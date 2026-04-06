# F02 Team Structure — Plan A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Agent model with `protected`, `spawned_by`, and `scope` fields; sync 7 new leads into `.claude/agents/` symlinks; scaffold the `.mesh/` directory skeleton.

**Architecture:** Three layers — Prisma schema (persistent state), AgentProfile type + profile.ts (profile parsing), connect.ts (DB sync on connect). All three new fields flow from `.md` frontmatter → parsed profile → DB upsert. Symlinks expose all leads to Claude Code and Hermes. `.mesh/` directory structure is scaffolded empty; file format is Plan B.

**Tech Stack:** TypeScript, Prisma (PostgreSQL), Vitest, gray-matter

**Resolved design decisions:**
- `protected`: in DB — needed to enforce dismissal rules at the platform layer
- `spawned_by` + `scope`: in DB — Hermes `delegate_task` is the Phase 1 sub-agent runtime; these fields track delegation lineage and lifecycle in the registry. `AgentType.TEMPORARY` is reserved for task-scoped agents spawned by Hermes.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `packages/db/prisma/schema.prisma` | Add `protected`, `spawned_by`, `scope` to Agent model; add `AgentScope` enum |
| Modify | `packages/cli/src/profile.ts` | Add all three fields to AgentProfile type + parsing |
| Modify | `packages/cli/src/commands/connect.ts` | Pass all three fields in DB upsert |
| Create | `packages/cli/fixtures/recruitment-lead.md` | Test fixture — protected lead (no spawned_by) |
| Create | `packages/cli/fixtures/developer.md` | Test fixture — task-scoped sub-agent (spawned_by + scope) |
| Modify | `packages/cli/tests/profile.test.ts` | Test all three fields parse correctly |
| Modify | `packages/cli/tests/connect.test.ts` | Test all three fields flow into upsert |
| Create | `.claude/agents/` × 7 symlinks | Expose new leads to Claude Code / Hermes |
| Create | `.mesh/` skeleton | Directory structure for Phase 1 mesh |

---

### Task 1: Add `protected`, `spawned_by`, `scope` to Prisma schema

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Add fields and enum**

Replace the full contents of `packages/db/prisma/schema.prisma` with:

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
  specialty        String?
  domain           String?
  meshRead         String[]
  meshWrite        String[]
  modelTier        Int         @default(2)
  skillPack        String[]    @default([])
  tags             String[]    @default([])
  protected        Boolean     @default(false)
  spawnedBy        String?
  scope            AgentScope?
  status           AgentStatus @default(OFFLINE)
  sessionCount     Int         @default(0)
  currentSessionId String?
  sessionStartedAt DateTime?
  heartbeatAt      DateTime?
  activeTaskIds    String[]    @default([])
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

enum AgentScope {
  TASK
  TENURE
}
```

- [ ] **Step 2: Push schema to DB**

```bash
cd /home/roking/Desktop/Projects/ai-org
pnpm db:push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat(f02): add protected, spawned_by, scope fields to Agent schema"
```

---

### Task 2: Add all three fields to AgentProfile type and parser

**Files:**
- Modify: `packages/cli/src/profile.ts`
- Create: `packages/cli/fixtures/recruitment-lead.md`
- Create: `packages/cli/fixtures/developer.md`
- Modify: `packages/cli/tests/profile.test.ts`

- [ ] **Step 1: Write the failing tests**

Add two new describe blocks to `packages/cli/tests/profile.test.ts` after the existing ones:

```typescript
describe("readProfile — protected field", () => {
  const recruitmentFixture = resolve(__dirname, "../fixtures/recruitment-lead.md");

  it("parses protected: true from frontmatter", async () => {
    const profile = await readProfile(recruitmentFixture);
    expect(profile.protected).toBe(true);
    expect(profile.spawnedBy).toBeUndefined();
    expect(profile.scope).toBeUndefined();
  });

  it("defaults protected to false when field is absent", async () => {
    const profile = await readProfile(fixturePath); // dev-lead.md
    expect(profile.protected).toBe(false);
  });
});

describe("readProfile — spawned_by and scope fields", () => {
  const developerFixture = resolve(__dirname, "../fixtures/developer.md");

  it("parses spawned_by and scope from sub-agent frontmatter", async () => {
    const profile = await readProfile(developerFixture);
    expect(profile.spawnedBy).toBe("dev-lead");
    expect(profile.scope).toBe("task");
    expect(profile.protected).toBe(false);
  });

  it("returns undefined scope and spawned_by for leads without those fields", async () => {
    const profile = await readProfile(fixturePath); // dev-lead.md
    expect(profile.spawnedBy).toBeUndefined();
    expect(profile.scope).toBeUndefined();
  });
});
```

- [ ] **Step 2: Create the fixtures**

Create `packages/cli/fixtures/recruitment-lead.md`:

```markdown
---
name: Recruitment Lead
slug: recruitment-lead
rank: lead
domain: recruitment
vibe: Team architect who onboards new agents and reconfigures the roster
emoji: 🤝
model_tier: 2
skill_pack: []
mesh_read:
  - lead
  - operator
mesh_write:
  - lead
