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
**What we take:** The MCP surface (list_peers, send_message, check_messages, set_summary) and peer registration model  
**Why fork, not install:** The upstream broker is SQLite-backed and fragile (unstable peer IDs, no group channels, no structured message types, no message TTL). We need to extend it significantly.  
**Fork changes:**
- Replace SQLite broker with NATS.io + JetStream as the messaging backend (Feature 06)
- Add stable identity mapping: `(peer_id_session, agent_profile_id)` → persistent agent identity survives restarts
- Add group channels: `channels` table with membership for team broadcasts
- Add structured message payloads: `message_type TEXT` + `payload JSON` columns
- Add message acknowledgment: `reply_to_id` FK for approval threads
- Add message TTL: `expires_at` + cleanup job
- Add notification routing: Telegram/Slack for HITL events (Feature 09)
- Cherry-pick PR #24 (worktree fix) and PR #7 (SendMessage conflict fix) from upstream

**Known bugs to fix:**
- Repo scope broken with git worktrees (#23 / PR #24)
- Built-in `SendMessage` conflict (#6 / PR #7)  
- Unstable peer IDs (#16) — solved by moving identity to ai-org database

**Effort:** Medium — fork, replace broker with NATS, stabilize identity mechanism, add extensions.

---

### 2. `agentic-ai-platform`
**Source:** `~/Desktop/Projects/agentic-ai-platform`  
**What we take:** Prisma schema (24 models), NextAuth v5 setup, Vitest + React Testing Library config, workspace scoping pattern, Prisma singleton, AGENTS.md coding conventions  
**Why fork, not start fresh:** The hardest parts are done — data model, auth, testing infra. Starting from scratch means rebuilding 40+ hours of work that's already solid.  
**What to throw away:** Boilerplate landing page, any UI that doesn't match the vision  
**What to keep as-is:** Everything in `prisma/schema.prisma`, `src/lib/auth.ts`, `src/lib/db.ts`, `vitest.config.ts`  
**What to add to schema:**
- `rank` field on Agent: `admin | operator | lead | agent` (Feature 01/02)
- `TaskDependency` table: `(taskId, dependsOnTaskId)` for DAG execution (Feature 07)
- `DecisionReport` + `ApprovalRequest` models for explicit HITL state (Feature 09)
- Task states: `AWAITING_HUMAN`, `APPROVED`, `REJECTED` (Feature 07)

**Effort:** Low — fork and build on top. Don't refactor what works.

---

### 4. Open Viking (Secondary Investigation)
**Source:** `github.com/volcengine/OpenViking`  
**What it is:** Memory and database architecture for AI agents. Organizes agent context into a file-system-like structure (directories = topics, files = memories) instead of flat vector search. Designed to reduce token usage by loading only the relevant context subtree into the prompt.  
**Why investigate:** Token efficiency is a first-class design constraint in this project. OpenViking's file-system context model could replace or wrap Mem0's retrieval layer — specifically for briefing pack generation (Feature 05), where we currently load memory.search() results wholesale.  
**Decision question:** Can OpenViking's context-file architecture serve as the retrieval layer for briefing packs, with Mem0 handling extraction and deduplication upstream?  
**If yes:** Adopt OpenViking as the context-loading layer between Mem0 and the briefing pack generator.  
**If no:** Use Mem0 as-is; OpenViking patterns inform how we structure context files manually.  
**Feature:** 05 Memory & Knowledge  
**Status:** Investigate — create `docs/research/openviking.md` (parallel to paiperclip.md pattern)  
**Effort:** Unknown until source is read.

---

### 3. Paperclip (Secondary Investigation)
**Source:** `github.com/paperclipai/paperclip`  
**Stars:** 46,100 | License: MIT  
**What it is:** Self-hosted AI agent orchestration platform. Node.js + TypeScript + React. Models a company as an org chart of AI agents with goals, budgets, tasks, and HITL governance.  
**Why a fork candidate:** Purpose-built for the exact use case — agent teams with human oversight. MIT licensed, data in Postgres.  
**Status:** Investigate before committing to agentic-ai-platform fork as primary for Feature 12. Specifically: can Paperclip's React UI + Postgres schema be decoupled from its execution runtime (heartbeats, task checkout)?  
**If yes:** Paperclip's UI layer may be a better fork target than agentic-ai-platform for Feature 12.  
**If no:** Use agentic-ai-platform as the dashboard shell (Feature 12) and reference Paperclip's schema design.

**Effort:** Unknown until source is read.

---

## What to Install (No Fork)

| Tool | Install | Why Not Fork |
|---|---|---|
| **LiteLLM** | `pip install litellm` | Stable, well-maintained, no customization needed |
| **LangGraph 1.0** | `pip install langgraph` | Use as framework; interrupt/Command API is the seam |
| **NATS.io** | `brew install nats-server` or Docker | Single binary; extend via subject schema, not code |
| **Mem0** | Docker Compose (3 containers) | Use as-is; seam is memory.add() + memory.search() |
| **FastMCP** | `pip install fastmcp` | MCP server in ~50 lines |
| **n8n** | Docker Compose (postgres + n8n + runner) | Configure, don't fork; seam is webhook API |
| **Supabase** | Managed cloud or self-hosted | Use the service |
| **shadcn/ui** | `npx shadcn@latest add` | UI components, use as-is |
| **Ollama** | `curl -fsSL https://ollama.ai/install.sh` | Local models, no fork needed |
| **Promptfoo** | `npx promptfoo@latest` or `pip install promptfoo` | Eval + red-team agent skill outputs; seam is `promptfoo eval` against LiteLLM endpoints |

---

## What to Build Custom (Minimal)

| Component | What to Build | Est. Size | Feature |
|---|---|---|---|
| **MCP Plugin Bridge** | FastMCP server exposing platform capabilities to Claude Code | ~200 lines Python | 11 |
| **HITL Pause Tool** | LangGraph node that calls interrupt() and formats Decision Report | ~50 lines Python | 09 |
| **HITL Callback Handler** | Webhook receiver that calls Command(resume=...) after n8n approval | ~50 lines Python | 09 |
| **Briefing Pack Generator** | Skill that assembles role-scoped context snapshots | ~100 lines markdown skill | 05 |
| **Cost Tracker** | LiteLLM callback that logs token cost per run to AuditLog | ~50 lines Python | 08 |
| **Platform Glue** | CLI that starts NATS + LangGraph + Mem0 + n8n together | ~100 lines shell/Python | all |
| **NATS Subject Schema** | Subject hierarchy definition for agent topology | ~30 lines config | 06 |

Total estimated custom code: **~580 lines** across 7 components. Everything else is configuration and wiring.

---

## What NOT to Fork

| Project | Why Not Fork |
|---|---|
| `agentic-ai` | Just a spec — no code to fork. Use as reference for feature design only. |
| `ai-team` | Reference for agent role definitions, not a codebase. Copy agent markdown files, not a fork. |
| `aios` | Personal system with different goals. Study patterns, don't fork. Reimplement ideas cleanly. |
| `ai-org` | This IS the new project. Build here, don't fork. |
| Flowise | Visual flow builder — wrong shape for agent management platform. |
| Dify | "Build an LLM app" paradigm — constrains architecture, doesn't accelerate it. License has non-Apache terms. |
| Temporal | Right for Phase 3 multi-machine; overkill for Phase 1 local. Note migration path. |
| E2B | Cloud-only managed sandbox; introduces cloud dependency for Phase 1 tool execution. Revisit Phase 2. |

---

## Reference-Only Projects

| Project | What to Extract |
|---|---|
| `aios` | 3-tier memory model, skills frontmatter format, briefing pack design, session lifecycle, skills-map.md pattern |
| `ai-team` | 14 agent role definitions (BMAD personas), conflict resolution protocol, daily briefing format, Orchestrator rules |
| `agentic-ai` | Full UX spec for web platform, skills bank design, dual-mode tool builder concept |
| `hermes-integration` | Execution engine pattern, memory bridge design, tool delegation pattern, handoff artifacts |
| `pi_agency` | Subagent delegation model, workflow routing logic, specialist role structure |
| `agency-agents` (`nacerallahchemssy/agency-agents`) | Ready-made persona definitions for PM, Dev, UX, Security, QA, and other job roles — use as starter content for Feature 01 agent profiles and Feature 03 skill templates. Don't fork: copy the role markdown files that fit, discard the rest. |
| `impeccable` (`pbakaus/impeccable`) | Domain-specific command pattern (frontmatter-driven skill framework by Paul Bakaus that steers AI output away from cliché UIs using explicit design commands) — study before finalising Feature 03 skill spec and Feature 12 UI design language. The command-over-description discipline maps directly to how our skills steer agent behaviour. |
| `heretic` (`p-e-w/heretic`) | Abliteration technique for removing refusal behaviour from local LLMs without post-training. Reference when preparing Ollama models for internal agent tasks that production API models would refuse. **Never apply to production API models.** Feature 08 (local model config). |
| `nanochat` (`karpathy/nanochat`) | Single-file LLM training + fine-tune pipeline by Andrej Karpathy. Reference only if custom agent-specific models are needed in Phase 3+. No action in Phase 1 or 2. |
| `agency-agents` (`msitarzewski/agency-agents`) | Different project from nacerallahchemssy's — "complete AI agency" with specialists defined by personality, process, and deliverables (frontend wizards, etc.). Richer character + role definitions. Compare with nacerallahchemssy version before finalising Feature 01 agent profiles. |
| `overstory` (`jayminwest/overstory`) | Multi-agent orchestration for Claude Code, Pi, and more — pluggable runtime adapters. May overlap with or inform the Plugin Bridge (Feature 11) and agent identity/dispatch model. Read before finalising Feature 11 design. |

---

## OSS Decisions Per Feature

| Feature | OSS Tool | Seam / How it connects |
|---|---|---|
| **01 Agent Identity** | claude-peers-mcp fork + NATS KV | Peer IDs are ephemeral; stable identity in ai-org DB; NATS KV maps session→profile. agency-agents personas used as starter profile content. |
| **02 Team Structure** | agentic-ai-platform Prisma schema | Workspace→Cluster→Group→Agent hierarchy; adopt immutable versioning + ResourceScopeBinding |
| **03 Skills System** | aios patterns (file-based) | Markdown + YAML frontmatter; skills-map.md as registry; handoff artifacts for chaining. Study impeccable command discipline + agency-agents role templates before finalising spec. |
| **04 Tools Layer** | agentic-ai-platform MCPTool schema + Docker exec | Schema adopted wholesale; Docker exec for sandbox; Deno V8 for JS tools |
| **05 Memory** | Mem0 + Supabase pgvector | Agents call memory.add() at session-end, memory.search() at start; LiteLLM for extraction model. Investigate OpenViking as context-loading layer for briefing packs. |
| **06 Agent Comms** | NATS.io + JetStream | Subject schema = agent topology; agent.{id}.inbox for DM; agent.broadcast.* for fan-out |
| **07 Workflow Engine** | LangGraph 1.0 + AsyncSqliteSaver | StateGraph = task DAG; interrupt() for HITL pause; thread_id = task/session handle |
| **08 Model Routing** | LiteLLM | Universal API; routing rules in config; no code changes to swap models. heretic for preparing local Ollama models that need unconstrained behaviour. |
| **09 HITL Reporting** | LangGraph interrupt() + n8n | LangGraph pauses and emits payload → n8n webhook → notifies → callback resumes LangGraph |
| **10 Observability** | Promptfoo + LangGraph tracing | `promptfoo eval` against skill outputs; A/B model comparison via LiteLLM; red-team agent pipelines; trace IDs logged to AuditLog |
| **11 Plugin Bridge** | FastMCP | MCP server (~200 lines Python) exposing platform capabilities to Claude Code / OpenCode / Pi |
| **12 Web Platform** | agentic-ai-platform fork (primary) | Prisma schema + NextAuth + Vitest; investigate Paperclip as alternative shell. impeccable design command pattern informs UI skill design. |
| **13 Project Management** | agentic-ai-platform schema (via F12 fork) | Task, Milestone, Deliverable models already in Prisma schema; build UI on top |
| **14 Agency Builder** | Next.js (via F12) + LangGraph | Wizard UI in Next.js; team config written to DB; LangGraph executes initial plan |
| **15 Desktop App** | Tauri | Wraps Next.js web layer; native shell; Phase 3 — note Electron as fallback |

---

## Decision Log

| Decision | Rationale | Date |
|---|---|---|
| Fork claude-peers-mcp | Core broker is good, but needs significant extension for NATS backend, profiles, group channels | 2026-04-02 |
| Fork agentic-ai-platform | Schema + auth already done, no point rebuilding | 2026-04-02 |
| Use LiteLLM (not direct OpenRouter API) | Model-agnostic from day one, swap models without code changes | 2026-04-02 |
| LangGraph over CrewAI | StateGraph + interrupt() maps exactly to task DAG + HITL; CrewAI is simpler but LangGraph 1.0 is now stable | 2026-04-04 |
| NATS.io over Slack alternatives | Purpose-built messaging, subject hierarchy = agent topology, single binary, MCP server exists, replaces claude-peers broker cleanly | 2026-04-04 |
| Mem0 over raw pgvector | Extraction pipeline + deduplication + scoped retrieval is non-trivial to build; Mem0 provides all of it via 3-line API | 2026-04-04 |
| Docker exec over E2B for tool sandbox | Phase 1 tools are platform-authored (known threat model); cloud dependency unjustified; E2B upgrade path for untrusted code | 2026-04-04 |
| n8n for HITL notifications | Already in stack; owns all notification routing; HITL webhook pattern is native; ~100 lines of custom glue code | 2026-04-04 |
| Skip Flowise/Dify for web platform | Wrong paradigm (flow builder / LLM app vs. agent management platform); forking = discarding most of what they are | 2026-04-04 |
| Investigate Paperclip before committing Feature 12 | 46K stars, MIT, purpose-built for agent teams; check if UI layer is decoupable from runtime | 2026-04-04 |
| Temporal: note migration path for Phase 3 | Battle-hardened durable workflows for multi-machine; overkill for Phase 1 single-machine local | 2026-04-04 |
| vm2: DO NOT USE | Deprecated, has critical CVEs | 2026-04-04 |
| Promptfoo for Feature 10 (Observability) | Only tool covering prompt eval + red-teaming + model comparison in one CLI; fills the observability gap without custom code; integrates natively with LiteLLM | 2026-04-06 |
| Investigate OpenViking for Feature 05 (Memory) | File-system context model directly targets token bloat; evaluate before locking Mem0 as sole retrieval layer; create openviking.md deep-dive | 2026-04-06 |
| agency-agents as reference for Features 01 + 03 | 30+ ready-made job-role personas avoid inventing agent identity templates from scratch; copy what fits, discard the rest | 2026-04-06 |
| impeccable as reference for Features 03 + 12 | Domain-specific command-over-description discipline maps to skill frontmatter design; study before finalising Feature 03 spec and UI design language | 2026-04-06 |
| heretic: reference only, local Ollama models only | Abliteration valid for internal Ollama models that refuse agent tasks; never apply to production API models; relevant to Feature 08 local model config | 2026-04-06 |
| nanochat: defer to Phase 3+ | Fine-tuning custom agent models not needed until platform is stable; reference only for future model training work | 2026-04-06 |
