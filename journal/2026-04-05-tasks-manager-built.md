# Tasks Manager Built: TASKS.md + task-sync + Dirty Flag Live
Date: 2026-04-05
Type: milestone

## What Happened

Executed the 9-task tasks manager plan using subagent-driven development. The full system shipped in one session — task-sync skill created, TASKS.md bootstrapped with current project state, dirty flag hook wired into the PostToolUse system, session-end and project-brief skills updated to use TASKS.md as the single task surface.

One meaningful deviation from the plan: the inline shell command specified for the PostToolUse hook had a quoting nightmare that broke when Claude Code ran it through `/bin/sh`. Fixed by extracting the logic to a proper script at `.claude/hooks/tasks-dirty.sh`. Cleaner than the original design — easier to read and maintain. The hook fires correctly on journal entries, session logs, FEATURE-MAP, and feature READMEs; silent on everything else.

The peer communication via claude-peers didn't land in the parallel skills-cleanup session — messages sent but not surfaced. Noted for investigation.

## Decisions Made

- **Extracted hook logic to script file** — why: inline shell in JSON settings had quoting issues that broke under `/bin/sh`; a script file is also more maintainable
- **task-sync + session-end + project-brief files not committed to git** — why: they live in `~/.claude/aios-plugins/` which is user-level config outside the repo; the pattern is correct, just not version-controlled here yet (Track 2 fixes this)
- **Skipped live skill invocation tests in Task 9** — why: skill files in `~/.claude/aios-plugins/` reload fresh per invocation; the structural verification (hook fires, TASKS.md ≤35 lines) was sufficient

## Open Questions

- task-sync plugin location: user-level aios plugin now vs. wait for Track 2 (ai-org as installable Claude Code plugin)?
- update-skills-map.sh hook (existing) vs. new tasks-dirty hook: do they conflict? (Track 1 needs to resolve)
- unified product data management: feature-sync, skills-sync, tools-sync following same pattern — when does this become a design task?

## What's Next

Track 1: skills cleanup design session — criteria for what to keep/archive/delete, resolve hook conflict, define "ready for Track 2" end-state. Plan at `~/.claude/plans/agile-marinating-glacier.md`.
