'use strict';

/**
 * Okapi BM25 scoring engine.
 *
 * K1 = 1.2, B = 0.3 — tuned for short corpora (10-15 phrases per skill).
 * IDF is the BM25-plus variant: log(1 + (N - n + 0.5) / (n + 0.5))
 * computed over positive docs only, so negatives don't skew term weights.
 *
 * Per-skill score in bm25-suggest.js = max over that skill's positive scenarios
 * (best single match wins, not a sum). This avoids biasing toward large corpora.
 */

const K1 = 1.2;
const B = 0.3;

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

function computeIdf(docs) {
  const N = docs.length;
  const df = new Map();
  for (const doc of docs) {
    const seen = new Set(doc.tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = {};
  for (const [t, n] of df) {
    idf[t] = Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }
  return idf;
}

function scoreDoc(queryTokens, doc, idf, avgdl) {
  const tf = termFreq(doc.tokens);
  const dl = doc.tokens.length || 1;
  let score = 0;
  for (const q of queryTokens) {
    const f = tf.get(q);
    if (!f) continue;
    const w = idf[q] || 0;
    const num = f * (K1 + 1);
    const den = f + K1 * (1 - B + B * (dl / avgdl));
    score += w * (num / den);
  }
  return score;
}

function buildIndex(scenarios) {
  const positives = scenarios.filter(s => s.polarity === 'pos');
  const avgdl = positives.reduce((a, s) => a + s.tokens.length, 0) / (positives.length || 1);
  const idf = computeIdf(positives);
  return { idf, avgdl, K1, B };
}

function scoreSkills(queryTokens, scenarios, index) {
  const bySkill = new Map();
  for (const s of scenarios) {
    if (s.polarity !== 'pos') continue;
    const raw = scoreDoc(queryTokens, s, index.idf, index.avgdl);
    const cur = bySkill.get(s.skill) || 0;
    if (raw > cur) bySkill.set(s.skill, raw);
  }
  const out = [];
  for (const [skill, score] of bySkill) out.push({ skill, score });
  out.sort((a, b) => b.score - a.score);
  return out;
}

module.exports = { buildIndex, scoreSkills, scoreDoc, computeIdf, K1, B };
