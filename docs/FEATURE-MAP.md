# Feature Map

Master registry of all platform features. Each feature has its own directory under `docs/features/` for deep design work.

---

## Phase Overview

| Phase | Layer | Focus | Status |
|---|---|---|---|
| Phase 1 | CLI Plugin | Foundation — model routing, identity, teams, workflow, HITL, skills, tools, memory | Planning |
| Phase 2 | Cross / Web | Platform — communication, observability, plugin bridge, web dashboard, project mgmt, agency builder | Planning |
| Phase 3 | Desktop App | Desktop — native app wrapping both layers | Future |

---

## Milestones

Each milestone is a dependency gate — the point at which a new class of capability unlocks and makes the next phase of work possible.

| # | Name | Features | Gate | Unlocks | Status |
|---|---|---|---|---|---|
| M1 | Runnable | F08 + F01 + F02 | Agents have stable identity, model routing is wired, a team can be defined with a hierarchy | Work can be dispatched to a structured team | COMPLETE |
| M2 | Executable | F07 + F09 | A workflow runs end-to-end — task decomposition, lead dispatch, sub-agent execution, HITL decision surfaced to human | The core interaction loop — the platform does something meaningful | IN PROGRESS |
| M3 | Capable | F03 + F04 + F05 | Agents have skills (reusable prompt templates), tools (MCP), and persistent memory across sessions | Agents that can do real work, not just execute workflow scaffolding | PENDING |
| M4 | Observable | F10–F13 | Web platform operational — runs visible in browser, agents configurable via UI, decision reports reviewable without terminal | Platform usable by non-technical stakeholders; multi-client operation | STUB |
| M5 | Distributable | F15 | Desktop app wraps all layers — native, offline-capable, ships as an installable | Consumer-grade distribution; first-class local experience | STUB |

---

## Feature Registry

| # | Feature | Phase | Layer | Priority | Depends On | Status |
|---|---|---|---|---|---|---|
| 08 | [Model Routing](features/08-model-routing/README.md) | 1 | Cross | Critical | — | DESIGNED |
| 01 | [Agent Identity & Profiles](features/01-agent-identity/README.md) | 1 | CLI | Critical | — | BUILDING |
| 02 | [Team Structure & Hierarchy](features/02-team-structure/README.md) | 1 | CLI | Critical | 01 | DESIGNED |
| 07 | [Workflow Engine](features/07-workflow-engine/README.md) | 1 | CLI | Critical | 02 | BUILT |
| 09 | [HITL Reporting](features/09-hitl-reporting/README.md) | 1 | Cross | Critical | 07 | PLACEHOLDER |
| 03 | [Skills System](features/03-skills-system/README.md) | 1 | CLI | Critical | 02 | DESIGNED |
| 04 | [Tools Layer](features/04-tools-layer/README.md) | 1 | CLI | Critical | 01 | PLACEHOLDER |
| 05 | [Memory & Knowledge](features/05-memory-knowledge/README.md) | 1 | CLI | Critical | 01 | PLACEHOLDER |
| 06 | [Agent Communication](features/06-agent-communication/README.md) | 2 | CLI | High | 01 | PLACEHOLDER |
| 10 | [Observability & Monitoring](features/10-observability/README.md) | 2 | Cross | High | 07 | PLACEHOLDER |
| 11 | [Plugin Bridge](features/11-plugin-bridge/README.md) | 2 | CLI | High | 03, 04 | PLACEHOLDER |
| 12 | [Web Platform](features/12-web-platform/README.md) | 2 | Web | High | 01–10 | PLACEHOLDER |
| 13 | [Project Management](features/13-project-management/README.md) | 2 | Web | Medium | 12 | PLACEHOLDER |
| 14 | [Agency Builder](features/14-agency-builder/README.md) | 2 | Cross | High | 01–13 | PLACEHOLDER |
| 15 | [Desktop App](features/15-desktop-app/README.md) | 3 | Desktop | Medium | 01–14 | PLACEHOLDER |

---

## Dependency Graph

```
[08 Model Routing] ──────────────────────────────────────────┐
                                                              ↓
[01 Agent Identity] → [02 Team Structure] → [07 Workflow Engine] → [09 HITL Reporting]
         ↓                    ↓
[04 Tools Layer]    [03 Skills System]    [10 Observability]
         ↓                    ↓
[05 Memory]         [11 Plugin Bridge]
         ↓
[06 Communication]
                   ↘                    ↘
                [12 Web Platform] → [13 Project Mgmt] → [14 Agency Builder] → [15 Desktop App]
```

---

## Phase 1 Build Order

The "it works" moment: a team of agents decomposes a task, executes it, and surfaces a decision to the human — all with the right model for each role.

1. **08 Model Routing** — no dependencies; gives every subsequent feature multi-model capability from day one
2. **01 Agent Identity** — foundation; stable agent IDs backed by claude-peers-mcp fork
3. **02 Team Structure** — Orchestrator + Lead agents + sub-agent hierarchy
4. **07 Workflow Engine** — task decomposition, routing, DAG execution
5. **09 HITL Reporting** — decision reports surface to human; core interaction loop (moved from Phase 2)
6. **03 Skills System** — reusable prompt templates as agent capabilities
7. **04 Tools Layer** — MCP tools agents can call
8. **05 Memory & Knowledge** — persistent context across sessions

---

## OSS Foundation

| Component | OSS Tool | Seam / How it connects |
|---|---|---|
| Model proxy | LiteLLM | Universal API for all providers; routing rules in config; no code changes to swap models |
| Workflow engine | LangGraph 1.0 + AsyncSqliteSaver | StateGraph = task DAG; `interrupt()` for HITL pause; `thread_id` = task/session handle |
| Agent messaging | NATS.io + JetStream | Subject hierarchy = agent topology; `agent.{id}.inbox` for DM; `agent.broadcast.*` for fan-out |
| Agent identity | claude-peers-mcp fork (NATS-backed) | MCP surface retained; SQLite broker replaced with NATS KV for stable identity mapping |
| Memory | Mem0 (self-hosted) on Supabase pgvector | `memory.add(text, user_id=agent_id)` at session-end; `memory.search(query)` at session-start |
| Database + vector | Supabase + pgvector | Managed Postgres + pgvector; Mem0 uses it as vector backend; Prisma schema from agentic-ai-platform fork |
| HITL notifications | n8n (self-hosted) | Platform emits Decision Report → n8n webhook → routes/notifies/waits → POSTs result back → platform resumes LangGraph |
| Tool sandbox | Docker exec + Deno V8 | Docker exec for Python tools; Deno V8 isolates for JS tools; E2B upgrade path for untrusted code (Phase 2) |
| Plugin bridge | FastMCP (Python) | MCP server (~200 lines) connecting to Claude Code / OpenCode / Pi |
| Web platform | agentic-ai-platform fork | Prisma schema (24 models) + NextAuth v5 + Vitest; investigate Paperclip as alternative shell |
| Web framework | Next.js + shadcn/ui | UI layer on top of agentic-ai-platform fork |
| Skills system | File-based (aios pattern) | Markdown + YAML frontmatter; skills-map.md as registry; handoff artifacts for chaining |

**Decisions locked 2026-04-04:** LangGraph over CrewAI; NATS over Slack alternatives; Mem0 over raw pgvector; Docker exec over E2B; Paperclip as Feature 12 secondary candidate. See `research/forks-and-oss.md` for full analysis and rationale.

---
