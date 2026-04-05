# Agent Hierarchy & Team Structure — Design Spec
**Date:** 2026-04-05  
**Status:** Locked — ready for implementation planning  
**Covers:** Feature 02 (Team Structure), CoS skill, Phase 1 .md mesh

---

## What Was Decided

This spec captures all hierarchy decisions from the 2026-04-05 brainstorming session. It drives three implementation plans: Feature 02, Phase 1 mesh, and CoS skill.

---

## Tier Structure

### Tier 1 — Top (Human)

| Role | Type | Description |
|---|---|---|
| Admin | Human | All decisions. Never bypassed. Single user for Phase 1. |

Phase 2/3: additional real human team members can join at this tier.

### Tier 2 — OP (Operator)

| Role | Type | Description |
|---|---|---|
| Operator (OP) | Persistent agent | Routes tasks down to Leads. Queues blocked decisions for Admin. Keeps company running when Admin is offline. Never a decision-maker — coordinator only. |
| Chief of Staff (CoS) | OP skill | Synthesizes lead outputs into decision reports for Admin. Faces up only — never routes tasks. Implemented as a skill on OP, not a separate agent. Needs further design. |

**OP behavioral rules:**
- OP concatenates raw lead outputs. The CoS skill synthesizes them into readable reports.
- OP triggers the Recruitment Lead when teams need to change.
- When Admin is offline: OP queues blocking decisions, allows non-blocking tasks to proceed with safe defaults, flags everything for Admin review on return.
- Circuit breaker: after N horizontal messages between leads without resolution, OP auto-escalates to Admin. N to be defined in Feature 07.

**Phase 1 CLI management tools on OP:**
`/queue` `/status` `/approve` `/block` `/decisions` `/brief` `/recruit` `/team-status`

Visual dashboard → Phase 2.

### Tier 3 — Leads + Workers

**Agent types:**

| Type | Persistence | Can spawn sub-agents | Description |
|---|---|---|---|
| Persistent Lead | Always alive | Yes | Stable identity, memory, role across sessions |
| Tenure Worker | Persistent | Yes (for their session) | Persistent sub-agent with domain expertise; can spawn task-scoped agents |
| Task-scoped sub-agent | Dismissed when done | No | Spawned for one objective, writes handoff, dismissed |

**Dual-mode leads:** A Lead can operate as an independent Claude Code instance OR be spawned as a sub-agent by another instance. Same identity, same role, different execution context.

---

## Protected Leads (Built-in, Cannot Be Removed)

These three leads exist in every deployment regardless of what kind of company the user is building.

| Lead | Sub-agents | Why protected |
|---|---|---|
| Recruitment Lead | Interviewer, Role Designer, Team Builder | Company can't onboard or reconfigure teams without it. Phase 1: manual config. Phase 2: self-recruiting via Admin interview. |
| Knowledge Lead | Researcher, Librarian, Archivist | Institutional memory. Every team queries it. Without it agents repeat work and make inconsistent decisions. |
| Operations Lead | Cost Monitor, Health Checker, Perf Analyst | Token cost tracking, agent health, company performance. Critical given token efficiency as a design constraint. |

---

## Phase 1 Roster (Roi's ai-org build)

All leads below are recruited for the ai-org project. They are not protected globally but are present in Phase 1.

| Lead | Tenure Workers | Task-scoped sub-agents | Notes |
|---|---|---|---|
| Dev Lead | Architect | Developer, QA | Core — this is a dev project |
| PM Lead | — | Analyst, Scrum Master | Backlog, task scoping, acceptance criteria |
| UX Lead | — | Researcher, UI Designer | |
| Security Lead | CSO Auditor | Pen Tester | |
| DevOps Lead | — | Deploy, Monitor | Phase 1 — managing real infra (Supabase, NATS, LiteLLM) |
| Quality Lead | Standards Keeper | Reviewer | Recommended recruit, not protected. Cross-department quality gate. |

Phase 2 recruits (when needed): Marketing Lead, Sales Lead, Support Lead.

---

## Horizontal Lead Communication

- Leads communicate peer-to-peer via NATS subject routing (`agent.{id}.inbox`).
- Informational messages stay lateral — do not surface to OP or Admin.
- Anything requiring a decision or revealing unresolved conflict escalates to OP.
- OP packages conflicts into the CoS skill → decision report for Admin.
- Admin never sees lead-to-lead chatter — only synthesized decision points.
- Circuit breaker (Feature 07): max N messages between two leads before auto-escalation.

**Conflict is a task status field, not an LLM judgment call:**
```
status: blocked | conflicted | decision_required
```
Set by workflow logic, triggers escalation deterministically.

---

## Phase 1 Communication Mesh (.md file layer)

Full Slack-like mesh (NATS + Mem0, DMs, #channels, @mentions, feed) is Phase 2.

Phase 1 uses a file-based layer for persistence and traceability between agents:

```
.mesh/
  agents/
    {agent-id}/
      profile.md      ← identity, role, current status, model tier
      journal.md      ← session-by-session log (append-only)
      inbox.md        ← messages received (append-only)
      outbox.md       ← messages sent (append-only)
  channels/
    #general.md
    #dev.md
    #decisions.md
  dms/
    {agent-a}→{agent-b}.md
```

**Session protocol:**
- Session start: agent reads `inbox.md` and `journal.md`
- Session end: agent writes to `journal.md`, `outbox.md`, and relevant channel/DM files
- No live transport needed — purely file-based persistence

This becomes the foundation that NATS replaces in Phase 2. Same structure, different transport.

Refinement sprint required before building.

---

## What Still Needs Design

| Item | Priority | Notes |
|---|---|---|
| CoS skill (OP) | High | Synthesis rules, report format, what counts as a decision point |
| .md mesh file format | Medium | Schema for profile.md, journal.md, inbox.md |
| Recruitment interview flow | Phase 2 | How OP triggers it, what Admin interview looks like |
| Phase 2 mesh social layer | Phase 2 | #channels, @mentions, feed, live NATS transport |
| User-configurable departments | Phase 2 | Custom team creation beyond built-in roster |

---

## Implementation Order

Three plans follow this spec, in order:

1. **Plan A — Feature 02**: Implement the team structure hierarchy (agent definitions, tier config, protected leads, Phase 1 roster for ai-org)
2. **Plan B — Phase 1 .md mesh**: Build the file-based communication layer
3. **Plan C — CoS skill**: Design and implement the Chief of Staff skill on OP

Each plan is independent and can be worked in a separate session.
