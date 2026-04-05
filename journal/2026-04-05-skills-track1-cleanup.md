# Skills Cleanup Track 1: Clean slate executed
Date: 2026-04-05
Type: decision

## What Happened
Track 1 of the skills/tooling cleanup finally got executed. The brainstorm had happened two sessions ago — three tracks locked, direction clear — but the actual cleanup was sitting in a queue. This session picked it up.

The approach was deliberately blunt: archive everything, start clean. 34 skill dirs from `~/.claude/skills/` (gstack suite + BMAD modules) moved to `~/.claude/skills-archive/`. No triage, no second-guessing which gstack skills might be "useful later" — the ones worth keeping will be rebuilt as ai-org-native versions in Track 2. Then the plugin list got trimmed: 6 generic AIOS plugins disabled (aios-health, agent-config, tool-registry, session-health, project-init, context-clean). All need ai-org-specific versions before they come back.

Also investigated the hook conflict flagged in TASKS.md (update-skills-map.sh vs tasks-dirty.sh). Not a real conflict — the AIOS hook only fires for `*/skills/*.md` changes and exits immediately otherwise. Noted as a Track 2 concern only if ai-org plugin skill files end up matching that path pattern.

## Decisions Made
- **Archive everything in `~/.claude/skills/`** — why: clean slate is the right call; skills that become agent building blocks (Feature 03/04) should be designed fresh in the product codebase, not kept as global noise
- **Disable 6 generic AIOS plugins** — why: ai-org does not use generic AIOS tooling; each needs a purpose-built ai-org version before it comes back
- **update-skills-map.sh hook conflict: non-issue** — why: hook exits early for non-matching paths; only becomes relevant if Track 2 skill files land in a `*/skills/*.md` path

## Open Questions
- Where exactly do ai-org Claude Code plugin skills live in the repo? (Track 2 design will answer this)
- Does task-sync location (standalone aios plugin vs inside ai-org plugin) need resolving before Track 2 design starts?

## What's Next
Track 2: design ai-org as an installable Claude Code plugin. Define the human ops skill surface (session-start, session-end, capture, feature-design, task-sync), the governance model (how skills are written and updated), and where they live in the repo. This is a brainstorm → spec → plan session. See TASKS.md for current state.
