# F01 Agent Identity — Developer Guide

How the identity layer works, what's been built, and how to use it.

---

## The Big Picture

Every agent in ai-org has a **stable identity** — a slug (like `dev-lead`) that survives across sessions, terminals, and restarts. This is managed in three layers:

```
agents/dev-lead.md          ← WHO the agent is (flat file, version-controlled)
       ↓
NATS KV "agent-registry"    ← IS the agent currently running? (live session state)
       ↓
Supabase "agents" table     ← HISTORY of the agent (session counts, last active, etc.)
```

---

## Agent Profile Files

Each agent is defined in `agents/<slug>.md`. This is the single source of truth.

**Format:**
```markdown
---
name: Dev Lead
slug: dev-lead
rank: lead          # admin | operator | lead | agent
domain: dev         # for leads — their specialty area
vibe: ...           # one-line personality description
emoji: 🔧
model_tier: 2       # 1=cheap, 2=standard, 3=powerful
skill_pack: []      # F03 hook — skills loaded into agent context
mesh_read: [lead]   # which mesh layers this agent can read
mesh_write: [lead]  # which mesh layers this agent can write
---

## Identity
...

## Mission
...

## Critical Rules
...

## Communication Style
...
```

**Initial agents:**

| Slug | Rank | Purpose |
|---|---|---|
| `mission-op` | operator | Initiates work, tasks Leads, coordinates execution |
| `watcher-op` | operator | Monitors system health, surfaces anomalies |
| `reporter-op` | operator | Aggregates state, writes reports to admin |
| `dev-lead` | lead | Technical executor — owns codebase |
| `pm-lead` | lead | Coordination — tracks tasks, surfaces blockers |

`.claude/agents/<slug>.md` files are **symlinks** to `agents/<slug>.md`. Claude Code reads from `.claude/agents/` when spawning agent subprocesses — this means the profile IS the Claude Code agent definition.

---

## NATS KV Registry (`packages/broker`)

The broker maps `slug → RegistryEntry` in NATS JetStream KV bucket `agent-registry`.

**RegistryEntry:**
```typescript
{
  slug: "dev-lead",
  peerId: "uuid",          // ephemeral — changes each session
  rank: "lead",
  domain: "dev",
  claimedAt: "ISO-8601",
  heartbeatAt: "ISO-8601"  // updated every 30s
}
```

**What AgentRegistry does:**

| Method | What it does |
|---|---|
| `claim(entry)` | Claim a slug. Returns `{ ok: true }` or `{ ok: false, reason: "active" }` |
| `heartbeat(slug, peerId)` | Update `heartbeatAt` — keeps the claim alive |
| `release(slug, peerId)` | Remove the claim on clean disconnect |
| `discoverAll()` | List all currently-claimed agents |
| `forceSet(entry)` | Bypass freshness check (used for crash recovery seeding) |

**Stale logic:** A claim is stale if `Date.now() - heartbeatAt >= 90_000ms`. Stale claims are auto-reclaimed by the next agent that tries to connect. This handles crashes without requiring human intervention.

---

## Prisma Schema (`packages/db`)

The `agents` table in Supabase tracks persistent runtime state. Fields:

- Identity: `slug`, `name`, `type` (TENURE/TEMPORARY/USER), `rank`, `specialty`, `domain`
- Mesh access: `meshRead[]`, `meshWrite[]`
- Config: `modelTier`, `skillPack[]`, `tags[]`
- Live session: `status`, `currentSessionId`, `sessionStartedAt`, `heartbeatAt`, `activeTaskIds[]`
- Lifecycle: `dismissedAt`, `handoffRef`, `sessionCount`, `lastActiveAt`

**Setup (one-time):**
```bash
# Set DATABASE_URL in .env (copy from .env.example)
cd packages/db
pnpm db:push    # push schema to Supabase
```

---

## CLI (`packages/cli`)

**Install:**
```bash
pnpm build          # builds all packages
npm link packages/cli/dist/src/index.js   # or just use: node packages/cli/dist/src/index.js
```

**Usage:**
```bash
# Connect as default agent (mission-op)
ai-org connect

# Connect as a specific agent
ai-org connect --as dev-lead
ai-org connect --as pm-lead
```

**What happens on connect:**
1. Reads `agents/<slug>.md` — loads profile from flat file
2. Connects to NATS at `$NATS_URL` (default: `nats://localhost:4222`)
3. Claims the slug in NATS KV — rejects if another session holds it
4. Upserts the Agent row in Supabase (status → ONLINE)
5. Starts 30s heartbeat loop
6. On `Ctrl+C` / SIGTERM: releases NATS claim, sets status → OFFLINE, closes NATS

**Environment variables:**
```
NATS_URL=nats://localhost:4222    # where to find NATS
DATABASE_URL=postgresql://...     # Supabase connection string
AI_ORG_ROOT=/path/to/ai-org       # repo root (for finding agents/ dir)
```

**Start NATS locally:**
```bash
docker run -d -p 4222:4222 nats:alpine -js
```

---

## Running Tests

```bash
pnpm test              # all packages
pnpm test --filter @ai-org/broker   # broker only (needs NATS running)
pnpm test --filter @ai-org/cli      # cli only (no NATS needed)
```

Broker integration tests require NATS. CLI tests are fully unit-tested (NATS and DB are mocked).

---

## What's NOT in F01

- **MCP messaging surface** (`list_peers`, `send_message`, `check_messages`) — that's F06
- **Skill loading from skill_pack** — that's F03
- **Tool loading** — that's F04
- **Temporary agent spawning** — that's F07
- **Cross-machine identity** — Phase 2+
