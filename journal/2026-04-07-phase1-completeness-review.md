# Phase 1 Completeness Review — B+A Gap Scan
Date: 2026-04-07 · 17:19 IL
Type: decision

## What Happened

Ran a full completeness review of everything built in Phase 1 so far. Two passes: a feature-by-feature gap scan (B) and a critical path trace from `aios run-workflow` to a surfaced HITL decision (A).

The B scan surfaced status drift in FEATURE-MAP (F01/F02/F03 all show wrong statuses), a missing injection seam in F03 (skill_pack is stored but never used at spawn), and F08 never having been built despite being in the dependency chain. The A trace found a high-severity bug: the LangGraph JS resume API is wrong — the code passes `{ type: "__resume__", data: value }` but the correct API is `new Command({ resume: value })`. This likely means multi-interrupt workflows restart from scratch rather than resuming.

Findings were written to a spec doc and committed. The user's plan: fix gaps in separate focused chats, starting with the resume API bug and FEATURE-MAP status drift, then proceed to F09 design.

## Decisions Made

- **Document gaps, fix in separate chats** — why: keeps this session focused on visibility; each fix is small enough to be self-contained in a fresh context
- **Fix priority: resume API bug → status drift → F09 design** — why: resume bug is high severity and undermines F07; status drift is a 3-line change that should be clean before F09 reads FEATURE-MAP

## Open Questions

- None — gap backlog is in `docs/superpowers/specs/2026-04-07-completeness-review.md`

## What's Next

1. Fix gap #1 (LangGraph resume API) in a separate chat — `packages/cli/src/commands/run-workflow.ts:52`
2. Fix gap #2 (FEATURE-MAP status drift) — F01/F02/F03 → BUILT
3. Start F09 HITL Reporting design session (`/feature-design` F09)
