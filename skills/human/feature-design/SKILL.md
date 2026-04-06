---
name: feature-design
description: >
  Run a focused design session for a specific feature phase.
  Triggers on: "feature design", "design feature", "design session", "/feature-design"
type: human
user-invocable: true
status: stub
---

# Feature Design — Focused Design Session

> **Status: Stub** — Full implementation pending F03 Skills System build.

This skill will run a structured design session for a specific feature phase,
following the design-think-build methodology:

1. Orient to the feature's position in the build order
2. Review existing design docs and open questions
3. Run a focused design session
4. Lock decisions and write the design doc
5. Run harmony check before handing off to build

**Coming in:** F03 Skills System build (Milestone 1).

For now, run design sessions manually using the feature's `docs/features/{N}/` dir
and the design-think-build method described in `docs/VISION.md`.
