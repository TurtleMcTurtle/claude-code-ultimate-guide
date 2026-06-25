# SEO Fixes: cc.bruniaux.com Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 categories of SEO issues identified via GSC (90-day data, June 2026) on cc.bruniaux.com: zero-click high-impression pages, broken titles, 404s without redirects, and cannibalisation of the releases page.

**Architecture:** All fixes live in the landing repo at `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/`. Content pages are Astro/Markdown with frontmatter controlling `<title>` and `<meta name="description">`. Redirects are declared in `astro.config.mjs`. After any change, run `pnpm build` from the landing repo root then redeploy (Vercel).

**Tech Stack:** Astro 5, Vercel, Markdown/MDX, TypeScript, `astro.config.mjs` redirects.

## Global Constraints

- Landing repo: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/`
- Guide repo (do not modify): `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide/`
- Build command: `cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing && pnpm build`
- All URLs in sitemap must be HTTPS (already the case, do not introduce http:// URLs)
- Titles: 50-60 chars; descriptions: 140-160 chars
- Language: English only
- Do not modify `dist/` files directly. Always edit sources and rebuild.

---

## Context: GSC Findings Summary

| Issue | Pages | Priority |
|-------|-------|----------|
| `/guide/data-privacy/`: 12,748 impressions, 0 clicks, pos 9.8 | 1 | P0 |
| Broken `title` fields on guide sub-pages (`"1. Quick Start"`) | ~5 | P1 |
| 48 URLs returning 404 in GSC | 48 | P1 |
| `github-actions` and `third-party-tools` at pos 9-10, 0 clicks | 2 | P2 |
| Releases page cannibalised (redirect already set, needs verification) | 1 | P2 |

---

## File Map

| File | Change |
|------|--------|
| `src/content/docs/guide/data-privacy.md` | Rewrite `title` + `description` frontmatter |
| `src/content/docs/guide/ultimate-guide/01-quick-start.md` | Rewrite `title` frontmatter |
| `src/content/docs/guide/workflows/github-actions.md` | Rewrite `description` frontmatter |
| `src/content/docs/guide/third-party-tools.md` | Rewrite `description` frontmatter |
| `astro.config.mjs` | Add missing redirects for 404 URLs |
| `src/pages/releases/index.astro` | Update `dateModified` to today |

---

## Task 1: Fix data-privacy zero-click problem (P0)

**Impact:** 12,748 impressions / 0 clicks / pos 9.8, the single biggest lost opportunity on the site. Expected +293 clicks at benchmark CTR.

**Root cause:** The title "Risks the Official Docs Don't Cover" signals criticism/controversy. Users searching "anthropic claude code privacy data retention official" want factual answers, not an editorial take. They skip the result.

**Files:**
- Modify: `src/content/docs/guide/data-privacy.md` (lines 1-7, frontmatter block)

- [ ] **Step 1: Read the current frontmatter**

```bash
head -8 /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/content/docs/guide/data-privacy.md
```

Expected:
```
---
title: "Claude Code Data Privacy: Risks the Official Docs Don't Cover"
description: "The privacy risks specific to Claude Code..."
sidebar:
  order: 118
---
```

- [ ] **Step 2: Replace title and description**

In `src/content/docs/guide/data-privacy.md`, replace the frontmatter block (keep `sidebar` unchanged):

```yaml
---
title: "Claude Code Privacy: What Gets Sent to Anthropic & How to Control It"
description: "What Claude Code sends to Anthropic servers: code context, file paths, shell commands, MCP logs. Data retention by plan (Consumer 5 yr, ZDR 0 days). Practical controls via env vars and PreToolUse hooks."
sidebar:
  order: 118
---
```

Why this works:
- Title answers the searcher's intent directly ("what gets sent", "how to control it")
- Includes "Anthropic" for brand queries, "Claude Code Privacy" for category queries
- Description mentions the specific data types users worry about + retention tiers + actionable controls

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing && pnpm build 2>&1 | tail -5
```

Expected: no errors, `dist/guide/data-privacy/index.html` exists.