protected: true
---

## Identity

You are the Recruitment Lead.

## Mission

Define agent roles, manage onboarding, maintain the roster.

## Critical Rules

- No agent is activated without Admin sign-off.

## Communication Style

Structured, talent-forward.
```

Create `packages/cli/fixtures/developer.md`:

```markdown
---
name: Developer
slug: developer
rank: agent
domain: dev
vibe: Story implementer who follows TDD strictly and never adds unrequested features
emoji: 💻
model_tier: 2
skill_pack: []
spawned_by: dev-lead
scope: task
---

## Identity

You are Amelia, the Developer. Spawned by the Dev Lead to implement specific stories.

## Mission

Implement stories using TDD.

## Critical Rules

- Never start without clear acceptance criteria.

## Communication Style

Implementation-focused. No narrative.
```

- [ ] **Step 3: Run to confirm failure**

```bash
cd /home/roking/Desktop/Projects/ai-org
pnpm --filter @ai-org/cli test tests/profile.test.ts
```

Expected: 4 new tests FAIL — `profile.protected`, `profile.spawnedBy`, `profile.scope` are `undefined`.

- [ ] **Step 4: Update AgentProfile type and parser**

Replace the full contents of `packages/cli/src/profile.ts` with:

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
  specialty?: string;
  domain?: string;
  protected: boolean;
  spawnedBy?: string;
  scope?: "task" | "tenure";
  body: string;
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
    protected: fm["protected"] === true,
    spawnedBy: fm["spawned_by"] !== undefined ? String(fm["spawned_by"]) : undefined,
    scope: fm["scope"] === "task" || fm["scope"] === "tenure" ? fm["scope"] : undefined,
    body: parsed.content,
  };
}

export function profilePath(slug: string, repoRoot: string): string {
  return `${repoRoot}/agents/${slug}.md`;
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
pnpm --filter @ai-org/cli test tests/profile.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/profile.ts \
        packages/cli/fixtures/recruitment-lead.md \
        packages/cli/fixtures/developer.md \
        packages/cli/tests/profile.test.ts
git commit -m "feat(f02): parse protected, spawned_by, scope from agent profile frontmatter"
```

---

### Task 3: Pass all three fields through DB sync

**Files:**
- Modify: `packages/cli/src/commands/connect.ts`
- Modify: `packages/cli/tests/connect.test.ts`

- [ ] **Step 1: Write the failing tests**

In `packages/cli/tests/connect.test.ts`, add after the existing `describe("buildConnectAction", ...)` block:

```typescript
import { prisma } from "@ai-org/db";
// prisma is already mocked via vi.mock above

const { syncAgentToDb } = await import("../src/commands/connect.js");

const protectedProfile = {
  name: "Recruitment Lead",
  slug: "recruitment-lead",
  rank: "lead" as const,
  vibe: "Team architect",
  emoji: "🤝",
  model_tier: 2,
  skill_pack: [],
  mesh_read: ["lead", "operator"],
  mesh_write: ["lead"],
  domain: "recruitment",
  protected: true,
  spawnedBy: undefined,
  scope: undefined,
  body: "## Identity\n...",
};

const subAgentProfile = {
  name: "Developer",
  slug: "developer",
  rank: "agent" as const,
  vibe: "Story implementer",
  emoji: "💻",
  model_tier: 2,
  skill_pack: [],
  mesh_read: [],
  mesh_write: [],
  domain: "dev",
  protected: false,
  spawnedBy: "dev-lead",
  scope: "task" as const,
  body: "## Identity\n...",
};

describe("syncAgentToDb — protected, spawned_by, scope", () => {
  it("syncs protected:true, no spawnedBy, no scope for protected leads", async () => {
    const upsertSpy = vi.mocked(prisma.agent.upsert);
    upsertSpy.mockClear();

    await syncAgentToDb(protectedProfile, "session-abc");

    const call = upsertSpy.mock.calls[0]![0];
    expect(call.create.protected).toBe(true);
    expect(call.create.spawnedBy).toBeNull();
    expect(call.create.scope).toBeNull();
    expect(call.update.protected).toBe(true);
  });

  it("syncs spawned_by and scope for task-scoped sub-agents", async () => {
    const upsertSpy = vi.mocked(prisma.agent.upsert);
    upsertSpy.mockClear();

    await syncAgentToDb(subAgentProfile, "session-xyz");

    const call = upsertSpy.mock.calls[0]![0];
    expect(call.create.spawnedBy).toBe("dev-lead");
    expect(call.create.scope).toBe("TASK");
    expect(call.create.protected).toBe(false);
    expect(call.update.spawnedBy).toBe("dev-lead");
    expect(call.update.scope).toBe("TASK");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm --filter @ai-org/cli test tests/connect.test.ts
```

Expected: 2 new tests FAIL.

- [ ] **Step 3: Update syncAgentToDb**

Replace `syncAgentToDb` in `packages/cli/src/commands/connect.ts`:

```typescript
export async function syncAgentToDb(
  profile: AgentProfile,
  sessionId: string,
): Promise<void> {
  const scopeValue = profile.scope
    ? (profile.scope.toUpperCase() as "TASK" | "TENURE")
    : null;

  await prisma.agent.upsert({
    where: { slug: profile.slug },
    create: {
      slug: profile.slug,
      name: profile.name,
      type: profile.scope === "task" ? "TEMPORARY" : "TENURE",
      rank: profile.rank.toUpperCase() as "ADMIN" | "OPERATOR" | "LEAD" | "AGENT",
      specialty: profile.specialty ?? null,
      domain: profile.domain ?? null,
      meshRead: profile.mesh_read,
      meshWrite: profile.mesh_write,
      modelTier: profile.model_tier,
      skillPack: profile.skill_pack,
      protected: profile.protected,
      spawnedBy: profile.spawnedBy ?? null,
      scope: scopeValue,
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
      protected: profile.protected,
      spawnedBy: profile.spawnedBy ?? null,
      scope: scopeValue,
      status: "ONLINE",
      currentSessionId: sessionId,
      sessionStartedAt: new Date(),
      heartbeatAt: new Date(),
      sessionCount: { increment: 1 },
    },
  });
}
```

- [ ] **Step 4: Run all CLI tests — expect pass**

```bash
pnpm --filter @ai-org/cli test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/connect.ts packages/cli/tests/connect.test.ts
git commit -m "feat(f02): sync protected, spawned_by, scope from profile to DB on connect"
```

---

### Task 4: Create `.claude/agents/` symlinks for 7 new leads

**Files:**
- Create: `.claude/agents/{slug}.md` × 7 (symlinks)

- [ ] **Step 1: Create the symlinks**

```bash
cd /home/roking/Desktop/Projects/ai-org/.claude/agents
ln -s ../../agents/devops-lead.md devops-lead.md
ln -s ../../agents/knowledge-lead.md knowledge-lead.md
ln -s ../../agents/operations-lead.md operations-lead.md
ln -s ../../agents/quality-lead.md quality-lead.md
ln -s ../../agents/recruitment-lead.md recruitment-lead.md
ln -s ../../agents/security-lead.md security-lead.md
ln -s ../../agents/ux-lead.md ux-lead.md
```

- [ ] **Step 2: Verify symlinks resolve**

```bash
ls -la /home/roking/Desktop/Projects/ai-org/.claude/agents/
```

Expected: 12 entries total (5 existing + 7 new), all pointing to `../../agents/`.

```bash
head -3 /home/roking/Desktop/Projects/ai-org/.claude/agents/recruitment-lead.md
```

Expected: prints `---` frontmatter of `agents/recruitment-lead.md`.

- [ ] **Step 3: Commit**

```bash
cd /home/roking/Desktop/Projects/ai-org
git add .claude/agents/
git commit -m "feat(f02): add .claude/agents symlinks for 7 new leads"
```

---

### Task 5: Scaffold `.mesh/` directory skeleton

**Files:**
- Create: `.mesh/agents/.gitkeep`
- Create: `.mesh/channels/.gitkeep`
- Create: `.mesh/dms/.gitkeep`

- [ ] **Step 1: Create directory skeleton**

```bash
mkdir -p /home/roking/Desktop/Projects/ai-org/.mesh/agents
mkdir -p /home/roking/Desktop/Projects/ai-org/.mesh/channels
mkdir -p /home/roking/Desktop/Projects/ai-org/.mesh/dms
touch /home/roking/Desktop/Projects/ai-org/.mesh/agents/.gitkeep
touch /home/roking/Desktop/Projects/ai-org/.mesh/channels/.gitkeep
touch /home/roking/Desktop/Projects/ai-org/.mesh/dms/.gitkeep
```

- [ ] **Step 2: Verify structure**

```bash
find /home/roking/Desktop/Projects/ai-org/.mesh -type f
```

Expected:
```
.mesh/agents/.gitkeep
.mesh/channels/.gitkeep
.mesh/dms/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
cd /home/roking/Desktop/Projects/ai-org
git add .mesh/
git commit -m "feat(f02): scaffold .mesh/ directory skeleton"
```

---

## Self-Review

**Spec coverage:**
- ✓ `protected` — flows from frontmatter → AgentProfile → DB; tested for both true and false
- ✓ `spawned_by` / `scope` — flows from sub-agent frontmatter → AgentProfile → DB; `scope: task` maps to `AgentType.TEMPORARY` + `AgentScope.TASK`; tested for sub-agents and leads
- ✓ 7 new leads symlinked in `.claude/agents/` — devops, knowledge, operations, quality, recruitment, security, ux
- ✓ `.mesh/` skeleton — `agents/`, `channels/`, `dms/` directories created
- ✓ Plan B (mesh file format) and Plan C (CoS skill) explicitly out of scope

**Placeholder scan:** None — all steps have exact code and commands.

**Type consistency:** `spawnedBy` (camelCase) used in `AgentProfile` and `syncAgentToDb` throughout; frontmatter key `spawned_by` (snake_case) mapped at parse time. `scope` values `"task"/"tenure"` in TypeScript uppercased to `"TASK"/"TENURE"` for Prisma enum at the DB boundary — consistently applied in both `create` and `update` clauses and test assertions.
