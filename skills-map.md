---
name: skills-map
description: >
  Skill index for ai-org. Used by skill-navigator to route invocations.
  All skills here are purpose-built for this project — not generic AIOS skills.
type: reference
user-invocable: false
---

# Skills Map — ai-org

> This project has its own purpose-built skill set.
> Workflow: Orient → Design → Harmony → Build, one feature at a time.
> Do not use generic AIOS skills (daily-brief, session-close, note, dev-audit, etc.).

---

## Session Start

| Skill | Triggers | What it does |
|-------|----------|--------------|
| `project-brief` | start session, orient me, project brief, what are we working on, session start | Reads project state, presents status brief, runs phase workflow |
| `task-sync` | task sync, update tasks, sync tasks, /task-sync | Reads 4 project sources, writes TASKS.md, cleans dirty flag. Called by session-end and project-brief. |

---

## Session Close

| Skill | Triggers | What it does |
|-------|----------|--------------|
| `session-end` | end session, wrap up, close session, I'm done, handoff, session end | Writes journal entry (if meaningful), local session log, handoff prompt |

---

## Skill Maintenance

| Skill | Triggers | What it does |
|-------|----------|--------------|
| `skill-scan` | skill scan, audit skills, what skills are broken, skill audit | Full skill audit — finds issues, writes report to data/ |

---

## Skills to Build (not yet created)

| Skill | Inspiration From | Purpose |
|-------|-----------------|---------|
| `task-sync` | tasks-manager design spec | Syncs TASKS.md — ✓ created |
| `feature-design` | project-brief Design phase | Run a focused design session for a specific feature phase |
| `capture` | AIOS `note` | Mid-session decision/question capture, project-aware |
| `context7` | context7 plugin | Library docs lookup (already installed, keep as-is) |