- [ ] **Step 4: Verify the new title appears in the built HTML**

```bash
grep -o '<title>[^<]*</title>' /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/dist/guide/data-privacy/index.html
```

Expected: `<title>Claude Code Privacy: What Gets Sent to Anthropic & How to Control It | Claude Code Ultimate Guide</title>`

- [ ] **Step 5: Commit**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing
git add src/content/docs/guide/data-privacy.md
git commit -m "seo: fix data-privacy title to match user intent (12.7k impressions, 0 clicks)"
```

---

## Task 2: Fix broken guide sub-page titles (P1)

**Impact:** Pages like `/guide/ultimate-guide/01-quick-start/` rank at pos 8.4 with 467 impressions and 0 clicks because their title in SERPs is literally `"1. Quick Start"` (no context, no value proposition).

**Pattern:** The guide is split into numbered chapters. Their frontmatter `title` fields are short document names, not SERP titles.

**Files:**
- Modify: `src/content/docs/guide/ultimate-guide/01-quick-start.md`
- Modify: `src/content/docs/guide/workflows/github-actions.md`

- [ ] **Step 1: Check current titles**

```bash
head -6 /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/content/docs/guide/ultimate-guide/01-quick-start.md
head -6 /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/src/content/docs/guide/workflows/github-actions.md
```

Expected for quick-start:
```
title: "1. Quick Start"
description: "Install Claude Code and complete your first AI-assisted task in 15 minutes..."
```

Expected for github-actions:
```
title: "GitHub Actions Workflows with Claude Code"
description: "Production-ready patterns for automating PR reviews..."
```

- [ ] **Step 2: Fix quick-start title**

In `src/content/docs/guide/ultimate-guide/01-quick-start.md`, replace the `title` line only:

```yaml
title: "Claude Code Quick Start: Install, First Task & Key Mistakes to Avoid"
```

Keep the existing `description` as-is (it is already good).

- [ ] **Step 3: Fix github-actions description**

The title is fine. The description is "Production-ready patterns for automating PR reviews, issue triage, and quality gates with claude-code-action", which doesn't mention keywords users actually search for.

In `src/content/docs/guide/workflows/github-actions.md`, replace `description`:

```yaml
description: "Step-by-step setup for claude-code-action in GitHub Actions: PR code review on mention, automatic review on push, issue triage. Includes permissions config and real YAML examples."
```

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing && pnpm build 2>&1 | tail -5
```

- [ ] **Step 5: Spot-check built titles**

```bash
grep -o '<title>[^<]*</title>' /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/dist/guide/ultimate-guide/01-quick-start/index.html
grep -o '<title>[^<]*</title>' /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/dist/guide/workflows/github-actions/index.html
```

- [ ] **Step 6: Commit**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing
git add src/content/docs/guide/ultimate-guide/01-quick-start.md \
        src/content/docs/guide/workflows/github-actions.md
