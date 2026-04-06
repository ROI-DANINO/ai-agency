---
name: decision-report
description: >
  Structures a HITL decision surface for the human at an approval gate.
  Called by the operator or lead agents when a decision requires human input.
type: agent
user-invocable: false
status: stub
---

# Decision Report — HITL Surface

> **Status: Stub** — Full implementation in F09 HITL Reporting build.

This skill will write a decision report to
`artifacts/decision-reports/YYYY-MM-DD-{feature}-{decision}.md` when a
task reaches a human approval gate.

A decision report contains:
- The decision required (one clear question)
- Context: what led to this decision point
- Options: 2–3 paths with tradeoffs
- Recommendation from the lead agent (if any)
- Impact: what changes depending on the human's answer
- Deadline: whether this blocks other work

The human reads the report and responds. The LangGraph workflow resumes
after `interrupt()` receives the decision.

**Coming in:** F09 HITL Reporting build (Milestone 2).
