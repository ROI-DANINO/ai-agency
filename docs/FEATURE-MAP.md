# Feature Map

Master registry of all platform features. Each feature has its own directory under `docs/features/` for deep design work.

---

## Phase Overview

| Phase | Layer | Focus | Status |
|---|---|---|---|
| Phase 1 | CLI Plugin | Foundation — identity, teams, skills, tools, memory, communication, workflow, model routing | Planning |
| Phase 2 | Web Platform | Platform — HITL reporting, observability, plugin bridge, web dashboard, project management, agency builder | Planning |
| Phase 3 | Desktop App | Desktop — native app wrapping both layers | Future |

---

## Feature Registry

| # | Feature | Phase | Layer | Priority | Depends On |
|---|---|---|---|---|---|
| 01 | [Agent Identity & Profiles](features/01-agent-identity/README.md) | 1 | CLI | Critical | — |
| 02 | [Team Structure & Hierarchy](features/02-team-structure/README.md) | 1 | CLI | Critical | 01 |
| 03 | [Skills System](features/03-skills-system/README.md) | 1 | CLI | Critical | 02 |
| 04 | [Tools Layer](features/04-tools-layer/README.md) | 1 | CLI | Critical | 01 |
| 05 | [Memory & Knowledge](features/05-memory-knowledge/README.md) | 1 | CLI | Critical | 01 |
| 06 | [Agent Communication](features/06-agent-communication/README.md) | 1 | CLI | High | 01 |
| 07 | [Workflow Engine](features/07-workflow-engine/README.md) | 1 | CLI | Critical | 02 |
| 08 | [Model Routing](features/08-model-routing/README.md) | 1 | Cross | Critical | — |
| 09 | [HITL Reporting](features/09-hitl-reporting/README.md) | 2 | Cross | Critical | 07 |
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
         ↓                    ↓                     ↓                      ↓
[04 Tools Layer]    [03 Skills System]    [10 Observability]     [12 Web Platform]
         ↓                    ↓                                            ↓
[05 Memory]         [11 Plugin Bridge]                         [13 Project Mgmt]
         ↓                                                                 ↓
[06 Communication]                                             [14 Agency Builder]
                                                                           ↓
                                                               [15 Desktop App]
```

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

**Session goal:** Fork decisions + Phase 1 implementation plan.  
Read: `VISION.md`, `ARCHITECTURE.md`, `research/forks-and-oss.md`, then open `features/01-agent-identity/README.md`.
