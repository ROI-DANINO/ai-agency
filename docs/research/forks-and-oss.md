# Forks & OSS Strategy

What to fork, what to install as-is, and what to build custom. The goal: write the minimum code necessary to connect great tools together.

---

## Philosophy

> "One tool that does 80% is better than four tools that together do 100%."

Custom code is a liability. Every line you write is a line you maintain. Fork only when the tool is close but needs targeted changes. Install when it fits as-is. Build custom only at the seams.

---

## What to Fork

### 1. `claude-peers-mcp`
**Source:** `~/claude-peers-mcp` (local) / `github.com/louislva/claude-peers-mcp`  
**What we take:** The broker daemon (SQLite-backed, REST API on localhost:7899), stable identity mechanism, message passing  
**Why fork, not install:** The broker needs significant extension for this platform — stable tenure profiles, feed/journal, group channels, cross-instance identity. The upstream version is not stable enough for production use.  
**Known issues to fix before using:**
- Repo scope broken with git worktrees (#23)
- Built-in `SendMessage` conflict (#6)
- Unstable peer IDs (#16)

**Effort:** Medium — fork and extend the broker, stabilize identity mechanism, add profile types.

---

### 2. `agentic-ai-platform`
**Source:** `~/Desktop/Projects/agentic-ai-platform`  
**What we take:** Prisma schema (24 models, complete), NextAuth v5 setup, Vitest + React Testing Library config, workspace scoping pattern, Prisma singleton  
**Why fork, not start fresh:** The hardest parts are done — data model, auth, testing infra. Starting from scratch means rebuilding 40+ hours of work that's already solid.  
**What to throw away:** The boilerplate landing page, any UI that doesn't match the vision  
**What to keep as-is:** Everything in `prisma/schema.prisma`, `src/lib/auth.ts`, `src/lib/db.ts`, `vitest.config.ts`, `AGENTS.md` coding conventions

**Effort:** Low — fork and build on top. Don't refactor what works.

---

## What to Install (No Fork)

| Tool | Install Command | Why Not Fork |
|---|---|---|
| **LiteLLM** | `pip install litellm` | Stable, well-maintained, no customization needed |
| **CrewAI** | `pip install crewai` | Use as framework, not fork |
| **LangGraph** | `pip install langgraph` | Use as framework |
| **FastMCP** | `pip install fastmcp` | MCP server in ~50 lines |
| **n8n** | Docker: `docker run n8nio/n8n` | Self-hosted, no code changes needed |
| **Supabase** | Managed cloud or self-hosted | Use the service, don't fork |
| **shadcn/ui** | `npx shadcn@latest add` | UI components, use as-is |
| **Ollama** | `curl -fsSL https://ollama.ai/install.sh` | Local models, no fork needed |

---

## What to Build Custom (Minimal)

| Component | What to Build | Estimated Size |
|---|---|---|
| **MCP Plugin Bridge** | FastMCP server exposing platform capabilities | ~200 lines Python |
| **Briefing Pack Generator** | Skill that assembles role-scoped context snapshots | ~100 lines markdown skill |
| **HITL Pause/Resume** | CrewAI custom tool that waits for human input | ~100 lines Python |
| **Cost Tracker** | LiteLLM callback that logs token cost per run | ~50 lines Python |
| **Platform Glue** | CLI that starts LiteLLM + broker + agent runtime together | ~100 lines shell/Python |

Total estimated custom code: **~550 lines** across 5 components. Everything else is configuration and wiring.

---

## What NOT to Fork

| Project | Why Not Fork |
|---|---|
| `agentic-ai` | Just a spec — no code to fork. Use as reference for feature design only. |
| `ai-team` | Reference for agent role definitions, not a codebase. Copy agent markdown files, not a fork. |
| `aios` | Personal system with different goals. Study patterns, don't fork. Reimplement ideas cleanly. |
| `ai-org` | This IS the new project. Build here, don't fork. |

---

## Reference-Only Projects

These are studied for patterns and ideas, not forked:

| Project | What to Extract |
|---|---|
| `aios` | Skills system patterns, 3-tier memory model, dev pod design, session lifecycle |
| `ai-team` | 14 agent role definitions (BMAD personas), conflict resolution protocol, daily briefing format |
| `agentic-ai` | Full UX spec for web platform, skills bank design, dual-mode tool builder |
| `stam/unified-efficiency-layer` | Briefing pack design, team health audit, role-to-context mapping |

---

## Decision Log

| Decision | Rationale | Date |
|---|---|---|
| Fork claude-peers-mcp | Core broker is good, but needs significant extension for profiles/feeds/groups | 2026-04-02 |
| Fork agentic-ai-platform | Schema + auth already done, no point rebuilding | 2026-04-02 |
| Use LiteLLM (not direct OpenRouter API) | Model-agnostic from day one, swap models without code changes | 2026-04-02 |
| Start with CrewAI, migrate to LangGraph | Faster initial build, upgrade when workflow complexity demands it | 2026-04-02 |
| Self-hosted n8n for integrations | Avoids building custom webhook/notification infra | 2026-04-02 |
