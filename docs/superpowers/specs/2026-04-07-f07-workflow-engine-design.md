# F07 Workflow Engine — Design Spec
Date: 2026-04-07
Status: APPROVED

---

## Overview

The Workflow Engine is how work moves through the system in a structured, trackable, human-controlled way. Tasks have states. Dependencies are explicit. Parallel work is safe. At every meaningful decision point — and the moment something goes wrong — the system stops and asks the human before proceeding.

**Execution model:** LangGraph owns the top-level graph (Orchestrator → Leads fan-out → HITL → synthesize). Hermes MCP executes each Lead as a session on whatever runtime the user configured (Claude Code, Codex, Gemini, OpenCode, etc.). The workflow runs inside Claude Code. HITL gates surface as Claude Code skill prompts.

---

## Architecture

### StateGraph Topology (Fixed)

```
Human: /run-workflow "task description"
    ↓
[orchestrator_node]
    decomposes task → writes TaskManifest to LangGraph state
    ↓
⏸ interrupt() — HITL Gate 1: Approve Manifest
    human reviews, edits, approves or rejects
    ↓
[dispatcher_node]
    reads manifest DAG → Send() to ready lead_nodes
    respects cross-Lead depends_on
    ↓ Send API fan-out
[lead_node × N] ← one instance per Lead task, run in parallel
    calls hermes.spawn(lead_id, briefing, runtime)
    writes checkpoint/blocker/completed events to .mesh/
    ↓ all lead_nodes complete
    (concurrently: mesh_watcher coroutine monitors .mesh/)
    (on blocker: injects interrupt via checkpointer → early HITL)
    (on completed: signals dispatcher to check unblocked deps)
[collector_node]
    aggregates Lead outputs → writes DecisionReport to state
    ↓
⏸ interrupt() — HITL Gate 4: Approve Output
    human reviews report, approves or picks who re-runs
    ↓
[done]
```

### Nodes

| Node | Type | Responsibility |
|---|---|---|
| `orchestrator_node` | Agent call (Qwen via LiteLLM) | Decomposes task, writes TaskManifest to state |
| `dispatcher_node` | Pure Python | Reads manifest DAG, resolves dependency order, calls Send() for ready Leads. A REJECTED Lead is treated as a new DRAFT — re-spawned with original briefing + rejection notes; its dependents stay QUEUED until it completes and is approved. |
| `lead_node` | Agent call via Hermes MCP | Spawns Lead session on configured runtime, writes to mesh |
| `mesh_watcher` | Async coroutine (outside graph) | Monitors .mesh/ entries, injects state via checkpointer, triggers early HITL on blockers, signals dispatcher on early completions |
| `collector_node` | Pure Python | Aggregates lead_node outputs, builds DecisionReport |

### Persistence

- **AsyncSqliteSaver** — LangGraph checkpointer, Phase 1 local-only
- **`thread_id`** — persistent workflow handle; workflow survives Claude Code restarts
- Upgrade path: `AsyncPostgresSaver` (Supabase) in Phase 2

---

## TaskManifest Format

YAML file. Written by `orchestrator_node`, stored in LangGraph state and on disk at `task-manifests/<thread_id>.yaml`. Serves as both the workflow definition and the audit log — fields are filled in as the workflow runs.

