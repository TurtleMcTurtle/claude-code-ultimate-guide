---
title: "MCP Servers Ecosystem"
description: "Validated community MCP servers evaluated for production readiness and security"
tags: [mcp, reference, integration]
---

# MCP Servers Ecosystem

**Last updated**: May 2026 • **Next review**: June 2026

This guide covers validated community MCP servers beyond the official Anthropic servers. All servers listed have been evaluated for production readiness, maintenance activity, and security.

> **Not sure whether to use an MCP server or a CLI tool?** See the [MCP vs CLI Decision Guide](./mcp-vs-cli.md) for a full breakdown of tradeoffs, a decision matrix, and guidance by situation.

## Table of Contents

- [Official vs Community Servers](#official-vs-community-servers)
- [Evaluation Framework](#evaluation-framework)
- [Ecosystem Evolution](#ecosystem-evolution)
- [Validated Community Servers](#validated-community-servers)
  - [Browser Automation](#browser-automation)
  - [DevOps & Infrastructure](#devops--infrastructure)
  - [Security & Code Analysis](#security--code-analysis)
  - [Code Search & Analysis](#code-search--analysis)
  - [Documentation & Knowledge](#documentation--knowledge)
  - [Project Management](#project-management)
  - [Orchestration](#orchestration)
- [Production Deployment](#production-deployment)
- [Monthly Watch Methodology](#monthly-watch-methodology)
- [Excluded Servers](#excluded-servers)

---

## Official vs Community Servers

| Type | Examples | Characteristics | Use When |
|------|----------|-----------------|----------|
| **Official** | filesystem, memory, brave-search, github | Anthropic-maintained, guaranteed stability | Default choice, core functionality |
| **Community** | Playwright, Semgrep, Kubernetes | Maintained by orgs/individuals, can be production-ready | Specialized needs, ecosystem integration |

**Key difference**: Official servers have Anthropic SLA backing, community servers require individual evaluation.

---

## Evaluation Framework

All community servers are evaluated against these criteria:

| Criterion | Threshold | Justification |
|-----------|-----------|---------------|
| **GitHub Stars** | ≥50 | Minimum community validation |
| **Recent Release** | <3 months | Active maintenance |
| **Documentation** | README + examples + config | Reduces adoption friction |
| **Tests/CI** | ✅ Automated | Ensures stability |
| **Use Case** | Not covered by official servers | Avoids redundancy |
| **License** | OSS required | Sustainability and auditability |

**Quality Score Components**:
- Maintenance (10 points): Release frequency, issue response time
- Documentation (10 points): README completeness, examples, troubleshooting
- Tests (10 points): Test coverage, CI/CD automation
- Performance (10 points): Response time, resource efficiency
- Adoption (10 points): Community usage, production deployments

**Total Score**: `/50` → Normalized to `/10` for final rating.

---

## Ecosystem Evolution

**Major developments (January 2026)**:

### Linux Foundation Standardization

MCP becomes official standard via **Agentic AI Foundation** under Linux Foundation governance.

- **Announcement**: [YouTube - Linux Foundation](https://www.youtube.com/watch?v=btNbIY7KYwg)
- **Impact**: Enterprise adoption, long-term stability guarantee

### Advanced MCP Tool Use

Anthropic deploys optimizations for MCP context management:

- **Deferred loading**: Tools loaded on-demand, not upfront
- **Search-based tools**: Efficient tool discovery in large sets
- **Announcement**: [Josh Twist LinkedIn](https://www.linkedin.com/posts/joshtwist_anthropic-recently-dropped-advanced-mcp-activity-7399492619581718528-g-Ip)

### MCPB Bundle Format

Standardized bundle format for one-click MCP server installation (replaces runtime dependency management).

- **Discussion**: [Reddit - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1qkzdh0/mcp_server_installs_are_nondeterministic_heres/)
- **Benefit**: Deterministic installations, reduced setup friction

### MCP Apps (Interactive Work Tools)

Claude now supports interactive tools via MCP Apps spec:

- **Examples**: Slack drafting, Figma diagrams, Asana timelines
- **Announcement**: [Smol.ai Newsletter](https://news.smol.ai/issues/26-01-26-mcp-apps)
- **Deep dive**: See [guide/architecture.md:656](../core/architecture.md#mcp-extensions-apps-sep-1865)

### IDE Integration

**Visual Studio 2026** natively integrates Azure MCP Server, GitHub Copilot Chat, and MCP clients.

- **Announcement**: [Microsoft DevBlogs](https://devblogs.microsoft.com/visualstudio/azure-mcp-server-now-built-in-with-visual-studio-2026-a-new-era-for-agentic-workflows/)

---

## Version Control (Official Servers)

These foundational MCP servers provide version control automation for all development workflows. **Official Anthropic servers** with guaranteed stability.

### Git MCP (Anthropic)

**Official Anthropic server** for Git repository interaction via Model Context Protocol. Provides programmatic access to Git operations with structured output and cross-platform safety.

**Repository**: [modelcontextprotocol/servers/git](https://github.com/modelcontextprotocol/servers/tree/main/src/git)
**License**: MIT
**Status**: Early development (API subject to change)
**Stars**: 77,908+ (parent repo)

**Use Cases**:
- **Automated commit workflows**: AI generates commit messages, stages changes, commits
- **Log analysis**: Filter commits by date, author, branch with structured output
- **Branch management**: Create feature branches, checkout, filter by SHA
- **Token-efficient diffs**: Control context lines for focused code reviews
- **Multi-repo automation**: Manage multiple repositories in monorepo setups

#### Key Features

| Tool | Description | Parameters |
|------|-------------|------------|
| `git_status` | Working tree status (staged, unstaged, untracked) | - |
| `git_log` | Commit history with advanced filtering | `max_count`, `skip`, `start_timestamp`, `end_timestamp`, `author` |
| `git_diff` | Diff between commits/branches | `target`, `source`, `context_lines` |
| `git_diff_unstaged` | Unstaged changes | `context_lines` |
| `git_diff_staged` | Staged changes | `context_lines` |
| `git_commit` | Create commit | `message` |
| `git_add` | Stage files/patterns | `files` |
| `git_reset` | Unstage files | `files` |
| `git_branch` | List/filter branches | `contains`, `not_contains` |
| `git_create_branch` | Create new branch | `name` |
| `git_checkout` | Switch branches/commits | `ref` |
| `git_show` | Show commit details | `revision` |

**Advanced Filtering** (`git_log`):
- **ISO 8601 dates**: `2024-01-15T14:30:25`
- **Relative dates**: `2 weeks ago`, `yesterday`, `last month`
- **Absolute dates**: `2024-01-15`, `Jan 15 2024`
- **Author filtering**: `--author="John Doe"`

#### Setup

**Installation (3 methods)**:

```bash
# Method 1: UV (recommended) - one-liner
uvx mcp-server-git --repository /path/to/repo

# Method 2: pip + Python module
pip install mcp-server-git
python -m mcp_server_git

# Method 3: Docker (sandboxed)
docker run -v /path/to/repo:/repo ghcr.io/modelcontextprotocol/mcp-server-git
```

**Claude Code Configuration** (`~/.claude.json`):

```json
{
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/Users/you/projects/myrepo"]
    }
  }
}
```

**Multi-repo support**:

```json
{
  "mcpServers": {
    "git-main": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/main-repo"]
    },
    "git-docs": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/path/to/docs-repo"]
    }
  }
}
```

#### IDE Integrations

**One-click install buttons available for**:
- **Claude Desktop** (macOS/Windows/Linux)
- **VS Code** (Stable + Insiders)
- **Zed**
- **Zencoder**

See [official README](https://github.com/modelcontextprotocol/servers/tree/main/src/git#quickstart) for integration links.

#### Quality Score

**8.5/10** ⭐⭐⭐⭐⭐

| Criterion | Score | Notes |
|-----------|-------|-------|
| Maintenance | 10/10 | Anthropic-backed, active development |
| Documentation | 9/10 | Comprehensive README, examples, but early dev warnings |
| Tests | 8/10 | Automated CI, improving coverage |
| Performance | 8/10 | Fast (<100ms), structured output reduces tokens |
| Adoption | 8/10 | Official server, 77K+ stars, wide IDE support |

#### Limitations & Workarounds

| Limitation | Workaround |
|------------|-----------|
| **Early development** (API changes) | Pin version in production, monitor releases |
| **No interactive rebase** (`-i` flag) | Use Bash tool for `git rebase -i` |
| **No reflog support** | Use Bash tool for `git reflog` |
| **No git bisect** | Use Bash tool for `git bisect` |
| **Single repo per instance** | Configure multiple MCP server instances |

#### Decision Matrix: Git MCP vs GitHub MCP vs Bash Tool

**When to use which tool**:

| Operation | Git MCP | GitHub MCP | Bash Tool | Justification |
|-----------|---------|------------|-----------|---------------|
| **Local commits** | ✅ Best | ❌ | ⚠️ OK | Structured output, cross-platform safe |
| **Branch management** | ✅ Best | ❌ | ⚠️ OK | `git_branch` filtering, SHA contains/excludes |
| **Diff/log analysis** | ✅ Best | ❌ | ⚠️ OK | `context_lines` control, token-efficient |
| **Staging files** | ✅ Best | ❌ | ⚠️ OK | Pattern matching (`git_add`), safer |
| **PR creation** | ❌ | ✅ Best | ⚠️ gh CLI | GitHub API, labels, assignees, reviewers |
| **Issue management** | ❌ | ✅ Best | ⚠️ gh CLI | GitHub-specific operations |
| **CI/CD status checks** | ❌ | ✅ Best | ⚠️ gh CLI | GitHub Actions integration |
| **Interactive rebase** | ❌ | ❌ | ✅ Best | Git MCP doesn't support `-i` flag |
| **Reflog recovery** | ❌ | ❌ | ✅ Best | Advanced Git operations |
| **Git bisect debugging** | ❌ | ❌ | ✅ Best | Complex debugging workflows |
| **Multi-tool pipelines** | ✅ | ✅ | ❌ | MCP servers compose with other MCP tools |

**Decision Tree**:

```
Is it a GitHub-specific operation (PRs, Issues, Actions)?
├─ YES → Use GitHub MCP
└─ NO → Is it a core Git operation (commit, branch, diff, log)?
    ├─ YES → Use Git MCP (structured, safe, token-efficient)
    └─ NO → Is it an advanced Git feature (rebase -i, reflog, bisect)?
        ├─ YES → Use Bash tool (flexibility)
        └─ NO → Default to Git MCP (safer, structured)
```

**Workflow Examples**:

| Workflow | Tool Chain | Justification |
|----------|-----------|---------------|
| **Feature development** | Git MCP (`git_create_branch` + `git_commit`) → GitHub MCP (PR) | Atomic, structured, full lifecycle |
| **Commit history analysis** | Git MCP (`git_log` with `start_timestamp: "2 weeks ago"`) | Token-efficient filtering, relative dates |
| **Code review preparation** | Git MCP (`git_diff` with `context_lines: 3`) | Focused context, reduced tokens |
| **Clean up commits (rebase)** | Bash tool (`git rebase -i HEAD~5`) | Interactive mode not in Git MCP |
| **Recover lost commits** | Bash tool (`git reflog`) | Reflog not exposed in Git MCP |
| **Bug hunting with bisect** | Bash tool (`git bisect start/good/bad`) | Bisect workflow not in Git MCP |
| **Automated release flow** | Git MCP (commit + tag) → GitHub MCP (create release) | Full automation, structured |

#### Resources

- **GitHub**: https://github.com/modelcontextprotocol/servers/tree/main/src/git
- **Parent Repo**: https://github.com/modelcontextprotocol/servers (77,908+ stars)
- **MCP Inspector**: Debug tool support for live testing
- **Docker Hub**: `ghcr.io/modelcontextprotocol/mcp-server-git`

---

## Validated Community Servers

### Browser Automation

#### Playwright MCP (Microsoft)

**Official Microsoft server** for browser automation optimized for LLMs. Uses accessibility trees instead of screenshots, reducing token usage.

**Use Case**: AI coding agents verify their work in browsers (E2E testing, bug verification).

**Key Features**:

| Capability | Details |
|------------|---------|
| Browser Automation | Navigate, click, fill, hover (Playwright API) |
| Content Extraction | Structured data via accessibility trees |
| Screenshots | Full-page + element-specific |
| JavaScript Execution | Run code in page context |
| Session Management | Persistent browser state |
| Supported Browsers | Chromium, Firefox, WebKit |

**Setup**:

```bash
# Installation
npm install @microsoft/playwright-mcp
# or
npx @microsoft/playwright-mcp
```

**Claude Code Configuration** (`~/.claude.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["--yes", "@microsoft/playwright-mcp"]
    }
  }
}
```

**Example Usage**:

```
User: "Navigate to example.com, log in with email test@example.com, then take a screenshot"

Claude: [Uses playwright_navigate → playwright_type → playwright_click → playwright_screenshot]

Result: Screenshot + accessibility tree in context
```

**Quality Score**: **8.8/10** ⭐⭐⭐⭐⭐

| Dimension | Score | Notes |
|-----------|-------|-------|
| Maintenance | 9/10 | Bi-weekly releases, active Microsoft team |
| Documentation | 9/10 | README complete, examples, Playwright Live videos |
| Tests | 10/10 | Extensive test suite, CI/CD automated |
| Performance | 8/10 | Fast snapshots (~200ms), memory-efficient |
| Adoption | 8/10 | 2890+ uses (Smithery.ai tracking) |

**Limitations & Workarounds**:

| Limitation | Workaround |
|------------|-----------|
| Single browser session | Use session ID to persist state |
| No cross-domain iframe access | Restrict to same-origin content |
| Screenshot size limits (4K max) | Use element snapshots for large pages |

**Alternatives**:

| Server | Advantage | Disadvantage |
|--------|-----------|--------------|
| **Playwright MCP** | Accessibility trees, LLM-native | No vision model support |
| Browserbase MCP | Cloud-based, stealth mode | API costs, latency |
| Puppeteer MCP | Lightweight, JS-only | Less structured data |

**Resources**:
- **GitHub**: https://github.com/microsoft/playwright-mcp
- **Releases**: https://github.com/microsoft/playwright-mcp/releases
- **Playwright Live Demo**: https://youtu.be/CNzg1aPwrKI

---

#### Browserbase MCP

**Official Browserbase server** for cloud browser automation. Includes Stagehand AI agent for autonomous task execution.

**Use Case**: Complex web interactions requiring stealth mode, proxy support, or autonomous execution (web scraping, form filling, data extraction).

**Key Features**:

| Capability | Details |
|------------|---------|
| Browser Control | Chromium via Browserbase cloud |
| Stagehand Agent | Autonomous task execution (e.g., "book a flight") |
| Data Extraction | CSS selectors + schema-based structured extraction |
| Anti-Detection | Stealth mode, proxy support, rotation |
| Multi-Model | OpenAI, Claude, Gemini, custom LLM |

**Setup**:

```bash
npm install @browserbasehq/mcp-server-browserbase
```

**Configuration**:

```json
{
  "mcpServers": {
    "browserbase": {
      "command": "npx",
      "args": ["@browserbasehq/mcp-server-browserbase"],
      "env": {
        "BROWSERBASE_API_KEY": "YOUR_KEY",
        "BROWSERBASE_PROJECT_ID": "YOUR_PROJECT_ID",
        "GEMINI_API_KEY": "YOUR_GEMINI_KEY"
      }
    }
  }
}
```

**Quality Score**: **7.6/10** ⭐⭐⭐⭐

**Cost**: Freemium (paid API usage), ~$0.10/session

**Limitations**:

| Limitation | Workaround |
|------------|-----------|
| Latency (~500ms cloud) | Batch operations, cache results |
| API costs | Use for high-value extractions only |
| Stagehand limitations | Fall back to manual playwright_* tools |

**Resources**:
- **GitHub**: https://github.com/browserbase/mcp-server-browserbase
- **Official Docs**: https://www.browserbase.com

---

#### Chrome DevTools MCP

**Official Anthropic server** for Chrome DevTools Protocol integration. Provides debugging and inspection capabilities via Chrome's native DevTools APIs.

**Use Case**: Debugging web applications, inspecting runtime state, monitoring network requests, and analyzing performance. Complements Playwright MCP (testing) with development-focused debugging capabilities.

**Key Features**:

| Capability | Details |
|------------|---------|
| Console Access | Read browser console logs, errors, warnings |
| Network Monitor | Inspect HTTP requests, responses, headers |
| DOM Inspection | Query DOM structure, element properties |
| JavaScript Execution | Execute arbitrary JS in page context |
| Performance Profiling | CPU profiles, memory snapshots |

**Setup**:

```bash
npm install @modelcontextprotocol/server-chrome-devtools
```

**Configuration**:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-chrome-devtools"]
    }
  }
}
```

**When to Use**:

| Scenario | Use Chrome DevTools MCP | Use Playwright MCP |
|----------|------------------------|-------------------|
| Debug runtime errors | ✅ Console logs, stack traces | ❌ Limited error visibility |
| Inspect network calls | ✅ Full request/response details | ⚠️ Basic navigation only |
| Test user interactions | ❌ Not designed for testing | ✅ Click, type, navigate |
| Profile performance | ✅ CPU/memory profiling | ❌ No profiling tools |
| Automate workflows | ❌ Manual debugging focus | ✅ E2E test automation |

**Limitations**:
- Requires Chrome browser running with DevTools Protocol enabled
- Manual setup (launch Chrome with `--remote-debugging-port`)
- Not suitable for automated testing (use Playwright for that)
- Performance overhead when profiling enabled

**Resources**:
- **npm**: https://www.npmjs.com/package/@modelcontextprotocol/server-chrome-devtools
- **Chrome DevTools Protocol**: https://chromedevtools.github.io/devtools-protocol/

---

### DevOps & Infrastructure

#### Kubernetes MCP (Red Hat)

**Official Containers Community server** (Red Hat-backed) for Kubernetes/OpenShift management in natural language.

**Use Case**: DevOps/SRE uses Claude to query/configure cluster ("kubectl in natural language").

**Key Features**:

| Capability | Details |
|------------|---------|
| Resource CRUD | Create, Read, Update, Delete any K8s resource |
| Pod Operations | Logs, events, exec, metrics (top) |
| Deployment Management | Scale, rollout, status |
| Config Management | View/update ConfigMaps, Secrets |
| CRD Support | Custom Resource Definitions |
| Multi-Cluster | Switch kubeconfig contexts |
| OpenShift Support | Native OpenShift resources |

**Setup**:

```bash
# Docker
docker run -it --rm \
  --mount type=bind,src=$HOME/.kube/config,dst=/home/mcp/.kube/config \
  ghcr.io/containers/kubernetes-mcp-server

# Native (Go binary)
go install github.com/containers/kubernetes-mcp-server@latest
kubernetes-mcp-server
```

**Claude Desktop Configuration**:

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--mount",
        "type=bind,src=/home/user/.kube/config,dst=/home/mcp/.kube/config",
        "ghcr.io/containers/kubernetes-mcp-server"
      ]
    }
  }
}
```

**Example Usage**:

```
User: "Show me all pods in production namespace with memory usage >500Mi"
Claude: [Uses list_resources for pods + metrics]
Result: List of pods with memory stats

User: "Scale the backend deployment to 5 replicas"
Claude: [Uses patch_resource]
Result: Deployment scaled
```

**Quality Score**: **8.4/10** ⭐⭐⭐⭐

**Security**: RBAC enforcement, kubeconfig auth, no privilege escalation

**Limitations**:

| Limitation | Workaround |
|------------|-----------|
| Requires kubeconfig access | Use ServiceAccount + RBAC for safety |
| Limited node shell access | Use `kubectl exec` for debugging |
| CRD discovery lag | Pre-document CRDs for AI context |

**Resources**:
- **GitHub**: https://github.com/containers/kubernetes-mcp-server
- **Red Hat Docs**: https://developers.redhat.com/articles/2025/09/25/kubernetes-mcp-server-ai-powered-cluster-management

---

#### Vercel MCP

**Community server** for Vercel platform (deployments, projects, env vars, teams).

**Use Case**: AI assistant generates Next.js code, creates Vercel project, configures env vars, triggers deployment — full CI/CD loop without leaving IDE.

**Key Features**:

| Capability | Details |
|------------|---------|
| Deployments | List, get details, create, monitor status |
| Projects | List, create, update settings |
| Environment Variables | Get, set, manage secrets |
| Teams | List, create, manage |
| Domains | List, configure, DNS management |
| Functions | Monitor Vercel Functions, logs |

**Setup**:

```bash
git clone https://github.com/nganiet/mcp-vercel
cd vercel-mcp
npm install
```

**Configuration**:

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npm",
      "args": ["start"],
      "env": {
        "VERCEL_API_TOKEN": "YOUR_VERCEL_TOKEN"
      }
    }
  }
}
```

**Quality Score**: **7.6/10** ⭐⭐⭐⭐

**Note**: Vercel also has an official MCP server. This community version offers comprehensive API coverage.

**Resources**:
- **GitHub**: https://github.com/nganiet/mcp-vercel
- **Vercel Docs**: https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel
- **Official Vercel MCP**: https://vercel.com/docs/mcp/vercel-mcp

#### Sentry MCP

**Official Sentry server** for error monitoring and observability. Closes the diagnostic loop: Sentry alert fires → Claude reads issue + stack trace → diagnoses root cause → proposes or writes the patch.

**Repository**: [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp)
**License**: MIT
**Maintainer**: Sentry (official)

**Use Case**: A Sentry alert fires in prod. The engineer asks Claude: "What's causing SEN-4521?". Claude reads the full stack trace, traces the regression through the codebase, and drafts a fix — without leaving the IDE. The observability loop closes inside Claude Code.

**Key Features**:

| Tool | Description |
|------|-------------|
| `list_issues` | Fetch unresolved issues with Sentry query syntax (`is:unresolved level:error`) |
| `get_issue` | Full issue details — stack trace, affected users, first/last seen timestamps |
| `get_event` | Specific event by ID, useful for time-scoped investigations |
| `search_events` | Full-text search across raw events with field filters |
| `list_projects` | List projects in your Sentry organization |

**Setup**:

```bash
# Via npx (recommended — verify package name against official docs)
npx -y @sentry/mcp-server

# One-liner for Claude Code
claude mcp add sentry -- npx -y @sentry/mcp-server
```

**Claude Code Configuration** (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "your_auth_token",
        "SENTRY_ORG": "your-org-slug"
      }
    }
  }
}
```

> Auth token: [sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/) — scopes needed: `project:read`, `event:read`, `org:read`

**Example Usage**:

```
User: "What's causing SEN-4521? It's been firing since yesterday's deploy."

Claude:
  [list_issues: query="is:unresolved level:error project:api-service"]
  [get_issue: issue_id="4521"]

Result: NullPointerException in UserController.getProfile() at line 142.
  Introduced in commit a3f8c2 (yesterday 14:32 UTC) — null check removed
  in the profile refactor. Fix: restore Optional.ofNullable at line 142.
  Opening a PR now.
```

**Query Syntax** (critical for effective use — the most common source of call failures):

```
is:unresolved                         # unresolved issues only
is:unresolved level:error             # errors only (excludes warnings, info)
is:unresolved has:user                # issues with identified users
is:unresolved times_seen:>100         # high-frequency issues
project:api-service is:unresolved     # scope to one project
assigned:me is:unresolved             # issues assigned to you
!has:assignee is:unresolved           # unassigned issues
```

> **Reference file**: `examples/skills/mcp-integration-reference/references/sentry-mcp.md` in this repo — complete parameter docs, gotchas, pagination patterns, and a curated noise-exclusion list. Copy it to your CLAUDE.md includes or project skills.

**Quality Score**: **8.5/10** ⭐⭐⭐⭐⭐

| Dimension | Score | Notes |
|-----------|-------|-------|
| Maintenance | 10/10 | Official Sentry server, enterprise-backed |
| Documentation | 8/10 | Good README + Sentry docs cover edge cases |
| Tests | 8/10 | CI present, TypeScript type safety |
| Performance | 8/10 | API-bound (~200–400ms), pagination required for large orgs |
| Adoption | 9/10 | Sentry is the de facto error monitoring standard (100K+ organizations) |

**Limitations & Workarounds**:

| Limitation | Workaround |
|------------|-----------|
| `organization_slug` ≠ display name | Read slug from URL: `sentry.io/organizations/<slug>/` |
| `search_events` times out in large orgs | Always scope with `project_slug` when searching events |
| 100 issues max per call | Use cursor-based pagination for complete sweeps |
| Read-only by default | Resolve/assign operations need additional token scopes |
| 90-day event retention | Events older than 90 days unavailable on default Sentry plan |

**When to Use vs Alternatives**:

| Tool | Best For | Not Worth It When |
|------|----------|-------------------|
| **Sentry MCP** | Error diagnosis loop: alert → stack trace → patch | Pure alerting (use webhooks or PagerDuty directly) |
| **Datadog MCP** | APM, distributed traces, metrics dashboards | Error-only workflows — overengineered for that use case |
| **Bash + Sentry CLI** | Bulk operations, scripted data exports | Interactive debugging sessions |

**Resources**:
- **GitHub**: https://github.com/getsentry/sentry-mcp
- **Sentry MCP Docs**: https://docs.sentry.io/product/sentry-mcp/
- **Reference File**: `examples/skills/mcp-integration-reference/references/sentry-mcp.md`
- **Auth Token Setup**: https://sentry.io/settings/account/api/auth-tokens/

---

### Security & Code Analysis

#### Semgrep MCP

**Official Semgrep server** for vulnerability scanning (SAST, secrets, supply chain). Includes custom rules engine.

**Use Case**: Claude Code generates code, Semgrep automatically scans for security issues, proposes fixes ("secure by default").

**Key Features**:

| Capability | Details |
|------------|---------|
| Quick Scan | Fast security check on code snippet |
| Full Scan | Comprehensive SAST using p/ci ruleset |
| Custom Rules | Scan with user-provided Semgrep rules |
| AST Generation | Abstract Syntax Tree for analysis |
| Ruleset Support | Pre-built rulesets (OWASP, CWE, etc.) |
| Language Coverage | Python, JS/TS, Java, Go, C#, Rust, PHP, etc. |

**Setup**:

```bash
# Via uvx (recommended)
uvx semgrep-mcp

# Or pip
pip install semgrep-mcp
```

**Claude Code Configuration**:

```bash
claude mcp add semgrep -- uvx semgrep-mcp
```

**Cursor Configuration** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "semgrep": {
      "command": "uvx",
      "args": ["semgrep-mcp"],
      "env": {
        "SEMGREP_APP_TOKEN": "your_token"
      }
    }
  }
}
```

**Example Usage**:

```
User: "Scan this Python code for SQL injection vulnerabilities"

Code:
  def search(query):
      return db.execute(f"SELECT * FROM users WHERE name = '{query}'")

Claude: [Uses security_check tool]

Result: [VULNERABLE] SQL injection detected at line 2.
  Fix: Use parameterized queries:
  return db.execute("SELECT * FROM users WHERE name = ?", [query])
```

**Quality Score**: **9.0/10** ⭐⭐⭐⭐⭐

| Dimension | Score | Notes |
|-----------|-------|-------|
| Maintenance | 10/10 | Official, frequent releases |
| Documentation | 9/10 | Comprehensive docs, examples |
| Tests | 10/10 | Extensive test coverage |
| Performance | 7/10 | Good, complexity-dependent (~500ms per scan) |
| Adoption | 9/10 | Enterprise standard (5000+ companies) |

**Alternatives**:

| Server | Advantage | Disadvantage |
|--------|-----------|--------------|
| **Semgrep** | Comprehensive SAST, custom rules | Slower on large codebases |
| GitGuardian | Secrets-focused, fast | Limited SAST coverage |
| SonarQube | Enterprise, detailed reports | Heavier, more setup |

**Resources**:
- **GitHub**: https://github.com/semgrep/mcp
- **Official Docs**: https://semgrep.dev/docs/mcp
- **Rules Registry**: https://semgrep.dev/r
- **Pricing**: https://semgrep.dev/pricing (free tier for MCP)

---

### Code Search & Analysis

#### Grepai MCP

**Community server** for semantic code search and call graph analysis via local Ollama embeddings. Searches code by intent ("payment flow", "auth logic") instead of exact patterns, and traces function call relationships.

**Repository**: [yoanbernabeu/grepai](https://github.com/yoanbernabeu/grepai)
**License**: MIT
**Status**: Active development
**Privacy**: Fully local (Ollama + nomic-embed-text), no data leaves your machine

**Use Case**: Developer needs to understand unfamiliar codebase → grepai finds relevant code by natural language description and maps function dependencies, without reading entire files.

**Key Features**:

| Capability | Details |
|------------|---------|
| `grepai_search` | Semantic search by natural language query (e.g., "error handling middleware") |
| `grepai_trace_callers` | Find all functions that call a given symbol |
| `grepai_trace_callees` | Find all functions called by a given symbol |
| `grepai_trace_graph` | Full call graph (callers + callees) with configurable depth |
| `grepai_index_status` | Health check: indexed files, chunks, configuration |

**Token Efficiency**:

| Workflow | Tokens | Verdict |
|----------|--------|---------|
| Grep + Read files (brute force) | ~15K | Noisy, lots of irrelevant context |
| grepai search + trace | ~4K | Targeted, relevant results only |
| grepai alone (no follow-up) | ~2-3K | Fast discovery |

**Setup**:

```bash
# Install grepai
curl -sSL https://raw.githubusercontent.com/yoanbernabeu/grepai/main/install.sh | sh

# Install Ollama + embedding model
brew install ollama
ollama pull nomic-embed-text

# Initialize in your project
cd /path/to/project
grepai init  # Choose: ollama, nomic-embed-text, gob

# Index your codebase
grepai index

# Optional: watch for file changes (auto-reindex)
grepai watch
```

**Claude Code Configuration**:

```bash
claude mcp add grepai -- grepai mcp
```

**`.mcp.json` (project-scoped)**:

```json
{
  "mcpServers": {
    "grepai": {
      "command": "grepai",
      "args": ["mcp"]
    }
  }
}
```

**Example Usage**:

```
User: "Find the authentication flow in this codebase"

Claude: [Uses grepai_search query="authentication flow" limit=5]

Result: 3 relevant files with line numbers and similarity scores
  - src/auth/middleware.ts:12-45 (0.89)
  - src/routes/login.ts:8-32 (0.85)
  - src/utils/jwt.ts:1-28 (0.78)

User: "What calls the validateToken function?"

Claude: [Uses grepai_trace_callers symbol="validateToken"]

Result: Call graph showing 4 callers across 3 files
  - authMiddleware → validateToken
  - refreshHandler → validateToken
  - wsAuthGuard → validateToken
  - testHelper → validateToken
```

**Quality Score**: **7.8/10** ⭐⭐⭐⭐

| Dimension | Score | Notes |
|-----------|-------|-------|
| Maintenance | 8/10 | Active development, responsive maintainer |
| Documentation | 7/10 | Good README, MCP integration docs |
| Tests | 7/10 | CI present, growing coverage |
| Performance | 8/10 | Fast local embeddings (~2s search), no network latency |
| Adoption | 9/10 | Growing community, production use in Claude Code setups |

**Limitations & Workarounds**:

| Limitation | Workaround |
|------------|-----------|
| Requires Ollama running locally | `brew services start ollama` (auto-start) |
| Index can become stale | Use `grepai watch` for auto-reindex |
| Not ideal for exact pattern matching | Use native Grep tool for regex patterns |
| Embedding model download (~270MB) | One-time `ollama pull nomic-embed-text` |

**Alternatives**:

| Server | Advantage | Disadvantage |
|--------|-----------|--------------|
| **Grepai** | Local, private, semantic + call graphs | Requires Ollama setup |
| Native Grep | Instant, exact patterns | No semantic understanding |
| GitHub Code Search | Cloud-based, cross-repo | Requires GitHub, no call graphs |

**Cross-reference**: See [ultimate-guide.md — MCP Servers: Grepai](../ultimate-guide.md) for detailed usage patterns, prompt strategies, and integration with other MCP servers.

**Resources**:
- **GitHub**: https://github.com/yoanbernabeu/grepai
- **Ollama**: https://ollama.com
- **Embedding Model**: nomic-embed-text (nomic-ai)

---

### Documentation & Knowledge

#### Context7 MCP

**Official Upstash server** for real-time library documentation (LangChain, Anthropic SDK, etc.). Eliminates API hallucination.

**Use Case**: Claude Code needs to use a library API → Context7 provides up-to-date docs + examples.

**Key Features**:

| Capability | Details |
|------------|---------|
| Library Search | Find docs for 500+ libraries |
| Code Examples | Language-specific examples (Python, TS, etc.) |
| API Reference | Detailed function signatures, parameters |
| Version Filtering | Docs for specific library versions |
| Smart Ranking | AI-ranked by relevance + project usage |

**Setup**:

```bash
# Local
npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

**Claude Code Configuration (local)**:

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

**Claude Code Configuration (remote/HTTP)**:

```bash
claude mcp add --transport http --header "CONTEXT7_API_KEY: YOUR_API_KEY" \
  context7 https://mcp.context7.com/mcp
```

**Example Usage**:

```
User: "Show me how to use Claude's streaming API with the Python SDK"

Claude: [Uses context7 search]

Result: Official Python SDK docs + example code for streaming
```

**Quality Score**: **8.2/10** ⭐⭐⭐⭐

**Limitations**:

| Limitation | Workaround |
|------------|-----------|
| Limited library coverage | Fallback to web search for obscure libs |
| Version lag (1-2 days) | Use official repo for cutting-edge |
| Hallucination risk (low but exists) | Cross-verify with official docs |

**Alternatives**:

| Server | Advantage | Disadvantage |
|--------|-----------|--------------|
| **Context7** | Real-time, version-specific | API key required |
| Web Search | Comprehensive, free | Slow, hallucination risk |
| Static RAG | Fast, local | Outdated, no versions |

**Resources**:
- **GitHub**: https://github.com/upstash/context7
- **Official Site**: https://context7.com
- **LobeHub Registry**: https://lobehub.com/mcp/upstash-context7

**ctx7 CLI companion**: Context7 also ships a CLI (`npx ctx7`) that handles skill discovery and MCP setup from the terminal. `ctx7 skills suggest` auto-detects project dependencies and recommends matching skills; `ctx7 setup --claude` runs a wizard that configures MCP or CLI+Skills mode automatically. See §5.5 of the ultimate guide for the full workflow.

---

### Project Management

#### Linear MCP

**Community server** for Linear (project management SaaS). GraphQL API with issue management, projects, teams, comments.

**Use Case**: Claude Code automatically creates tickets, updates status, links issues in Linear (closes loop between development and project management).

**Key Features**:

| Capability | Details |
|------------|---------|
| Issue Management | List, get, create, update, delete, search |
| Projects | List, create, update, assign |
| Teams & Users | Team management, member assignment |
| Comments | Add, list, with position tracking |
| Cycles | Sprint/cycle management |
| Webhooks | Subscribe to Linear events (optional) |

**Setup**:

```bash
# NPM or uvx
npm install mcp-linear
# or
uvx mcp-linear
```

**Claude Code Configuration**:

```bash
claude mcp add linear -- npx -y mcp-linear --api-key YOUR_LINEAR_API_KEY
```

**Example Usage**:

```
User: "Create a bug ticket in Linear for the CSS layout issue I just found"

Claude: [Uses linear.issues.create with team key, title, description]

Result: Ticket created, issue ID returned

User: "Update ticket SOFT-123 status to 'In Progress'"

Claude: [Uses linear.issues.update]

Result: Status changed
```

**Quality Score**: **7.6/10** ⭐⭐⭐⭐

**Note**: Community-maintained (not Linear Inc.), but active and well-documented.

**Limitations**:

| Limitation | Workaround |
|------------|-----------|
| Timeout issues (fixed after 1h) | Implement heartbeat, firewall checks |
| 65KB field limit | Auto-chunking for comments |
| GraphQL complexity | Split complex queries automatically |

**Alternatives**:

| Server | Advantage | Disadvantage |
|--------|-----------|--------------|
| **Linear MCP** | Modern GraphQL, startup-friendly | Community-maintained |
| Jira MCP | Enterprise, complex workflows | Heavier, older API |
| GitHub Issues | Built-in, free | Limited project management |

**Resources**:
- **GitHub**: https://github.com/tacticlaunch/mcp-linear
- **Linear API**: https://developers.linear.app
- **Docs**: https://jan.ai/docs/desktop/mcp-examples/productivity/linear

---

### Orchestration

#### MCP-Compose

**Community tool** for managing multiple MCP servers Docker Compose-style. Declarative YAML configuration, multi-transport support (STDIO/HTTP/SSE).

**Use Case**: Developer needs 5+ MCP servers; Docker Compose-like config simplifies lifecycle management.

**Key Features**:

| Capability | Details |
|------------|---------|
| YAML Configuration | Docker Compose-style server definitions |
| Multi-Transport | STDIO, HTTP, SSE, TCP support |
| Container Runtimes | Docker, Podman, native processes |
| Network Management | Automatic Docker network creation |
| Health Monitoring | Connection pooling, session management |
| HTTP Proxy | Single unified HTTP endpoint |
| Hot Reload | Update config without restart |

**Setup**:

```bash
git clone https://github.com/phildougherty/mcp-compose
cd mcp-compose
cargo build --release
```

**Configuration** (`mcp-compose.yaml`):

```yaml
version: "1.0"
mcpServers:
  filesystem:
    command: npx
    args:
      - "@modelcontextprotocol/server-filesystem"
      - "/tmp"
    transport: stdio

  memory:
    command: npx
    args:
      - "@modelcontextprotocol/server-memory"
    transport: stdio
    env:
      DEBUG: "true"

  postgres:
    image: postgres:15
    transport: tcp
    port: 5432
    env:
      POSTGRES_PASSWORD: secret

proxy:
  port: 3000
  listen: "127.0.0.1"
```

**Generate Claude Desktop Config**:

```bash
./mcp-compose create-config --type claude --output ~/.claude.json
```

**Start Servers**:

```bash
./mcp-compose up
# Single unified HTTP proxy at http://localhost:3000
```

**Quality Score**: **7.4/10** ⭐⭐⭐⭐

**Limitations**:

| Limitation | Workaround |
|------------|-----------|
| Cargo build required | Use pre-built binary (if available) |
| YAML learning curve | Provide templates for common setups |
| Debug complexity | Use mcp-compose logs for troubleshooting |

**Resources**:
- **GitHub**: https://github.com/phildougherty/mcp-compose
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **MCP Protocol Spec**: https://modelcontextprotocol.io

---

#### Packmind

**Community tool** for distributing engineering standards as AI context across multiple agents and repositories. Exposes an MCP server for creating and managing playbook standards directly from Claude Code (or any MCP-capable agent).

**Use Case**: Engineering team maintains one playbook; Packmind MCP server lets Claude Code propose new standards or update existing ones during a session without leaving the editor.

**Key Features**:

| Capability | Details |
|------------|---------|
| Standards Creation | Create/update playbook entries via MCP tools |
| Multi-Agent Output | Generates CLAUDE.md, .cursor/rules, Copilot instructions from one source |
| Knowledge Ingestion | Pull context from GitHub, Slack, Jira, GitLab, Confluence, Notion via their MCP servers |
| Self-hosted | Docker/Kubernetes, Apache-2.0 CLI |

**Resources**:
- **GitHub**: https://github.com/PackmindHub/packmind
- **Demo use cases**: https://github.com/PackmindHub/demo-use-case-skills

> **Cross-ref**: Full tool evaluation in [third-party-tools.md — Engineering Standards Distribution](./third-party-tools.md#engineering-standards-distribution).

---

## Production Deployment

### Security Checklist

- [ ] **API keys** stored in `.env`, not in config files
- [ ] **RBAC/permissions** reviewed (especially Kubernetes, Semgrep)
- [ ] **Rate limits** understood (Linear GraphQL complexity, Vercel API)
- [ ] **Fallback mechanisms** for API downtime implemented
- [ ] **Monitoring + logging** enabled for all MCP servers

### Error Handling & Reliability

MCP tools can fail for many reasons, and how you signal those failures to Claude matters. The protocol provides a dedicated mechanism: the `isError` flag in tool responses.

**The `isError` flag**

When a tool call fails, set `isError: true` in the response instead of raising an exception or returning a fake success. This tells Claude the call failed and invites it to decide what to do next: retry, try a different approach, or surface the issue to the user.

```json
{
  "content": [
    {
      "type": "text",
      "text": "Database connection refused: ECONNREFUSED 127.0.0.1:5432"
    }
  ],
  "isError": true
}
```

Without `isError: true`, Claude may interpret the error message as data and continue confidently with a broken state. With it, Claude understands the step failed and can reason about recovery.

**Error taxonomy: four categories**

Different failure types warrant different recovery strategies. Structuring your error messages around these four categories makes it easier for Claude to pick the right recovery action:

| Category | When | Claude's expected response | Example |
|----------|------|---------------------------|---------|
| **Transient** | Temporary unavailability, network flap, rate limit | Retry after a delay | `503 Service Unavailable`, timeout |
| **Validation** | Bad input — wrong type, missing field, format error | Fix the input, retry immediately | `invalid date format: expected ISO8601` |
| **Business** | Correct input but operation not permitted by domain rules | Escalate or skip | `cannot delete: record has active dependencies` |
| **Permission** | Caller lacks authorization | Stop and explain to user | `403 Forbidden: insufficient scope` |

**Implementation pattern**

Include the category in your error messages so Claude can act without guessing:

```python
def call_tool(params):
    try:
        result = execute(params)
        return {"content": [{"type": "text", "text": result}], "isError": False}
    except NetworkError as e:
        return {
            "content": [{"type": "text", "text": f"[transient] {e}. Retry in a few seconds."}],
            "isError": True
        }
    except ValidationError as e:
        return {
            "content": [{"type": "text", "text": f"[validation] {e}. Check the input format."}],
            "isError": True
        }
    except PermissionError as e:
        return {
            "content": [{"type": "text", "text": f"[permission] {e}. Cannot proceed without elevated access."}],
            "isError": True
        }
    except BusinessError as e:
        return {
            "content": [{"type": "text", "text": f"[business] {e}. Operation not permitted by domain rules."}],
            "isError": True
        }
```

Transient errors are the only category where automatic retry makes sense. Validation errors should be retried with corrected input, not blindly. Business and permission errors should stop and surface to the user rather than loop.

### Tool Description Design Patterns

Tool descriptions are the most impactful part of an MCP server. Claude uses them to decide which tool to call — and a vague or overlapping description causes misrouting more reliably than any other design mistake.

**The core problem: overlapping descriptions cause misrouting**

Two tools with similar-sounding descriptions create ambiguity. Claude will pick one, often inconsistently, because it's guessing from the description which one applies.

```json
// Bad — ambiguous, Claude will guess
{ "name": "analyze_content", "description": "Analyzes content" }
{ "name": "analyze_document", "description": "Analyzes document content" }

// Good — each description carves out a specific input type
{ "name": "analyze_content", "description": "Analyzes raw text strings or inline content (not files). Use for clipboard content, API responses, or text passed directly as a string." }
{ "name": "analyze_document", "description": "Analyzes content from a file path or URL. Use when the content lives on disk or at a remote endpoint, not when you already have the text in memory." }
```

The test: can you read the description alone and know exactly when NOT to use this tool? If not, add the boundary.

**Description anatomy**

A good tool description has three parts, in this order:

1. **What it does** — one sentence, present tense, action verb
2. **What it takes** — the key input type or constraint (file path vs string, single vs batch)
3. **When to use it vs similar tools** — the decision boundary, explicitly stated

```json
{
  "name": "search_codebase",
  "description": "Searches source code files by regex pattern across the repository. Use for finding symbol definitions, function calls, and string literals in code. Not for searching documentation, configs, or prose — use search_docs for those."
}
```

**Naming conventions that prevent misrouting**

| Pattern | Example pair | Why it works |
|---------|-------------|--------------|
| Verb distinguishes intent | `get_user` vs `search_users` | Fetch known ID vs discover by criteria |
| Noun distinguishes input type | `analyze_file` vs `analyze_text` | Path on disk vs inline string |
| Scope suffix | `list_tickets` vs `list_project_tickets` | Global vs scoped |
| Action granularity | `create_record` vs `bulk_create_records` | One vs batch |

Avoid synonyms as tool names — `fetch`, `get`, `retrieve` all mean the same thing to Claude. Pick one verb family per semantic operation.

**Anti-patterns to avoid**

- **Generic verbs without scope**: `process`, `handle`, `manage` tell Claude nothing about when to call the tool
- **Missing the boundary**: "Searches the database" — which database? All of it? A specific table?
- **Boolean flags that change semantics**: A tool that does completely different things based on a flag should be two tools
- **Descriptions longer than 3 sentences**: If you need more, the tool does too much

**`input_examples` as a complement**

When a schema isn't enough to express which parameter combinations are valid or typical, add `input_examples` (supported by Anthropic API since February 2026). These show Claude concrete usage patterns, especially useful for optional parameters:

```json
{
  "name": "create_ticket",
  "input_examples": [
    { "title": "Login page 500 error", "priority": "critical", "assignee": "oncall" },
    { "title": "Add dark mode toggle", "priority": "low" },
    { "title": "Update API docs for v2.1" }
  ]
}
```

Examples teach what the description can't: that `assignee` is only set for critical items, and `priority` can be omitted for routine tasks.

---

## Advanced MCP Tool Design

Beyond basic error taxonomy, three design decisions significantly affect how Claude uses MCP tools in production: error response semantics, the distinction between Resources and Tools, and tool naming.

---

### isRetryable: Application-Level Convention

The MCP specification does not include an `isRetryable` field in the error response schema. However, the convention of embedding retry guidance in `structuredContent` has emerged as a practical pattern for tools that call fallible external services.

```json
{
    "isError": true,
    "content": [
        {
            "type": "text",
            "text": "Database query timed out after 30s. Retrying with the same parameters is likely to succeed."
        }
    ],
    "structuredContent": {
        "error": {
            "code": "DATABASE_TIMEOUT",
            "message": "Query timed out",
            "isRetryable": true,
            "retryAfterMs": 5000,
            "suggestedAction": "Retry the same query after 5 seconds"
        }
    }
}
```

For non-retryable errors:

```json
{
    "isError": true,
    "content": [
        {
            "type": "text",
            "text": "Record not found. No record with ID 'usr_99999' exists in the database."
        }
    ],
    "structuredContent": {
        "error": {
            "code": "RECORD_NOT_FOUND",
            "message": "No record found for ID: usr_99999",
            "isRetryable": false,
            "suggestedAction": "Verify the ID is correct before retrying"
        }
    }
}
```

The `isRetryable` flag is not something Claude reads natively from the MCP spec. It is read by your orchestration layer, which decides whether to retry or escalate. The pattern works because `structuredContent` is machine-readable and your code can check it before Claude does.

---

### isError: false + Empty Content vs isError: true

These two response shapes have completely different semantics. Confusing them causes silent failures that are hard to debug.

| Response | Meaning |
|---|---|
| `isError: false` + non-empty content | Tool succeeded, here is the result |
| `isError: false` + empty content | Tool succeeded, zero results found (legitimate empty state) |
| `isError: true` | Tool failed: the operation could not complete |

```json
// Search returning no results: NOT an error
{
    "isError": false,
    "content": [
        {
            "type": "text",
            "text": "No documents found matching query: 'quarterly report Q5 2024'"
        }
    ]
}

// Search that failed to execute: IS an error
{
    "isError": true,
    "content": [
        {
            "type": "text",
            "text": "Search service unavailable. Could not execute query."
        }
    ]
}
```

When a search returns zero results, Claude should report that to the user and potentially try different terms. When a search fails to execute, Claude should report a tool failure and the orchestrator should consider retrying or escalating. These paths diverge, and only correct error semantics makes them diverge correctly.

---

### MCP Resources vs Tools

Resources and Tools serve different purposes and are controlled by different actors. Mixing them up leads to tools that cannot be indexed and resources that cannot be parameterized.

| Dimension | Resources | Tools |
|---|---|---|
| Who controls access | Application (pre-defined, not model-initiated) | Model (calls as needed during conversation) |
| Parameters | None (read by URI) | Full parameter schema |
| Use case | Read-only data catalog: config files, reference data, documents | Parameterized operations: search, compute, write, API calls |
| Discovery | Listed at startup, browsable | Described in system prompt, called on demand |
| Side effects | None (read-only by convention) | Allowed |
| Example | Company policy document | `search_policy_documents(query, date_range)` |

```python
# Resource: static reference data, application-controlled
@server.list_resources()
async def list_resources():
    return [
        Resource(
            uri="config://database/schema",
            name="Database Schema",
            description="Current production database schema",
            mimeType="application/json"
        ),
        Resource(
            uri="docs://api/reference",
            name="API Reference",
            description="Internal API documentation",
            mimeType="text/markdown"
        )
    ]

@server.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "config://database/schema":
        return json.dumps(get_current_schema())
    elif uri == "docs://api/reference":
        return read_file("docs/api-reference.md")
    raise ValueError(f"Unknown resource: {uri}")

# Tool: parameterized operation, model-controlled
@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_database",
            description="Search the database with a structured query",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "table": {"type": "string"},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": ["query", "table"]
            }
        )
    ]
```

**ResourceLink bridge:** When a tool returns a reference to a resource (rather than inline content), use a ResourceLink:

```json
{
    "isError": false,
    "content": [
        {
            "type": "resource",
            "resource": {
                "uri": "docs://reports/Q3-2024",
                "mimeType": "application/pdf",
                "text": "Q3 2024 Financial Report (use read_resource to access full content)"
            }
        }
    ]
}
```

---

### Tool Naming and System Prompt Conflicts

Tool names that appear as keywords in the system prompt cause Claude to associate the tool with unrelated instructions. A tool named `process` will be mentally linked to any occurrence of the word "process" in the system prompt, creating unpredictable activation patterns.

Rules for tool names:
- Use specific, compound names: `search_customer_records` not `search`
- Avoid generic verbs that appear in system prompts: `run`, `process`, `execute`, `handle`, `manage`
- Use underscores, not camelCase or hyphens (MCP convention)
- Prefix with domain when there are many tools: `crm_get_contact`, `crm_update_contact`, `crm_search`

```python
# Bad: generic names that conflict with system prompt keywords
tools = ["search", "process", "run", "execute", "get", "update"]

# Good: specific compound names with domain prefix
tools = [
    "crm_search_contacts",
    "crm_get_contact_by_id",
    "crm_update_contact_status",
    "billing_create_invoice",
    "billing_get_invoice_status"
]
```

---

### Task-Scoped Tool Profiles

Providing every available tool to every agent call is wasteful and increases the risk of unintended writes during read-only phases. Task-scoped tool profiles restrict the available tools based on the current task phase.

```python
TOOL_PROFILES = {
    "exploration": [
        "search_documents",
        "get_document_by_id",
        "list_categories",
        "read_config"
    ],
    "analysis": [
        "search_documents",
        "get_document_by_id",
        "calculate_metrics",
        "compare_versions"
    ],
    "execution": [
        "create_document",
        "update_document",
        "delete_document",
        "send_notification"
    ]
}

def get_tools_for_phase(phase: str) -> list[str]:
    return TOOL_PROFILES.get(phase, TOOL_PROFILES["exploration"])
```

The exploration profile is read-only. The execution profile adds write operations. Claude cannot accidentally call `delete_document` during an analysis phase because the tool simply is not present in the call.

For multi-role systems where different user roles can access different tools, scope at the role level rather than filtering post-call:

```python
ROLE_TOOL_ACCESS = {
    "viewer": ["search_documents", "get_document_by_id"],
    "editor": ["search_documents", "get_document_by_id", "create_document", "update_document"],
    "admin": ["*"]  # all tools
}

def get_tools_for_role(role: str, all_tools: list) -> list:
    if role == "admin":
        return all_tools
    allowed = ROLE_TOOL_ACCESS.get(role, [])
    return [t for t in all_tools if t.name in allowed]
```

Scoped access is particularly valuable for the `verify_fact` tool pattern: a subagent that only needs to verify a single claim can be given only `verify_fact`, reducing both latency (fewer tools to describe in the context) and risk (no write tools in scope).

---

### Quick Start Stack

**MVP (Essentials)**:

1. **Playwright MCP** — E2E testing, web verification
2. **Semgrep MCP** — Security-first coding

**Important Additions**:

3. **Context7 MCP** — API reference accuracy
4. **Linear MCP** (optional) — Issue tracking integration

**DevOps/SRE Stack**:

5. **Kubernetes MCP** — Cluster management
6. **Vercel MCP** — Next.js deployment automation

**Complex Setups**:

7. **MCP-Compose** — Multi-server orchestration
8. **Browserbase MCP** — Heavy web automation (premium)

### Installation Examples

```bash
# Playwright (browser testing)
npm install @microsoft/playwright-mcp

# Semgrep (security)
uvx semgrep-mcp

# Context7 (documentation)
npx -y @upstash/context7-mcp --api-key YOUR_API_KEY

# Linear (project management)
npm install mcp-linear
```

### Performance Metrics

| Metric | Median | Range | Notes |
|--------|--------|-------|-------|
| **Response Time** | ~200ms | 100-500ms | Cloud-dependent (Browserbase ~500ms) |
| **Token Overhead** | ~200-500 tokens | Minimal for structured output | Accessibility trees vs screenshots |
| **Setup Time** | ~5 minutes | 2-10 minutes | Cargo build (MCP-Compose) = 10 min |

---

## Monthly Watch Methodology

This section documents the process for maintaining this guide with monthly ecosystem updates.

### Sources to Monitor

**Official Sources**:
- [Anthropic MCP GitHub](https://github.com/modelcontextprotocol/servers)
- [Anthropic Blog](https://www.anthropic.com/news)
- [MCP Protocol Spec](https://modelcontextprotocol.io)

**Community Sources**:
- [GitHub topic: mcp-servers](https://github.com/topics/mcp-servers) (7260+ servers)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers) (75.5k stars)
- [MCP Registry](https://github.blog/ai-and-ml/generative-ai/how-to-find-install-and-manage-mcp-servers-with-the-github-mcp-registry/)

**Discussions**:
- [Reddit r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/)
- [Reddit r/mcp](https://www.reddit.com/r/mcp/)
- [X/Twitter #MCPServer](https://twitter.com/search?q=%23MCPServer)

**Technical Articles**:
- [Blog Skyvia](https://blog.skyvia.com/best-mcp-servers/)
- [Builder.io Blog](https://www.builder.io/blog/best-mcp-servers-2026)
- [Cyberpress](https://cyberpress.org/best-mcp-servers/)

### Monthly Review Checklist

- [ ] **Official servers**: Check Anthropic GitHub for new releases
- [ ] **Community servers**: Review GitHub topics for trending servers (≥50 stars, <3 months release)
- [ ] **Ecosystem changes**: Monitor Anthropic blog for protocol updates
- [ ] **Server health**: Re-evaluate existing servers (releases, issues, maintenance)
- [ ] **Security**: Check for disclosed vulnerabilities (GitHub Security Advisories)
- [ ] **Deprecations**: Identify archived or unmaintained servers
- [ ] **Update guide**: Add new validated servers, remove deprecated ones

### Evaluation Template

For each candidate server:

1. **Basic Validation**:
   - GitHub stars ≥50?
   - Last release <3 months?
   - Documentation complete (README + examples + config)?
   - Tests/CI present?

2. **Quality Scoring** (see [Evaluation Framework](#evaluation-framework)):
   - Maintenance: `/10`
   - Documentation: `/10`
   - Tests: `/10`
   - Performance: `/10`
   - Adoption: `/10`
   - **Total**: `/50` → Normalized to `/10`

3. **Use Case Analysis**:
   - What gap does it fill?
   - Is it already covered by official servers?
   - What are the alternatives?

4. **Decision**:
   - **Integrate** (score ≥8): Add full section to guide
   - **Monitor** (score 6-7): Add to [Watch List](../../docs/resource-evaluations/watch-list.md), re-evaluate next month
   - **Reject** (score <6): Document reason in [Excluded Servers](#excluded-servers)

### Integration Workflow

When adding a new server:

1. Create section in appropriate category (Browser Automation, DevOps, etc.)
2. Include:
   - Use case description
   - Key features table
   - Setup instructions
   - Configuration examples
   - Quality score
   - Limitations & workarounds
   - Alternatives comparison
   - Resources (GitHub, docs, tutorials)
3. Update [Quick Start Stack](#quick-start-stack) if MVP-relevant
4. Update [Production Deployment](#production-deployment) checklist if security-critical

---

## Documenting an MCP for Claude: The Reference File Pattern

When you integrate an MCP server into a skill, Claude has to figure out the query syntax, required parameter combinations, and quirky behavior on its own. For simple MCPs this is fine. For anything production-facing (observability tools, project management APIs, log aggregators), it breaks down fast. Claude guesses at parameter format, gets a cryptic error, retries with a different guess, and burns your budget on noise.

The fix from the Packmind engineering team (open-sourced under Apache 2.0): add a `references/<mcp-name>.md` file alongside the skill, and have the skill read it as its first step before any MCP call.

### What Goes in the Reference File

Three types of content that Claude cannot reliably infer on its own:

**1. Parameter semantics that differ from the tool name**

For example, a Datadog "search" tool that uses Datadog query syntax (not regex). Or a Sentry tool that requires an `organization_slug` (the URL slug, not the display name). These are not bugs in the MCP; they are just non-obvious.

**2. Known error patterns and what triggers them**

For example: "If you use `SELECT` aliases in `GROUP BY` with DDSQL, you get a cryptic error. Repeat the full expression instead." This turns a 10-minute debug session into a zero-second lookup.

**3. Working query examples for the 80% case**

Copy-paste examples that cover the most common queries. Claude can adapt them rather than constructing from scratch.

### File Structure

```
.claude/skills/my-mcp-skill/
├── SKILL.md                    # Main skill file
└── references/
    └── <mcp-name>.md           # MCP reference file (this pattern)
```

The SKILL.md reads the reference file in its first step:

```markdown
## Step 1: Read the MCP Reference File

Before doing anything else, read `references/<mcp-name>.md`.
This contains the query syntax and known gotchas for this MCP.
Do not skip this step.
```

### Why This Works

The reference file is not documentation for humans. It is a structured context injection. Every piece of information in it reduces the probability of a malformed MCP call by Claude. Done well, it eliminates retry loops caused by syntax errors and makes the skill reliable enough to run on a schedule without supervision.

This pattern generalizes to any MCP with non-obvious behavior: Datadog, Sentry, PagerDuty, Linear, Jira, Mixpanel, Posthog. If the MCP has a query language, pagination quirks, or required parameters with non-intuitive names, a reference file pays for itself in the first run.

### Fork-Ready Template

A complete template skill demonstrating this pattern (with a Sentry example) is available at:

`examples/skills/mcp-integration-reference/` in this repository

The template includes:
- `SKILL.md` with the 5-step structure (read reference, gather scope, fetch, analyze, report)
- `references/sentry-mcp.md` with complete parameter docs, gotchas, query examples, and noise exclusion list
- Instructions for adapting to any MCP server

> Inspired by the Datadog MCP reference file from the [Packmind open-source repo](https://github.com/packmind/packmind) (Apache 2.0, Cédric Teyton). See [Credits](../core/credits.md) for full attribution.

---

## Excluded Servers

Servers evaluated but not included in the validated list:

| Server | Reason | Source | Date Evaluated |
|--------|--------|--------|----------------|
| **X/Twitter MCP** | API instability, frequent auth issues, inconsistent maintenance | [Cursor Forum](https://forum.cursor.com/t/linear-mcp-commonly-errors-out-and-requires-turning-off-then-on/148816) | Jan 2026 |
| **Vector Search MCP** | <50 stars, incomplete documentation | [LobeHub](https://lobehub.com/mcp/hugoduncan-mcp-vector-search) | Jan 2026 |
| **GitHub MCP** | Archived, migrated to official Go SDK | [GitHub Changelog](https://github.blog/changelog/2025-12-10-the-github-mcp-server-adds-support-for-tool-specific-configuration-and-more/) | Jan 2026 |
| **Jira MCP (sooperset)** | No recent release (last: June 2025), less stable than Linear | [GitHub Releases](https://github.com/sooperset/mcp-atlassian/releases) | Jan 2026 |

---

## Statistics & Insights

### Distribution by Category

| Category | Servers | Use Cases |
|----------|---------|-----------|
| **Browser Automation** | 3 (Playwright, Browserbase, Chrome DevTools) | Testing, debugging, data extraction |
| **DevOps/Infrastructure** | 3 (Vercel, Kubernetes, Sentry) | Deployment, cluster management, observability |
| **Security/Code Analysis** | 1 (Semgrep) | Vulnerability scanning, secure coding |
| **Code Search/Analysis** | 1 (Grepai) | Semantic search, call graph analysis |
| **Documentation/Knowledge** | 1 (Context7) | API reference, code examples |
| **Project Management** | 1 (Linear) | Issue tracking, sprint planning |
| **Orchestration** | 1 (MCP-Compose) | Multi-server management |

### Maintainer Types

- **Official Servers** (6): Playwright (Microsoft), Browserbase, Semgrep, Context7, Kubernetes (Red Hat), Chrome DevTools (Anthropic)
- **Community Servers** (4): Linear, Vercel, MCP-Compose, Grepai (well-designed, actively maintained)

---

**Last updated**: May 2026
**Next review**: June 2026
**Maintainer**: Claude Code Ultimate Guide Team

---

*Back to [main guide](../ultimate-guide.md) | [README](../README.md)*