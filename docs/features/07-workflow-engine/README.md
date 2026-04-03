# Feature 07 — Workflow Engine

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin + Cross-layer  
**Priority:** Critical  
**Depends on:** 02 Team Structure, 01 Agent Identity

---

## Vision

Work moves through the system in a structured, trackable way. Tasks have states. Dependencies are explicit. Parallel work is safe. And at every meaningful decision point, the system stops and asks the human before proceeding.

---

## Core Concept

Every piece of work is a task with a state machine:

```
DRAFT → QUEUED → RUNNING → BLOCKED (awaiting human) → APPROVED → DONE
                               ↓
                            REJECTED → back to DRAFT
```

Complex work is decomposed into a DAG (directed acyclic graph) of sub-tasks. Tasks with no dependencies start immediately. Tasks with dependencies wait. No polling — agents are notified when their dependencies complete.

Human approval gates are built into the DAG. Certain task types always require human sign-off before the next phase begins.

---

## Key Capabilities

- Task state machine (8 states: draft, queued, running, blocked, awaiting-human, approved, rejected, done)
- DAG-based task decomposition — Orchestrator writes manifest, Scheduler dispatches
- Dependency-aware parallel execution — tasks start only when blockers resolve
- Gate types: automatic (no approval needed) and human-gated (must be approved)
- Built-in gates: brainstorm → plan → build → review → ship
- Daily briefing — structured human inbox with tasks awaiting decision
- Sub-agent spawn on demand — created for a task, dismissed on completion with handoff
- Task retry on rejection — REJECTED sends task back to DRAFT with notes
- Timeout strategy — if a decision isn't answered in N minutes, agent continues with a default and logs the decision for post-facto review
- Workflow templates — pre-defined DAGs for common patterns (feature build, research sprint, security audit)

---

## Open Questions

- [ ] Where is task state stored — CLI-local (SQLite) or web platform DB?
- [ ] How does the Orchestrator write a DAG manifest — free-form markdown, or structured YAML/JSON?
- [ ] What triggers the daily briefing — a cron job, a skill, or manual invocation?
- [ ] Timeout defaults — how long before an agent continues without human response?
- [ ] How are rejected tasks communicated back to the agent that submitted them?
- [ ] Can the human modify a task mid-flight, or only approve/reject?
- [ ] Workflow templates — stored as skill files or separate template format?

---

## Considerations

- The gate-based flow (brainstorm → plan → build → review → ship) from aios is the right default pattern. It prevents agents from building the wrong thing.
- DAG dispatch is more complex than sequential chains but is essential for parallel agent work. Don't simplify this away.
- The daily briefing is the human's primary interface with the running system. It must be concise, actionable, and never overwhelming.
- Timeout with default-and-log is better than blocking indefinitely. Agents should be able to make reasonable progress without constant human attention.
- Consider CrewAI or LangGraph for the execution engine. Don't build this from scratch.

---

## OSS Stack

- **LangGraph 1.0** — StateGraph abstraction maps directly to the task DAG. Nodes are agent calls or Python functions; conditional edges handle routing; `interrupt()` provides HITL pause anywhere inside a node; `Command(resume=value)` resumes after human decision. — Seam: Feature 01 injects agent configs into node factories at graph build time; `thread_id` maps to a task/session context; state passes typed dicts conforming to the platform's AgentState schema.
- **AsyncSqliteSaver** (LangGraph checkpointer) — persists graph state to SQLite for Phase 1 local-only use. Zero additional infrastructure. Upgrade to `AsyncPostgresSaver` (Supabase) in Phase 2. — Seam: `thread_id` is the persistent handle; state survives process restarts.
- **agentic-ai-platform Task schema** (fork) — `Task` model with state machine adopted; add `AWAITING_HUMAN`, `APPROVED`, `REJECTED` states; add `TaskDependency(taskId, dependsOnTaskId)` table for DAG. — Seam: LangGraph `thread_id` maps to `Task.id`; task state transitions mirror LangGraph graph state.
- **Temporal** (Phase 3 migration path) — durable workflow execution for multi-machine deployments. Workflows survive crashes and restarts via event sourcing. Note this migration now; do not build toward it. — Exit cost from LangGraph: rewrite graph definitions as `@workflow.defn` classes; no proprietary state migration.

## OSS & References

- **OSS:** LangGraph 1.0 — stateful agent graphs with first-class HITL interrupt/resume (confirmed over CrewAI)
- **Reference:** `aios` — dev pod pattern (Planner → Scheduler → Coder/Tester/Reviewer with DAG)
- **Reference:** `ai-team` — orchestrator protocol, sub-agent dispatch, daily briefing format
- **Reference:** `agentic-ai-platform` Prisma schema — Task model with state machine

---

## Dependencies

- **01** Agent Identity — tasks are owned by agents
- **02** Team Structure — task routing follows the team hierarchy

---

## Session Notes
<!-- Fill during design/build session -->