git commit -m "seo: fix broken chapter titles and github-actions description for SERP clarity"
```

---

## Task 3: Identify and fix 48 404 URLs (P1)

**Context:** GSC reports 48 pages returning 404. These are most likely old URLs Google crawled before content was restructured or moved. Every 404 that has a logical redirect destination should get a 301 (via `astro.config.mjs`). Pages with no replacement should get a 410 (explicit Gone).

**Note on Astro redirects:** Astro's `redirects` config in `astro.config.mjs` generates meta-refresh HTML redirects for static output. For a Vercel deployment, Vercel converts these to proper 301 HTTP redirects if you use `@astrojs/vercel` adapter. Verify the adapter is present.

**Files:**
- Read: `astro.config.mjs` (existing redirects reference)
- Modify: `astro.config.mjs` (add new entries to `redirects` object)

- [ ] **Step 1: Check which adapter is used**

```bash
grep -n "adapter\|vercel" /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/astro.config.mjs | head -5
```

Expected: `import vercel from '@astrojs/vercel/static'` or similar. If present, Vercel generates 301s. If using pure static output, redirects are meta-refresh only; prefer `vercel.json` rewrites instead.

- [ ] **Step 2: Get the list of 404 URLs from GSC**

Open Google Search Console → cc.bruniaux.com → Indexing → Pages → filter "Not Found (404)".

Export or note the 48 URLs. Alternatively, run batches of suspected URLs through the GSC MCP:

```
mcp__gsc-mcp__batch_url_inspection(
  site="sc-domain:cc.bruniaux.com",
  urls=[<list of 10 suspected URLs>]
)
```

Suspected candidates based on known restructurings (check these first):
- `/guide/data-privacy/` old path before move, likely `/guide/security/data-privacy/`
- `/guide/core/architecture/`
- `/guide/security/security-hardening/`
- Any `/guide/workflows/` page that existed at `/guide/{slug}/` before the workflows/ prefix was added
- `/guide/cowork/` if it was removed
- `/guide/learning-path/` sub-pages if restructured

- [ ] **Step 3: Cross-reference existing redirects**

```bash
grep "redirects" /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/astro.config.mjs -A 80 | head -100
```

This shows all currently configured redirects. Any URL in the 404 list that is NOT here needs to be added.

- [ ] **Step 4: Add missing redirects**

In `astro.config.mjs`, locate the `redirects` object and add entries for each 404 URL that has a logical destination. Pattern:

```js
redirects: {
  // ... existing entries ...

  // 404 fixes (identified from GSC, 2026-06-25)
  '/guide/OLD-PATH/': '/guide/NEW-PATH/',
  '/guide/OTHER-OLD/': '/guide/workflows/OTHER-NEW/',
  // Add one line per 404 URL
}
```

For URLs with no replacement (page deleted permanently, content doesn't exist elsewhere):

```js
// These 410 Gone, no replacement page exists
// Astro doesn't support 410 natively; use vercel.json instead
```

For 410s, add to `vercel.json` at the landing repo root (create if absent):

```json
{
  "redirects": [],
  "headers": [
    {
      "source": "/guide/DELETED-PAGE/",
      "headers": [{"key": "X-Robots-Tag", "value": "noindex"}]
    }
  ]
}
```

Note: Vercel doesn't support 410 directly; the closest equivalent is a noindex header + redirect to a relevant page, or leaving the 404 as-is (which is technically correct for deleted pages).

- [ ] **Step 5: Build and spot-check one redirect**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing && pnpm build 2>&1 | tail -5
```

Then verify one of the new redirects produced the correct HTML:

```bash
cat /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/dist/guide/OLD-PATH/index.html
```

Expected: `<meta http-equiv="refresh" content="0;url=/guide/NEW-PATH/">` (or HTTP 301 header if Vercel adapter handles it before build output inspection).

- [ ] **Step 6: Commit**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing
git add astro.config.mjs
git commit -m "seo: add 301 redirects for 48 GSC 404 URLs (identified 2026-06-25)"
```

---

## Task 4: Releases page: verify canonical consolidation (P2)

**Context:** Three URLs competing for "claude code changelog" queries:
1. `https://cc.bruniaux.com/releases/`: 51,690 impressions, 13 clicks, pos 15.7 (canonical winner)
2. `https://cc.bruniaux.com/guide/claude-code-releases/`: 18,029 impressions, 1 click, pos 26.4
3. `http://cc.bruniaux.com/guide/claude-code-releases/`: 13,657 impressions, 1 click, pos 21.2

The redirect from (2) to (1) is already configured in `astro.config.mjs`. But the built output uses meta-refresh, not HTTP 301. This task verifies the redirect is working and updates the releases page meta to capture more of the striking-distance queries.

**Files:**
- Read: `dist/guide/claude-code-releases/index.html` (verify redirect output)
- Modify: `src/pages/releases/index.astro` (update `dateModified`)

- [ ] **Step 1: Verify the redirect is built correctly**

```bash
cat /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/dist/guide/claude-code-releases/index.html
```

Expected output includes both:
- `<meta http-equiv="refresh" content="0;url=/releases/">`
- `<link rel="canonical" href="https://cc.bruniaux.com/releases/">`
- `<meta name="robots" content="noindex">`

