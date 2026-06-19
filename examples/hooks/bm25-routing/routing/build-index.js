#!/usr/bin/env node
'use strict';

/**
 * Build the BM25 routing index from skill corpora.
 *
 * Usage:
 *   node routing/build-index.js            # build index.json, thresholds.json, manifest.json
 *   node routing/build-index.js --dry-run  # report without writing any files
 *
 * Reads all evals/scenarios.json files found under BM25_SKILLS_ROOT.
 * Writes output files to BM25_DATA_DIR (or .claude/hooks/routing/data).
 *
 * Calibration:
 *   - Leave-one-out cross-scoring: each positive scored against the rest of its skill's positives
 *   - Threshold candidates: midpoints between observed positive and negative scores
 *   - Picks tau maximizing F-beta with beta^2=4 (recall-favoring over precision)
 *   - Status: 'ok' (F1>=0.60), 'conflict' (F1<0.60), 'excluded' (corpus too small)
 *
 * Tune MIN_POS and MIN_NEG to match your corpus size.
 * Larger corpora (15+ positive, 5+ negative) produce more reliable thresholds.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { tokenize } = require('./tokenize');
const { buildIndex, scoreDoc } = require('./bm25');
const { skillsRoot, dataDir, findScenariosFiles } = require('./paths');

// Minimum corpus size for a skill to receive a calibrated threshold.
// Skills below either limit receive status: 'excluded' and are never suggested.
const MIN_POS = 8;  // minimum positive scenarios
const MIN_NEG = 2;  // minimum negative scenarios

function tryReadJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function loadScenarios() {
  const files = findScenariosFiles(skillsRoot());
  const out = [];
  for (const f of files) {
    const data = tryReadJson(f);
    if (!data || typeof data.skill !== 'string' || !Array.isArray(data.positive)) continue;
    const mtime = fs.statSync(f).mtimeMs;
    for (const p of data.positive) {
      if (typeof p !== 'string') continue;
      out.push({ skill: data.skill, prompt: p, polarity: 'pos', _source: f, _mtime: mtime });
    }
    for (const n of (data.negative || [])) {
      if (typeof n !== 'string') continue;
      out.push({ skill: data.skill, prompt: n, polarity: 'neg', _source: f, _mtime: mtime });
    }
  }
  return out;
}

function tokenizeAll(scenarios) {
  for (const s of scenarios) {
    const tok = tokenize(s.prompt);
    s.tokens = tok.tokens;
    s.negated = tok.negated;
  }
  return scenarios;
}

// Score probe `p` against every other positive in the same skill (leave-one-out).
function scorePositiveAgainstSkill(p, skillPositives, idf, avgdl) {
  let best = 0;
  for (const doc of skillPositives) {
    if (doc === p) continue;
    const s = scoreDoc(p.tokens, doc, idf, avgdl);
    if (s > best) best = s;
  }
  return best;
}

function f1AtThreshold(posScores, negScores, tau) {
  const TP = posScores.filter(s => s >= tau).length;
  const FN = posScores.length - TP;
  const FP = negScores.filter(s => s >= tau).length;
  const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
  const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
  const f1 = precision + recall === 0 ? 0 : 2 * precision * recall / (precision + recall);
  // beta^2 = 4 (beta=2): recall weighted 4x more than precision.
  // We prefer to suggest and occasionally be wrong rather than stay silent when relevant.
  const beta2 = 4;
  const fbeta2 = beta2 * precision + recall === 0
    ? 0
    : (1 + beta2) * precision * recall / (beta2 * precision + recall);
  return { TP, FP, FN, precision, recall, f1, fbeta2 };
}

function calibrateThresholds(scenarios, index) {
  const skills = [...new Set(scenarios.map(s => s.skill))];
  const thresholds = {};
  for (const skillId of skills) {
    const positives = scenarios.filter(s => s.skill === skillId && s.polarity === 'pos');
    const negatives = scenarios.filter(s => s.skill === skillId && s.polarity === 'neg');
    if (positives.length < MIN_POS || negatives.length < MIN_NEG) {
      thresholds[skillId] = {
        tau: null, f1: null,
        n_pos: positives.length, n_neg: negatives.length,
        status: 'excluded',
      };
      continue;
    }
    const posScores = positives.map(p =>
      scorePositiveAgainstSkill(p, positives, index.idf, index.avgdl));
    const negScores = negatives.map(n =>
      scorePositiveAgainstSkill(n, positives, index.idf, index.avgdl));

    const candidates = [...new Set([...posScores, ...negScores])]
      .filter(c => c > 0).sort((a, b) => a - b);
    if (candidates.length === 0) {
      thresholds[skillId] = {
        tau: null, f1: 0, recall: 0, precision: 0,
        n_pos: positives.length, n_neg: negatives.length, status: 'conflict',
      };
      continue;
    }
    let bestFbeta = -1, bestTau = 0, bestMetrics = null;
    for (let i = 0; i < candidates.length; i++) {
      const tau = i === 0 ? candidates[0] - 0.001 : (candidates[i - 1] + candidates[i]) / 2;
      if (tau <= 0) continue;
      const m = f1AtThreshold(posScores, negScores, tau);
      if (m.fbeta2 > bestFbeta) {
        bestFbeta = m.fbeta2; bestTau = tau; bestMetrics = m;
      }
    }
    // Note: tau is chosen to maximize fbeta2 (recall-favoring), but the
    // status classification uses plain F1 >= 0.60. A skill can have acceptable
    // fbeta2 yet still be 'conflict' if F1 is below that threshold.
    thresholds[skillId] = {
      tau: bestTau,
      f1: bestMetrics.f1,
      fbeta2: bestMetrics.fbeta2,
      precision: bestMetrics.precision,
      recall: bestMetrics.recall,
      TP: bestMetrics.TP, FP: bestMetrics.FP, FN: bestMetrics.FN,
      n_pos: positives.length, n_neg: negatives.length,
      status: bestMetrics.f1 >= 0.60 ? 'ok' : 'conflict',
    };
  }
  return thresholds;
}

function buildHash(scenarios, index) {
  const h = crypto.createHash('sha256');
  const sorted = [...scenarios].sort((a, b) =>
    (a.skill + a.prompt).localeCompare(b.skill + b.prompt));
  for (const s of sorted) h.update(`${s.skill}|${s.prompt}|${s.polarity}\n`);
  h.update(JSON.stringify({ K1: index.K1, B: index.B }));
  return h.digest('hex');
}

// Cache key: SHA-256 over file paths + mtimes. If unchanged, skip full rebuild.
function cacheKey(scenarios) {
  const h = crypto.createHash('sha256');
  const sources = [...new Set(scenarios.map(s => s._source).filter(Boolean))].sort();
  for (const src of sources) {
    try {
      const stat = fs.statSync(src);
      h.update(`${src}|${stat.mtimeMs}\n`);
    } catch { h.update(`${src}|0\n`); }
  }
  return h.digest('hex');
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const outDir = dataDir();

  const scenarios = tokenizeAll(loadScenarios());
  if (scenarios.length === 0) {
    console.error('[build-index] no scenarios found.');
    console.error('[build-index] Add evals/scenarios.json files under your skills directory.');
    console.error(`[build-index] Skills root: ${skillsRoot()}`);
    process.exit(1);
  }

  const ckey = cacheKey(scenarios);
  const manifestPath = path.join(outDir, 'manifest.json');
  const existing = tryReadJson(manifestPath);
  if (existing && existing.cache_key === ckey && !dryRun) {
    // Corpus unchanged — just bump built_at to record the check time.
    try {
      const tmp = manifestPath + '.tmp.' + process.pid;
      fs.writeFileSync(tmp, JSON.stringify(
        { ...existing, built_at: new Date().toISOString() }, null, 2));
      fs.renameSync(tmp, manifestPath);
    } catch { /* ignore */ }
    console.log(`[build-index] cache hit (key=${ckey.slice(0, 12)}), skip rebuild`);
    return;
  }

  const index = buildIndex(scenarios);
  const thresholds = calibrateThresholds(scenarios, index);
  const hash = buildHash(scenarios, index);

  if (dryRun) {
    console.log(`[build-index] dry-run scenarios=${scenarios.length} skills=${Object.keys(thresholds).length} cache_key=${ckey.slice(0, 12)}`);
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  // Atomic writes: write to .tmp.<pid> then rename to avoid partial reads.
  const writeAtomic = (file, content) => {
    const tmp = file + '.tmp.' + process.pid;
    fs.writeFileSync(tmp, content);
    fs.renameSync(tmp, file);
  };

  writeAtomic(path.join(outDir, 'index.json'), JSON.stringify({
    version: 1,
    build_hash: hash,
    params: { K1: index.K1, B: index.B },
    avgdl: index.avgdl,
    idf: index.idf,
    scenarios: scenarios.map(s => ({
      skill: s.skill, prompt: s.prompt,
      tokens: s.tokens, polarity: s.polarity,
    })),
  }, null, 2));

  writeAtomic(path.join(outDir, 'thresholds.json'),
    JSON.stringify(thresholds, null, 2));

  writeAtomic(path.join(outDir, 'manifest.json'), JSON.stringify({
    version: 1,
    build_hash: hash,
    cache_key: ckey,
    params: { K1: index.K1, B: index.B },
    scenarios_count: scenarios.length,
    positives: scenarios.filter(s => s.polarity === 'pos').length,
    negatives: scenarios.filter(s => s.polarity === 'neg').length,
    skills: Object.keys(thresholds).length,
    excluded_skills: Object.entries(thresholds)
      .filter(([, t]) => t.status === 'excluded').map(([k]) => k),
    conflict_skills: Object.entries(thresholds)
      .filter(([, t]) => t.status === 'conflict').map(([k]) => k),
    built_at: new Date().toISOString(),
  }, null, 2));

  console.log(`[build-index] built scenarios=${scenarios.length} skills=${Object.keys(thresholds).length} hash=${hash.slice(0, 12)}`);
  console.log(`[build-index] out=${outDir}`);
  const conflicts = Object.entries(thresholds).filter(([, t]) => t.status === 'conflict');
  if (conflicts.length) console.log(`[build-index] conflicts: ${conflicts.map(([k]) => k).join(', ')}`);
  const excluded = Object.entries(thresholds).filter(([, t]) => t.status === 'excluded');
  if (excluded.length) console.log(`[build-index] excluded: ${excluded.length} skills`);
}

main();
