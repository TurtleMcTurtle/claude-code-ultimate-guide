# BM25 Routing Hook

A `UserPromptSubmit` hook that scores every prompt against a skill corpus using Okapi BM25 and injects routing hints via `additionalContext`. When a match clears its calibrated threshold, Claude sees `BM25 routing hint: - /skill-name (NN%)` in its context and can proactively invoke the right skill.

Zero npm dependencies. Requires Node.js and nothing else.

## How it works

Each skill you want to suggest gets a `scenarios.json` file with positive examples (prompts that should trigger the skill) and negative examples (prompts that look similar but shouldn't). The `build-index.js` script tokenizes all corpora, builds a BM25 index, and auto-calibrates a per-skill confidence threshold using leave-one-out cross-validation.

At runtime, `bm25-suggest.js` reads the user's prompt from stdin, tokenizes it, scores it against the index, and returns the top-3 skills that clear their threshold. The confidence percentage is each skill's share of the combined top scores, not an absolute probability. If no skill clears its threshold, the hook exits silently.

The hook self-heals: if corpus files change after the index was built, a detached background process rebuilds the index while the current prompt passes through unblocked.

## Prerequisites

Node.js (v16+). No `npm install` needed. All modules use Node builtins (`fs`, `path`, `crypto`, `child_process`).

The regex hook `smart-suggest.sh` additionally needs `jq` and standard coreutils, but BM25 routing has no shell dependencies.

## Setup

Copy this directory into your project. A natural home is `.claude/hooks/bm25-routing/` if you follow the Claude Code convention, or anywhere you prefer.

Tell the system where your skills live and where to write the index:

```bash
export BM25_SKILLS_ROOT=/your-project/.claude/skills   # where evals/scenarios.json files live
export BM25_DATA_DIR=/your-project/.claude/hooks/bm25-routing/routing/data
```

You can also set these permanently in your shell profile, or rely on the defaults (see `routing/paths.js` for the fallback logic).

## Build the index

After adding or editing corpus files, build the index:

```bash
node routing/build-index.js
```

This writes three files to `BM25_DATA_DIR`:

- `index.json` — tokenized scenarios, BM25 IDF weights, average document length
- `thresholds.json` — per-skill calibrated threshold (tau), F1, precision, recall, and status
- `manifest.json` — build metadata and cache key

On subsequent runs, if corpus file contents and mtimes are unchanged, the build is skipped and only `built_at` is updated.

The `--dry-run` flag reports what would be built without writing any files:

```bash
BM25_SKILLS_ROOT=./skills-corpus BM25_DATA_DIR=/tmp/bm25-test \
  node routing/build-index.js --dry-run
```

Check the output for `conflict` and `excluded` skills. See the [Threshold statuses](#threshold-statuses) section below.

## Wire into settings.json

Add both hooks to your `UserPromptSubmit` array. BM25 should run before the regex hook so its hints appear first in the context:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/bm25-routing/bm25-suggest.js",
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

Make the entry point executable: `chmod +x .claude/hooks/bm25-routing/bm25-suggest.js`

The `timeout: 2` value is intentional. The hook is non-blocking: it always exits 0 and never delays the prompt even if the index is unavailable.

## Write your corpus

Create a `scenarios.json` file for each skill you want to suggest:

```json
{
  "skill": "my-skill-name",
  "positive": [
    "run the linter on this file",
    "check code style",
    "lint errors in my component",
    "formatting issues in src/",
    "style violations found by ESLint"
  ],
  "negative": [
    "review this PR for security issues",
    "fix the failing tests",
    "deploy to production"
  ]
}
```

The `skill` field must match the slash command or skill ID you want Claude to suggest (it appears as `/<skill>` in the hint). Aim for 10-15 positives and 3-5 negatives. More is better; the calibrator needs enough variance to find a reliable threshold.

Write positives that cover realistic phrasings of the same intent: direct ("lint this"), roundabout ("check if my code follows the style guide"), error-report style ("ESLint is complaining about unused variables"), and task-description style ("I want to enforce formatting"). Mix languages if your team works in multiple.

Negatives should be superficially related but clearly routing to a different skill. If your negatives are unrelated ("write a poem"), the calibrator will set the threshold too low and the skill will over-trigger.

Place corpus files at `<BM25_SKILLS_ROOT>/<skill-name>/evals/scenarios.json`. The discovery walk handles arbitrary nesting up to depth 8.

## Threshold statuses

After building the index, `thresholds.json` reports a status for each skill:

`ok` means F1 >= 0.60 on cross-validation. The skill will suggest when its threshold is cleared.

`conflict` means the calibrator found a threshold but F1 was below 0.60. The skill won't suggest. Fix: add more contrastive negatives, or rephrase positives that are lexically similar to your negatives.

`excluded` means the corpus is too small (fewer than 8 positives or fewer than 2 negatives). The skill won't suggest until you add more examples.

## Calibration details

The threshold for each skill is chosen to maximize F-beta with beta-squared=4, which weights recall 4x more than precision. The system prefers to over-suggest and occasionally miss rather than stay silent when a skill is relevant. Status classification then gates on F1 >= 0.60 (plain F1, not fbeta2) to ensure the suggestion is meaningful.

Cache key is a SHA-256 hash of corpus file paths and their modification times. The rebuild is fully atomic: each output file is written to `.tmp.<pid>` and renamed, so a concurrent read never sees a partial file.

## What the hook outputs

When a skill clears its threshold, the hook writes to stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "BM25 routing hint:\n- /debug-tool (72%)\n- /code-review (28%)\nMultiple candidates, pick the one matching intent."
  }
}
```

Claude Code delivers this to Claude's context. Claude sees the hint alongside the user's prompt and can proactively invoke the suggested skill without the user having to know its name.

## Adapting to your project

| File | What to customize |
|------|------------------|
| `routing/paths.js` | `skillsRoot()` default path; use `BM25_SKILLS_ROOT` env to override without editing |
| `routing/build-index.js` | `MIN_POS` and `MIN_NEG` constants if your corpus is larger or smaller |
| `routing/tokenize.js` | `STOP_WORDS` and `NEGATION_TOKENS` sets for language-specific needs |
| `routing/bm25.js` | `K1` and `B` constants (1.2 / 0.3 tuned for short 10-15 phrase corpora) |
| `bm25-suggest.js` | `MAX_HINTS` (default 3); the output text format |

## Related

- `examples/hooks/bash/smart-suggest.sh` — the regex-based sibling hook (3-tier priority, max 1 suggestion per prompt)
- `guide/workflows/smart-suggest-routing.md` — full documentation covering both engines, calibration, and the decision framework for when to use each
