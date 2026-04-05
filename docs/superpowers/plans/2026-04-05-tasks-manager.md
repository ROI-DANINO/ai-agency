# Tasks Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the TASKS.md task manager — a persistent, token-efficient, self-updating project state file maintained by a `task-sync` skill, with dirty-flag auto-updates and integration into `project-brief` and `session-end`.

**Architecture:** `session-end` is the primary writer — it calls `task-sync` after every session close. A PostToolUse hook marks `.tasks-dirty` when key project files change. `project-brief` reads `TASKS.md` directly (30 lines) at session start; if dirty, re-derives first. All "what's next" content moves out of journal, session logs, and FEATURE-MAP into TASKS.md exclusively.

**Tech Stack:** Markdown skill files (AIOS plugin pattern), Bash hook script, Claude Code PostToolUse hooks, `TZ=Asia/Jerusalem` for timestamps.

**Spec:** `docs/superpowers/specs/2026-04-05-tasks-manager-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `TASKS.md` | Create | Persistent task surface — single forward-looking document |
| `.tasks-dirty` | Create on demand | Dirty flag — zero-byte, never committed |
| `.gitignore` | Modify | Exclude `.tasks-dirty` |
| `/home/roking/.claude/aios-plugins/plugins/task-sync/skills/task-sync/SKILL.md` | Create | task-sync skill — the only writer of TASKS.md |
| `skills-map.md` | Modify | Register task-sync in project skill registry |
| `.claude/settings.local.json` | Modify | Add PostToolUse dirty flag hook |
| `/home/roking/.claude/aios-plugins/plugins/session-end/skills/session-end/SKILL.md` | Modify | Add task-sync call; remove "What's Next" from journal template |
| `/home/roking/.claude/aios-plugins/plugins/project-brief/skills/project-brief/SKILL.md` | Modify | Check dirty flag; read TASKS.md for task surface; replace NEXT UP |
| `docs/FEATURE-MAP.md` | Modify | Fix F02 status (PLACEHOLDER → DESIGNED); remove stale "Next Session" note |
| `docs/features/01-agent-identity/README.md` | Modify | Fix header status (PLACEHOLDER → BUILDING) |

---

## Task 1: Create task-sync skill

**Files:**
- Create: `/home/roking/.claude/aios-plugins/plugins/task-sync/skills/task-sync/SKILL.md`

- [ ] **Step 1: Create plugin directory structure**

```bash
mkdir -p /home/roking/.claude/aios-plugins/plugins/task-sync/skills/task-sync
```

- [ ] **Step 2: Write the skill file**

Write `/home/roking/.claude/aios-plugins/plugins/task-sync/skills/task-sync/SKILL.md`:

```markdown
---
name: task-sync
description: Updates TASKS.md from current project state. Reads FEATURE-MAP, master plan checkboxes, most recent journal entry, and skills tracks plan. Writes the single forward-looking task file. Called by session-end always, by project-brief if .tasks-dirty exists, or manually via /task-sync.
---

# task-sync

Update TASKS.md from current project state. This is the only writer of TASKS.md.

---

## Step 1 — Get current project root

Run: `git rev-parse --show-toplevel`

Store as PROJECT_ROOT. All file paths below are relative to it.

---

## Step 2 — Read sources in parallel

Read all four simultaneously:

1. `docs/FEATURE-MAP.md` — lines 19–36 only (the feature registry table, skip everything else)
2. `docs/superpowers/plans/2026-04-04-build-roadmap.md` — scan for all `- [ ]` unchecked lines only (skip checked lines and prose)
3. `journal/README.md` — get the filename of the first (most recent) entry, then read that file in full
4. `~/.claude/plans/agile-marinating-glacier.md` — full file (skills tracks current state)

Do not read any other files. This is the complete source set.

---

## Step 3 — Derive project state

From what you read, determine each of the following:

**Where We Are (4 lines):**
- Line 1: `Phase [N] · [current activity] · Milestone [N] ([milestone name])`
  - Phase = 1 until all Phase 1 features are DONE
  - Current activity = "Design" if any Phase 1 feature is DESIGNING/HARMONY, "Design → Build" if some are BUILDING, "Build" if all designed
  - Milestone = current Phase 1 milestone (1 = /admin, 2 = /op, 3 = /[lead])
- Line 2: `Design: [X] of 10 sessions done ([list of ✓ features])`
  - Count: each DESIGNED/HARMONY/BUILDING/DONE Phase 1 feature = 1 session done (F03 and F05 each count for 2)
