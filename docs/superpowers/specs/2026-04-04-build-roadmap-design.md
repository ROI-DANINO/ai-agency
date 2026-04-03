# Build Roadmap Design
Date: 2026-04-04

## What This Is

The full product build roadmap for ai-org — 16 features across 3 phases, from a working CLI mesh plugin to a native desktop app. Every phase is a complete, shippable product. Each phase's features are the canonical references for the phases that follow.

---

## Methodology

**Design all → build all → ship.** For each phase:
1. Design every feature (orient → design → harmony → build)
2. Build in milestone order
3. Ship the phase as a complete product

No feature is built before its design is locked. No phase begins building before all its features are designed.

---

## Phase 1 — The Mesh (CLI Plugin)

**Goal:** A fully working Claude Code plugin of the agentic AI mesh system. Linear, async, systematic. The human opens sessions as specific roles and the mesh state persists across sessions via handoffs and memory.

**Entry points:**
- `/admin` — connect as admin, read mesh briefing, post decisions
- `/op` — connect as Operator, run specialty tools, surface decisions, assign tasks to leads
- `/[lead]` — connect as a specific Team Lead, pick up tasks, spawn inline subagents, do work

**Model:** Linear and async. One session at a time. No parallel instances in Phase 1. Each session connects, reads a briefing pack built from accumulated state, does work, and writes back via handoff.

### Milestone 1 — /admin works

| Feature | What It Delivers |
|---|---|
| **F08 Model Routing** | LiteLLM proxy, tier config (Tier 1/2/3), OpenRouter integration, routing rules per role |
| **F01 Agent Identity** | Stable slug-based IDs, NATS KV for session→profile mapping, profile schema (admin/operator/lead/agent ranks), /admin /op /lead connection flow |
| **F03 skeleton — Session Skills** | session-start skill, session-end skill, handoff writer, briefing pack reader |
| **F05 skeleton — Memory** | Flat file memory layer, briefing pack builder, mesh state reader |

**Done when:** `type /admin` in a Claude session, it connects as the admin profile, shows a mesh briefing with current state, and lets you post decisions that persist to the next session.

### Milestone 2 — /op works

| Feature | What It Delivers |
|---|---|
| **F02 Team Structure** | Operator tier, Lead tier, rank system, mesh topology (Admin/OP/Lead/Agent layers), profile hierarchy |
| **F07 light — Task Router** | Sequential task list, lead assignment, interrupt() pattern for in-session HITL decisions. No parallel DAG. |
| **F09 light — HITL** | In-session decision surface: structured decision report rendered in terminal, human approves or redirects before session continues |

**Done when:** `/op` connects as Operator, reads the mesh state, runs its specialty tools (analyst, reporter, mission), surfaces a decision to the human mid-session, and on approval writes task assignments for each Lead.

### Milestone 3 — /[lead] works

| Feature | What It Delivers |
|---|---|
| **F04 Tools Layer** | MCP tool definitions, Docker exec sandbox (Python tools), Deno V8 isolates (JS/TS tools), tool registry |
| **F03 full — Skills** | Complete skill library, /admin /op /[lead] skills fully built, skill chaining, mesh-aware session-end |
| **F05 full — Memory** | Mem0 on Supabase pgvector, memory.add() at session end, memory.search() at session start, 3-tier memory model |

**Done when:** `/dev-lead` connects, picks up its assigned task, spawns inline subagents (architect, developer), uses tools, produces work, writes results + decisions back to the mesh.

### Phase 1 Design Order

10 design sessions (F03 and F05 each split into skeleton + full):

```
F08 → F01 → F03-skeleton → F05-skeleton → F02 → F07-light → F09-light → F04 → F03-full → F05-full
```

### Phase 1 Build Order

Same order as design. Build Milestone 1 complete before starting Milestone 2.

---

## Phase 2 — The Platform (Web + Power Layer)

**Goal:** Upgrade the mesh from linear-async to real-time. Add parallel execution, web management, full HITL notifications, observability, and the adaptive intelligence layer.

**Builds on:** All Phase 1 features as canonical references. F07 and F09 are upgraded (not replaced). F03 and F05 are extended.

| Feature | What It Adds |
|---|---|
| **F06 Agent Communication** | NATS.io + JetStream live mesh, real-time agent feed, subject hierarchy = agent topology, replaces flat-file async transport from Phase 1 |
| **F07 full — Workflow Engine** | Full LangGraph DAG, parallel subtask execution, dependency graphs, AsyncSqliteSaver checkpointing, Temporal migration path for Phase 3 |
| **F09 full — HITL** | n8n Wait Node + Webhook, async decision workflows, Telegram notifications, human approves outside terminal |
| **F10 Observability** | Run history, token usage per agent and session, model performance tracking, decision audit trail |
| **F11 Plugin Bridge** | FastMCP bridge connecting mesh to OpenCode, Pi, and other agentic environments. Platform agnostic. |
| **F12 Web Platform** | agentic-ai-platform fork, NextAuth v5, agent config UI, run monitoring dashboard, team management. Paperclip as alternate candidate — assess before committing. |
| **F13 Project Management** | Projects, clients, deliverables, work history — all linked to agent runs |
| **F14 Agency Builder** | Define a new agency (roles + models + skills + tools), configure, deploy as a plugin. The meta-product moment. |
| **F16 Adaptive Intelligence** | Analyzes patterns across runs. Three HITL proposal types: (1) skill suggestions — repeated action patterns → propose formalizing as a skill; (2) agent suggestions — team gaps or role overload → propose new agent profile; (3) tuning reports — routing rules, skill weights, memory retention — all proposed, human approves before any change applies. Never acts autonomously. |

### Phase 2 Build Order

```
F06 → F07↑ → F09↑ → F10 → F11 → F12 → F13 → F14 → F16
```

F16 is last — it needs F10's observability data and a running platform before it can analyze anything meaningful.

---

## Phase 3 — The Desktop App

**Goal:** Wrap both layers into a first-class native experience. Offline-capable, tight OS integration, full UI over the mesh.

| Feature | What It Delivers |
|---|---|
| **F15 Desktop App** | Tauri (preferred over Electron — lighter, Rust-based, better performance). Wraps CLI plugin + web platform. Full UI over the mesh, offline-capable. |

---

## Feature Count

| Phase | Features | Design Sessions |
|---|---|---|
| Phase 1 | F08, F01, F03, F05, F02, F07, F09, F04 — **8 features** | 10 (F03 + F05 each have skeleton + full sessions) |
| Phase 2 | F06, F07↑, F09↑, F10, F11, F12, F13, F14, F16 — **9 features** | 9 (F07↑ and F09↑ are upgrade sessions, not new features) |
| Phase 3 | F15 — **1 feature** | 1 |
| **Total** | **16 features** | **20 design sessions** |

---

## Key Principles Applied

- **Human in the loop is non-negotiable** — every meaningful decision surfaces to the human. F16 never applies changes without approval.
- **Each phase is a complete product** — Phase 1 is fully usable before Phase 2 begins.
- **Phase N is the reference for Phase N+1** — no throwaway code. Phase 1 features are built to be extended, not replaced.
- **Linear before parallel** — Phase 1's async linear model is intentional. Complexity is added in Phase 2 when it's actually needed.
- **Apple-level throughout** — each milestone delivers a polished, complete experience. No rough edges shipped.

---

## Open Questions

None — all decisions locked as of 2026-04-04.
