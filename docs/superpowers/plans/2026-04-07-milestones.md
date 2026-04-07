# Milestones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a formal `## Milestones` section to `docs/FEATURE-MAP.md` that defines five dependency-gate milestones across all three platform phases.

**Architecture:** Single markdown edit — insert the Milestones section between the Phase Overview table and the Feature Registry table in `docs/FEATURE-MAP.md`. No code changes required.

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
