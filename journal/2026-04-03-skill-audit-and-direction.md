# Skill Audit and Direction
Date: 2026-04-03
Type: decision

## What Happened

Ran a full audit of ai-org's skill and tools landscape before moving into Feature 01 Chat B. The goal was to understand what was installed, what was broken, and whether the skill setup was coherent with the project's identity.

The audit surfaced two critical issues immediately: the `session-end` skill — built last session — was dead because it had no `plugin.json` manifest. And the project had no `skills-map.md`, so `skill-navigator` was falling back to the generic AIOS map, which knew nothing about this project's skills.

Both were fixed. But the more important outcome was a direction decision that came out of triage.

The project was drifting toward using generic AIOS skills as a permanent foundation — `daily-brief`, `session-close`, `note`, etc. That's the wrong call. ai-org should have its own purpose-built skill set, Apple-level, designed specifically for this project's workflow. `project-brief` and `session-end` are the right model. Everything else needs to be built, not borrowed.

The second insight: the "noise" skills that seemed irrelevant (gstack web tools, `cso`, `qa`, `codex`) aren't actually noise — they're unassigned capabilities. When Feature 03 (Skills System) and Feature 04 (Tools Layer) are designed, these get mapped to specific agent roles rather than used directly.

And the bigger picture that clicked: the skill system for this project has two layers. Human workflow skills (Roi building the platform: orient, design, capture, close) and agent workflow skills (the teams operating within it: accept, execute, escalate, report). Same philosophy, different users. The project's own development is a prototype of what it's building.

## Decisions Made

- ai-org uses no generic AIOS skills — build project-specific, Apple-level versions — why: generic scaffolding doesn't reflect the product's identity or quality bar
- Skill system has two layers: human workflow + agent workflow — why: they serve different users but share the same design philosophy (clean handoffs, human in the loop at the right moments)
- "Noise" skills are unassigned capabilities, not waste — why: tools like `cso`, `qa`, `codex` belong wired into specific agent roles in Feature 03/04, not used ad-hoc

## Open Questions

- When exactly do we design the human-layer skills (`capture`, `feature-design`)? They're needed now, but Feature 03 isn't until much later in the build order.

## What's Next

Feature 01 Chat B — Profile Schema & Agent Types. Questions to answer: what does a profile persist vs reset, what's the Orchestrator's identity model vs Team Leads.
