# ai-org Plugin Architecture Designed — Track 2 Complete
Date: 2026-04-06
Type: decision

## What Happened

Track 2 was the design session for turning the ai-org project into a proper
installable Claude Code plugin — not just a collection of loose skill files
scattered across `@aios` entries, but a single coherent artifact that IS the
Phase 1 product.

The key reframe that drove everything: the ai-org plugin isn't the ops shell
around the product, it IS the product for Phase 1. That changes the structure
from "where do my scripts live" to "what does the Phase 1 CLI plugin look like
as a designed artifact."

The design landed on Approach B — plugin-as-root. The repo reorganizes so that
concern-grouped runtime dirs sit at root level alongside docs/ and journal/.
No wrapper subdirectory. The structure communicates the system's mental model
the moment you open the folder.

The artifacts layer surfaced as a first-class concept: `artifacts/` is where
agents write MD files to pass state to each other. Briefing packs, handoffs,
decision reports — all explicit, auditable, persistent. This is the
communication nervous system, designed before any agents exist.

## Decisions Made

- **Repo-as-plugin (Approach B)** — concern-grouped dirs at root, not wrapped
  in a `plugin/` subdir; why: the structure should communicate the product, not
  the build process

- **Copy-on-deploy** — explicit `deploy.sh` copies runtime dirs to
  `~/.claude/aios-plugins/plugins/ai-org/`; why: explicit control over when
  the running plugin updates, no drift risk from live symlinks

- **Two-surface skills** — `skills/human/` for user-invocable, `skills/agent/`
  for internal; why: keeps the / menu clean, makes the plumbing invisible

- **Artifacts as first-class layer** — `artifacts/` dir with three types
  (briefing-packs, handoffs, decision-reports); why: agent communication via
  MD files needs a designed home, not ad-hoc file conventions

- **task-sync inside the plugin** — stays in `skills/human/`, not a standalone
  plugin; why: it's intrinsically tied to this project's workflow

- **Single plugin entry** — `ai-org@ai-org` replaces scattered `project-brief@aios`,
  `session-end@aios`; why: one product, one toggle

- **skills-map.md as contract** — nothing in `skills/` exists unless registered;
  `skill-scan` enforces this

## Open Questions

- When to wire `deploy.sh` into a git hook vs keep it manual
- What the first agent-facing skills under `skills/agent/` should look like
  (depends on F01 build starting)

## What's Next

The design is locked and committed. Next steps split into two tracks:

1. **Execute the repo migration** — create the new dirs, move existing skills,
   write manifest.yaml and deploy.sh, update settings.json, run deploy

2. **Resume feature work** — F01 build plan is ready to write (harmony passed);
   F03 Skeleton Design is the next design session in build order
