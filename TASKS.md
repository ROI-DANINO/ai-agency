---
updated: 2026-04-07 (F01 build in progress)
---

# Tasks

## Where We Are
Phase 1 · Design → Build · Milestone 1 (/admin)
Design: 4 of 10 features locked (F08✓, F01✓, F02✓, F03✓)
Build: not started
Plugin: Track 2 complete ✓ · deployed ✓ · ai-org skills live in ~/.claude/skills/

## Now
1. **F01 Build — finish + merge** — Tasks 7–9 in progress (CLI connect, wire, e2e verify). Then merge `build/f01-agent-identity` → main.
2. **F01 Post-merge ops** — run `pnpm db:push` against Supabase, smoke-test `ai-org connect --as dev-lead` end-to-end (real NATS + real DB).
3. **Add `toolPack` to Agent schema** — add `toolPack String[] @default([])` before F04 design begins. Easier migration now than later.

## Resume
1. **F02 Team Structure design** — can now be designed against real Agent model + broker code (not just spec). Read F01 implementation before starting.
2. **F07 Light Design** — async linear workflow model; design only what's needed for Milestone 1 (not full DAG)
3. **F09 Light Design** — HITL decision surface; define what a decision report looks like to the human
4. **F05 Skeleton Design** — memory & knowledge persistence; follows F03 in design sequence

## Open Questions
- Superpowers reset: deferred to F03 — F03 is now locked; superpowers still in use. Decide before F03 build begins whether to reset or keep as-is.
- **agents/ ↔ .claude/agents/ pattern**: decided — `agents/<slug>.md` is source of truth, `.claude/agents/` symlinks to it. Document this in F03 design (skill_pack field wires into F03 skill loading).
- **Worktree read access**: `.worktrees/` blocked from Read/Glob tools. Spec review happens via `git show <branch>:<file>` from main repo. Consider working on feature branches in main repo for future build tasks instead of worktrees.

## Done
- Two OSS references added: msitarzewski/agency-agents + jayminwest/overstory → forks-and-oss.md ✓ 2026-04-07
- F03 design locked — step-file architecture, workflow.md separation, skill:// protocol ✓ 2026-04-06
- Session skill pipeline fixed: session-end → HANDOFF.md → project-brief, prerequisites, all recent journals ✓ 2026-04-06
- Track 2: ai-org plugin scaffold + deploy.sh ✓ 2026-04-06
- F08 Model Routing design ✓ 2026-04-03
