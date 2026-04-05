# Tasks Manager Design
Date: 2026-04-05

## What This Is

A persistent task and context manager for the ai-org project. One file (`TASKS.md`) is the single forward-looking document in the project — everything else is backward-looking (journal, session logs, feature READMEs). A lightweight skill (`task-sync`) maintains it. `project-brief` reads it directly at session start.

---

## Core Principles

- **Token efficiency**: project-brief reads ~30 lines. No multi-source scanning at session start.
- **Single writer**: only `task-sync` writes `TASKS.md`. No manual edits.
- **Single forward-looking document**: no "what's next" in journal, session logs, or FEATURE-MAP. Those are backward-looking by design.
- **Ground truth over derived status**: `task-sync` writes from what actually happened, not from FEATURE-MAP (which can be stale).

---

## The File — `TASKS.md`

Lives at project root. Git-tracked. ~30 lines always. This is what `project-brief` reads.

```markdown
---
updated: YYYY-MM-DD · HH:MM
---

# Tasks

## Where We Are
Phase [N] · [current activity] · Milestone [N] ([milestone name])
Design: [X] of [Y] sessions done ([completed features] ✓)
Build: [status — not started / in progress / milestone N complete]
Bottleneck: [single sentence — what's blocking the critical path]

## Now
1. [task] — [why it's right now, one line]
2. [task] — [why]
3. [task] — [why]

## Resume
1. [in-progress work] — [where it left off]
2. [in-progress work] — [where it left off]
3. [in-progress work] — [where it left off]

## Open Questions
- [question]: [what needs to be resolved · what it blocks]
- [question]: [what needs to be resolved · what it blocks]

## Blocked
- [work item] → [what it's waiting on]
- [work item] → [what it's waiting on]
```

**Rules for each section:**
- `Now`: sorted by dependency order + vision alignment. Top task is always the most critical path item.
- `Resume`: sorted by recency + blocking impact. These are things in-progress that can be picked up.
- `Open Questions`: only questions that are actively blocking something. Resolved questions are removed.
- `Blocked`: only hard blockers (dependency not yet met). Soft blockers go in Open Questions.
- Max 3 items per Now/Resume. Max 5 Open Questions. Max 3 Blocked items.

---

## Update Mechanism

### Primary writer: `task-sync` skill

Called by:
1. `session-end` — always, at every session close
2. `project-brief` — if `.tasks-dirty` flag exists at session start
3. Manually — `/task-sync` if needed mid-session

What `task-sync` reads (defined source set, no expansion):
- `docs/FEATURE-MAP.md` — feature statuses (~20 lines, the registry only)
- `docs/superpowers/plans/2026-04-04-build-roadmap.md` — unchecked task checkboxes only (~10 lines)
- `journal/` — most recent entry only (~30 lines)
- `~/.claude/plans/agile-marinating-glacier.md` — skills tracks state (~15 lines)

Total read budget: ~75 lines. Writes ~30 lines. Net context cost is minimal.

What `task-sync` does NOT read:
- `.project-session/` logs (backward-looking, journal covers the same ground)
- Feature READMEs (design detail, not task state)
- Old journal entries (only the most recent matters for current state)

### Dirty flag: `.tasks-dirty`

A zero-byte flag file at project root. Never committed (add to `.gitignore`).

**Created by** a PostToolUse hook when Write or Edit touches:
- `journal/*.md`
- `.project-session/*.md`
- `docs/FEATURE-MAP.md`
- `docs/features/*/README.md`

**Consumed by** `task-sync` — deletes it after writing `TASKS.md`.

Hook implementation: <!-- PLACEHOLDER: hook config file location and exact glob pattern -->

### Flow

```
session-end
  → calls task-sync
  → task-sync reads source set (~75 lines)
  → writes TASKS.md (~30 lines)
  → deletes .tasks-dirty if present

mid-session (file change in watched paths)
  → PostToolUse hook
  → touch .tasks-dirty

session-start (project-brief)
  → .tasks-dirty present? → call task-sync first, then read TASKS.md
  → .tasks-dirty absent?  → read TASKS.md directly
  → present Now (3) + Resume (3)
```

---

## Integration with `project-brief`

`project-brief` Step 2 (Present Session Brief) gets the task surface from TASKS.md, not from scanning sources.

Current project-brief output ends with:
```
NEXT UP (by dependency order)
1. Feature XX — why it's unblocked
```

Replace that section with the TASKS.md read:
```
TASKS
[paste Now section]
[paste Resume section]
```

<!-- PLACEHOLDER: exact insertion point in project-brief skill file -->
<!-- PLACEHOLDER: decide whether project-brief calls task-sync inline or as a separate step -->

---

## Source File Cleanup (required for architecture to hold)

