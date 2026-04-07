# F07 Workflow Engine — Stress-Test Review + Implementation Plan
Date: 2026-04-07 · 16:00 IL
Type: plan

## What Happened

F07 spec was reviewed and stress-tested before writing the implementation plan. The review surfaced 8 gaps in the approved spec — all were fixed inline before the plan was written.

The three key areas probed: (1) `mesh_watcher` communication with LangGraph — the spec incorrectly implied `interrupt()` could be called from outside the graph; fixed to `aupdate_state` + pending-blocker flag pattern, with blockers not stopping parallel Leads. (2) `dispatcher_node` reject→retry semantics — spec was silent on what happens when a Lead is rejected; fixed to DRAFT re-spawn with rejection notes, dependents stay QUEUED. (3) HITL gate retry loop termination — no limit existed; fixed with `max_retries: 3` global default (configurable in init interview), per-Lead override, and a dedicated Retry Limit Gate.

Additional gaps patched: Gate 3 `resolve` semantics (re-spawn with full context), timeout behavior (fires as Gate 3, not auto-failure), Gate 1 retry limit (same max_retries applies), `hitl_log` expanded to all gate types, and init interview wiring for `timeout_minutes` / `max_retries`.

The implementation plan was then written: 12 tasks, TypeScript, TDD throughout. Full file map covering `packages/cli/src/workflow/` with 10 new source files and 5 test files. Hermes is stubbed via `MockHermesClient` for Phase 1. Plan includes a ready-to-paste agent dispatch prompt for Hermes execution.

## Decisions Made

- **Blockers don't stop parallel Leads** — why: less disruptive, simpler to implement; Gate 3 fires at next natural pause point (batch completion).
- **Gate 3 resolve = re-spawn with full context** — why: Hermes sessions aren't resumable; re-spawn with original briefing + mesh history + resolution note is the correct pattern.
- **`max_retries: 3` global default, per-Lead override** — why: Apple-level default (safe without thinking), customizable when needed; set once in init interview.
- **Retry Limit Gate surfaces as explicit decision surface** — why: infinite rejection loops must be visible and human-controlled, not silent failures.
- **Timeout fires as Gate 3 blocker, not auto-failure** — why: timeout is a signal, not a verdict; human decides.
- **Implementation is TypeScript using `@langchain/langgraph`** — why: existing codebase is TS; LangGraph JS has all required primitives (Send, interrupt, Command, SqliteSaver).
- **Phase 1 uses MockHermesClient** — why: Hermes doesn't exist yet; stub writes `.mesh/` events and returns immediately, allowing full graph to be built and tested.

## Open Questions
- None.

## What's Next
Execute the F07 implementation plan (`docs/superpowers/plans/2026-04-07-f07-workflow-engine.md`) — dispatch to dev agent via Hermes or run inline. After F07 build complete, design F09 HITL Reporting.
