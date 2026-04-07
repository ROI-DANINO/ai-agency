---
updated: 2026-04-07 · 17:19 IL
---

# Tasks

## Where We Are
Phase 1 · Build · M2 · Executable
Design: 5 of 10 features locked (F08, F01, F02, F03, F07). Spec reviewed and patched (8 gaps fixed).
Build: F01, F02, F03, F07 complete and merged. 75 tests passing.
Active: F09 HITL Reporting — next design target.

## Now
1. **Fix LangGraph resume API bug** — `run-workflow.ts:52` passes `{ type: "__resume__", data }` but correct API is `new Command({ resume: value })`. Multi-interrupt workflows are broken without this.
2. **Fix FEATURE-MAP status drift** — F01/F02/F03 show wrong statuses (BUILDING/DESIGNED/DESIGNED). Update all three to BUILT before F09 design reads the file.
3. **Design F09 HITL Reporting** — closes M2. Reads `.mesh/` and LangGraph state, surfaces decisions to human. Run `/feature-design` for F09 after gaps 1–2 are fixed.

## Resume
- **Add `toolPack` to Agent schema** — blocked until F07/F09 scope settled.

## Open Questions
<!-- none -->

## Done
- Phase 1 completeness review — B+A gap scan, 9-item fix backlog written ✓ 2026-04-07
- Milestones system wired — FEATURE-MAP.md, TASKS.md, project-brief, session-end all updated ✓ 2026-04-07
- F07 build complete — 10 source files, 31 F07 tests, all 75 CLI tests passing ✓ 2026-04-07
- F03 build complete — skills resolver, artifact writer, 5 CLI subcommands, 33 profiles, 44 tests ✓ 2026-04-07
- F02 merged to main + superpowers artifacts cleaned ✓ 2026-04-07