- Line 3: `Build: [status]`
  - "not started" if no Phase 1 features are DONE
  - "Milestone 1 in progress" if some M1 features built but not all
  - "Milestone N complete" if all features in that milestone are DONE
- Line 4: `Bottleneck: [one sentence — the single thing blocking the critical path right now]`

**Now — 3 tasks:**
Candidate pool: unchecked tasks from master plan + any stale file states (wrong status in README or FEATURE-MAP) + any open questions blocking design work.
Sort by:
1. Dependency order (tasks that unblock others first)
2. Vision alignment (Apple-level = no stale states, no orphaned work, no skipped prereqs)

Pick top 3. Format: `[task] — [why it's right now, one line]`

**Resume — 3 suggestions:**
In-progress work that was started but paused (has a plan file, session log, or open questions but no completion). Sort by recency + blocking impact. Format: `[work] — [where it left off, one line]`

**Open Questions:**
Only questions that are actively blocking a design or build decision right now. Maximum 5.
Format: `- [question]: [what it blocks]`

**Blocked:**
Hard dependencies not yet met. Maximum 3.
Format: `- [work item] → [waiting on what]`

---

## Step 4 — Get Israel timestamp

Run: `TZ=Asia/Jerusalem date +"%Y-%m-%d · %H:%M"`

Store the output.

---

## Step 5 — Write TASKS.md

Write `TASKS.md` at project root. Total line count must stay under 35. Use the exact format below — no extra prose, no section headers beyond what's shown:

```
---
updated: [timestamp from Step 4]
---

# Tasks

## Where We Are
[4 lines from Step 3]

## Now
1. [task] — [why]
2. [task] — [why]
3. [task] — [why]

## Resume
1. [work] — [where it left off]
2. [work] — [where it left off]
3. [work] — [where it left off]

## Open Questions
- [question]: [what it blocks]

## Blocked
- [work item] → [waiting on what]
```

Omit "Open Questions" section if there are none. Omit "Blocked" section if there are none.

---

## Step 6 — Clean dirty flag

Run:
```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
rm -f "$PROJECT_ROOT/.tasks-dirty"
```
```

- [ ] **Step 3: Verify the file was created**

```bash
ls -la /home/roking/.claude/aios-plugins/plugins/task-sync/skills/task-sync/SKILL.md
```

Expected: file exists, non-zero size.

- [ ] **Step 4: Commit**

```bash
cd /home/roking/Desktop/Projects/ai-org
git add /home/roking/.claude/aios-plugins/plugins/task-sync/skills/task-sync/SKILL.md
git commit -m "feat: add task-sync skill — TASKS.md writer"
```

---

## Task 2: Bootstrap TASKS.md with current project state

**Files:**
- Create: `TASKS.md` at project root

- [ ] **Step 1: Invoke task-sync to generate the initial file**

Invoke the `task-sync` skill now. It will read the 4 sources and write `TASKS.md` with the current project state.

- [ ] **Step 2: Verify output**

Read `TASKS.md`. Confirm:
- Line count is ≤ 35
- `updated:` timestamp is in Israel time
- All 5 sections present (Where We Are, Now, Resume, Open Questions, Blocked)
- Now task 1 is "Fix stale statuses" (F01 README + F02 FEATURE-MAP — both wrong right now)

- [ ] **Step 3: Commit**

```bash
git add TASKS.md
git commit -m "feat: bootstrap TASKS.md — initial project task state"
```

---

## Task 3: Register task-sync in skills-map.md

**Files:**
- Modify: `skills-map.md`

- [ ] **Step 1: Read current skills-map.md**

Read `skills-map.md`. Locate the "Skills to Build" table at the bottom.

- [ ] **Step 2: Add task-sync to the Session Start table and remove from Skills to Build**

In the `## Session Start` table, add a new row:

```markdown
| `task-sync` | task sync, update tasks, sync tasks, /task-sync | Reads 4 project sources, writes TASKS.md, cleans dirty flag. Called by session-end and project-brief. |
```

In the `## Skills to Build` table, add a row marking it as created:

```markdown
| `task-sync` | tasks-manager design spec | Syncs TASKS.md — ✓ created |
```

- [ ] **Step 3: Commit**

```bash
git add skills-map.md
git commit -m "feat: register task-sync in skills-map"
```

---

## Task 4: Add dirty flag PostToolUse hook

**Files:**
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: Read current settings.local.json**

