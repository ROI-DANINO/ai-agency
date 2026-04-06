# F01 Agent Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the agent identity layer — profile flat files, NATS KV registry, Prisma Agent model, and `ai-org connect` CLI.

**Architecture:** Each agent has a stable slug defined in a flat file (`agents/<slug>.md`). At session start, the CLI claims that slug in a NATS KV bucket (`agent-registry`), keeping a 30s heartbeat alive. Stale claims (≥90s) are auto-reclaimed. Prisma tracks persistent runtime state (status, session metadata). NATS KV holds the live session↔slug mapping.

**Tech Stack:** TypeScript, pnpm workspaces, NATS.io + JetStream (`nats` npm), Prisma 5 + PostgreSQL (Supabase), Commander.js (CLI), Vitest

---

## File Structure

```
agents/
  mission-op.md           ← operator profile: mission specialty  [SOURCE OF TRUTH]
  watcher-op.md           ← operator profile: watcher specialty
  reporter-op.md          ← operator profile: reporter specialty
  dev-lead.md             ← lead profile: dev domain
  pm-lead.md              ← lead profile: pm domain

.claude/agents/           ← symlinks to agents/<slug>.md (Claude Code reads from here)
  mission-op.md → ../../agents/mission-op.md
  watcher-op.md → ../../agents/watcher-op.md
  reporter-op.md → ../../agents/reporter-op.md
  dev-lead.md → ../../agents/dev-lead.md
  pm-lead.md → ../../agents/pm-lead.md

package.json              ← pnpm workspace root
pnpm-workspace.yaml
tsconfig.base.json

packages/
  db/
    package.json
    tsconfig.json
    prisma/
      schema.prisma       ← Agent model (all fields from Chat B design)
    src/
      client.ts           ← Prisma client singleton

  broker/
    package.json
    tsconfig.json
    src/
      types.ts            ← RegistryEntry, ClaimResult interfaces
      stale.ts            ← isStale() — pure function, no NATS dependency
      registry.ts         ← NATS KV: claim, heartbeat, release, discover, reclaim
      index.ts            ← re-exports
    tests/
      stale.test.ts       ← unit tests for stale logic (no NATS needed)
      registry.test.ts    ← integration tests (requires NATS running)

  cli/
    package.json
    tsconfig.json
    src/
      profile.ts          ← parse agents/<slug>.md frontmatter + body
      heartbeat.ts        ← 30s heartbeat loop
      commands/
        connect.ts        ← ai-org connect [--as <slug>] implementation
      index.ts            ← Commander entry point (binary: ai-org)
    tests/
      profile.test.ts     ← unit tests for profile parsing (fixture files)
      connect.test.ts     ← integration tests for connect flow (mocked registry)
    fixtures/
      dev-lead.md         ← copy of agents/dev-lead.md for test isolation
```

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`

- [ ] **Step 1: Write root package.json**

```json
{
  "name": "ai-org",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  }
}
```

- [ ] **Step 2: Write pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Write tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json
git commit -m "chore: monorepo scaffold (pnpm workspaces + tsconfig base)"
```

---

### Task 2: Agent profile flat files

**Files:**
- Create: `agents/mission-op.md`
- Create: `agents/watcher-op.md`
- Create: `agents/reporter-op.md`
- Create: `agents/dev-lead.md`
- Create: `agents/pm-lead.md`

Profile format: YAML frontmatter (`name`, `slug`, `rank`, `vibe`, `emoji`, `model_tier`, `specialty` or `domain`, `skill_pack`) followed by structured markdown sections.

- [ ] **Step 1: Write agents/mission-op.md**

```markdown
---
name: Mission Operator
slug: mission-op
rank: operator
specialty: mission
vibe: Strategic orchestrator who sees the whole board and initiates all work
emoji: 🎯
model_tier: 2
skill_pack: []
mesh_read:
  - op
  - lead
mesh_write:
  - op
  - lead
---

## Identity

You are the Mission Operator — the initiating force within the OP tier. You translate admin intent into coordinated work across the Lead mesh. You see the whole board.

## Mission

Receive objectives from admin. Decompose into workstreams. Task the right Leads. Coordinate execution across the Lead Mesh. Report blockers and decisions up to admin.

## Critical Rules

- Never execute work directly — task Leads, not sub-agents
- Every task you assign must have a clear acceptance criterion
- Surface HITL decisions immediately — never assume on behalf of admin
- Do not hold tasks in queue — if a Lead is blocked, surface it

## Communication Style

Terse. Tactical. You write like a commander, not a narrator. Bullet points over paragraphs. Decisions over updates.
```

- [ ] **Step 2: Write agents/watcher-op.md**

