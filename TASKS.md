---
updated: 2026-04-07 · 02:36 IL
---

# Tasks

## Where We Are
Phase 1 · Build · Milestone 1 (/admin)
Design: 4 of 10 features locked (F08✓, F01✓, F02✓, F03✓)
Build: F01 ✓ · F02 ✓ (branch ready to merge) · F03 next
Hermes set up as coding tool (Qwen via OpenRouter)

## Now
1. **Merge `build/f02-team-structure` to main** — F02 build complete, 14 tests passing, branch clean
2. **F03 build** — design locked; read `docs/features/03-skills-system/` for spec, write build plan, execute
3. **Design SOUL.md for Hermes** — placeholder written; proper design needed before Hermes sessions are productive

## Resume
1. **F07 Light Design** — async linear workflow; design only what Milestone 1 needs; blocked until F03 build complete
2. **Add `toolPack` to Agent schema** — `toolPack String[] @default([])` before F04 design begins; one migration now beats two later

## Open Questions
- **Hermes vs LangGraph for sub-agent spawning** — does Hermes replace or sit alongside LangGraph for F07? Must decide before F07 design begins
- **Superpowers reset** — still deferred; must decide before F03 build begins

## Done
- F02 Team Structure built — protected/spawnedBy/scope fields, 7 lead symlinks, .mesh/ scaffold, 14 tests ✓ 2026-04-07
- F02 full agent roster written — 7 leads + 19 sub-agents, all profiles complete ✓ 2026-04-07
- F01 merged to main — 16/16 tests passing ✓ 2026-04-07
- F03 Skills System design locked — step-file architecture, workflow.md separation, skill:// protocol ✓ 2026-04-06
- Track 2: ai-org plugin scaffold + deploy.sh ✓ 2026-04-06