Read `/home/roking/Desktop/Projects/ai-org/.claude/settings.local.json`. Current content:

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)"
    ]
  }
}
```

- [ ] **Step 2: Write updated settings with hook added**

Write `/home/roking/Desktop/Projects/ai-org/.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git add:*)",
      "Bash(git commit:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'changed=$(echo \"${CLAUDE_TOOL_INPUT:-}\" | grep -o '\"'\"'\"file_path\":\"[^\"]*\"'\"'\"' | head -1 | cut -d'\"'\"'\"' -f4 2>/dev/null || true); case \"$changed\" in */journal/*.md|*/.project-session/*.md|*/docs/FEATURE-MAP.md|*/docs/features/*/README.md) touch /home/roking/Desktop/Projects/ai-org/.tasks-dirty ;; esac'"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Verify the hook fires**

Run this to simulate: edit `docs/FEATURE-MAP.md` (add a space and remove it), then check:

```bash
ls -la /home/roking/Desktop/Projects/ai-org/.tasks-dirty 2>/dev/null && echo "dirty flag created" || echo "no dirty flag"
```

Expected: `dirty flag created`

Clean up:

```bash
rm -f /home/roking/Desktop/Projects/ai-org/.tasks-dirty
```

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.local.json
git commit -m "feat: add PostToolUse dirty flag hook for TASKS.md auto-update"
```

---

## Task 5: Update .gitignore

**Files:**
- Modify: `.gitignore` (create if not present)

- [ ] **Step 1: Check if .gitignore exists**

```bash
cat /home/roking/Desktop/Projects/ai-org/.gitignore 2>/dev/null || echo "does not exist"
```

- [ ] **Step 2: Add .tasks-dirty**

If `.gitignore` exists, append:
```
.tasks-dirty
```

If it doesn't exist, create it with:
```
.tasks-dirty
```

- [ ] **Step 3: Verify**

```bash
git check-ignore -v /home/roking/Desktop/Projects/ai-org/.tasks-dirty
```

Expected: `.gitignore:.tasks-dirty`

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .tasks-dirty flag file"
```

---

## Task 6: Modify session-end skill

**Files:**
- Modify: `/home/roking/.claude/aios-plugins/plugins/session-end/skills/session-end/SKILL.md`

Two changes: (1) add task-sync invocation as new Step 6, (2) remove "## What's Next" from journal template, (3) renumber handoff to Step 7.

- [ ] **Step 1: Add task-sync step before handoff**

Find the line in the file:

```
## Step 6 — Output Fresh Chat Handoff Prompt
```

Insert a new step before it:

```markdown
## Step 6 — Sync TASKS.md

Invoke the `task-sync` skill now. This updates TASKS.md with the current project state before the session closes.

Do not skip this step, even for exploratory sessions. TASKS.md must always reflect the latest state.

---

```

Then change the heading of the handoff step from `## Step 6` to `## Step 7`.

- [ ] **Step 2: Remove "## What's Next" from journal template**

Find in the journal entry format block:

```
    ## What's Next
    [One paragraph — what's unblocked, what to pick up next session]
```

Remove those two lines entirely. The journal is now backward-looking only — forward-looking content lives in TASKS.md via task-sync.

- [ ] **Step 3: Remove "Next up" from handoff template**

Find in the handoff prompt template:

```
- Next up: Feature [XX] — [why it's next]
```

Remove that line. The next-up context comes from TASKS.md, not the handoff prompt.

- [ ] **Step 4: Verify the file looks right**

Read the modified skill file. Confirm:
- Steps are numbered 1–7
- Step 6 is "Sync TASKS.md — invoke task-sync"
- Step 7 is "Output Fresh Chat Handoff Prompt"
- No "## What's Next" in the journal template
- No "Next up:" in the handoff template

- [ ] **Step 5: Commit**

```bash
git add /home/roking/.claude/aios-plugins/plugins/session-end/skills/session-end/SKILL.md
git commit -m "feat: session-end now calls task-sync before handoff"
```

---

## Task 7: Modify project-brief skill

**Files:**
- Modify: `/home/roking/.claude/aios-plugins/plugins/project-brief/skills/project-brief/SKILL.md`

Two changes: (1) add dirty flag check + task-sync invocation at the start of Step 1, (2) replace "NEXT UP" section in the brief output with TASKS.md Now + Resume.

- [ ] **Step 1: Add dirty flag check to Step 1**

Find:

```markdown
## Step 1 — Read Project State

Read these files in parallel:
- `docs/VISION.md`
- `docs/FEATURE-MAP.md`
- The three most recent files in `.project-session/` (sort by filename date)
```

Replace with:

```markdown
## Step 1 — Read Project State

First, check for dirty flag:
```bash
ls $(git rev-parse --show-toplevel)/.tasks-dirty 2>/dev/null && echo "dirty" || echo "clean"
```
If "dirty": invoke `task-sync` skill before reading anything else.

Then read these files in parallel:
- `docs/VISION.md`
- `docs/FEATURE-MAP.md`
- `TASKS.md` — the current task surface (replaces .project-session/ scan)
```

- [ ] **Step 2: Replace NEXT UP section in brief output**

Find in the Step 2 brief template:

```
NEXT UP (by dependency order)
1. Feature [XX] — [why it's unblocked and ready]
2. Feature [XX] — [why it's next]
```

Replace with:

```
TASKS — NOW
[Now section from TASKS.md — paste the 3 lines as-is]

TASKS — RESUME
[Resume section from TASKS.md — paste the 3 lines as-is]
```

- [ ] **Step 3: Verify the file looks right**

Read the modified skill. Confirm:
- Step 1 starts with the dirty flag check
- Step 1 reads TASKS.md (not .project-session/)
- Step 2 brief template shows "TASKS — NOW" and "TASKS — RESUME" sections
- No "NEXT UP" section remains

- [ ] **Step 4: Commit**

```bash
git add /home/roking/.claude/aios-plugins/plugins/project-brief/skills/project-brief/SKILL.md
git commit -m "feat: project-brief reads TASKS.md for task surface"
```

---

## Task 8: Source file cleanup

**Files:**
- Modify: `docs/FEATURE-MAP.md`
- Modify: `docs/features/01-agent-identity/README.md`

- [ ] **Step 1: Fix F02 status in FEATURE-MAP.md**

Find:
```
| 02 | [Team Structure & Hierarchy](features/02-team-structure/README.md) | 1 | CLI | Critical | 01 | PLACEHOLDER |
```

Replace with:
```
| 02 | [Team Structure & Hierarchy](features/02-team-structure/README.md) | 1 | CLI | Critical | 01 | DESIGNED |
```

- [ ] **Step 2: Remove stale "Next Session" note from FEATURE-MAP.md**

Find and remove this entire block at the bottom of FEATURE-MAP.md:

```markdown
## Next Session

Feature 01 complete (BUILDING). Task 3: Feature 03 Skeleton Design — session-start, session-end, handoff writer, briefing pack reader skills for Milestone 1.
Key context: session-start replaces project-brief + daily-brief; session-end confirmed on-point.
Read: `features/03-skills-system/README.md`, `features/01-agent-identity/README.md`, `.project-session/2026-04-04-session-close.md`
```

TASKS.md owns this content now.

- [ ] **Step 3: Fix F01 README header**

In `docs/features/01-agent-identity/README.md`, find line 3:

```
**Status:** PLACEHOLDER  
```

Replace with:

```
**Status:** BUILDING  
```

- [ ] **Step 4: Commit**

```bash
git add docs/FEATURE-MAP.md docs/features/01-agent-identity/README.md
git commit -m "fix: sync stale feature statuses — F01 BUILDING, F02 DESIGNED, remove stale Next Session note"
```

---

## Task 9: End-to-end verification

No files modified — verification only.

- [ ] **Step 1: Run a session-end to verify full write flow**

Invoke `/session-end`. Confirm:
- It invokes task-sync as Step 6
- `TASKS.md` is updated (check `updated:` timestamp changed)
- `.tasks-dirty` does not exist after task-sync completes

- [ ] **Step 2: Trigger dirty flag via a file write**

Make a trivial edit to `journal/README.md` (add a blank line), save, then undo. Check:

```bash
ls /home/roking/Desktop/Projects/ai-org/.tasks-dirty && echo "hook fired" || echo "hook did not fire"
```

Expected: `hook fired`

- [ ] **Step 3: Run project-brief to verify dirty path**

With `.tasks-dirty` present, invoke `/project-brief`. Confirm:
- It detects the dirty flag
- It invokes task-sync before reading TASKS.md
- The brief output shows "TASKS — NOW" and "TASKS — RESUME" sections
- `.tasks-dirty` is gone after

- [ ] **Step 4: Run project-brief clean path**

With no `.tasks-dirty`, invoke `/project-brief` again. Confirm:
- No task-sync invocation (reads TASKS.md directly)
- Same task surface shown

- [ ] **Step 5: Verify TASKS.md stays under 35 lines**

```bash
wc -l /home/roking/Desktop/Projects/ai-org/TASKS.md
```

Expected: ≤ 35

- [ ] **Step 6: Final commit**

```bash
git add TASKS.md
git commit -m "feat: tasks manager complete — TASKS.md + task-sync + dirty flag + skill integrations"
```
