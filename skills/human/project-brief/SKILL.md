---
name: project-brief
description: >
  Session start skill for the ai-org project. Orients to current project state,
  presents a status brief, and guides the design-think-build phase workflow.
  Triggers on: "start session", "orient me", "project brief", "what are we working on",
  "session start", "/project-brief"
type: human
user-invocable: true
calls: task-sync
---

# Project Brief — Session Start

You are starting a new session on the **ai-org** project — an AI Agency Platform for
orchestrating persistent teams of AI agents with the human in control of every
meaningful decision.

## Step 1 — Sync Tasks

Before presenting the brief, run `task-sync` to ensure TASKS.md is current:
- Read `TASKS.md`
- If `.tasks-dirty` exists at repo root, run the full task-sync process first

## Step 2 — Read Current State

Read these files in order:
1. `TASKS.md` — current bottlenecks, priorities, open questions
2. `docs/FEATURE-MAP.md` — build order, feature status, and active milestone (read the `## Milestones` table; the active milestone is the highest IN PROGRESS entry, or the lowest PENDING entry if none are in progress)
3. `journal/HANDOFF.md` (if it exists) — structured handoff from the last session: what happened, current state, what's next, key files
4. All journal files from the last 3 days (by date prefix, excluding HANDOFF.md) — captures parallel session work that may not be in HANDOFF.md

## Step 2b — Load Prerequisites

If `journal/HANDOFF.md` has a `Prerequisites` section:
- Read every file listed there before presenting the brief
- Surface them explicitly in the brief: "Required reading this session: X — {why}"
- These are mandatory, not optional context

## Step 3 — Present the Brief

Present a concise brief with exactly these sections:

### Where We Are
- Phase + active milestone from FEATURE-MAP.md Milestones table (format: "Phase 1 · M2 · Executable")
- Design progress: N of 10 sessions done, which features locked
- Build progress: what's built, what's next
- Active tracks (e.g. Track 2 in progress)

### Now
The top 1–3 items from TASKS.md `## Now` section, with context on why they matter.

### Open Questions
Any unresolved decisions from TASKS.md that affect the current work direction.

### Suggested Start
One concrete recommendation for where to begin this session, based on the
current state. Be specific — name the task, the file to open, the decision to make.

## Step 4 — Phase Workflow Reminder

After the brief, show the current phase workflow:

```
Design-Think-Build Method
─────────────────────────
Orient → Design → Harmony → Build
         ↑ you are here (if design phase)
```

State which phase each active feature is in.

## Tone

Direct. No filler. The human knows the project — give them signal, not ceremony.
Max 300 words for the brief. If asked for more detail, go deeper on the specific item.
