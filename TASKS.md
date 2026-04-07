---
updated: 2026-04-07 · 16:01 IL
---

# Tasks

## Where We Are
Phase 1 · Build · Milestone 1 (/admin)
Design: 5 of 10 features locked (F08, F01, F02, F03, F07). Spec reviewed and patched (8 gaps fixed).
Build: F01, F02, F03 complete and merged. F07 plan written — ready to build.
Active: F07 Workflow Engine — implementation plan ready for agent dispatch.

## Now
1. **Execute F07 build** — dispatch `docs/superpowers/plans/2026-04-07-f07-workflow-engine.md` to dev agent via Hermes (or inline). 12 tasks, LangGraph TS, MockHermesClient stub. Done when `pnpm test` passes and `run-workflow` CLI command runs to Gate 1.

## Resume
1. **F09 HITL Reporting design** — follows F07 build; reads from `.mesh/` and LangGraph state to build daily briefing surface.
2. **Add `toolPack` to Agent schema** — blocked until F07/F09 scope settled.

## Open Questions
<!-- none -->

## Done
- F07 spec stress-tested, 8 gaps patched, implementation plan written ✓ 2026-04-07
- F07 design locked — LangGraph+Hermes MCP model, mesh_watcher, HITL gates, retry limits ✓ 2026-04-07
- F03 build complete — skills resolver, artifact writer, 5 CLI subcommands, 33 profiles, 44 tests ✓ 2026-04-07
- F02 merged to main + superpowers artifacts cleaned ✓ 2026-04-07
- F01 build complete — agent identity, profile schema, registry ✓ 2026-04-07
