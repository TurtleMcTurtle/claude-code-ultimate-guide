#!/usr/bin/env node
// examples/hooks/bm25-routing/bm25-suggest.js
// Event: UserPromptSubmit
// Self-calibrating BM25 lexical hook: scores the user's prompt against a skill corpus
// and injects routing hints via additionalContext when a match clears its calibrated threshold.
//
// Architecture:
//   - Reads prompt from stdin JSON (Claude Code hook protocol)
//   - Scores against pre-built index.json (built by routing/build-index.js)
//   - Per-skill score = max over that skill's positive scenarios (best single match)
//   - Returns top-3 matches with confidence percentages
//   - Passes through silently when no index exists (spawns detached rebuild instead)
//   - Passes through silently on negated prompts or slash-command prompts
//
// Properties:
//   - MAX_HINTS: 3 (top matches shown)
//   - Non-blocking: always exits 0, never delays the prompt
//   - Self-healing: detects stale corpus files, rebuilds index in background
//   - Zero npm dependencies (Node builtins only)
//
// Customization:
//   - Set BM25_SKILLS_ROOT to point at your skill corpus directory
//   - Set BM25_DATA_DIR to control where index.json / thresholds.json are written
//   - Add evals/scenarios.json files in your skills directory to expand coverage
//   - Run `node routing/build-index.js` after adding corpora to rebuild the index

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROUTING_DIR = path.join(__dirname, 'routing');
const DATA_DIR = process.env.BM25_DATA_DIR || path.join(ROUTING_DIR, 'data');
const BUILD_SCRIPT = path.join(ROUTING_DIR, 'build-index.js');
const MAX_HINTS = 3;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function passthrough() { process.exit(0); }

function spawnDetachedRebuild() {
  try {
    const child = spawn(process.execPath, [BUILD_SCRIPT], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    });
    child.unref();
  } catch { /* fail silent */ }
}

function loadIndex() {
  try {
    const index = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'index.json'), 'utf8'));
    const thresholds = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'thresholds.json'), 'utf8'));
    return { index, thresholds };
  } catch {
    return null;
  }
}

function hasNewerScenarios(dir, since, depth) {
  if ((depth || 0) > 8) return false;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const sub = path.join(dir, e.name);
    if (e.name === 'evals') {
      const sf = path.join(sub, 'scenarios.json');
      try {
        if (fs.existsSync(sf) && fs.statSync(sf).mtimeMs > since) return true;
      } catch { /* ignore */ }
    } else {
      if (hasNewerScenarios(sub, since, (depth || 0) + 1)) return true;
    }
  }
  return false;
}

function needsRebuild() {
  try {
    const manifestPath = path.join(DATA_DIR, 'manifest.json');
    if (!fs.existsSync(manifestPath)) return true;
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const builtAt = new Date(m.built_at).getTime();
    if (!Number.isFinite(builtAt)) return true;
    const { skillsRoot } = require(path.join(ROUTING_DIR, 'paths'));
    return hasNewerScenarios(skillsRoot(), builtAt);
  } catch {
    return false;
  }
}

function scoreSkills(tokens, index) {
  const { scoreDoc } = require(path.join(ROUTING_DIR, 'bm25'));
  const bySkill = new Map();
  for (const doc of index.scenarios) {
    if (doc.polarity !== 'pos') continue;
    const raw = scoreDoc(tokens, doc, index.idf, index.avgdl);
    const cur = bySkill.get(doc.skill) || 0;
    if (raw > cur) bySkill.set(doc.skill, raw);
  }
  const out = [];
  for (const [skill, score] of bySkill) out.push({ skill, score });
  out.sort((a, b) => b.score - a.score);
  return out;
}

async function main() {
  let payload = {};
  try { payload = JSON.parse(await readStdin()); } catch { return passthrough(); }
  const prompt = payload.prompt;
  if (!prompt || typeof prompt !== 'string') return passthrough();
  if (prompt.trim().startsWith('/')) return passthrough();

  const loaded = loadIndex();
  if (!loaded) {
    spawnDetachedRebuild();
    return passthrough();
  }

  if (needsRebuild()) {
    spawnDetachedRebuild();
  }

  const { tokenize } = require(path.join(ROUTING_DIR, 'tokenize'));
  const { tokens, negated } = tokenize(prompt);
  if (tokens.length === 0 || negated) return passthrough();

  const { index, thresholds } = loaded;
  const scored = scoreSkills(tokens, index);
  const filtered = scored.filter(s => {
    const t = thresholds[s.skill];
    return t && t.status !== 'excluded' && t.tau != null && s.score >= t.tau;
  });

  if (filtered.length === 0) return passthrough();

  const top = filtered.slice(0, MAX_HINTS);
  const sum = top.reduce((a, b) => a + b.score, 0);
  const matches = top.map(m => ({
    skill: m.skill,
    score: m.score,
    confidence: sum > 0 ? m.score / sum : 0,
  }));

  const lines = matches
    .map(m => `- /${m.skill} (${Math.round(m.confidence * 100)}%)`)
    .join('\n');
  const note = matches.length > 1
    ? '\nMultiple candidates, pick the one matching intent.'
    : '';
  const text = `BM25 routing hint:\n${lines}${note}`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: text,
    },
  }));
  process.exit(0);
}

main().catch(() => passthrough());
