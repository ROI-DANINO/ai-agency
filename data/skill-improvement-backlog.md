# Skill Improvement Backlog

## Cleanup tasks

- [ ] `session-end` — ~~Create `.claude-plugin/plugin.json`~~ DONE (2026-04-03)
- [ ] `CLAUDE.md` — Update skill guidance: reference `session-end`, `skill-scan`, point to `skills-map.md`; note that generic AIOS skills are not used here

## Wiring tasks

- [ ] `session-close` vs `session-end` — Note in CLAUDE.md that `session-end` is the project skill; `session-close` (AIOS generic) should not be used

## Design tasks (human-layer skill system)

> These are the skills Roi uses to build the platform. Prototype now — every session depends on them.

- [ ] `capture` — Mid-session decision/question/blocker capture. Inspired by AIOS `note` but aware of the project's phase structure (feature, phase, type of capture). Writes to `.project-session/` or `data/notes.md`.
- [ ] `feature-design` — Run a focused design session for a specific feature phase (Design, Harmony, or Build). Extracted from the embedded phase logic in `project-brief`. Triggered mid-session when working a specific phase rather than at session start.

## Design tasks (agent-layer skill system)

> These are the skills the agentic teams will use once the platform runs. Design alongside Feature 03 (Skills System) — not before.

- [ ] `task-accept` — Agent skill: receive a task assignment, confirm scope, ask clarifying questions before starting
- [ ] `task-report` — Agent skill: structured task completion report to the Lead or Orchestrator
- [ ] `decision-escalate` — Agent skill: surface a decision that requires human input, with context + options
- [ ] `agent-brief` — Agent skill: session-start orientation for a persistent Lead agent (load memory, check active tasks, confirm tier)

## Tools to integrate / improve

- [ ] `claude-md-improver` — installed globally. Use now to improve ai-org's CLAUDE.md. When designing Feature 03/04: this is the reference model for a CLAUDE.md management agent — build a project-aware version that understands the design-think-build methodology, skill maps, and feature phase workflow (not just build commands and env vars).

## Research tasks

- [ ] `skills-map.md` — As new skills are built, keep this file current; it's the skill-navigator's source of truth for this project