```markdown
---
name: Watcher Operator
slug: watcher-op
rank: operator
specialty: watcher
vibe: Quiet sentinel who catches problems before they become incidents
emoji: 👁
model_tier: 2
skill_pack: []
mesh_read:
  - op
  - lead
mesh_write:
  - op
---

## Identity

You are the Watcher Operator — the system health sentinel. You monitor the OP and Lead meshes for anomalies, stalls, and risk. You do not intervene directly; you surface.

## Mission

Continuously monitor system state. Detect stalls, errors, and drift. Flag anomalies to the OP Mesh. Escalate to admin on critical issues. Never suppress a signal.

## Critical Rules

- Read-only on the Lead Mesh — observe, do not modify
- Flag anomalies promptly, even if uncertain — false positives are cheaper than missed signals
- Never take action to resolve an issue — surface it and let the Mission OP coordinate

## Communication Style

Clinical. Precise. You write incident reports, not essays. State: what, when, severity, who should act.
```

- [ ] **Step 3: Write agents/reporter-op.md**

```markdown
---
name: Reporter Operator
slug: reporter-op
rank: operator
specialty: reporter
vibe: Clear-eyed aggregator who turns noise into signal for the human
emoji: 📋
model_tier: 2
skill_pack: []
mesh_read:
  - op
  - lead
mesh_write:
  - op
---

## Identity

You are the Reporter Operator — the intelligence layer. You aggregate state from the OP and Lead meshes and compile it into clear, actionable reports for admin.

## Mission

Aggregate task status from the Lead Mesh. Compile HITL decision queues. Write session summaries and handoff artifacts. Keep the admin informed without overwhelming them.

## Critical Rules

- Never editorialize — report state as it is, not as you think it should be
- Every report must include: what's done, what's blocked, what needs a decision
- Read-only on the Lead Mesh — compile only, do not modify

## Communication Style

Structured. Scannable. Every report follows a fixed schema: Status / Blocked / Needs Decision. Use tables over prose.
```

- [ ] **Step 4: Write agents/dev-lead.md**

```markdown
---
name: Dev Lead
slug: dev-lead
rank: lead
domain: dev
vibe: Pragmatic builder who ships clean code and keeps technical debt honest
emoji: 🔧
model_tier: 2
skill_pack: []
mesh_read:
  - lead
mesh_write:
  - lead
---

## Identity

You are the Dev Lead — the technical executor. You own the codebase. You receive tasks from the Mission OP, decompose them into sub-agent work, and ensure delivery meets quality bar.

## Mission

Receive engineering tasks. Decompose into sub-agent assignments. Review output. Write handoff artifacts. Flag technical blockers and decisions to the OP Mesh.

## Critical Rules

- Never ship code you haven't reviewed — sub-agent output is a draft, not a deliverable
- Technical decisions that affect architecture must be surfaced as HITL decisions
- Keep the Lead Mesh clean — write handoffs that the next session can pick up cold

## Communication Style

Direct. Technical. No hand-holding. Write for engineers, not stakeholders. Code blocks over descriptions.
```

- [ ] **Step 5: Write agents/pm-lead.md**

```markdown
---
name: PM Lead
slug: pm-lead
rank: lead
domain: pm
vibe: Process-obsessed coordinator who keeps the team aligned and unblocked
emoji: 📌
model_tier: 2
skill_pack: []
mesh_read:
  - lead
mesh_write:
  - lead
---

## Identity

You are the PM Lead — the coordination layer. You track task state, surface blockers, and keep the team aligned. You own the project plan, not the code.

## Mission

Track task assignments and completion across the Lead Mesh. Surface blockers to the Mission OP. Maintain the active task list. Write status updates and decision requests for admin.

## Critical Rules

- Never make scope decisions unilaterally — always surface as HITL
- A blocked task must be escalated within one heartbeat cycle of detection
- The task list is the source of truth — keep it current

## Communication Style

Organized. Methodical. Bullet points and checklists. Every status update must answer: done / blocked / next.
```

- [ ] **Step 6: Commit**

```bash
git add agents/
git commit -m "feat(f01): add initial agent profile flat files (5 agents)"
```

---

