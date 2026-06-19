---
title: "Context Engineering: Tools & Ecosystem"
description: "A practical map of the tools that compress, optimize, route, and observe LLM context — from CLI output filters to AI gateways to LLMOps platforms"
tags: [context, tokens, optimization, ecosystem, tools, advanced]
---

# Context Engineering: Tools & Ecosystem

> **Confidence**: Tier 1/2 — Core concepts based on published research and production data. Third-party tool details based on public documentation (March 2026).
>
> **Related**: [Context Engineering (configuration guide)](../core/context-engineering.md) | [Third-Party Tools](./third-party-tools.md) | [MCP Servers Ecosystem](./mcp-servers-ecosystem.md)

This page maps the ecosystem of tools that help you manage what enters the context window and what doesn't. It complements the [configuration-focused context engineering guide](../core/context-engineering.md), which covers CLAUDE.md structure and path-scoping. Here the focus is on the broader tooling landscape: output compression, prompt compression, AI gateways, RAG optimization, observability, and inference infrastructure.

---

## Table of Contents

1. [The Mental Model](#1-the-mental-model)
2. [Core Concepts](#2-core-concepts)
3. [Output Compression: CLI & Tool Output](#3-output-compression-cli--tool-output) (RTK, Headroom, tilth, context-mode, stacklit)
4. [Prompt Compression](#4-prompt-compression)
5. [AI Gateways](#5-ai-gateways)
6. [RAG Optimization](#6-rag-optimization)
7. [Memory Systems](#7-memory-systems)
8. [KV Cache Infrastructure](#8-kv-cache-infrastructure)
9. [LLMOps & Observability](#9-llmops--observability)
10. [Tool Selection by Use Case](#10-tool-selection-by-use-case)
11. [Research Landscape](#11-research-landscape)

---

## 1. The Mental Model

The framing that makes everything else click: **the context window is RAM, not disk**.

RAM is fast, expensive, and finite. You don't load everything you own into RAM before running a program. You load exactly what the program needs, right when it needs it. The same applies to LLM context: every token you put there displaces something else, costs money, and competes for the model's attention.

This reframes the engineering challenge. It's not "how do I give the model more information?" but "what is the minimum viable set of information the model needs to succeed?" Every technique in this page is an answer to that second question.

The parallel with system architecture holds further. A CPU without good memory management stalls. An LLM without good context management hallucinates, loses coherence, and drifts toward generic outputs. Optimizing context is not a cost-cutting exercise — it's a reliability investment.

---

## 2. Core Concepts

### Minimum Viable Context (MVC)

MVC is the principle of providing exactly the information needed for the task, nothing more. It has two failure modes that look opposite but stem from the same cause:

- **Under-context**: the model lacks necessary information, hallucinates or produces generic output
- **Over-context**: the model is overwhelmed with irrelevant information, attention diffuses, adherence degrades

The research on adherence degradation (see [context engineering guide, section 2](../core/context-engineering.md#2-the-context-budget)) quantifies the over-context failure: a CLAUDE.md over 400 lines typically drops adherence to ~60%. The cause is attention diffusion — too many potentially relevant signals compete for the model's limited attention budget.

MVC is not about minimalism for its own sake. It's about precision. A 300-token system prompt that covers exactly what the model needs beats a 3,000-token prompt that buries the critical instruction on page five.

### Context Rot

Context rot describes the degradation in model behavior as context length grows during a session. The most studied form is the "lost-in-the-middle" phenomenon: models consistently underweight information placed in the middle of a long context, attending primarily to the beginning and end.

Empirical consequences in practice:

- Instructions near the top of a CLAUDE.md file are followed more consistently than instructions at the bottom
- In long agentic sessions, earlier constraints lose salience as new content pushes them toward the middle
- Tool outputs from the start of a session are often effectively "forgotten" after several rounds of interaction

Mitigation: `/compact` at 70% context usage (not 90%), structured note-taking hooks, and session restarts for fundamentally new task contexts. The `/compact` command summarizes conversation history, moving stale content out of the active attention window while preserving continuity.

### Semantic Priming Hypothesis

An observation from compression research with practical implications: when you ultra-compress a context (removing most tokens), the model does not recall the removed information verbatim. Instead, the compressed context acts as a *semantic prime* — it activates relevant latent knowledge that was already present in the model's weights from training.

This matters because it means heavily compressed context can perform better than its information density suggests. The model is not reconstructing facts from the context; it's being pointed toward relevant knowledge it already has. For well-trained domains, a 10-token hint may activate more relevant knowledge than a 100-token verbatim extract.

The practical implication: prefer keywords and structural cues over prose when context is tight. "Use OpenAPI 3.1, strict mode, no nullable" retrieves more precise behavior than two paragraphs explaining the same thing.

### Context Rot vs. Token Cost: The Two Pressures

Context management operates under two simultaneous pressures that pull in opposite directions:

| Pressure | Cause | Effect | Mitigation |
|----------|-------|--------|------------|
| **Context Rot** | Too much content | Attention diffusion, lost-in-middle | Prune, compact, scope |
| **Token Cost** | Every token billed | Budget overrun, latency increase | Compress, filter, cache |

Compression addresses cost. Pruning addresses rot. Good context engineering does both.

---

## 3. Output Compression: CLI & Tool Output

Tool outputs, shell command results, test logs, and database query responses share a structural problem: they contain 70–95% boilerplate. A passing test suite logs hundreds of success lines for the one failure you care about. A `git log` dumps metadata for every commit when you need three fields. This noise enters the context window verbatim unless intercepted.

### RTK (Rust Token Killer)

RTK is a CLI proxy that intercepts command output before it reaches Claude's context, applying purpose-built filters that surface signal and discard noise. It integrates via a Claude Code hook, so standard commands are transparently rewritten.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk) |
| **Install** | `brew install rtk-ai/tap/rtk` or `cargo install rtk` |
| **Stars** | 446 (March 2026) |
| **Integration** | Claude Code hook via `rtk init --global` |

Measured savings across command categories:

| Command | Reduction |
|---------|-----------|
| `rtk git log` | 92% |
| `rtk git status` | 76% |
| `rtk vitest run` | 99%+ |
| `rtk cargo test` | 89% avg |
| `rtk pnpm outdated` | 70–85% |

The design philosophy: suppress successful output, surface failures. A test suite that passes 300 tests and fails 2 should show 2 lines, not 302. This matches how a developer reads output — context should match that cognitive model.

RTK supports custom filters via TOML DSL (`.rtk/filters.toml`) for project-specific output patterns without writing Rust. See [Third-Party Tools: RTK](./third-party-tools.md#rtk-rust-token-killer) for the complete feature reference.

**Real-world cost impact**: Real-world billing data from the codepointer substack ($926 API bill, analyzed) shows that bash output accounts for roughly 12% of total token usage in a typical Claude Code session, not the dominant source. File reads represent approximately 65%. At 60-90% compression on bash output alone, RTK's real API cost impact is in the range of 6-10% of the total bill, not 60-90%. The per-command savings are genuine; the headline "60-90% savings" refers to the compression ratio on the commands RTK processes, not to overall session cost reduction. For total context efficiency, pair RTK with a file-read compression tool like lean-ctx or tilth (see below).

### Headroom

Headroom targets a different problem: structured data returned by tools (JSON payloads, database results, API responses) that is large but not entirely droppable.

The key difference from RTK: Headroom is lossless. Rather than discarding content, it replaces verbose data with a compressed summary and registers the original with a retrieval handle. If the model determines it needs the full data, it can call a tool to fetch it. This preserves the agent's ability to access detail on demand without loading everything upfront.

| Attribute | Details |
|-----------|---------|
| **Source** | [headroom.ai](https://headroom.ai) |
| **Compression** | 70–95% on structured tool output |
| **Architecture** | Lossless (original accessible via retrieval handle) |
| **Compression models** | SmartCrusher (fast), Kompress (high fidelity) |

When to choose Headroom over RTK:

- Tool outputs contain structured data the model may need partially (database results, API responses)
- You cannot predict which parts of the output the model will need
- Lossless retrieval is a requirement (compliance, debugging, audit trails)

When RTK is sufficient:

- Output is unstructured command-line text
- Successful runs produce noise you definitively do not need
- Simplicity and zero infrastructure is preferred

### tilth

tilth is an MCP server for code navigation that targets the largest single source of token usage in Claude Code sessions: file reads. Rather than returning full file contents, it provides structural navigation via tree-sitter, so the model reads shapes and relationships instead of raw text.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/jahala/tilth](https://github.com/jahala/tilth) |
| **Install** | `cargo install tilth` then `tilth install claude-code` |
| **Architecture** | MCP server, installs into Claude Code |
| **Parser** | tree-sitter (multi-language) |

The core tools it exposes:

- **File read with auto-outline**: for large files, instead of the full text, returns a structural skeleton with section names and line ranges. The model requests specific ranges on demand.
- **Symbol search**: definitions, usages, and resolved callees in a single call, replacing the grep-then-read loop.
- **`--callers`**: all call sites of a symbol, structurally, not via text search.
- **`--deps`**: imports and dependents of a file, useful before a refactor to understand blast radius.
- **`grok <symbol>`**: everything about one symbol in one call: signature, callers, callees, sibling functions, associated tests.
- **Structural diff**: change summary at the function level, not the line level.
- **Session dedup**: symbols already shown in the session are marked `[shown earlier]` rather than re-expanded.

**Benchmarks** (160 runs across 4 real repositories, metric = cost per correct answer):

| Model | Without tilth | With tilth | Cost change | Accuracy change |
|-------|--------------|------------|-------------|----------------|
| Sonnet 4.6 | baseline | tilth | -44% | 84% → 94% |
| Opus 4.6 | baseline | tilth | -39% | 91% → 92% |
| Haiku 4.5 | baseline | tilth | -38% | 54% → 73% |
| Average | | | -40% | 76% → 86% |

The "cost per correct answer" framing is meaningful: it captures both the efficiency gain and the accuracy improvement simultaneously. A tool that saves tokens but degrades output quality is not useful. tilth shows gains on both dimensions.

Why file reads are the right target: they represent about 65% of total token usage in a real Claude Code session (versus ~12% for bash output). Compressing the larger pool produces proportionally larger savings on the total bill.

**Install:**

```bash
cargo install tilth
tilth install claude-code   # registers the MCP server in Claude Code
```

No per-project configuration is needed after global install.

**Comparison with lean-ctx**: Both tilth and lean-ctx use tree-sitter to compress file reads. lean-ctx operates as a hook-level redirect (intercepts native Read calls at the MCP layer), while tilth exposes explicit navigation tools the model calls directly. lean-ctx is more transparent and requires no change to how the model requests files. tilth gives the model more control over what it fetches but requires it to use the tilth tools rather than standard read operations. On teams that want the model to actively navigate code structure rather than have reads compressed passively, tilth's explicit tools fit better.

### context-mode

context-mode is an MCP server that operates at the boundary between tools and context, intercepting tool call outputs before they reach the conversation window and applying compression or selective retrieval. It also implements a session tracking layer using SQLite with FTS5 full-text search, enabling semantic retrieval of earlier session content after `/compact` discards raw history.

| Attribute | Details |
|-----------|---------|
| **Source** | [GitHub: mksglu/context-mode](https://github.com/mksglu/context-mode) |
| **Stars** | ~14,149 (May 2026) |
| **License** | ELv2 (commercial SaaS planned) |
| **Platforms** | Claude Code plugin, Gemini CLI, Copilot, Cursor, Kiro, Zed, and 6 others (12 total) |
| **Claims** | 98% MCP output compression, 65–75% response compression |

**How the MCP output sandbox works**: Instead of routing raw tool call output directly into the conversation, context-mode intercepts the result, applies compression, and injects a summary with a retrieval handle. The full output is accessible on demand if the model requests it, similar in spirit to Headroom's lossless architecture but operating specifically on MCP tool boundaries.

**Session memory after `/compact`**: context-mode uses SQLite + FTS5 to index session history. When `/compact` runs and discards raw conversation history, the SQLite index persists. Subsequent retrieval queries use BM25 ranking to surface relevant earlier context without reloading the full transcript.

**"Think in Code" pattern**: context-mode v1.0.64 documented a pattern where, instead of reading files to answer an exploratory question, the model writes and executes a script that queries or counts, then reads only the result. This is covered in depth as a named technique in the [context engineering guide](../core/context-engineering.md).

**When to choose context-mode**: If you run Claude Code alongside other platforms (Cursor, Gemini CLI) and want a single context management layer that works across all of them. Also useful when MCP tool outputs are large and structured, and you need post-compact session retrieval beyond what `/compact` alone provides.

**Comparison with RTK and Headroom**: RTK operates at the shell command level (CLI output), Headroom at the structured data/API response level. context-mode operates specifically at the MCP tool boundary and adds session persistence. These tools are complementary.

### stacklit

stacklit generates a machine-readable index of a repository's package structure, exported symbols, and dependencies. An agent reads this index in a single call (~250 tokens) instead of spending 50,000+ tokens exploring files to understand the codebase structure.

| Attribute | Details |
|-----------|---------|
| **Source** | [GitHub: glincker/stacklit](https://github.com/glincker/stacklit) |
| **Install** | `npm install -g stacklit` |
| **Integration** | Auto-configures Claude Code, Cursor, and Aider via `stacklit setup` |
| **Claimed reduction** | 50,000+ tokens of exploration compressed to ~250 tokens |

**How it works**: `stacklit generate-json` scans the repository and writes `stacklit.json`, a structured map of packages, exports with type signatures, dependency graph, git activity heatmap, and framework hints. `stacklit setup` injects a compact codebase map into agent configuration files automatically. `stacklit diff` detects when the index is stale after file additions or deletions.

```bash
# One-time setup per repository
stacklit generate-json    # create the index
stacklit setup            # inject into Claude Code / Cursor / Aider config

# Maintenance
stacklit diff             # check if index is stale
stacklit generate-json    # re-index after structure changes
```

**Worktree compatibility**: generates per-repository indexes with no centralized state. Unlike grepai (which requires a local embedding index) or Serena (which connects to a language server), stacklit produces a static JSON file that works in git worktrees and ephemeral CI environments without additional setup.

**Comparison with RTK and context-mode**: RTK intercepts CLI output during a session. context-mode intercepts MCP tool output in real time. stacklit eliminates exploration-phase token spend before the session starts, by making the repo structure known from the first message. The three tools target different moments in a session's lifecycle and are complementary.

---

## 4. Prompt Compression

Prompt compression operates at the model-input level: reducing the token count of the prompt itself before it is sent to the LLM. This differs from output compression (which intercepts tool responses) and context pruning (which manages session history).

### LLMLingua / LLMLingua-2

LLMLingua (Microsoft Research) is the most studied prompt compression framework. It uses a small language model to evaluate the "importance" of each token in a prompt, then removes the least important tokens up to a target compression ratio.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/microsoft/LLMLingua](https://github.com/microsoft/LLMLingua) |
| **Max compression** | 20x |
| **Performance loss** | ~1.5% on GSM8K and BBH benchmarks |
| **Approach (v1)** | Perplexity-based token scoring via small LM |
| **Approach (v2)** | Data distillation from GPT-4, token classification |

LLMLingua-2 improves on the original by treating compression as a classification problem (keep vs. drop) rather than a ranking problem. The classifier is trained via distillation from GPT-4 annotations, making it faster and more generalizable across domains.

The Semantic Priming Hypothesis (see section 2) explains why 20x compression can retain 98.5% of task performance: the model is not recalling compressed text literally. It's using the compressed tokens as semantic anchors into its own pre-trained knowledge. High-frequency tokens (function words, connectives) are often dropped; domain keywords and structural markers are preserved.

**When to use**: Long system prompts, repetitive RAG contexts, few-shot examples where the examples are verbose. Not suitable for code (syntax is load-bearing) or numerical data (every digit matters).

### AttnComp (Research Direction)

AttnComp (not yet a shipping product as of March 2026) proposes replacing perplexity scoring with cross-attention patterns as the compression metric. The argument: perplexity measures how "surprising" a token is given its predecessors — useful for language modeling, but only loosely correlated with task relevance. Cross-attention patterns directly show which tokens the model attends to for a given output, making it a more principled importance metric.

Published results show AttnComp outperforms LLMLingua at equivalent compression ratios. Monitor for OSS release.

---

## 5. AI Gateways

AI gateways sit between your application and the LLM provider. They handle routing, rate limiting, cost management, and increasingly, active context transformation. The gateway category is where infrastructure and context engineering overlap.

### Edgee

Edgee positions as a "composable edge layer" for AI applications. Its context engineering features operate transparently at the HTTP layer: the application sends a standard API call, Edgee intercepts it, applies compression and routing policies, and forwards the optimized request to the model.

| Attribute | Details |
|-----------|---------|
| **Source** | [edgee.cloud](https://www.edgee.cloud) |
| **Context compression** | Up to 50% active compression |
| **Deployment** | Edge (close to user, low latency) |
| **Features** | Routing, guardrails, compression, cost policies |

The "edge" positioning is deliberate: by running close to the user rather than in a centralized server, Edgee reduces round-trip latency while still intercepting the full request/response cycle. This matters in interactive applications where token compression and latency are both constraints.

Guardrails are applied at the gateway level, meaning they are enforced regardless of which application or client initiates the request. In multi-tenant environments, this separates the concern of "what context reaches the model" from the application code that generates it.

### Portkey

Portkey is the more established player in the AI gateway category, with a broader feature set centered on unified routing across multiple LLM providers.

| Attribute | Details |
|-----------|---------|
| **Source** | [portkey.ai](https://portkey.ai) |
| **Model support** | 250+ LLMs via unified API |
| **Features** | Routing, fallbacks, load balancing, caching, guardrails |
| **Observability** | Built-in tracing and cost tracking |

Portkey's semantic caching layer is particularly relevant for context optimization: identical or near-identical requests are cached and returned without an LLM call. In applications with repetitive query patterns (helpdesks, code review bots, internal search), cache hit rates can reduce total LLM calls by 30–60%.

**Gateway vs. Output Compression**: these categories complement each other. RTK/Headroom compress what goes into the context from tool outputs. Gateways compress or route the assembled prompt before it hits the model. Both reduce total token spend, but they intercept at different points in the pipeline.

---

## 6. RAG Optimization

Retrieval-Augmented Generation has a well-documented failure mode: the retrieval step returns chunks that are semantically relevant in isolation but lack the context to be useful. A fragment mentioning "Q3 revenue grew 3%" is meaningless without the company name and year — both of which may have been in the same document but in a different chunk.

### Anthropic Contextual Retrieval

Anthropic's contextual retrieval method addresses chunk isolation by pre-contextualizing each fragment before indexing. A short LLM-generated preamble is prepended to each chunk, situating it within the document it came from.

```
Before: "Revenue grew 3% in Q3."

After: "From Acme Corp Q3 2024 earnings report: Revenue grew 3% in Q3."
```

The preamble is generated once per chunk at indexing time, not at retrieval time. With prompt caching, the cost of generating preambles for a large document corpus is reduced by ~90% (the document is cached; only the per-chunk instruction varies).

Published results from Anthropic's evaluation:

| Method | Failure Rate Reduction |
|--------|----------------------|
| Contextual embeddings only | 35% |
| Contextual BM25 (keyword + semantic) | 49% |
| Contextual embeddings + BM25 + reranking | 67% |

The combination of semantic search (embeddings), keyword search (BM25), and a reranking step that re-orders results by relevance to the actual query produces the best outcomes. Reranking providers include Cohere and Voyage AI.

Cost at scale: generating contextual preambles for 1M document tokens costs approximately $1.02 after prompt caching. For most production corpora, this is a one-time indexing cost.

### JIT / Agentic Search

Traditional RAG loads the retrieval results at the start of the request. JIT (Just-in-Time) retrieval defers this: the agent starts with minimal context and retrieves information on-demand as the task reveals what it actually needs.

This matters for agent workflows with unpredictable information requirements. A code debugging agent may need one set of docs for a Python error and a completely different set for the database error encountered two steps later. Loading both upfront wastes context; loading neither forces hallucination. JIT retrieval threads the needle.

In Claude Code terms: this is what the agent does naturally when it uses tools (`list_directory`, `read_file`, `grep`) rather than receiving a pre-assembled context. The "search when needed" pattern is a design principle, not just a Claude capability.

### RAG Triad Evaluation

The RAG Triad is a framework for evaluating RAG output quality across three dimensions:

| Dimension | Question | What it catches |
|-----------|----------|----------------|
| **Context Relevance** | Is the retrieved context relevant to the question? | Retrieval failures |
| **Answer Relevance** | Is the answer relevant to the question? | Generation drift |
| **Groundedness** | Is the answer supported by the retrieved context? | Hallucination |

All three can fail independently. A system can retrieve perfectly relevant context and still hallucinate (groundedness failure). It can generate a relevant answer not supported by what was retrieved. Evaluating all three simultaneously identifies which part of the RAG pipeline is the weak link.

Arize Phoenix implements the RAG Triad as a production evaluation framework (see section 9).

---

## 7. Memory Systems

Long-running agents face a variant of the context rot problem: session history grows until it exceeds the context window, or until early context is effectively ignored. Memory systems solve this by moving information out of the context window and into persistent storage, retrieving it on demand.

### Short-Term: Compaction and Structured Note-Taking

For Claude Code specifically, two mechanisms handle session-level memory:

**`/compact`** summarizes the conversation history, replacing the raw exchange with a dense summary. The model retains continuity but the token count resets substantially. Use at 70% context usage, not 90%.

**Structured note-taking via hooks** is the agentic version: a PostToolUse hook writes key decisions, discovered facts, and task state to a notes file. The agent loads this file at the start of the next session. This sidesteps context rot entirely for multi-session work — the notes file sits at the start of the context (maximum attention) and contains only curated information.

**Auto Memory (v2.1.59+)** and **Auto Dream** provide native CC alternatives: Claude writes its own `MEMORY.md` between sessions, and a background sub-agent consolidates it after ≥5 sessions and ≥24 hours. See [Memory Systems: Auto Memory](../core/memory-systems.md#22-auto-memory-v21594).

### Long-Term: External Memory Systems

For multi-session and multi-agent workflows, persistent memory systems store information outside the context window and retrieve it selectively. The CC ecosystem has a three-tier model:

**Individual (no team)**: claude-mem (26.5K stars, hooks-based auto-capture), agentmemory (16K stars, BM25+vector+graph fusion, 95.2% R@5), ICM (Rust binary, dual decay+graph architecture, `brew install icm`).

**Team sharing**: CLAUDE.md + `.mcp.json` + skills committed to the repo (the Trinity, zero infra). Mem0 Cloud MCP for pooled team memory. Zep/Graphiti for temporal knowledge graphs.

**The RAG-vs-Memory distinction**: RAG is the model's access to external world knowledge (docs, codebase, web). Memory is its access to user-specific and session-specific knowledge (preferences, past decisions, continuity). Both are retrieval systems serving different parts of the information architecture. A well-designed agent uses both.

> **Canonical reference**: [Memory Systems guide](../core/memory-systems.md) — 20-tool comparison table, architecture patterns, risk matrix, decision flowchart, and benchmarks.

---

## 8. KV Cache Infrastructure

This section has two parts. The first covers Anthropic's prompt caching mechanics as they apply to Claude Code, including how Claude Code structures requests to maximize hit rates. The second covers self-hosted inference infrastructure for teams deploying their own LLMs.

### What is the KV Cache?

During the prefill phase (processing the input), the transformer computes Key-Value pairs for every token in the context. These pairs are stored in GPU VRAM, not as raw text or token hashes. For a 100K-token prefix on Opus, the KV data occupies approximately 500MB–1GB of VRAM.

For subsequent requests that share a prefix (e.g., the same system prompt), these stored KV values can be reused rather than recomputed. This is KV cache reuse. The autoregressive nature of transformers imposes one strict constraint: only prefixes can be cached. If token N changes, the KV entries for tokens N+1 onward must be recomputed. A modification anywhere in the prefix invalidates everything downstream.

Without KV cache reuse, every request processes the full context from scratch. With effective caching, only the unique portion of each request (the user message, new tool results) requires fresh computation. Anthropic's prompt caching reduces both latency and cost: cached tokens on Opus are billed at approximately $0.50/M versus $5/M for uncached input tokens. Cache hits require the shared prefix to be long enough (typically 1,024+ tokens) and recent enough (cache expires after approximately 5 minutes without access).

### How Claude Code Uses Prompt Caching

Claude Code structures every request to maximize cache hit rate. The request order matters because of the prefix constraint: items that change most often must appear last.

**Request structure (most stable to least stable)**:

1. **System prompt** — Identical across all Claude Code users on the same version. Shared cache: all users on the same version benefit from the same cached KV entries when Anthropic serves the system prompt from shared GPU memory.
2. **Tool definitions** — Static per session. Locked at session start. Adding or removing tools mid-session invalidates the entire conversation cache, which is why Claude Code locks the tool list when a session begins.
3. **Project config / CLAUDE.md** — Injected as message content (via `<system-reminder>` blocks in messages), not in the system prompt.
4. **Conversation history** — The sliding breakpoint: only new turns require fresh computation.

**Why CLAUDE.md is not in the system prompt**: If CLAUDE.md content were injected into the system prompt, each user's prefix would be unique (different projects, different configs), and the shared caching benefit of the ~30K-token system prompt would disappear. By keeping the system prompt identical for all users and injecting CLAUDE.md as message content, Anthropic can amortize the system prompt computation cost across every concurrent Claude Code session. CLAUDE.md still gets cached once it appears in the conversation history, but the system prompt itself stays universally shared.

**Production hit rates**: In real Claude Code sessions, prompt caching achieves approximately 96% hit rate. The simple reason is that the system prompt, tool definitions, CLAUDE.md content, and prior conversation turns all hit the cache; only the new user turn and the model's response are fresh computation.

### Cache Anti-Patterns

**Timestamps in the system prompt**: Any frequently-changing value in the system prompt prefix breaks caching by making every user's prefix unique. A Hacker News user reported recovering over 20 percentage points of cache hit rate by moving a timestamp field from the system prompt prefix into a message. The fix: move dynamic values (current date, git branch, file modification times) into message content, not the system prompt.

**Adding or removing tools mid-session**: Because tool definitions sit between the system prompt and conversation history in the request prefix, any change to the tool list invalidates the cache for the entire conversation. Claude Code avoids this by locking tool definitions at session start.

### Plan Mode: A Cache-Stable Design Pattern

Plan Mode restricts write access during planning phases. A naive implementation would be to remove write tools from the tool list while in Plan Mode. The problem: removing tools from the list changes the prefix, invalidating the entire session cache.

Claude Code's actual implementation: rather than removing tools, two new tools are added (`EnterPlanMode` and `ExitPlanMode`). The full tool list remains constant across mode switches. Mode behavior is conveyed through instructions in messages, not through changes to the tool definitions. The cache prefix stays identical whether Plan Mode is on or off.

This is a concrete example of a broader design principle: prefer instruction-level mode switching over structural changes to the request prefix.

### Compaction vs `/clear` for Cache Continuity

Compaction (`/compact`) preserves the cache. The compaction request reuses the same system prompt and tool definitions prefix, so cached KV entries from earlier in the session remain valid after compaction runs. Only the conversation history portion is replaced with the summary.

`/clear` followed by more than approximately 5 minutes of inactivity can result in a full cold start. The TTL for cached entries expires during the idle time, so the next request finds no cached KV entries for the system prompt or tool definitions. This is one reason Claude Code defaults to compaction rather than hard resets for long sessions: compaction preserves continuity without triggering cache expiration.

### Self-Hosted KV Cache Infrastructure

The following tools apply to teams deploying their own LLMs rather than using Anthropic's managed API.

### vLLM (PagedAttention)

vLLM is the dominant open-source inference engine for self-hosted LLMs. Its key innovation is PagedAttention: KV cache memory is allocated in fixed-size pages (analogous to OS virtual memory pages) rather than contiguous blocks.

Traditional KV cache allocation wastes 60–80% of GPU memory through fragmentation (allocating worst-case space per sequence). PagedAttention reduces this waste to under 4% by sharing pages across requests and allocating on demand.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/vllm-project/vllm](https://github.com/vllm-project/vllm) |
| **Key innovation** | PagedAttention (non-contiguous KV cache) |
| **Memory waste** | Reduced from 60–80% to <4% |

### SGLang (RadixAttention)

SGLang introduces RadixAttention: KV cache entries are organized as a radix tree (trie structure) keyed on the token sequence. When two requests share a prefix, their shared prefix's KV entries are reused automatically.

This is particularly powerful for:

- Multiple requests sharing the same system prompt (the trie stores it once)
- RAG pipelines where the retrieved document is constant across many queries
- Multi-agent systems where a base context is shared across subagents

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/sgl-project/sglang](https://github.com/sgl-project/sglang) |
| **Key innovation** | RadixAttention (trie-based automatic cache reuse) |
| **Best for** | Shared-prefix workloads, multi-agent systems |

### Semantic Caching

Semantic caching operates above the model layer: instead of caching KV activations, it caches complete LLM responses keyed on semantic similarity of the request. A new request that is semantically close to a cached request returns the cached response without an LLM call.

Redis, with vector search extensions, is the most common implementation. In high-repetition workloads (FAQ bots, internal search, code review pipelines with similar patterns), semantic cache hit rates of 30–60% are achievable, with some production deployments reporting 73% cost reduction.

The risk: cached responses become stale. Semantic caching requires TTL policies aligned with how frequently the underlying knowledge changes.

---

## 9. LLMOps & Observability

You cannot optimize what you do not measure. The LLMOps tooling category provides the instrumentation layer: tracing, cost tracking, quality evaluation, and drift detection for LLM-powered systems.

### Langfuse

The leading open-source option. Langfuse traces LLM calls across complex multi-step agent workflows, capturing input/output at each step, latency, cost per call, and the full execution tree.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/langfuse/langfuse](https://github.com/langfuse/langfuse) |
| **License** | Open-source (MIT) |
| **Deployment** | Self-hosted or cloud |
| **Best for** | Self-hosting requirements, cost analysis, trace debugging |

Key features for context optimization: per-session token cost breakdowns, trace comparison (which prompt variant is cheaper?), and custom evaluation metrics you can run on stored traces without rerunning the agent.

### LangSmith

LangSmith is Anthropic-adjacent (LangChain ecosystem) and the standard choice if you are building on LangChain or LangGraph. It excels at debugging chained operations where understanding the execution graph is as important as the individual LLM calls.

| Attribute | Details |
|-----------|---------|
| **Source** | [smith.langchain.com](https://smith.langchain.com) |
| **Best for** | LangChain/LangGraph workloads, chain debugging, A/B testing |
| **Features** | Dataset management, automated evaluation, regression testing |

### Arize Phoenix

Phoenix specializes in RAG quality evaluation, implementing the RAG Triad natively. It traces retrieval operations alongside generation, so you can correlate retrieval quality with final answer quality.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) |
| **License** | Open-source |
| **Specialty** | RAG evaluation, LLM-as-judge metrics, embedding drift |

Particularly useful for: identifying when retrieval is the bottleneck (context relevance failures) versus generation (groundedness failures). This distinction determines whether you fix the retriever or the prompt.

### Maxim AI

Maxim AI focuses on continuous evaluation: running automated evals against every production trace, not just offline test sets. It supports LLM-as-a-judge workflows (using an LLM to score another LLM's output) and A/B testing of prompt variants against production traffic.

| Attribute | Details |
|-----------|---------|
| **Source** | [getmaxim.ai](https://www.getmaxim.ai) |
| **Best for** | Continuous eval, A/B testing in production, regression detection |

### TruLens

TruLens implements the RAG Triad evaluation framework as an open-source library. It can be embedded directly in your application code, running evaluations inline as part of the application rather than in a separate observability platform.

| Attribute | Details |
|-----------|---------|
| **Source** | [github.com/truera/trulens](https://github.com/truera/trulens) |
| **License** | Open-source |
| **Best for** | Inline RAG evaluation, library integration, RAG Triad scoring |

### Choosing an Observability Tool

| Need | Recommended |
|------|------------|
| Self-host everything, cost analysis | Langfuse |
| LangChain ecosystem, chain debugging | LangSmith |
| RAG quality evaluation specifically | Arize Phoenix |
| Continuous prod eval, A/B testing | Maxim AI |
| Embed RAG Triad in app code | TruLens |

These tools are not mutually exclusive. Langfuse for tracing plus Phoenix for RAG evaluation is a common combination.

---

## 10. Tool Selection by Use Case

### You are a Claude Code user (individual developer)

| Problem | Tool |
|---------|------|
| Command outputs flooding context | RTK |
| File reads consuming most of context budget | tilth or lean-ctx |
| Monitoring token spend | ccusage (see [Third-Party Tools](./third-party-tools.md)) |
| Context growing too long in a session | `/compact` at 70% usage |
| Forgetting past session decisions | ICM memory system |
| Claude ignoring rules from long CLAUDE.md | Path-scoping (see [context engineering guide](../core/context-engineering.md)) |

### You are building an AI application

| Problem | Tool |
|---------|------|
| Tool output JSON too verbose | Headroom |
| Prompts too long, need compression | LLMLingua |
| Routing across multiple LLM providers | Portkey |
| Compression + guardrails at the edge | Edgee |
| RAG chunks losing context | Anthropic Contextual Retrieval |
| Tracing agent execution | Langfuse or LangSmith |
| RAG quality measurement | Arize Phoenix |
| Continuous evaluation | Maxim AI |

### You are deploying a self-hosted LLM

| Problem | Tool |
|---------|------|
| GPU memory efficiency | vLLM (PagedAttention) |
| Shared-prefix caching (multi-agent, RAG) | SGLang (RadixAttention) |
| Caching repeated queries semantically | Redis with vector search |

---

## 11. Research Landscape

Active research areas that have not yet shipped as production tools (March 2026):

### SlimInfer (Dynamic Token Pruning)

SlimInfer identifies redundant token representations in intermediate transformer layers and prunes them during inference. Published results: 2.53x speedup on Time-to-First-Token for LLaMA 3.1 without measurable quality degradation. The mechanism: mid-layer representations for many tokens converge to near-identical values; pruning these redundant representations saves computation without losing information.

### TopV (Visual Token Pruning)

For multimodal models (vision-language models), image tokens dominate context usage. A 1024x1024 image can generate thousands of visual tokens, most of which encode uninformative patches (backgrounds, margins). TopV formulates patch selection as an optimization problem (Sinkhorn algorithm), retaining only the visual regions relevant to the reasoning task. Published results show significant TTFT reduction on VLM inference with maintained task performance.

### The Token Reduction Effect on Hallucination

A finding that cuts across multiple research directions: token reduction in generative models does not just reduce cost — it measurably reduces hallucination and "overthinking" on simple queries. The mechanism is not fully understood, but the correlation is consistent across studies. Shorter, more precise contexts yield more grounded, less verbose outputs. This strengthens the case for MVC as a reliability principle, not just a cost principle.

---

> **Cross-references**
>
> - [Context Engineering (configuration guide)](../core/context-engineering.md) — CLAUDE.md hierarchy, path-scoping, budget management
> - [Third-Party Tools](./third-party-tools.md) — RTK full reference, ccusage, ICM, and other CC-specific tools
> - [MCP Servers Ecosystem](./mcp-servers-ecosystem.md) — MCP as dynamic context injection
> - [Observability](../ops/observability.md) — Monitoring Claude Code in production
> - [Ultimate Guide: Memory Systems](.#memory-hierarchy) — Complete memory architecture for Claude Code
