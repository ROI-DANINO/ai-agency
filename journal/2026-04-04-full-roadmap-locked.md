# Full Product Roadmap Locked — 3 Phases, 16 Features
Date: 2026-04-04
Type: decision

## What Happened

This was the session where the project stopped being a collection of features and became a real product with a real build plan. The OSS stack was already locked from the previous session — today the work was about stepping back and asking: what are we actually building, in what order, and what does "done" look like for each phase?

The answer turned out to be sharper than expected. Phase 1 is not just 8 features in a dependency order — it's a mesh system with three distinct working moments: `/admin` connects you to the mesh, `/op` lets the Operator tier manage it, `/[lead]` lets a Lead pick up work and execute. Each of those is a milestone you can demo and feel. That's the Apple-level principle applied to the roadmap itself.

Two important structural decisions came out of this: F03 (Skills) and F05 (Memory) each ship in two passes — a skeleton for Milestone 1, and a full version for Milestone 3. F07 (Workflow Engine) and F09 (HITL) ship as lightweight versions in Phase 1 and get upgraded in Phase 2. This means the complexity curve is right: you build the minimum that makes each milestone work, then add power in Phase 2 when it's actually needed.

A new feature was added — F16 Adaptive Intelligence. The system watches patterns across runs and surfaces three types of HITL proposals: skill creation suggestions (repeated patterns → formalize as a skill), agent suggestions (team gaps or overload → propose a new agent profile), and tuning reports (routing rules, skill weights, memory retention). All HITL. Nothing applies without approval. The vision doc always said "the platform learns from every run" — F16 is what makes that real.

## Decisions Made

- Phase 1 restructured into 3 milestones (M1: /admin, M2: /op, M3: /[lead]) — why: gives working, testable moments throughout the build instead of nothing until all 8 features are done
- F03 and F05 each split into skeleton + full design sessions — why: skeleton is the minimum for Milestone 1; full versions depend on F04 (tools) being done first
- F07 and F09 are "light" in Phase 1 — why: the async linear model doesn't need LangGraph DAGs or n8n webhooks; adding that complexity early would slow Phase 1 and isn't justified by the use case
- F06 Agent Communication stays Phase 2 — why: Phase 1's async state model is intentional, not a limitation; NATS live messaging is a Phase 2 power-up, not a Phase 1 requirement
- F16 Adaptive Intelligence added to end of Phase 2 — why: needs F10 Observability data running first; HITL-only because the vision says the human stays in control of every meaningful change
- Approach B locked for Phase 1 structure — why: milestone structure gives Apple-level polish at each step while keeping all 8 features as complete Phase 2 references

## Open Questions

None — all decisions locked.

## What's Next

Execute the implementation plan starting at Task 1: Feature 01 Chat C — lock stable ID, profile storage, fork strategy. The decisions are already made (pre-answered by OSS research), this is just writing them into the feature doc and session log. Then Task 2: Feature 01 Harmony Check. Then the remaining 8 Phase 1 design sessions.

Plan lives at: `docs/superpowers/plans/2026-04-04-build-roadmap.md`
