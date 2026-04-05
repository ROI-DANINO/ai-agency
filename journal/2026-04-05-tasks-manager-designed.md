# Tasks Manager Designed: TASKS.md + task-sync Architecture
Date: 2026-04-05
Type: decision

## What Happened

Started the session wanting to orient around open tasks and loose ends — there was no single place to look at "what's happening now." Session logs had "what's next." Journal entries had "what's next." FEATURE-MAP had a stale "Next Session" note. Everything was forward-looking in multiple places at once, which means nothing was actually trustworthy.

The session turned into a full design-think-build cycle for a task manager. The key insight that shaped everything: the problem isn't that we need a better tracker — it's that every source file was doing double duty (backward-looking history AND forward-looking intent). The fix is an information hierarchy where only one file is ever forward-looking: TASKS.md.

The architecture that emerged is clean. Session-end writes TASKS.md by reading 4 sources (~75 lines) and distilling to ~30. A PostToolUse hook touches `.tasks-dirty` when key files change mid-session. Project-brief reads TASKS.md directly at session start (30 lines, nearly free) and re-derives only when the dirty flag is present. Token cost paid once per batch of changes, not on every keystroke.

A bigger idea surfaced at the end: the same mechanism should manage everything — feature map, skills map, tools map. One coherent product data management architecture where every state document has a single writer, a dirty flag, and a compact read surface. Captured in notes and as out-of-scope placeholders in the spec.

## Decisions Made

- **TASKS.md as single forward-looking document** — why: eliminates overlap and redundancy across session logs, journal, and FEATURE-MAP; one place to look, one writer
- **session-end as primary writer** — why: session-end already reads sources for the handoff; deriving TASKS.md is amortized into work already happening
- **Dirty flag (`.tasks-dirty`) over live hook derivation** — why: hook fires cheaply (one `touch`), full derivation happens once at next session start — not on every file write
- **task-sync reads exactly 4 sources** — why: defined source set prevents scope creep and keeps the read budget at ~75 lines; no scanning, no redundancy
- **Feature map, skills map, tools map should follow the same pattern** — why: Apple-level product means no manual sync debt anywhere; unified architecture scales cleanly as the project grows

## Open Questions

- task-sync skill location: standalone aios plugin now, or wait for Track 2 (ai-org as Claude Code plugin)?
- Status vocabulary: DESIGNED isn't in the official project-brief flow — reconcile before it causes more confusion
- Unified product data management design: what does the full architecture look like when feature-sync, skills-sync, tools-sync all exist alongside task-sync?

## What's Next

Execute the tasks manager implementation plan (9 tasks) using subagent-driven development. Plan at: `docs/superpowers/plans/2026-04-05-tasks-manager.md`

Task 1 is the task-sync skill. Task 2 bootstraps TASKS.md. Tasks 3–5 are wiring (skills-map, hook, gitignore). Tasks 6–7 integrate into session-end and project-brief. Task 8 fixes stale statuses. Task 9 verifies end-to-end.
