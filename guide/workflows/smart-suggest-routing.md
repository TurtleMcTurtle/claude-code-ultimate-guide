---
title: "Smart-Suggest Routing: Regex + BM25 Skill Hints"
description: "A two-engine UserPromptSubmit hook system that injects skill suggestions via pattern matching and self-calibrating BM25 lexical scoring"
tags: [workflow, hooks, guide, reference]
---

# Smart-Suggest Routing: Regex + BM25 Skill Hints

A `UserPromptSubmit` hook that goes beyond pattern matching: BM25 lexical scoring scores every prompt against a curated skill corpus and injects ranked suggestions as `additionalContext`, so Claude proposes the right skill even when phrasing was never anticipated.

---

## Why this exists

Regex hooks are fast and precise for anticipated patterns. They break on reformulations. "my Prisma throws connection refused" and "prisma connection error" should both suggest `/debug-db`, but a regex written for the second form silently ignores the first. Every new phrasing requires a new rule, and bilingual teams double the maintenance burden.

BM25 solves this differently. It scores prompts against positive scenario examples stored per skill, using term frequency and inverse document frequency to find lexical overlap without requiring exact phrasing. You write representative examples once; the engine generalizes.

The two hooks run in parallel and are additive, not competitive. Regex catches high-confidence enforcement cases. BM25 catches the long tail of natural-language variations.

---

## Regex vs BM25: when each fires

Both hooks fire on every prompt. The difference is what they're good at.

| Situation | Regex wins | BM25 wins |
|-----------|-----------|-----------|
| Pattern is fixed and predictable | Yes | No |
| Enforcement rule (must run before code) | Yes | No |
| Natural-language variation, FR/EN mix | No | Yes |
| Skill with 10+ documented phrasings | No | Yes |
| New skill, corpus still small | No | Maybe (check `excluded`) |
| Speed | ~1ms | ~20-50ms |

Regex is the right tool when you want to intercept a specific intent reliably, such as "create a PR without mentioning the changelog fragment." BM25 is the right tool when you want broad coverage of a skill's semantic territory without maintaining an exhaustive list of patterns.

---

## Architecture

Both hooks attach to `UserPromptSubmit`. Claude Code delivers their outputs to context before the model processes the prompt. Neither blocks; both emit `additionalContext` through `hookSpecificOutput`.

```
User prompt
     │
     ├──► bm25-suggest.js (timeout 2s)
     │      BM25 scores prompt vs all skills
     │      Returns: "BM25 routing hint:\n- /skill (NN%)\n..."
     │
     └──► smart-suggest.sh (timeout 2s)
            Regex matches against known patterns
            Returns: enforcement reminder or skill suggestion
                              │
                    Both delivered as additionalContext
                    Claude sees both hints, picks the relevant one
```

