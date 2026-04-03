# Feature 01 — Chat B Design: Profile Schema & Agent Types

**Date:** 2026-04-03
**Feature:** 01 — Agent Identity & Profiles
**Chat:** B of 3 — Profile Schema & Agent Types
**Status:** Locked

---

## Scope

This document covers the profile schema for all agent types, the rank system, the Operator architecture, the mesh topology, and temporary profile lifecycle. Session flow and activation (Chat A) and identity foundation / fork strategy (Chat C) are out of scope here.

---

## Naming Change

**Orchestrator → Operator (OP)**. Cleaner, shorter, unambiguous. Used throughout this document and all subsequent design.

---

## Rank System

Four tiers. Rank is a first-class field on every profile — it determines mesh access, reporting direction, and process model.

```
admin      ← the human operator (Roi). Above the agent hierarchy.
operator   ← OP tier. Multiple independent processes, each with a specialty.
lead       ← Team Leads. Domain-scoped, persistent.
agent      ← Sub-agents. Task-scoped, logical (no separate process).
```

---

## Process Model

The process boundary sits at the tenure/temporary split:

| Profile Type | Process Model |
|---|---|
| Tenure (operator, lead) | Real Claude Code subprocess — own process, own context, own token budget |
| Temporary (agent) | Logical — inline within the spawning Lead's context, no separate process |

Tenure agents need genuine isolation and persistence across tasks. Temporary agents are task-scoped and dismissed — a separate process would be overhead with no benefit.

---

## Operator Architecture

Operator is a **tier**, not a single agent. Multiple independent OP processes exist, each with a specialty. They coordinate via the OP Mesh.

No "OP coordinator" above them — they are all equal rank, differentiated by specialty. A single OP with sub-agents would push complexity up one level without gaining isolation.

| Specialty | OP Mesh | Lead Mesh | Purpose |
|---|---|---|---|
| watcher | read/write | read only | Monitors system health, surfaces anomalies |
| reporter | read/write | read only | Aggregates state, compiles reports to admin |
| mission | read/write | read/write | Initiates work, tasks Leads, coordinates execution |

More OP specialties may be added as the platform grows. The specialty field is open-ended.

---

## Mesh Topology

Four named layers. Named by the rank that primarily operates in each.

```
Admin Layer    ← Roi's personal surface: session history, notes, decisions
    ↕ (Roi reads/writes by default)
OP Mesh        ← OPs coordinate here. Roi reads/writes by default.
    ↕
Lead Mesh      ← Leads read/write. Mission OP read/write. Watcher/Reporter read only.
    ↕
Agent Mesh     ← Sub-agents write (report up). Leads read.
```

**Admin access model:**
- Default: Admin Layer + OP Mesh (read/write)
- On demand: superuser — read/write/delete/edit on any layer, message any agent or group directly
- Reaching down is explicit, not accidental

**Admin Layer content:** Session history, important notes, personal context. Full content design deferred to Feature 02/05.

---

## Profile Schemas

### User (Admin)

```
id:                  UUID
type:                "user"
rank:                "admin"
name:                string
access:              "superuser"
mesh_default:        ["admin", "op"]
created_at:          datetime
last_active_at:      datetime
─ session-scoped (reset on connect) ──────
current_session_id:  UUID | null
session_started_at:  datetime | null
```

### Operator (tenure)

```
id:                  UUID
type:                "tenure"
rank:                "operator"
name:                string
specialty:           "watcher" | "reporter" | "mission" | ...
mesh_read:           ["op", "lead"]
mesh_write:          ["op"]            ← watcher, reporter
                     ["op", "lead"]    ← mission
model_tier:          1 | 2 | 3
skill_pack:          string[]
created_at:          datetime
last_active_at:      datetime
session_count:       int
─ session-scoped (reset on connect) ──────
current_session_id:  UUID | null
session_started_at:  datetime | null
heartbeat_at:        datetime | null
active_task_ids:     UUID[]
```

### Lead (tenure)

```
id:                  UUID
type:                "tenure"
rank:                "lead"
name:                string
domain:              "dev" | "pm" | "ux" | "security" | ...
mesh_read:           ["lead"]
mesh_write:          ["lead"]
model_tier:          1 | 2 | 3
skill_pack:          string[]
created_at:          datetime
last_active_at:      datetime
session_count:       int
─ session-scoped (reset on connect) ──────
current_session_id:  UUID | null
session_started_at:  datetime | null
heartbeat_at:        datetime | null
active_task_ids:     UUID[]
```

### Sub-agent (temporary)

```
id:                  UUID
type:                "temporary"
rank:                "agent"
name:                string
role:                string             ← flexible, task-derived
parent_id:           UUID               ← Lead that spawned it
task_id:             UUID
mesh_read:           ["agent"]
mesh_write:          ["agent"]
tags:                string[]           ← for group addressing (design in Feature 06/02)
created_at:          datetime
dismissed_at:        datetime | null
handoff_ref:         string | null      ← path to handoff artifact
```

---

## Temporary Profile Lifecycle

```
1. Lead receives task requiring a sub-agent
2. Lead spawns temp profile → broker registers it
3. Sub-agent runs logical/inline within Lead's context (no separate process)
4. Sub-agent writes to Agent Mesh as needed
5. Task completes → Lead writes handoff artifact
6. Profile archived: dismissed_at set, handoff_ref set, marked inactive
   (not deleted — audit trail preserved)
```

---

## Targeted Messaging

Roi can message specific agents or agent groups directly (on-demand, from admin access). This requires agents to be addressable by more than just ID.

Schema note: `tags` field on all profiles (shown above on sub-agent — applies to all types). Full group addressing design deferred to Feature 06 / Feature 02.

---

## Open Questions for Chat C

1. Stable agent ID mechanism — UUID? broker-assigned? machine fingerprint?
2. Profile config storage — broker DB only, or flat file + broker?
3. Fork strategy — claude-peers-mcp fork + modify vs. thin wrapper

---

## Decisions Summary

| Decision | Outcome |
|---|---|
| Orchestrator renamed | Operator / OP |
| Rank system | admin / operator / lead / agent |
| Process model | Tenure = real subprocess, Temporary = logical |
| OP architecture | Independent processes per specialty (not one OP + sub-agents) |
| OP mesh access | read/write both layers (mission) or read-only on Lead layer (watcher, reporter) |
| Admin profile | User's own profile, superuser access, mesh_default = admin + op |
| Admin layer | Exists, content TBD (Feature 02/05) |
| Mesh layers | 4 named layers: Admin, OP, Lead, Agent |
| Temp lifecycle | Spawn → inline → archive on dismiss |
| Targeted messaging | Via tags field, full design in Feature 06/02 |
