---
updated: 2026-04-07 · 01:57 IL
---

# Tasks

## Where We Are
Phase 1 · Design → Build · Milestone 1 (/admin)
Design: 4 of 10 features locked (F08✓, F01✓, F02✓, F03✓)
Build: F01 merged to main ✓ · F02 roster complete · F02 build next
Smoke-test: deferred to milestone boundary

## Now
1. **F02 build (Plan A)** — add `protected` field to Prisma schema, create `.claude/agents/` symlinks for 7 new leads, scaffold `.mesh/` directory, run `pnpm db:push`, write protected-lead claim tests
2. **Decide: `spawned_by` / `scope` in Prisma** — sub-agent frontmatter has these fields; decide whether to add to Agent schema or keep as profile-only convention; blocks F02 build
3. **F02 build (Plan B)** — define `.mesh/` file format spec (profile.md, inbox.md, journal.md) before scaffolding

## Resume
1. **Add `toolPack` to Agent schema** — `toolPack String[] @default([])` before F04 design begins; one migration now beats two later
2. **F03 build** — design locked; build queue after F02 complete
3. **F07 Light Design** — async linear workflow; design only what Milestone 1 needs

## Open Questions
- **Superpowers reset** — still deferred; must decide before F03 build begins
- **`spawned_by` / `scope` fields** — in sub-agent frontmatter but not Prisma schema; blocks F02 build plan finalization

## Done
- F02 full agent roster written — 7 leads + 19 sub-agents, all profiles complete ✓ 2026-04-07
- F01 merged to main — 16/16 tests passing ✓ 2026-04-07
- F01 Agent Identity built — profiles, NATS KV broker, Prisma schema, `ai-org connect` CLI ✓ 2026-04-07
- F03 Skills System design locked — step-file architecture, workflow.md separation, skill:// protocol ✓ 2026-04-06
- Track 2: ai-org plugin scaffold + deploy.sh ✓ 2026-04-06