The BM25 hook runs first in the settings array (see [Wiring](#wiring-into-settingsjson)). When the index does not exist yet (first run, or detached rebuild still in progress), the hook passes through silently.

---

## The corpus format

Each skill gets its own `evals/scenarios.json` file placed under your skills directory. The discovery walk finds all `evals/` folders recursively under `BM25_SKILLS_ROOT`:

```
<BM25_SKILLS_ROOT>/
  debug-db/
    evals/
      scenarios.json    ← one file per skill
  code-review/
    evals/
      scenarios.json
```

Each `scenarios.json` is a single JSON object:

```json
{
  "skill": "debug-db",
  "positive": [
    "my Prisma throws connection refused",
    "prisma connection error",
    "database won't connect",
    "connexion base de données échoue",
    "DB connection pool exhausted",
    "sequelize authenticate failed",
    "TypeORM cannot connect",
    "psql: could not connect to server",
    "redis ECONNREFUSED",
    "MongoDB MongoNetworkError"
  ],
  "negative": [
    "slow query performance",
    "database schema migration",
    "add index to table",
    "export database backup"
  ]
}
```

Guidelines for writing good corpus entries:

Write 10+ positives per skill. Fewer than 8 triggers `excluded` status during calibration. Vary phrasing, not just vocabulary: "database won't connect" and "cannot reach DB" cover different token patterns. Include both languages if your team is bilingual; BM25 treats FR and EN tokens equally.

Write 3+ negatives: prompts that sound adjacent but should route elsewhere. "slow query" looks like a DB prompt but belongs to a performance skill, not a connection-error skill. Negatives are what separate overlapping skills, and calibration cannot find a threshold without them.

---

## Building the index

```bash
node routing/build-index.js
```

This discovers all `evals/scenarios.json` files under `BM25_SKILLS_ROOT`, runs leave-one-out cross-scoring for every skill, picks a threshold via F-beta optimization, and writes three files to `BM25_DATA_DIR` (defaults to `.claude/hooks/routing/data/`):

- `index.json`: per-term IDF + per-skill posting lists
- `thresholds.json`: per-skill calibrated tau (the score above which a suggestion fires)
- `manifest.json`: SHA-256 fingerprint of inputs for cache invalidation

The output lists each skill with one of three statuses:

| Status | Meaning | Fix |
|--------|---------|-----|
| `ok` | Corpus is large enough, threshold found | None needed |
| `excluded` | Fewer than 8 positives or fewer than 2 negatives | Add more examples |
| `conflict` | F1 below 0.60 on leave-one-out scoring | Add contrastive negatives |

A `conflict` status usually means your positive scenarios are lexically too similar to your negatives. The calibration found a threshold, but either too many negatives score above it or too many positives score below. Adding negatives that share surface features but differ in intent (e.g., "check database health" as a negative for a connection-error skill) gives the threshold somewhere to land.

The cache mechanism skips the full rebuild when the SHA-256 fingerprint over input file paths and mtimes matches the stored manifest. A cache hit bumps `built_at` and exits immediately. This makes the hook fast after the first build.

---

## The BM25 scoring

The hook uses BM25-plus with K1 = 1.2 and B = 0.3. For each skill, the score is the **maximum** across that skill's positive scenarios rather than a sum. This is deliberate: the best single matching scenario is sufficient evidence for routing. Summing would bias toward large corpora, making well-documented skills appear more relevant simply because they have more examples.

IDF is computed over positive scenarios only, using the formula:

```
IDF(t) = log(1 + (N - n + 0.5) / (n + 0.5))
```

where N is the total number of positive scenarios across all skills, and n is the number that contain term t.

The top 3 skills above their respective thresholds appear in the hint output. Confidence is displayed as a share of the top-N scores:

```
confidence = skill_score / sum(all_top_scores)
```

If 2 or more skills are suggested, the output appends "Multiple candidates, pick the one matching intent." so Claude knows to exercise judgment rather than defaulting to the first entry.

For deeper background on BM25 theory and IR foundations, this guide covers it in `guide/core/memory-systems.md` and `guide/ecosystem/context-engineering-tools.md`.

---

## Auto-calibration

Threshold calibration uses F-beta with beta-squared = 4. That makes the metric recall-favoring: missing a correct skill suggestion costs four times more than a false positive. The intent is to suggest broadly and let Claude pick, rather than to suggest conservatively and miss relevant skills.

The calibration picks tau as the midpoint between observed score pairs that maximizes this F-beta. It then gates status on F1 (not F-beta): a skill is `conflict` if F1 < 0.60, meaning calibration found a threshold but it does not generalize well to the leave-one-out splits.

At runtime, when the index file is missing or the fingerprint has changed, the hook spawns a detached `node routing/build-index.js` rebuild in the background (via `spawn().unref()`) and passes the current prompt through without suggestions. The next prompt runs against the freshly rebuilt index.

---

## Wiring into settings.json

The correct shape nests each hook inside a `hooks` array inside an outer array element. BM25 comes before regex so its broader coverage runs first.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit/bm25-suggest.js",
          "timeout": 2
        }]
      },
      {
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit/smart-suggest.sh",
          "timeout": 2
        }]
      }
    ]
  }
}
```

Both hooks use `timeout: 2` (2 seconds). BM25 typically resolves in 20-50ms; the budget is generous to absorb cold Node.js startup on the first call.

**Runtime requirements**: Node.js (no npm install, zero external dependencies, CommonJS via `"type": "commonjs"` in the hook's `package.json`). The regex hook (`smart-suggest.sh`) needs `jq`, `git`, and standard coreutils.

---

## Adapting to your project

| File | What to customize |
|------|------------------|
| `<BM25_SKILLS_ROOT>/<skill>/evals/scenarios.json` | Add/remove skills, write positives and negatives |
| `routing/build-index.js` | `MIN_POS`, `MIN_NEG` constants; K1, B live in `routing/bm25.js` |
| `routing/paths.js` | `skillsRoot()` default; override via `BM25_SKILLS_ROOT` env |
| `bm25-suggest.js` | `MAX_HINTS` (default: 3), output text format |
| `smart-suggest.sh` | Regex patterns, enforcement tiers |

After editing or adding corpus files, rebuild:

```bash
node routing/build-index.js
```

Check the output for any `excluded` or `conflict` statuses before committing the updated index.

---

> [!NOTE]
> **Production deployment**: In the MethodeAristote project, this system runs across 58 skills with 803 scenarios (610 positive, 193 negative). The calibrated thresholds cover skills ranging from narrow utility commands to broad semantic categories like "debugging" or "database work." At this scale, the detached rebuild takes under 3 seconds on an M-series Mac; hooks see the updated index on the following prompt.

---

## Common pitfalls

**Negation tokens short-circuit the prompt.** Any negation token in the prompt (not, never, no, ne, pas, jamais, non, sans, dont) causes the entire prompt to pass through silently without suggestions. Negated phrases are genuinely ambiguous for routing, so this is intentional, not a bug. "Don't suggest anything" and "not a database error" both bail out.

**`conflict` status means the corpus boundaries are too soft.** Your positive scenarios are lexically too similar to your negatives. The calibration cannot find a stable threshold. Add negatives that share surface vocabulary with your positives but represent genuinely different intents.

**`excluded` status means the corpus is too small.** The calibration requires at least 8 positives and 2 negatives per skill. A skill with 5 examples might work in practice, but it cannot be calibrated and is excluded from the index.

**The hook passes through silently on first run.** If the index does not exist yet, no suggestions appear. This is expected. Run `node routing/build-index.js` once before wiring the hook.

**Do not confuse threshold and calibration metrics.** Tau is picked on F-beta (recall-favoring, beta^2=4), but `conflict` status is gated on F1. A skill can have a well-chosen tau and still be `conflict` if its F1 is poor.

---

## Related workflows

- [Changelog Fragments](./changelog-fragments.md): the regex-only sibling, documenting the `smart-suggest.sh` enforcement patterns and the `UserPromptSubmit` 3-tier hook architecture
- Runnable example with full corpus scaffolding: `examples/hooks/bm25-routing/`
