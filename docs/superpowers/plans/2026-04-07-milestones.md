# Milestones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a formal `## Milestones` section to `docs/FEATURE-MAP.md` and wire the active milestone into TASKS.md, project-brief, and session-end so the current milestone is visible across the full session lifecycle.

**Architecture:** Three markdown file edits + two skill file updates. FEATURE-MAP.md gets the milestones table. TASKS.md "Where We Are" adopts M-number format. The project-brief and session-end skills get explicit instructions to read and display the active milestone from FEATURE-MAP.md.

**Tech Stack:** Markdown, git

---

### Task 1: Add Milestones section to FEATURE-MAP.md

**Files:**
- Modify: `docs/FEATURE-MAP.md` (between Phase Overview table and Feature Registry table)

- [ ] **Step 1: Open the file and locate the insertion point**

Read `docs/FEATURE-MAP.md`. The insertion point is the `---` separator between the Phase Overview table and the `## Feature Registry` heading. It currently looks like:

```markdown
| Phase 3 | Desktop App | Desktop — native app wrapping both layers | Future |

---

## Feature Registry
```

- [ ] **Step 2: Insert the Milestones section**

Replace that `---` separator block with the following content:

```markdown
| Phase 3 | Desktop App | Desktop — native app wrapping both layers | Future |

---

## Milestones

Each milestone is a dependency gate — the point at which a new class of capability unlocks and makes the next phase of work possible.

| # | Name | Features | Gate | Unlocks | Status |
|---|---|---|---|---|---|
| M1 | Runnable | F08 + F01 + F02 | Agents have stable identity, model routing is wired, a team can be defined with a hierarchy | Work can be dispatched to a structured team | COMPLETE |
| M2 | Executable | F07 + F09 | A workflow runs end-to-end — task decomposition, lead dispatch, sub-agent execution, HITL decision surfaced to human | The core interaction loop — the platform does something meaningful | IN PROGRESS |
| M3 | Capable | F03 + F04 + F05 | Agents have skills (reusable prompt templates), tools (MCP), and persistent memory across sessions | Agents that can do real work, not just execute workflow scaffolding | PENDING |
| M4 | Observable | F10–F13 | Web platform operational — runs visible in browser, agents configurable via UI, decision reports reviewable without terminal | Platform usable by non-technical stakeholders; multi-client operation | STUB |
| M5 | Distributable | F15 | Desktop app wraps all layers — native, offline-capable, ships as an installable | Consumer-grade distribution; first-class local experience | STUB |

---

## Feature Registry
```

- [ ] **Step 3: Commit**

```bash
git add docs/FEATURE-MAP.md
git commit -m "feat: add milestones section to FEATURE-MAP.md — 5 dependency gates across 3 phases"
```

---

### Task 2: Update TASKS.md active milestone format

**Files:**
- Modify: `TASKS.md` (Where We Are section)

- [ ] **Step 1: Update the milestone reference**

In `TASKS.md`, the "Where We Are" section currently reads:
```
Phase 1 · Build · Milestone 1 (/admin)
```

Replace with the M-number + name format derived from FEATURE-MAP.md:
```
Phase 1 · Build · M2 · Executable
```

The full updated "Where We Are" block:
```markdown
## Where We Are
Phase 1 · Build · M2 · Executable
Design: 5 of 10 features locked (F08, F01, F02, F03, F07). Spec reviewed and patched (8 gaps fixed).
Build: F01, F02, F03, F07 complete and merged. 75 tests passing.
Active: F09 HITL Reporting — next design target.
```

- [ ] **Step 2: Commit**

```bash
git add TASKS.md
git commit -m "chore: adopt M-number milestone format in TASKS.md"
```

---

### Task 3: Update project-brief skill to read active milestone from FEATURE-MAP.md

**Files:**
- Modify: `/home/roking/.claude/skills/project-brief/SKILL.md`

- [ ] **Step 1: Update Step 2 — Read Current State**

The current Step 2 reads:
```markdown
## Step 2 — Read Current State

Read these files in order:
1. `TASKS.md` — current bottlenecks, priorities, open questions
2. `docs/FEATURE-MAP.md` — build order and feature status
3. Most recent file in `journal/` (by date prefix) — what happened last session
```

Replace with:
```markdown
## Step 2 — Read Current State

Read these files in order:
1. `TASKS.md` — current bottlenecks, priorities, open questions
2. `docs/FEATURE-MAP.md` — build order, feature status, and active milestone (read the `## Milestones` table; the active milestone is the highest IN PROGRESS entry, or the lowest PENDING entry if none are in progress)
3. Most recent file in `journal/` (by date prefix) — what happened last session
```

- [ ] **Step 2: Update Step 3 — Where We Are**

The current "Where We Are" bullet reads:
```markdown
- Phase + milestone (e.g. "Phase 1 · Milestone 1 · /admin")
```

Replace with:
```markdown
- Phase + active milestone from FEATURE-MAP.md Milestones table (format: "Phase 1 · M2 · Executable")
```

- [ ] **Step 3: Commit**

```bash
git add /home/roking/.claude/skills/project-brief/SKILL.md
git commit -m "feat(skills): project-brief reads active milestone from FEATURE-MAP.md"
```

---

### Task 4: Update session-end skill to include active milestone in handoff

**Files:**
- Modify: `/home/roking/.claude/skills/session-end/SKILL.md`

- [ ] **Step 1: Update the handoff prompt template**

The current handoff template in Step 4 reads:
```markdown
State: {current phase/milestone}
```

Replace with:
```markdown
State: {active milestone from FEATURE-MAP.md Milestones table, format: "Phase 1 · M2 · Executable (IN PROGRESS)"}
```

Also add a note before the handoff template block:
```markdown
Read the active milestone from the `## Milestones` table in `docs/FEATURE-MAP.md`
before writing the handoff. Active = highest IN PROGRESS entry, or lowest PENDING
entry if none are in progress.
```

- [ ] **Step 2: Commit**

```bash
git add /home/roking/.claude/skills/session-end/SKILL.md
git commit -m "feat(skills): session-end includes active milestone in handoff prompt"
```
