# F01 Agent Identity — Full Build
Date: 2026-04-07
Type: build

## What Happened

Wrote the F01 implementation plan using `superpowers:writing-plans`, then executed it using `subagent-driven-development`. The plan covered 9 tasks: monorepo scaffold, 5 agent profile flat files, Prisma schema, broker types, stale detection, NATS KV registry, CLI profile parser, CLI connect command, and end-to-end wire. All tasks completed. 16/16 tests passing on branch `build/f01-agent-identity`.

The broker (`packages/broker`) implements NATS KV claim/heartbeat/release/discover with a 90s stale threshold and auto-reclaim logic. The CLI (`packages/cli`) reads agent profile flat files, claims a NATS KV slot, upserts the Supabase Agent row, starts a 30s heartbeat loop, and gracefully releases on SIGINT/SIGTERM. One notable fix during build: `kv.keys()` had a race condition in NATS v2 — replaced with `kv.history()` which is the correct enumeration pattern.

Mid-session, the BMAD/oh-my-pi question surfaced a deeper harmonization concern: should `agents/<slug>.md` and `.claude/agents/<name>.md` be separate files? Decision: merge them. `agents/<slug>.md` is the single source of truth; `.claude/agents/` contains symlinks. This means the profile IS the Claude Code subagent definition — identity and behavior in one file.

Worktree-based subagent execution hit a permission wall (`.worktrees/` blocked for Read/Glob tools in main session). Resolved by force-removing the worktree and checking out the feature branch directly. All remaining tasks executed from the main repo on the feature branch.

## Decisions Made

- **agents/ is single source of truth** — why: avoids two files for the same agent; profile format (YAML frontmatter + markdown body) is compatible with Claude Code's .claude/agents/ expectations. `.claude/agents/` symlinks to `agents/`.
- **No worktrees for future build tasks** — why: Claude Code's file tools (Read/Glob/Grep) can't access gitignored directories; worktrees inside `.worktrees/` are gitignored. Use feature branches in the main repo instead.
- **kv.history() over kv.keys()** — why: kv.keys() in nats.js v2 uses a watcher subscription with a race condition under fast writes. kv.history() delivers all existing entries reliably.
- **vitest.config.ts alias for workspace packages** — why: vitest can't resolve unbuilt workspace packages (no dist/ yet); aliasing to source files lets tests run without a build step.
- **toolPack field deferred** — why: not needed for F01, but should be added before F04 design begins. Flagged in TASKS.md.

## Open Questions

- Superpowers reset: still deferred — decide before F03 build begins.
- `toolPack String[] @default([])` needs to be added to Agent schema before F04 design.
- F01 branch not yet merged to main — pending smoke-test with real NATS + Supabase.

## What's Next

Merge `build/f01-agent-identity` → main. Run `pnpm db:push` and smoke-test `ai-org connect --as dev-lead` with real infrastructure. Then start F02 Team Structure design — can now be designed against real Agent model and broker code.
