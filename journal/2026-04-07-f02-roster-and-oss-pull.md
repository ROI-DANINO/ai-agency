# F02 Team Structure — Roster Built, OSS Pulled
Date: 2026-04-07 · 01:57 IL
Type: build

## What Happened

Merged `build/f01-agent-identity` into main — 58 files, full monorepo scaffold. Smoke-test deferred to milestone boundary rather than per-feature.

Reviewed F02 design against F01's real Agent model and NATS KV implementation. Decided Workspace/Cluster/Group from agentic-ai-platform → Phase 2. The `rank` + `domain` fields on Agent are sufficient for Phase 1 CLI routing. Adding FK-enforced hierarchy now would be over-engineering for a single-workspace CLI with ~10 agents.

Pulled all BMAD persona content from `ai-team` and wrote the full Phase 1 agent roster. Created 7 new lead profiles and 19 sub-agent profiles. Leads adapted from ai-team: `ux-lead`, `security-lead`. Written fresh: `devops-lead`, `quality-lead`, and the 3 protected leads (`recruitment-lead`, `knowledge-lead`, `operations-lead`). Sub-agents sourced from ai-team where available (`architect`, `developer`, `qa`, `analyst`, `scrum-master`, `ux-researcher`, `ui-designer`, `cso-auditor`, `pen-tester`) and written fresh for domains not in ai-team (DevOps, Quality, all protected lead sub-agents).

All profiles follow the F01 format: YAML frontmatter with slug, rank, domain, vibe, emoji, model_tier, skill_pack, mesh_read/write. Sub-agents add `spawned_by` and `scope: task` fields. Protected leads have `protected: true`.

## Decisions Made

- **Workspace/Cluster/Group → Phase 2** — why: rank + domain fields cover Phase 1 routing; FK hierarchy needed only for web dashboard, multi-workspace, and ResourceScopeBinding — none of which apply to Phase 1 CLI
- **Smoke-test at milestone boundaries, not per-feature** — why: validates the integrated stack at meaningful checkpoints rather than adding overhead after every feature build
- **Full roster in `agents/` before F02 build** — why: agent definitions are the primary deliverable of F02; having them written makes the build plan concrete and the remaining work (schema, symlinks, .mesh scaffold) clearer

## Open Questions

- **Superpowers reset** — still deferred; must decide before F03 build begins
- **`toolPack` field** — must add `toolPack String[] @default([])` to Agent schema before F04 design
- **`protected` field** — frontmatter has it, Prisma schema does not yet; needs schema migration in F02 build
- **`spawned_by` / `scope` fields** — in sub-agent frontmatter but not in Prisma schema; decide whether to add or keep as profile-only convention

## What's Next

F02 build (Plan A): add `protected` field to Prisma schema, create `.claude/agents/` symlinks for all new leads, scaffold `.mesh/` directory structure, run `pnpm db:push`, write tests for protected lead claim behavior.