```yaml
# Written by Orchestrator · <timestamp>

task: <human task description>
thread_id: wf-YYYY-MM-DD-NNN
requested_by: human
created_at: <ISO timestamp>
approved_at: null          # filled at Gate 1 approval
completed_at: null         # filled when workflow finishes

leads:
  - id: ux-lead
    goal: <what this Lead must deliver>
    model: auto             # F08 routes by tier; or pin e.g. claude-haiku
    runtime: auto           # from init config; or pin e.g. claude-code
    tier: 2
    depends_on: []          # starts immediately
    gate: human             # output requires human approval before dependents unblock
    max_retries: null       # null = use global default (3); set integer to override per-Lead
    queued_at: null
    started_at: null
    completed_at: null
    approved_at: null

  - id: pm-lead
    goal: <goal>
    model: auto
    runtime: auto
    tier: 2
    depends_on: []
    gate: auto              # output accepted automatically
    queued_at: null
    started_at: null
    completed_at: null
    approved_at: null

  - id: dev-lead
    goal: <goal>
    model: auto
    runtime: auto
    tier: 2
    depends_on: [ux-lead]   # waits for UX Lead to complete + be approved
    gate: human
    queued_at: null
    started_at: null
    completed_at: null
    approved_at: null

  - id: security-lead
    goal: <goal>
    model: claude-sonnet    # pinned — security needs Tier 3
    runtime: auto
    tier: 3
    depends_on: [dev-lead]
    gate: human
    queued_at: null
    started_at: null
    completed_at: null
    approved_at: null

timeout_minutes: 30         # per Lead task
max_retries: 3              # global default — Lead aborts to human gate after N rejections
mesh_check_interval: 5      # minutes between mesh_watcher stall checks (Phase 2)

# HITL log — one entry appended per gate decision (all 4 gate types)
hitl_log:
  - gate: manifest-approval     # gate: manifest-approval | lead-output | blocker | final-synthesis | retry-limit
    lead_id: null               # null for manifest-approval and final-synthesis
    presented_at: null
    decided_at: null
    decision: null              # approved | rejected | resolve | skip | abort | force-approve | change-goal | redirect
    notes: null
```

### Manifest rules

- Every time-trackable field is always present — `null` until the event occurs
- The manifest is the audit log; at workflow end it contains the full timeline
- Human can edit any field at Gate 1 before approving — change goals, swap models, add/remove depends_on
- `model: auto` defers to F08 routing by tier. Phase 2 model library replaces `auto` with task-aware selection.
- `runtime: auto` uses the runtime configured during the init interview. Can be pinned per Lead.
- `timeout_minutes` and `max_retries` global defaults are set during the init interview and written to user config. The manifest inherits them; per-workflow or per-Lead overrides take precedence when set.

---

## Mesh Integration

### Write events (lead_node → .mesh/)

Every Lead session writes structured events to `.mesh/<lead-id>/`. Every entry is timestamped.

```yaml
timestamp: <ISO timestamp>
agent: dev-lead
thread_id: wf-2026-04-07-001
event: checkpoint | blocker | completed
message: <human-readable description>
data: {}  # optional structured payload
```

**Event types:**
- `checkpoint` — progress update, informational
- `blocker` — Lead cannot continue without human input; triggers immediate HITL
- `completed` — Lead session done; triggers dispatcher to check for newly unblocked Leads

### Read events (mesh_watcher)

`mesh_watcher` is a separate async coroutine running alongside the LangGraph graph. It is **event-driven**, not time-based — reacting when new `.mesh/` entries appear. It communicates with the graph by writing to the LangGraph checkpointer and calling `interrupt()` on the active thread.

- **On `blocker`:** calls `interrupt()` immediately → Early HITL Gate (Gate 3)
- **On `completed`:** signals dispatcher — check if any `depends_on` are now satisfied
- **On `checkpoint`:** updates `state.mesh_snapshot` for context; no interrupt

**Stall detection** (Phase 2 enhancement): if a Lead hasn't written to `.mesh/` in N minutes, surface a warning. `mesh_check_interval` in the manifest is reserved for this.

### Hermes-level mesh awareness

Inside each Lead session, Hermes loads relevant `.mesh/` context at session start and re-reads it every N sub-agent tasks. This keeps Leads aware of teammates' output without graph-level coordination.

---

## HITL Gates

All four gate types surface in Claude Code as skill prompts via `interrupt()` / `Command(resume=value)`.

**Timeout behavior:** When `timeout_minutes` expires for a Lead, `mesh_watcher` treats it as a `blocker` event and Gate 3 fires with message "Lead timed out." Human decides: resolve (re-spawn), skip, or abort. Timeout is not an automatic failure.

**Gate 1 retry limit:** If the Orchestrator's manifest is rejected `max_retries` times, the workflow stops with: *"Orchestrator could not produce an acceptable manifest after N attempts. Abort or edit the manifest manually."* Human can open the last manifest, edit it directly, and approve.

### Gate 1 — Manifest Approval (before work starts)
Triggered by: `orchestrator_node` completing  
Shows: task breakdown, Lead assignments, depends_on chain, gate types  
Options: `approve` / `reject` (redirect Orchestrator with notes) / `edit` (opens manifest for changes)

