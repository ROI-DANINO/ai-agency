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

## Feature Registry

| # | Feature | Phase | Layer | Priority | Depends On |
|---|---|---|---|---|---|
| 08 | [Model Routing](features/08-model-routing/README.md) | 1 | Cross | Critical | — | DESIGNING |
| 01 | [Agent Identity & Profiles](features/01-agent-identity/README.md) | 1 | CLI | Critical | — |
| 02 | [Team Structure & Hierarchy](features/02-team-structure/README.md) | 1 | CLI | Critical | 01 |
| 07 | [Workflow Engine](features/07-workflow-engine/README.md) | 1 | CLI | Critical | 02 |
| 09 | [HITL Reporting](features/09-hitl-reporting/README.md) | 1 | Cross | Critical | 07 |
| 03 | [Skills System](features/03-skills-system/README.md) | 1 | CLI | Critical | 02 |
| 04 | [Tools Layer](features/04-tools-layer/README.md) | 1 | CLI | Critical | 01 |
| 05 | [Memory & Knowledge](features/05-memory-knowledge/README.md) | 1 | CLI | Critical | 01 |
| 06 | [Agent Communication](features/06-agent-communication/README.md) | 2 | CLI | High | 01 |
| 10 | [Observability & Monitoring](features/10-observability/README.md) | 2 | Cross | High | 07 |
| 11 | [Plugin Bridge](features/11-plugin-bridge/README.md) | 2 | CLI | High | 03, 04 |
| 12 | [Web Platform](features/12-web-platform/README.md) | 2 | Web | High | 01–10 |
| 13 | [Project Management](features/13-project-management/README.md) | 2 | Web | Medium | 12 |
| 14 | [Agency Builder](features/14-agency-builder/README.md) | 2 | Cross | High | 01–13 |
| 15 | [Desktop App](features/15-desktop-app/README.md) | 3 | Desktop | Medium | 01–14 |

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

| Component | OSS Tool | Notes |
|---|---|---|
| Model proxy | LiteLLM | Universal API for all model providers |
| Agent orchestration | CrewAI → LangGraph | Start simple, scale to graphs |
| Workflow automation | n8n (self-hosted) | Integrations, scheduling, notifications |
| Database + vector | Supabase + pgvector | Managed Postgres, auth, storage |
| Agent messaging | claude-peers-mcp (fork) | Identity broker + message passing |
| Plugin bridge | FastMCP (Python) | MCP server connecting to Claude Code / OpenCode / Pi |
| Web framework | Next.js + shadcn/ui | Fork agentic-ai-platform as base |

See `research/forks-and-oss.md` for full analysis.

---

## Next Session

Start with Feature 08 — Model Routing. No dependencies, no blockers, and it unlocks multi-model capability for everything that follows.
Read: `VISION.md`, `ARCHITECTURE.md`, `features/08-model-routing/README.md`
