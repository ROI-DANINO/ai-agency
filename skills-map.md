---
name: skills-map
description: >
  Skill index for ai-org. Used by skill-navigator to route invocations.
  All skills here are purpose-built for this project — not generic AIOS skills.
  Rule: every skill in skills/ must appear here. skill-scan enforces this.
type: reference
user-invocable: false
---

# Skills Map — ai-org

> This project has its own purpose-built skill set.
> Workflow: Orient → Design → Harmony → Build, one feature at a time.
> Do not use generic AIOS skills (daily-brief, session-close, note, dev-audit, etc.).

---

## Human Skills (user-invocable — appear in / menu)

| Skill | Path | Triggers | What it does | Status |
|-------|------|----------|--------------|--------|
| `project-brief` | `skills/human/project-brief/` | start session, orient me, project brief, what are we working on, session start, /project-brief | Syncs tasks, reads project state, presents status brief, shows phase workflow | active |
| `session-end` | `skills/human/session-end/` | end session, wrap up, close session, I'm done, handoff, session end, /session-end | Writes journal entry, runs task-sync, produces handoff prompt | active |
| `task-sync` | `skills/human/task-sync/` | task sync, update tasks, sync tasks, /task-sync | Reads 4 project sources, writes TASKS.md, clears dirty flag | active |
| `skill-scan` | `skills/human/skill-scan/` | skill scan, audit skills, what skills are broken, skill audit, /skill-scan | Full skill audit — finds issues, writes report to data/ | active |
| `feature-design` | `skills/human/feature-design/` | feature design, design feature, design session, /feature-design | Focused design session for a feature phase | stub |
| `capture` | `skills/human/capture/` | capture, note this, save this, remember this, /capture | Mid-session decision/question capture | stub |

---

## Agent Skills (internal — invoked by skills or agents, not humans)

| Skill | Path | What it does | Status |
|-------|------|--------------|--------|
| `briefing-pack` | `skills/agent/briefing-pack/` | Builds context pack for an agent before a task | stub |
| `handoff` | `skills/agent/handoff/` | Writes handoff artifact when work transfers between agents | stub |
| `decision-report` | `skills/agent/decision-report/` | Structures HITL decision surface for human approval gate | stub |

---

## Archive

Skills moved here are retired. Never deleted — moved to `skills/archive/`.

| Skill | Archived | Reason |
|-------|----------|--------|
| _(none yet)_ | — | — |

---

## Skills to Build

| Skill | Inspiration | Purpose | When |
|-------|-------------|---------|------|
| `briefing-pack` (full) | F03 design | Full agent context packaging with Mem0 | F03 + F05 build |
| `handoff` (full) | F02 team structure | Agent-to-agent work transfer | F03 build |
| `decision-report` (full) | F09 HITL | Human approval gate surface | F09 build |
| `feature-design` (full) | project-brief Design phase | Structured feature design sessions | F03 build |
| `capture` (full) | AIOS `note` | Mid-session project-aware capture | F03 build |