For TASKS.md to be the single forward-looking document, existing files must stop containing "what's next" content:

| File | What to remove |
|---|---|
| `docs/FEATURE-MAP.md` | "Next Session" note at bottom |
| `journal/*.md` | "What's Next" sections (keep as historical record, don't add to new entries) |
| `.project-session/*.md` | "What's Next" sections (same — keep history, stop adding) |

New entries from this point forward: no "What's Next" section in journal or session logs. That content goes to `task-sync` → `TASKS.md` only.

<!-- PLACEHOLDER: cleanup task — strip existing "Next Session" from FEATURE-MAP.md -->
<!-- PLACEHOLDER: update journal README and session-end skill to remove "What's Next" from templates -->

---

## Status Vocabulary Reconciliation

Current state: `DESIGNED` is used in feature files but doesn't exist in the project-brief phase system (PLACEHOLDER → DESIGNING → HARMONY → BUILDING → DONE).

<!-- PLACEHOLDER: decide — adopt DESIGNED as an official status between HARMONY and BUILDING, or collapse to the 5-step flow. Update project-brief skill, FEATURE-MAP, and all feature READMEs to match. -->

Until resolved: `task-sync` treats DESIGNED = design complete, not yet in build phase.

---

## `task-sync` Skill

<!-- PLACEHOLDER: full skill content — see implementation plan -->

Inputs: reads 4 source files (defined above)
Output: overwrites `TASKS.md`, deletes `.tasks-dirty`
Time: writes `updated:` timestamp using `TZ=Asia/Jerusalem`
Trigger: called by session-end, project-brief (if dirty), or manually

---

## Files Created / Modified

| File | Action |
|---|---|
| `TASKS.md` | Create — persistent task manager |
| `.tasks-dirty` | Create on demand by hook — never committed |
| `.gitignore` | Add `.tasks-dirty` |
| `skills/task-sync.md` | Create — the sync skill <!-- PLACEHOLDER: location in skills dir --> |
| `project-brief` skill | Modify — read TASKS.md in Step 2 |
| `session-end` skill | Modify — call task-sync before closing |
| PostToolUse hook | Modify — add dirty flag trigger <!-- PLACEHOLDER: hook config --> |
| `docs/FEATURE-MAP.md` | Modify — remove "Next Session" note |

---

## Open Questions

- Where does the `task-sync` skill live? In the ai-org Claude Code plugin (Track 2) or as a standalone skill now? <!-- PLACEHOLDER -->
- Does `project-brief` call `task-sync` directly, or just check the dirty flag and let the user decide? <!-- PLACEHOLDER -->
- Max line budget for TASKS.md — 30 lines is the target. Hard cap or soft? <!-- PLACEHOLDER -->

---

## Out of Scope — Future Extensions

These items were captured during design but are explicitly deferred. Each is a candidate for its own design session.

### 1. Unified Product Data Management System
The tasks manager mechanism (single writer, dirty flag, token-efficient read, auto-update) is a pattern that should extend to all project state maps:
- `docs/FEATURE-MAP.md` — currently manually managed; could be auto-synced by a `feature-sync` variant
- Agent skills map (`skills-map.md`) — currently manually managed; could be auto-updated when skills are created/modified
- Tools map (not yet designed) — same pattern when F04 Tools Layer is designed
- Any future state map added to the project

The vision: one coherent `project-sync` architecture where every state document in the project has a defined writer, a dirty flag, and a token-efficient read surface. Human edits trigger the flag; the sync skill reconciles and updates. Apple-level product data management — nothing is ever manually out of sync.

**Design session needed before building.** Captures what the unified sync architecture looks like, what the shared dirty-flag pattern is, and how individual sync skills (task-sync, feature-sync, skills-sync, tools-sync) relate to a potential master `project-sync` orchestrator.

### 2. Status Vocabulary Reconciliation
The PLACEHOLDER → DESIGNING → HARMONY → BUILDING → DONE flow defined in project-brief doesn't match what FEATURE-MAP actually uses (DESIGNED is not an official status). This needs a decision + propagation to all feature READMEs and project-brief skill.

### 3. Skills Track Integration
The skills/tooling tracks (Track 1 cleanup, Track 2 plugin, Track 3 agent skills) are currently tracked in `~/.claude/plans/agile-marinating-glacier.md` — outside the project. Once Track 2 is built (ai-org as Claude Code plugin), task-sync's source set should replace that external path with an internal project file.

### 4. task-sync Source Set Evolution
Currently reads 4 fixed files. As the project grows (new plans, new maps), the source set will need to expand. Design a source registry (a config in task-sync itself) rather than hardcoding file paths, so the source set can be updated without rewriting the skill logic.
