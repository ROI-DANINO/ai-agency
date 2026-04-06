# Plugins and Skill Strategy

Date: 2026-04-06
Type: decision

## What Happened

Asked why the skill menu felt messy. Discovered that `daily-brief@aios` and `session-close@aios` from the superpowers plugin were still enabled despite earlier disabling of AIOS skills. Attempted to disable them in `settings.json`, but disabling individual skills in `enabledPlugins` doesn't work because superpowers is a marketplace plugin with built-in skills that are baked into the package.

Realized the plugin architecture: superpowers is a Claude Marketplace plugin (can't selectively disable built-in skills), AIOS is a legacy plugin system, and ai-org is the new project-specific skill set living in `~/.claude/skills/`.

Decision: Rather than try to integrate or reset superpowers, study its workflow patterns (brainstorm, writing-plans, executing-plans, etc.) as design inspiration for ai-org's own skills. This keeps ai-org self-contained while learning from proven UX patterns.

Added `reference_superpowers_patterns.md` to project memory for future skill design sessions.

## Decisions Made

- **Study superpowers as design reference, not integration** — why: keeps ai-org self-contained while borrowing proven workflow patterns for skill UX
- **Superpowers will be reset to default in next session** — why: customizations are creating menu noise; fresh install or full removal will be cleaner

## Open Questions

- Should superpowers be fully removed from Claude Code, or reset and kept?

## What's Next

F03 Skeleton Design. If superpowers still feels messy, remove it or reset to default next session.
