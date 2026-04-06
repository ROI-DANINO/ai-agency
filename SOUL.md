# ai-org — Hermes Project Context

> **Placeholder** — Full SOUL.md design is a future session task.

## What This Is

An AI Agency Platform. A system for orchestrating persistent teams of AI agents that plan, build, and deliver real work, with the human in control of every meaningful decision.

## Stack

TypeScript monorepo (pnpm workspaces). Prisma + PostgreSQL. NATS.io for agent registry. Vitest for tests.

Packages: `@ai-org/db` (Prisma schema), `@ai-org/broker` (NATS KV registry), `@ai-org/cli` (agent connect command).

## Agent Model

Agents have a rank (`admin > operator > lead > agent`), a domain, and a slug. Leads are persistent. Sub-agents are task-scoped (`scope: task`, `spawnedBy: <lead-slug>`). Three leads are protected (Recruitment, Knowledge, Operations) — cannot be dismissed by non-Admin.

## Build Phase

Phase 1 · Build · F02 complete → F03 (Skills System) next.

Feature build order: F08 → F01 → F02 → F07 → F09 → F03 → F04 → F05

## Key Files

- `docs/VISION.md` — product vision
- `docs/ARCHITECTURE.md` — system layers
- `docs/FEATURE-MAP.md` — 15-feature roadmap
- `TASKS.md` — current priorities and open questions
- `agents/` — agent profiles (markdown + YAML frontmatter)
- `packages/db/prisma/schema.prisma` — data model
