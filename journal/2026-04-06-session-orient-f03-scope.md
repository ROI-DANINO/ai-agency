# Session Orientation — F03 Scope Clarified
Date: 2026-04-06
Type: decision

## What Happened

Short orientation session. Ran project-brief, then went back and read all journal files and session docs from 2026-04-06 that the initial brief had skipped. This surfaced two things that were missing from TASKS.md.

First: the F03 scope in TASKS.md only described the skill file structure side (frontmatter schema, injection mechanism, chaining model), but the track1-audit journal described F03 Skeleton Design as also defining the artifact formats — briefing-pack, handoff, decision-report. These are two sides of the same design: one governs how skills are structured, the other governs what they produce. Both need to be locked in the same design session.

Second: the open question "should superpowers be fully removed or reset to default?" was clarified. The answer is defer — superpowers skills are still in use until F03 defines the replacement patterns, and F03 will answer the architecture question anyway. Not urgent.

## Decisions Made

- **Superpowers reset deferred to F03** — why: still in active use; F03 will define the right answer for skill architecture
- **F03 scope expanded** — why: journals showed skill structure and artifact formats are one design session, not two; both must be locked before F01 build plan can be written

## Open Questions

- None new. Superpowers question closed (deferred).

## What's Next

F03 Skeleton Design — run brainstorming skill covering both:
1. Skill file format (frontmatter schema, injection, chaining)
2. Artifact formats (briefing-pack, handoff, decision-report)

Read `docs/features/03-skills-system/README.md` and `docs/research/forks-and-oss.md` (impeccable + agency-agents sections) before starting.
