# F02 Team Structure — Built
Date: 2026-04-07 · 02:36 IL
Type: build

## What Happened

Built F02 Team Structure (Plan A) on branch `build/f02-team-structure` using subagent-driven development. The build extended the Agent model with three new fields — `protected`, `spawnedBy`, and `scope` — flowing the full pipeline from Prisma schema through AgentProfile type and parser to DB sync on connect. 14 tests passing across the CLI package.

The original plan had `AgentScope.TENURE` which the code reviewer caught as a naming collision with `AgentType.TENURE`. Renamed to `AgentScope.PERSISTENT` before Tasks 2 and 3 were executed — one-word fix that would have been expensive after the fact. The reviewer also caught a missing pair validation invariant (spawnedBy and scope must both be set or both absent), which was added to `syncAgentToDb` with two tests.

Also created `.claude/agents/` symlinks for all 7 new leads, scaffolded the `.mesh/` directory skeleton, and wrote a placeholder `SOUL.md` for Hermes project context.

The session also resolved the Hermes integration question: Hermes (`delegate_task`) maps directly to `scope: task` + `spawnedBy`, so those fields are now in the DB rather than profile-only. Full Hermes → DB wiring (FastMCP bridge) is deferred to F11 — captured as a decision note. Hermes is set up as the coding tool going forward using Qwen via OpenRouter.

## Decisions Made

- **`spawned_by`/`scope` added to DB schema** — why: Hermes `delegate_task` is the Phase 1 sub-agent runtime; the machinery exists now, so YAGNI no longer applies
- **`AgentScope.PERSISTENT` instead of `AgentScope.TENURE`** — why: avoids semantic collision with `AgentType.TENURE`; caught by code reviewer before downstream tasks were written
- **Hermes as coding tool, Option B (sub-agent runtime) deferred** — why: FastMCP bridge (F11) doesn't exist yet; not worth building ahead of F03; captured in notes and TASKS.md
- **Smoke-test at milestone boundary, not per-feature** — why: consistent with prior session decision; integrated stack validates at meaningful checkpoints

## Open Questions

- **SOUL.md design** — placeholder written; full design needed before Hermes sessions are deeply productive
- **Hermes vs LangGraph for sub-agent spawning** — must decide before F07 design begins; does Hermes replace or sit alongside LangGraph?
- **Superpowers reset** — still deferred; must decide before F03 build begins

## What's Next

Merge `build/f02-team-structure` to main, then begin F03 Skills System build. Design is locked — read `docs/features/` for the F03 spec before starting the build plan.
