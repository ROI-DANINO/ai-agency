---
updated: 2026-04-07 · 01:34 IL
---

# Tasks

## Where We Are
Phase 1 · Design → Build · Milestone 1 (/admin)
Design: 4 of 10 features locked (F08✓, F01✓, F02✓, F03✓)
Build: F01 Agent Identity complete on `build/f01-agent-identity` — 16/16 tests passing. Awaiting merge.
Plugin: Track 2 complete ✓ · deployed ✓ · ai-org skills live in ~/.claude/skills/

## Now
1. **Merge F01** — `git checkout main && git merge build/f01-agent-identity`. Branch is clean and tested.
2. **F01 post-merge ops** — `pnpm db:push` (Supabase), smoke-test `ai-org connect --as dev-lead` with real NATS + real DB. Confirms the full stack works end-to-end.
3. **F02 Team Structure design** — unblocked; should now be designed against real Agent model + broker code (read F01 GUIDE.md first).

## Resume
1. **Add `toolPack` to Agent schema** — `toolPack String[] @default([])` before F04 design begins. One migration now beats two later.
2. **F07 Light Design** — async linear workflow model; design only what Milestone 1 needs (not full DAG).
3. **F09 Light Design** — HITL decision surface; define what a decision report looks like to the human.
4. **F05 Skeleton Design** — memory & knowledge persistence; follows F03 in design sequence.

## Open Questions
- **Superpowers reset**: still in use post-F03 lock. Decide before F03 build begins whether to reset or keep as-is.
- **toolPack field**: not yet on Agent model — must add before F04 design begins.

## Done
- F01 Agent Identity built — profiles, NATS KV broker, Prisma schema, `ai-org connect` CLI, 16 tests ✓ 2026-04-07
- Two OSS references added: msitarzewski/agency-agents + jayminwest/overstory → forks-and-oss.md ✓ 2026-04-07
- F03 Skills System design locked — step-file architecture, workflow.md separation, skill:// protocol ✓ 2026-04-06
- Track 2: ai-org plugin scaffold + deploy.sh ✓ 2026-04-06
- F08 Model Routing design ✓ 2026-04-03
