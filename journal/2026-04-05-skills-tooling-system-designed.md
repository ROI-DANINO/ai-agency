# Skills & Tooling System: Direction Locked
Date: 2026-04-05
Type: decision

## What Happened
The `/` menu mess finally got addressed — not by cleaning it, but by stepping back and understanding why it's messy. The session started as "I want to clean up my skills" and ended with a three-track plan for rebuilding the entire skills/tooling system from scratch, with this project as the source of truth.

The key insight that emerged: there are two fundamentally different kinds of skills being confused. Skills for Roi (human ops — session management, project workflow, design process) and skills for the agents inside the platform (what they use at runtime). Mixing them has been the root cause of the clutter.

## Decisions Made
- **Three-track approach adopted** — Track 1: clean the immediate mess. Track 2: design ai-org as an installable Claude Code plugin. Track 3: design agent skills architecture as a product concern. Each track gets its own design-think-build cycle before anything is touched.
- **Architecture split locked (tentative)** — Human ops skills live as a Claude Code plugin sourced from this repo. Agent skills live inside the product codebase, loaded by the orchestrator at runtime — not in `~/.claude/`.
- **This project is the source of truth** — any machine, any session, installs from here.

## Open Questions
- What exactly belongs in the human ops plugin vs what stays global (superpowers, context7, etc.)?
- How do the agent skills in Track 3 relate to Feature 03 (Skills) and Feature 04 (Tools) in the roadmap?
- What does "archive current setup" mean precisely — snapshot and disable, or fully remove?

## What's Next
Track 1 is queued with a handoff prompt. Fresh chat picks it up: design the cleanup/archive approach, decide what stays and what goes, then apply. The plan is saved at `~/.claude/plans/agile-marinating-glacier.md`.
