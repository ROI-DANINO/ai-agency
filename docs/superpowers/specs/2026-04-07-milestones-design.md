# Milestones Design
Date: 2026-04-07
Status: Approved

## Summary

Define five formal milestones for the ai-org platform, covering all three phases.
Each milestone is a dependency gate — it marks the point at which a new class of
capability is unlocked, making the next phase of work possible.

Milestones live in `docs/FEATURE-MAP.md` under a new `## Milestones` section,
co-located with the feature registry.

---

## Milestone Definitions

### M1 · Runnable — COMPLETE
**Features:** F08 Model Routing + F01 Agent Identity + F02 Team Structure
**Gate:** Agents have stable identity, model routing is wired, a team can be
defined with a real hierarchy.
**Unlocks:** Work can be dispatched to a structured team. The skeleton is complete.

### M2 · Executable — In Progress
**Features:** F07 Workflow Engine + F09 HITL Reporting
**Gate:** A workflow runs end-to-end — task decomposition, lead dispatch,
sub-agent execution, HITL decision surfaced to the human.
**Unlocks:** The core interaction loop. The platform does something meaningful.

### M3 · Capable — Pending
**Features:** F03 Skills + F04 Tools + F05 Memory
**Gate:** Agents have skills (reusable prompt templates), tools (MCP), and
persistent memory across sessions.
**Unlocks:** Agents that can do real work, not just execute workflow scaffolding.

### M4 · Observable — Phase 2 Stub
**Features:** F10–F13 (Phase 2 web layer)
**Gate:** Web platform operational — runs visible in browser, agents configurable
via UI, decision reports reviewable without the terminal.
**Unlocks:** Platform usable by non-technical stakeholders; multi-client operation.

### M5 · Distributable — Phase 3 Stub
**Features:** F15 Desktop App
**Gate:** Desktop app wraps all layers — native experience, offline-capable,
ships as an installable.
**Unlocks:** Consumer-grade distribution; first-class local experience.

---

## Placement

Add a `## Milestones` section to `docs/FEATURE-MAP.md` between the Phase Overview
table and the Feature Registry table. Each milestone entry includes: name, features,
gate condition, unlocks, and status.

---

## Status Vocabulary

| Status | Meaning |
|---|---|
| COMPLETE | All features in milestone built and merged |
| IN PROGRESS | At least one feature built; remainder active |
| PENDING | No features started yet |
| STUB | Phase 2/3 — definition is directional, not final |
