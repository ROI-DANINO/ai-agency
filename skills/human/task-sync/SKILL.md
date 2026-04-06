---
name: task-sync
description: >
  Syncs TASKS.md with current project state. Reads 4 project sources, writes
  TASKS.md, clears the .tasks-dirty dirty flag.
  Triggers on: "task sync", "update tasks", "sync tasks", "/task-sync"
  Also called internally by project-brief and session-end.
type: human
user-invocable: true
---

# Task Sync

Reads 4 sources, synthesizes current project state, writes TASKS.md.

## Sources (read in order)

1. **`docs/FEATURE-MAP.md`** — which features are locked, in design, or placeholder
2. **`docs/superpowers/plans/`** — most recent plan file (sort by date prefix, take latest)
3. **`journal/`** — last 2 journal entries (sort by date prefix, take latest 2)
4. **Current `TASKS.md`** — carry forward any open questions not yet resolved

## Write TASKS.md

Overwrite `TASKS.md` with this exact structure:

```markdown
---
updated: YYYY-MM-DD
---

# Tasks

## Where We Are
{One-line phase/milestone summary}
{Design progress: N of 10 sessions done, which features locked}
{Build progress: what's built or "not started"}
{Active tracks if any}

## Now
{Top 1–3 prioritized items. Each item = what to do + why it matters (one line).}

## Resume
{Items that are in progress but not the immediate priority. Brief status note per item.}

## Open Questions
{Unresolved decisions that block or affect architecture. One per line, with what it blocks.}

## Done
{Recently completed items, with date. Keep last 3–5 only — archive older ones.}
```

## Rules

- `## Now` items must be actionable. Not "think about X" — "design X" or "build X" or "decide X".
- `## Open Questions` is for blockers only, not general curiosity.
- `## Done` never grows beyond 5 items. Drop oldest when adding new.
- Do not preserve stale items just because they were in the previous TASKS.md.
  If something is no longer relevant, remove it.

## After Writing

Delete `.tasks-dirty` if it exists at repo root:

```bash
rm -f .tasks-dirty
```

Output: "TASKS.md updated." — no other commentary unless something unexpected was found.
