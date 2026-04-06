# F03 Skills System — Design Locked
Date: 2026-04-06
Type: decision

## What Happened

Resumed the F03 Skeleton Design after reading the two prerequisite repos. Cloned oh-my-pi (can1357) and BMAD-METHOD (bmad-code-org) and extracted the relevant patterns. Also confirmed superpowers is from `anthropics/claude-plugins-official` (v5.0.7, already installed).

oh-my-pi's TTSR (Time-Travel Stream Rewriting) pattern: rules that inject lazily into context only when a regex condition triggers mid-session. Three buckets: always-apply, rulebook (listed by name+description, content fetched on demand via `rule://`), and TTSR (trigger-based). The on-demand loading protocol (`rule://name`) was the key insight — skills don't all pre-load, they're fetched when needed. Adapted as `skill://name` in our design.

BMAD-METHOD's step-file architecture: complex skills are split into numbered step files loaded just-in-time. Only the current step is in context. State tracked via `stepsCompleted` frontmatter in the output artifact. This directly solves the token efficiency problem for complex multi-step skills.

After seeing both patterns, the F03 design was updated with three additions: (1) optional multi-step architecture via `multi-step: true` frontmatter + `workflow.md` + `steps/` directory, (2) `skill://` on-demand loading protocol, and (3) explicit HALT condition format for step files. TTSR-style trigger injection was deferred to Phase 2.

A key design refinement happened mid-session: the initial approach (A) had SKILL.md as entry point only with a ≤500 token soft rule. After pushback, a structural solution was adopted — SKILL.md for multi-step skills is frontmatter only, with procedure physically separated into `workflow.md`. The presence of `workflow.md` in the directory is the signal for complexity. Structure enforces the constraint rather than a rule.

## Decisions Made

- **Step-file architecture adopted** — why: token efficiency is a design constraint; step files solve it structurally, not with arbitrary limits
- **workflow.md separation required for multi-step skills** — why: structural enforcement is better than rule-based; SKILL.md cannot grow because it has nowhere to put procedure
- **skill:// on-demand loading protocol** — why: system prompt lists descriptions only, full content fetched lazily; mirrors oh-my-pi's rulebook/rule:// pattern
- **TTSR-style trigger injection deferred** — why: adds meaningful complexity for Phase 1; behavior skills cover the always-on case
- **Superpowers source identified** — why: anthropics/claude-plugins-official, already installed locally at v5.0.7
- **F03 DESIGN.md locked** — why: all open questions resolved; multi-step and skill:// additions complete the spec

## Open Questions

- None. F03 design is fully locked.

## What's Next

F01 Build Plan — write the implementation plan for agent identity. F03 is the last design dependency that needed to be locked before this could proceed. Start fresh session.
