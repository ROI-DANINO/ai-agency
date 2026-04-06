# Cleanup — Skill Menu Redundancy

Date: 2026-04-06
Type: decision

## What Happened

Asked why the skill menu felt messy. Discovered that `daily-brief@aios` and `session-close@aios` from the superpowers plugin were still enabled and redundant with the ai-org project skills `project-brief` and `session-end`. These AIOS skills load by default via the superpowers plugin.

Disabled both in `settings.json` under `enabledPlugins`. Menu is now clean — only ai-org's 6 human skills appear in the `/` menu.

## Decisions Made

- **Disable daily-brief@aios and session-close@aios** — why: replaced by ai-org's project-brief and session-end; superpowers defaults were creating menu noise

## Open Questions

None.

## What's Next

Continue with F03 Skeleton Design (from prior session's closing plan).