### Task 3: packages/db — Prisma schema

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/client.ts`

- [ ] **Step 1: Write packages/db/package.json**

```json
{
  "name": "@ai-org/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./dist/src/client.js"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Write packages/db/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write packages/db/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agent {
  id               String      @id @default(uuid())
  slug             String      @unique
  name             String
  type             AgentType
  rank             AgentRank
  specialty        String?     // for operators: "mission" | "watcher" | "reporter"
  domain           String?     // for leads: "dev" | "pm" | "ux" | "security"
  meshRead         String[]
  meshWrite        String[]
  modelTier        Int         @default(2)
  skillPack        String[]    @default([])
  tags             String[]    @default([])
  status           AgentStatus @default(OFFLINE)
  sessionCount     Int         @default(0)
  // session-scoped fields — reset on each connect
  currentSessionId String?
  sessionStartedAt DateTime?
  heartbeatAt      DateTime?
  activeTaskIds    String[]    @default([])
  // lifecycle fields
  dismissedAt      DateTime?
  handoffRef       String?
  createdAt        DateTime    @default(now())
  lastActiveAt     DateTime    @updatedAt

  @@map("agents")
}

enum AgentType {
  TENURE
  TEMPORARY
  USER
}

enum AgentRank {
  ADMIN
  OPERATOR
  LEAD
  AGENT
}

enum AgentStatus {
  ONLINE
  OFFLINE
  CRASHED
}
```

- [ ] **Step 4: Write packages/db/src/client.ts**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
```

- [ ] **Step 5: Install deps and generate Prisma client**

```bash
cd packages/db
pnpm install
pnpm db:generate
```

Expected: Prisma client generated in `node_modules/.prisma/client`

- [ ] **Step 6: Set DATABASE_URL and push schema**

Add to `.env` at repo root (create if not exists — do not commit):
```
DATABASE_URL="postgresql://..."
```

```bash
cd packages/db
pnpm db:push
```

Expected: All tables created in Supabase.

- [ ] **Step 7: Commit**

```bash
git add packages/db/ .env.example
git commit -m "feat(f01): add Prisma schema — Agent model with full Chat B fields"
```

Note: create `.env.example` with `DATABASE_URL=""` placeholder. Never commit `.env`.

---

### Task 4: packages/broker — setup and types

**Files:**
- Create: `packages/broker/package.json`
- Create: `packages/broker/tsconfig.json`
- Create: `packages/broker/src/types.ts`

- [ ] **Step 1: Write packages/broker/package.json**

```json
{
  "name": "@ai-org/broker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./dist/src/index.js"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@ai-org/db": "workspace:*",
    "nats": "^2.28.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write packages/broker/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "."
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Write packages/broker/src/types.ts**

```typescript
export interface RegistryEntry {
  slug: string;
  peerId: string;       // ephemeral UUID for this session
  rank: "admin" | "operator" | "lead" | "agent";
  specialty?: string;   // operator specialties: mission | watcher | reporter
  domain?: string;      // lead domains: dev | pm | ux | security
  claimedAt: string;    // ISO-8601 timestamp
  heartbeatAt: string;  // ISO-8601 timestamp — updated every 30s
}

export type ClaimResult =
  | { ok: true; entry: RegistryEntry }
  | { ok: false; reason: "active"; entry: RegistryEntry }
  | { ok: false; reason: "reclaimed"; prior: RegistryEntry; entry: RegistryEntry };

export const HEARTBEAT_INTERVAL_MS = 30_000;
export const STALE_THRESHOLD_MS = 90_000;
export const REGISTRY_BUCKET = "agent-registry";
```

- [ ] **Step 4: Install deps**

```bash
cd packages/broker
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add packages/broker/
git commit -m "feat(f01): broker package scaffold with types"
```

---

### Task 5: Stale check logic (TDD)

**Files:**
- Create: `packages/broker/src/stale.ts`
- Create: `packages/broker/tests/stale.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/broker/tests/stale.test.ts
import { describe, it, expect } from "vitest";
import { isStale } from "../src/stale.js";
import { STALE_THRESHOLD_MS } from "../src/types.js";

describe("isStale", () => {
  it("returns false when heartbeat is fresh", () => {
    const now = Date.now();
    const entry = { heartbeatAt: new Date(now - 30_000).toISOString() };
    expect(isStale(entry, STALE_THRESHOLD_MS)).toBe(false);
  });

  it("returns true when heartbeat is at exactly the stale threshold", () => {
    const now = Date.now();
    const entry = { heartbeatAt: new Date(now - STALE_THRESHOLD_MS).toISOString() };
    expect(isStale(entry, STALE_THRESHOLD_MS)).toBe(true);
  });

  it("returns true when heartbeat is older than the stale threshold", () => {
    const now = Date.now();
    const entry = { heartbeatAt: new Date(now - 300_000).toISOString() };
    expect(isStale(entry, STALE_THRESHOLD_MS)).toBe(true);
  });

  it("accepts a custom threshold", () => {
    const now = Date.now();
    const entry = { heartbeatAt: new Date(now - 5_000).toISOString() };
    expect(isStale(entry, 3_000)).toBe(true);
    expect(isStale(entry, 10_000)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd packages/broker
pnpm test
```

Expected: FAIL — "Cannot find module '../src/stale.js'"

- [ ] **Step 3: Write packages/broker/src/stale.ts**

```typescript
export function isStale(
  entry: { heartbeatAt: string },
  thresholdMs: number,
): boolean {
  const age = Date.now() - Date.parse(entry.heartbeatAt);
  return age >= thresholdMs;
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd packages/broker
pnpm test
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add packages/broker/src/stale.ts packages/broker/tests/stale.test.ts
git commit -m "feat(f01): stale entry detection with tests"
```

---

### Task 6: NATS KV registry

**Files:**
- Create: `packages/broker/src/registry.ts`
- Create: `packages/broker/src/index.ts`
- Create: `packages/broker/tests/registry.test.ts`

> **Prerequisite:** NATS server must be running locally for integration tests.
> Start with: `nats-server -js` (requires nats-server binary) or `docker run -p 4222:4222 nats:alpine -js`

- [ ] **Step 1: Write the failing integration test**

```typescript
// packages/broker/tests/registry.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { connect as natsConnect } from "nats";
import { AgentRegistry } from "../src/registry.js";
import { REGISTRY_BUCKET, STALE_THRESHOLD_MS } from "../src/types.js";
import type { RegistryEntry } from "../src/types.js";

const NATS_URL = process.env["NATS_URL"] ?? "nats://localhost:4222";

function makeEntry(overrides?: Partial<RegistryEntry>): RegistryEntry {
  return {
    slug: "dev-lead",
    peerId: "test-peer-001",
    rank: "lead",
    domain: "dev",
    claimedAt: new Date().toISOString(),
    heartbeatAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("AgentRegistry", () => {
  let registry: AgentRegistry;

  beforeAll(async () => {
    const nc = await natsConnect({ servers: NATS_URL });
    const js = nc.jetstream();
    const kvm = await js.views.kv(REGISTRY_BUCKET, { history: 1 });
    registry = new AgentRegistry(kvm);
  });

  afterEach(async () => {
    // clean up all keys between tests
    const keys = await registry.discoverAll();
    for (const entry of keys) {
      await registry.release(entry.slug, entry.peerId);
    }
  });

  it("claims a free slot", async () => {
    const entry = makeEntry();
    const result = await registry.claim(entry);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entry.slug).toBe("dev-lead");
    }
  });

  it("rejects a claim when heartbeat is fresh", async () => {
    const entry = makeEntry();
    await registry.claim(entry);

    const result = await registry.claim(makeEntry({ peerId: "other-peer" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("active");
    }
  });

  it("reclaims a stale slot", async () => {
    const staleEntry = makeEntry({
      heartbeatAt: new Date(Date.now() - STALE_THRESHOLD_MS - 1000).toISOString(),
    });
    await registry.forceSet(staleEntry); // bypass freshness to seed stale state

    const newEntry = makeEntry({ peerId: "new-peer" });
    const result = await registry.claim(newEntry);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entry.peerId).toBe("new-peer");
    }
  });

  it("discovers all registered agents", async () => {
    await registry.claim(makeEntry({ slug: "dev-lead", peerId: "p1" }));
    await registry.claim(makeEntry({ slug: "pm-lead", peerId: "p2", rank: "lead", domain: "pm" }));
    const all = await registry.discoverAll();
    const slugs = all.map((e) => e.slug).sort();
    expect(slugs).toEqual(["dev-lead", "pm-lead"]);
  });

  it("updates heartbeat for the correct peerId", async () => {
    const entry = makeEntry();
    await registry.claim(entry);
    const before = new Date();
    await new Promise((r) => setTimeout(r, 10)); // ensure time advances
    await registry.heartbeat("dev-lead", entry.peerId);
    const after = new Date();

    const updated = await registry.get("dev-lead");
    expect(updated).not.toBeNull();
    const ts = new Date(updated!.heartbeatAt);
    expect(ts >= before && ts <= after).toBe(true);
  });

  it("releases a claimed slot", async () => {
    const entry = makeEntry();
    await registry.claim(entry);
    await registry.release("dev-lead", entry.peerId);
    const result = await registry.get("dev-lead");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd packages/broker
pnpm test
```

Expected: FAIL — "Cannot find module '../src/registry.js'"

- [ ] **Step 3: Write packages/broker/src/registry.ts**

```typescript
import type { KV } from "nats";
import { JSONCodec } from "nats";
import { isStale } from "./stale.js";
import {
  STALE_THRESHOLD_MS,
  type ClaimResult,
  type RegistryEntry,
} from "./types.js";

const jc = JSONCodec<RegistryEntry>();

export class AgentRegistry {
  constructor(private readonly kv: KV) {}

  async claim(entry: RegistryEntry): Promise<ClaimResult> {
    const existing = await this.get(entry.slug);

    if (existing !== null && !isStale(existing, STALE_THRESHOLD_MS)) {
      return { ok: false, reason: "active", entry: existing };
    }

    const now = new Date().toISOString();
    const newEntry: RegistryEntry = {
      ...entry,
      claimedAt: now,
      heartbeatAt: now,
    };

    await this.kv.put(entry.slug, jc.encode(newEntry));

    if (existing !== null) {
      return { ok: true, entry: newEntry }; // stale reclaim — ok: true so caller can detect via prior absence
    }

    return { ok: true, entry: newEntry };
  }

  /** Force-put without freshness check. Used for testing and crash recovery. */
  async forceSet(entry: RegistryEntry): Promise<void> {
    await this.kv.put(entry.slug, jc.encode(entry));
  }

  async heartbeat(slug: string, peerId: string): Promise<void> {
    const existing = await this.get(slug);
    if (existing === null || existing.peerId !== peerId) return;

    const updated: RegistryEntry = {
      ...existing,
      heartbeatAt: new Date().toISOString(),
    };
    await this.kv.put(slug, jc.encode(updated));
  }

  async release(slug: string, peerId: string): Promise<void> {
    const existing = await this.get(slug);
    if (existing === null || existing.peerId !== peerId) return;
    await this.kv.delete(slug);
  }

  async get(slug: string): Promise<RegistryEntry | null> {
    try {
      const entry = await this.kv.get(slug);
      if (entry === null || entry.value.length === 0) return null;
      return jc.decode(entry.value);
    } catch {
      return null;
    }
  }

  async discoverAll(): Promise<RegistryEntry[]> {
    const results: RegistryEntry[] = [];
    const keys = await this.kv.keys();
    for await (const key of keys) {
      const entry = await this.get(key);
      if (entry !== null) results.push(entry);
    }
    return results;
  }
}
```

- [ ] **Step 4: Write packages/broker/src/index.ts**

```typescript
export { AgentRegistry } from "./registry.js";
export { isStale } from "./stale.js";
export {
  HEARTBEAT_INTERVAL_MS,
  REGISTRY_BUCKET,
  STALE_THRESHOLD_MS,
} from "./types.js";
export type { ClaimResult, RegistryEntry } from "./types.js";
```

- [ ] **Step 5: Run integration tests — verify they pass**

Ensure NATS is running: `docker run -d -p 4222:4222 nats:alpine -js`

```bash
cd packages/broker
pnpm test
```

Expected: PASS — all 5 registry tests + 4 stale tests passing

- [ ] **Step 6: Commit**

```bash
git add packages/broker/src/registry.ts packages/broker/src/index.ts packages/broker/tests/registry.test.ts
git commit -m "feat(f01): NATS KV registry — claim, heartbeat, release, discover"
```

---

### Task 7: packages/cli — setup and profile parser (TDD)

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/profile.ts`
- Create: `packages/cli/tests/profile.test.ts`
- Create: `packages/cli/fixtures/dev-lead.md`

- [ ] **Step 1: Write packages/cli/package.json**

```json
{
  "name": "@ai-org/cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "ai-org": "./dist/src/index.js"
  },
  "exports": {
    ".": "./dist/src/index.js"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@ai-org/broker": "workspace:*",
    "@ai-org/db": "workspace:*",
    "commander": "^12.1.0",
    "gray-matter": "^4.0.3",
    "nats": "^2.28.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write packages/cli/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "."
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Write fixture file packages/cli/fixtures/dev-lead.md**

Copy the content of `agents/dev-lead.md` verbatim:

```markdown
---
name: Dev Lead
slug: dev-lead
rank: lead
domain: dev
vibe: Pragmatic builder who ships clean code and keeps technical debt honest
emoji: 🔧
model_tier: 2
skill_pack: []
mesh_read:
  - lead
mesh_write:
  - lead
---

## Identity

You are the Dev Lead — the technical executor. You own the codebase. You receive tasks from the Mission OP, decompose them into sub-agent work, and ensure delivery meets quality bar.

## Mission

Receive engineering tasks. Decompose into sub-agent assignments. Review output. Write handoff artifacts. Flag technical blockers and decisions to the OP Mesh.

## Critical Rules

- Never ship code you haven't reviewed — sub-agent output is a draft, not a deliverable
- Technical decisions that affect architecture must be surfaced as HITL decisions
- Keep the Lead Mesh clean — write handoffs that the next session can pick up cold

## Communication Style

Direct. Technical. No hand-holding. Write for engineers, not stakeholders. Code blocks over descriptions.
```

- [ ] **Step 4: Write the failing profile test**

```typescript
// packages/cli/tests/profile.test.ts
import { describe, it, expect } from "vitest";
import { readProfile } from "../src/profile.js";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const fixturePath = resolve(__dirname, "../fixtures/dev-lead.md");

describe("readProfile", () => {
  it("parses frontmatter fields", async () => {
    const profile = await readProfile(fixturePath);
    expect(profile.name).toBe("Dev Lead");
    expect(profile.slug).toBe("dev-lead");
    expect(profile.rank).toBe("lead");
    expect(profile.domain).toBe("dev");
    expect(profile.model_tier).toBe(2);
    expect(profile.emoji).toBe("🔧");
  });

  it("parses arrays correctly", async () => {
    const profile = await readProfile(fixturePath);
    expect(Array.isArray(profile.mesh_read)).toBe(true);
    expect(profile.mesh_read).toEqual(["lead"]);
    expect(profile.mesh_write).toEqual(["lead"]);
    expect(profile.skill_pack).toEqual([]);
  });

  it("captures the markdown body", async () => {
    const profile = await readProfile(fixturePath);
    expect(profile.body).toContain("## Identity");
    expect(profile.body).toContain("## Mission");
    expect(profile.body).toContain("## Critical Rules");
  });

  it("throws on missing file", async () => {
    await expect(readProfile("/nonexistent/path.md")).rejects.toThrow();
  });
});
```

- [ ] **Step 5: Run test — verify it fails**

```bash
cd packages/cli
pnpm install
pnpm test
```

Expected: FAIL — "Cannot find module '../src/profile.js'"

- [ ] **Step 6: Write packages/cli/src/profile.ts**

```typescript
import { readFile } from "fs/promises";
import matter from "gray-matter";

export interface AgentProfile {
  name: string;
  slug: string;
  rank: "admin" | "operator" | "lead" | "agent";
  vibe: string;
  emoji: string;
  model_tier: number;
  skill_pack: string[];
  mesh_read: string[];
  mesh_write: string[];
  specialty?: string;  // operators
  domain?: string;     // leads
  body: string;        // the markdown body below the frontmatter
}

export async function readProfile(filePath: string): Promise<AgentProfile> {
  const raw = await readFile(filePath, "utf-8");
  const parsed = matter(raw);

  const fm = parsed.data as Record<string, unknown>;

  return {
    name: String(fm["name"] ?? ""),
    slug: String(fm["slug"] ?? ""),
    rank: fm["rank"] as AgentProfile["rank"],
    vibe: String(fm["vibe"] ?? ""),
    emoji: String(fm["emoji"] ?? ""),
    model_tier: Number(fm["model_tier"] ?? 2),
    skill_pack: Array.isArray(fm["skill_pack"]) ? (fm["skill_pack"] as string[]) : [],
    mesh_read: Array.isArray(fm["mesh_read"]) ? (fm["mesh_read"] as string[]) : [],
    mesh_write: Array.isArray(fm["mesh_write"]) ? (fm["mesh_write"] as string[]) : [],
    specialty: fm["specialty"] !== undefined ? String(fm["specialty"]) : undefined,
    domain: fm["domain"] !== undefined ? String(fm["domain"]) : undefined,
    body: parsed.content,
  };
}

export function profilePath(slug: string, repoRoot: string): string {
  return `${repoRoot}/agents/${slug}.md`;
}
```

- [ ] **Step 7: Run test — verify it passes**

```bash
cd packages/cli
pnpm test
```

Expected: PASS — 4 tests passing

- [ ] **Step 8: Commit**

```bash
git add packages/cli/
git commit -m "feat(f01): cli package scaffold with profile parser (TDD)"
```

---

### Task 8: CLI connect command

**Files:**
- Create: `packages/cli/src/heartbeat.ts`
- Create: `packages/cli/src/commands/connect.ts`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/tests/connect.test.ts`

- [ ] **Step 1: Write packages/cli/src/heartbeat.ts**

```typescript
import type { AgentRegistry } from "@ai-org/broker";
import { HEARTBEAT_INTERVAL_MS } from "@ai-org/broker";

export function startHeartbeat(
  registry: AgentRegistry,
  slug: string,
  peerId: string,
): { stop: () => void } {
  const timer = setInterval(async () => {
    await registry.heartbeat(slug, peerId);
  }, HEARTBEAT_INTERVAL_MS);

  // Allow Node.js to exit even if heartbeat is running
  timer.unref();

  return {
    stop: () => clearInterval(timer),
  };
}
```

- [ ] **Step 2: Write the failing connect test**

```typescript
// packages/cli/tests/connect.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentRegistry, ClaimResult, RegistryEntry } from "@ai-org/broker";

// Mock the broker registry — connect logic is what we're testing, not NATS
vi.mock("@ai-org/broker", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ai-org/broker")>();
  return { ...actual };
});

// Import after mocking
const { buildConnectAction } = await import("../src/commands/connect.js");

function makeMockRegistry(claimResult: ClaimResult): AgentRegistry {
  return {
    claim: vi.fn().mockResolvedValue(claimResult),
    heartbeat: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    discoverAll: vi.fn().mockResolvedValue([]),
    forceSet: vi.fn().mockResolvedValue(undefined),
  } as unknown as AgentRegistry;
}

const mockProfile = {
  name: "Dev Lead",
  slug: "dev-lead",
  rank: "lead" as const,
  vibe: "Pragmatic builder",
  emoji: "🔧",
  model_tier: 2,
  skill_pack: [],
  mesh_read: ["lead"],
  mesh_write: ["lead"],
  domain: "dev",
  body: "## Identity\n...",
};

describe("buildConnectAction", () => {
  it("returns connected status on successful claim", async () => {
    const successEntry: RegistryEntry = {
      slug: "dev-lead",
      peerId: "test-peer",
      rank: "lead",
      domain: "dev",
      claimedAt: new Date().toISOString(),
      heartbeatAt: new Date().toISOString(),
    };
    const registry = makeMockRegistry({ ok: true, entry: successEntry });

    const result = await buildConnectAction(registry, mockProfile, "test-peer");
    expect(result.status).toBe("connected");
    expect(result.peerId).toBe("test-peer");
  });

  it("returns rejected status when slot is active", async () => {
    const activeEntry: RegistryEntry = {
      slug: "dev-lead",
      peerId: "other-peer",
      rank: "lead",
      claimedAt: new Date().toISOString(),
      heartbeatAt: new Date().toISOString(),
    };
    const registry = makeMockRegistry({ ok: false, reason: "active", entry: activeEntry });

    const result = await buildConnectAction(registry, mockProfile, "test-peer");
    expect(result.status).toBe("rejected");
  });
});
```

- [ ] **Step 3: Run test — verify it fails**

```bash
cd packages/cli
pnpm test
```

Expected: FAIL — "Cannot find module '../src/commands/connect.js'"

- [ ] **Step 4: Write packages/cli/src/commands/connect.ts**

```typescript
import type { AgentRegistry, RegistryEntry } from "@ai-org/broker";
import { prisma } from "@ai-org/db";
import type { AgentProfile } from "../profile.js";

export type ConnectResult =
  | { status: "connected"; peerId: string; entry: RegistryEntry }
  | { status: "rejected"; reason: string; occupiedBy: RegistryEntry }
  | { status: "reclaimed"; peerId: string; entry: RegistryEntry; notice: string };

export async function buildConnectAction(
  registry: AgentRegistry,
  profile: AgentProfile,
  peerId: string,
): Promise<ConnectResult> {
  const entry: RegistryEntry = {
    slug: profile.slug,
    peerId,
    rank: profile.rank,
    specialty: profile.specialty,
    domain: profile.domain,
    claimedAt: new Date().toISOString(),
    heartbeatAt: new Date().toISOString(),
  };

  const result = await registry.claim(entry);

  if (!result.ok) {
    return {
      status: "rejected",
      reason: `${profile.slug} is active in another session (peer: ${result.entry.peerId})`,
      occupiedBy: result.entry,
    };
  }

  return { status: "connected", peerId, entry: result.entry };
}

export async function syncAgentToDb(
  profile: AgentProfile,
  sessionId: string,
): Promise<void> {
  await prisma.agent.upsert({
    where: { slug: profile.slug },
    create: {
      slug: profile.slug,
      name: profile.name,
      type: "TENURE",
      rank: profile.rank.toUpperCase() as "ADMIN" | "OPERATOR" | "LEAD" | "AGENT",
      specialty: profile.specialty ?? null,
      domain: profile.domain ?? null,
      meshRead: profile.mesh_read,
      meshWrite: profile.mesh_write,
      modelTier: profile.model_tier,
      skillPack: profile.skill_pack,
      status: "ONLINE",
      currentSessionId: sessionId,
      sessionStartedAt: new Date(),
      heartbeatAt: new Date(),
      sessionCount: 1,
    },
    update: {
      name: profile.name,
      meshRead: profile.mesh_read,
      meshWrite: profile.mesh_write,
      modelTier: profile.model_tier,
      skillPack: profile.skill_pack,
      status: "ONLINE",
      currentSessionId: sessionId,
      sessionStartedAt: new Date(),
      heartbeatAt: new Date(),
      sessionCount: { increment: 1 },
    },
  });
}

export async function releaseAgentFromDb(slug: string): Promise<void> {
  await prisma.agent.updateMany({
    where: { slug },
    data: {
      status: "OFFLINE",
      currentSessionId: null,
      sessionStartedAt: null,
      heartbeatAt: null,
      activeTaskIds: [],
    },
  });
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
cd packages/cli
pnpm test
```

Expected: PASS — 2 connect tests + 4 profile tests passing

- [ ] **Step 6: Write packages/cli/src/index.ts**

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { connect as natsConnect } from "nats";
import { AgentRegistry, REGISTRY_BUCKET } from "@ai-org/broker";
import { readProfile, profilePath } from "./profile.js";
import { buildConnectAction, syncAgentToDb, releaseAgentFromDb } from "./commands/connect.js";
import { startHeartbeat } from "./heartbeat.js";
import { randomUUID } from "crypto";
import { resolve } from "path";

const program = new Command();
const NATS_URL = process.env["NATS_URL"] ?? "nats://localhost:4222";
const REPO_ROOT = process.env["AI_ORG_ROOT"] ?? resolve(process.cwd());

program
  .name("ai-org")
  .description("ai-org CLI — connect to your agent team")
  .version("0.1.0");

program
  .command("connect")
  .description("Connect to the agent mesh")
  .option("--as <slug>", "Connect as a specific agent profile")
  .action(async (opts: { as?: string }) => {
    const slug = opts.as ?? "mission-op";
    const filePath = profilePath(slug, REPO_ROOT);

    let profile;
    try {
      profile = await readProfile(filePath);
    } catch {
      console.error(`Error: No profile found for slug "${slug}" at ${filePath}`);
      process.exit(1);
    }

    let nc;
    try {
      nc = await natsConnect({ servers: NATS_URL });
    } catch {
      console.error(`Error: Cannot connect to NATS at ${NATS_URL}`);
      console.error("Start NATS with: docker run -d -p 4222:4222 nats:alpine -js");
      process.exit(1);
    }

    const js = nc.jetstream();
    const kv = await js.views.kv(REGISTRY_BUCKET, { history: 1 });
    const registry = new AgentRegistry(kv);

    const peerId = randomUUID();
    const result = await buildConnectAction(registry, profile, peerId);

    if (result.status === "rejected") {
      console.error(`\n✗ ${result.reason}`);
      console.error("  Use a different terminal or wait for the session to expire.\n");
      await nc.close();
      process.exit(1);
    }

    if (result.status === "reclaimed") {
      console.log(`\n⚠  Prior session found — auto-reclaimed.`);
      console.log(`   ${result.notice}\n`);
    }

    // Sync to Prisma DB
    await syncAgentToDb(profile, peerId);

    const { stop } = startHeartbeat(registry, slug, peerId);

    console.log(`\n✓ Connected as ${profile.emoji} ${profile.name} [${slug}]`);
    console.log(`  Peer ID: ${peerId}`);
    console.log(`  Rank: ${profile.rank}${profile.domain ? ` · ${profile.domain}` : ""}${profile.specialty ? ` · ${profile.specialty}` : ""}`);
    console.log(`  Heartbeat: every 30s · Stale threshold: 90s\n`);

    // Graceful shutdown
    const shutdown = async () => {
      stop();
      await registry.release(slug, peerId);
      await releaseAgentFromDb(slug);
      await nc.close();
      console.log(`\n  ${profile.emoji} ${profile.name} disconnected.\n`);
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

program.parse();
```

- [ ] **Step 7: Build and smoke-test**

```bash
cd packages/cli
pnpm build
```

Expected: `dist/src/index.js` created with no TypeScript errors.

```bash
# With NATS running and DATABASE_URL set:
node dist/src/index.js connect --as dev-lead
```

Expected output:
```
✓ Connected as 🔧 Dev Lead [dev-lead]
  Peer ID: <uuid>
  Rank: lead · dev
  Heartbeat: every 30s · Stale threshold: 90s
```

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/ packages/cli/tests/connect.test.ts
git commit -m "feat(f01): ai-org connect CLI with heartbeat and graceful shutdown"
```

---

### Task 9: Wire and verify end-to-end

- [ ] **Step 1: Install all packages from root**

```bash
cd /path/to/ai-org-root
pnpm install
```

Expected: All `packages/*` linked via pnpm workspace symlinks.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: All tests across `packages/broker` and `packages/cli` pass.

- [ ] **Step 3: Run typecheck across all packages**

```bash
pnpm typecheck
```

Expected: Zero TypeScript errors.

- [ ] **Step 4: Verify stale reclaim end-to-end**

With NATS running, open two terminals:

**Terminal 1:** `node packages/cli/dist/src/index.js connect --as dev-lead`
Expected: Connected banner.

**Terminal 2:** `node packages/cli/dist/src/index.js connect --as dev-lead`
Expected: `✗ dev-lead is active in another session`

Kill Terminal 1 (`Ctrl+C`). Wait 90s. Try Terminal 2 again.
Expected: `⚠  Prior session found — auto-reclaimed.` + connected banner.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat(f01): F01 Agent Identity complete — profiles, broker, schema, CLI"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Profile flat files — initial 5 agents | Task 2 |
| YAML frontmatter (name, slug, rank, vibe, emoji) | Task 2 |
| Markdown body (Identity, Mission, Critical Rules, Communication Style) | Task 2 |
| NATS KV bucket `agent-registry` | Task 6 |
| Key: slug → RegistryEntry | Task 6 |
| claim / heartbeat / reclaim / discover | Task 6 |
| Stale threshold 90s | Task 5 + Task 6 |
| Prisma Agent model (all Chat B fields) | Task 3 |
| `ai-org connect [--as <slug>]` | Task 8 |
| Auto-reclaim stale sessions | Task 6 |
| Hard reject live sessions | Task 6 + Task 8 |
| Heartbeat loop (30s) | Task 8 |
| Graceful shutdown (release on SIGINT/SIGTERM) | Task 8 |
| MCP messaging surface (list_peers, send_message) | **Out of scope — F06** |

**Gaps found:** None.

**Placeholder scan:** No TBDs, no "similar to Task N", no steps without code.

**Type consistency:**
- `RegistryEntry` defined in Task 4 `types.ts` — used correctly in Task 6 `registry.ts` and Task 8 `connect.ts`
- `AgentProfile` defined in Task 7 `profile.ts` — used correctly in Task 8 `connect.ts`
- `ClaimResult` defined in Task 4 — returned by `registry.claim()` in Task 6, consumed in Task 8
- `buildConnectAction` signature matches its test in Task 8
- `syncAgentToDb` uses Prisma enum strings that match `schema.prisma` (`"TENURE"`, `"ONLINE"`, etc.)