### Gate 2 — Lead Output (mid-flight, `gate: human`)
Triggered by: `lead_node` completing for a Lead with `gate: human`  
Shows: Lead goal, output summary, mesh entry count, duration, which Leads are waiting  
Options: `approve` (unblocks dependents) / `reject` (Lead retries with notes) / `redirect` (change dependent Lead's goal before it starts)

### Gate 3 — Early Blocker (unscheduled)
Triggered by: `mesh_watcher` on a `blocker` event  
Shows: which agent, blocker message, how long blocked, downstream impact  
Options: `resolve` (provide value or instruction) / `skip` (Lead continues, logs gap) / `abort` (stop Lead, reschedule)

**Resolve semantics:** `resolve` re-spawns the Lead session via Hermes with the original briefing + full `.mesh/` history for that Lead + the resolution note injected as context. The Lead resumes from where it blocked. The human never sees a restart — from their perspective the Lead just continued.

**Parallel Lead behavior:** A blocker does not stop other running Leads. `mesh_watcher` writes a pending-blocker flag to the checkpointer; Gate 3 fires at the next natural graph pause point (when the current batch of lead_nodes completes). Independent Leads continue making progress while the human addresses the blocker.

### Retry Limit Gate (any Lead, any gate)
Triggered by: a Lead reaching `max_retries` rejections (default: 3)  
Shows: Lead ID, goal, rejection history with all notes, retry count  
Options: `abort` (remove Lead from workflow) / `change goal` (edit Lead goal and restart count) / `force approve` (override and accept current output)

This gate fires instead of the normal retry. It is not an error — it is a decision surface. The workflow pauses until the human acts.

### Gate 4 — Final Synthesis (all Leads done)
Triggered by: `collector_node` completing  
Shows: summary of all Lead outputs, total duration, open items flagged  
Options: `approve` (workflow done, `completed_at` filled) / `reject` (pick which Lead re-runs with notes)

---

## Model & Runtime Abstraction

**Model field:** `model` in the manifest is passed through to Hermes MCP → LiteLLM. `auto` defers to F08 tier routing. Explicit values pin the model (e.g. `claude-haiku`, `qwen-3`).

**Phase 2 model library:** replaces `auto` with task-aware selection — the library chooses the best model based on task characteristics (complexity, domain, cost target). F07 only carries the field; the library is a separate feature.

**Runtime field:** `runtime` is passed to Hermes MCP. `auto` uses the runtime from the user's init config. Can be pinned per Lead (e.g. `claude-code`, `codex`, `gemini`, `opencode`). F07 has no knowledge of which runtime is used — that's entirely Hermes's concern.

---

## Task State Machine

```
DRAFT → QUEUED → RUNNING → COMPLETED
                     ↓                  ↓
                  BLOCKED          AWAITING_HUMAN (if gate: human → Gate 2)
                     ↓                  ↓              ↓
                  RESOLVED        APPROVED         REJECTED
                     ↓            (unblocks         (→ DRAFT
                  RUNNING          dependents)       with notes)
```

---

## OSS Stack

| Concern | Tool | Seam |
|---|---|---|
| Graph execution | LangGraph 1.0 + AsyncSqliteSaver | StateGraph nodes; `thread_id` = workflow handle |
| Parallel fan-out | LangGraph Send API | `dispatcher_node` calls `Send("lead_node", task_state)` |
| HITL interrupt/resume | LangGraph `interrupt()` + `Command(resume=value)` | Surfaces in Claude Code as skill prompt |
| Lead execution | Hermes MCP | `hermes.spawn(lead_id, briefing, model, runtime)` |
| Observability | `.mesh/` file system (F02) | Structured YAML events per Lead session |
| Model routing | LiteLLM (F08) | `model` field in manifest resolves to provider/model |

---

## Dependencies

- **F01 Agent Identity** — Lead and sub-agent IDs injected into node factories at graph build time
- **F02 Team Structure** — `.mesh/` scaffold; Lead agent definitions
- **F08 Model Routing** — resolves `model: auto` to provider/model via LiteLLM
- **F09 HITL Reporting** — reads from `.mesh/` and LangGraph state to build the daily briefing (separate feature, built after F07)

---

## Out of Scope (this feature)

- Daily briefing format and delivery — F09
- Workflow templates — Phase 2
- Stall detection — Phase 2 enhancement (`mesh_check_interval` reserved)
- Model library (task-aware model selection) — Phase 2
- Multi-machine durable execution (Temporal) — Phase 3 migration path