If these are present, the signal to Google is correct. The consolidation will complete over the next few crawl cycles (typically 2-4 weeks).

- [ ] **Step 2: Check if Vercel generates a proper 301**

After deploying, use curl to verify:

```bash
curl -I https://cc.bruniaux.com/guide/claude-code-releases/
```

Expected: `HTTP/2 301` with `Location: https://cc.bruniaux.com/releases/`

If you get 200 instead, the redirect is only meta-refresh. In that case, add an explicit 301 in `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/guide/claude-code-releases/",
      "destination": "/releases/",
      "permanent": true
    }
  ]
}
```

- [ ] **Step 3: Update releases page dateModified**

In `src/pages/releases/index.astro` line 6 and line 24, update the `dateModified` to today to signal freshness:

```js
// Line 6:
const description = 'Complete Claude Code version history with environment variables reference. Find CLAUDE_CODE_USE_MANTLE, CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY, showThinkingSummaries, and every config flag since v2.0. Updated with each release.'

// In jsonLd (around line 18):
"dateModified": "2026-06-25",

// In Layout props (line 24):
<Layout title={title} description={description} ogType="article" jsonLd={jsonLd} publishedDate="2026-01-17" modifiedDate="2026-06-25">
```

- [ ] **Step 4: Build and verify**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing && pnpm build 2>&1 | tail -3
grep "dateModified" /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/dist/releases/index.html | head -2
```

Expected: `"dateModified":"2026-06-25"` in the JSON-LD block.

- [ ] **Step 5: Commit**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing
git add src/pages/releases/index.astro
git commit -m "seo: update releases dateModified, verify canonical consolidation"
```

---

## Task 5: Deploy and submit sitemap for re-crawl

After all 4 tasks are committed and pushed, force Google to re-process the changes.

- [ ] **Step 1: Push to Vercel**

```bash
cd /Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing
git push
```

Wait for Vercel deployment to complete (check Vercel dashboard or `vercel status`).

- [ ] **Step 2: Verify live deployment**

```bash
curl -s https://cc.bruniaux.com/guide/data-privacy/ | grep -o '<title>[^<]*</title>'
# Expected: new title with "What Gets Sent to Anthropic"

curl -I https://cc.bruniaux.com/guide/claude-code-releases/
# Expected: HTTP/2 301

curl -I https://cc.bruniaux.com/guide/OLD-PATH/
# Expected: HTTP/2 301 for each new redirect
```

- [ ] **Step 3: Submit sitemap for re-index**

In Google Search Console → Sitemaps → select `sitemap-index.xml` → click "Resubmit".

For the data-privacy page specifically (highest priority), also use URL Inspection → Request Indexing directly on `https://cc.bruniaux.com/guide/data-privacy/`.

- [ ] **Step 4: Monitor in GSC (7-14 days)**

Check weekly:
- `/guide/data-privacy/` CTR: expect first clicks within 7-14 days after re-indexing
- 404 count: should drop from 48 toward 0 as Google processes the new redirects
- `/releases/` vs `/guide/claude-code-releases/`: impressions should consolidate to `/releases/`

---

## Self-Review

**Spec coverage:**
- P0 data-privacy CTR fix → Task 1 ✓
- Broken guide sub-page titles → Task 2 ✓
- 48 × 404 URLs → Task 3 ✓
- Releases cannibalisation → Task 4 ✓
- Deploy + GSC submission → Task 5 ✓

**What this plan does NOT cover (out of scope):**
- The 61 "explored, not indexed" pages: thin content, addressing them requires content expansion on each page. Monitor for 30 days first.
- The `/glossary/` page at pos 26.6: ranking problem, not a meta problem. Needs internal linking and content depth work.
- The `/guide/ai-ecosystem/` page at pos 18.5 with 14,825 impressions (same category as glossary: ranking issue, not CTR issue).
- The 39 "pages with redirect" HTTP to HTTPS entries: these self-resolve as Google crawls the HTTPS canonical. No action needed.
