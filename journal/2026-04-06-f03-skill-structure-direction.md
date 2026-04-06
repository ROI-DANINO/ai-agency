# F03 Skill Structure — Direction Locked
Date: 2026-04-06
Type: decision

## What Happened

Session opened with a question about the most natural next task. While navigating the options, a conceptual question surfaced: since ai-org Phase 1 is delivered as a Claude Code plugin, and superpowers is also a Claude Code plugin — are they the same thing? Should ai-org extend or reuse superpowers?

Clarified using the project docs that there are two distinct skill surfaces: Surface A (session skills for human+Claude workflow — project-brief, session-end, etc.) and Surface B (F03 agent skills — SOPs injected into agent system prompts). The mechanism is identical (markdown + YAML frontmatter) but the audiences are different. F03 is "superpowers for agents," not an extension of superpowers itself.

From there, narrowed to the most natural starting point within F03: skill structure (file format, injection, chaining) vs. skill navigator (routing logic). Decided skill structure is the right first design target — the navigator has nothing to route until the format is locked. Structure is also the seam that connects F03 to F01 and F02.

## Decisions Made

- **Two skill surfaces are distinct** — why: session skills guide human workflow; agent skills guide agent behavior. Same mechanism, different audiences. Not the same feature.
- **F03 Skill Structure Design is the next task** — why: it's the skeleton that unblocks the build sequence; navigator and DB questions can follow once the format is locked.
- **Flat markdown files for Phase 1, defer DB to Phase 2** — why: consistent with existing aios pattern, avoids premature infrastructure.
- **Superpowers cleanup deferred to next session** — why: faster task, less interesting; not blocking anything critical.

## Open Questions

- Should superpowers be fully removed from Claude Code, or reset to default?

## What's Next

Fresh session: run brainstorming skill on F03 Skill Structure Design. Lock frontmatter schema, injection mechanism, and chaining model. Write spec to `docs/features/03-skills-system/`.
