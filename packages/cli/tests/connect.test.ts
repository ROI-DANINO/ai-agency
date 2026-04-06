import { describe, it, expect, vi } from "vitest";
import type { AgentRegistry, ClaimResult, RegistryEntry } from "@ai-org/broker";

// Mock @ai-org/db so tests don't need a real database
vi.mock("@ai-org/db", () => ({
  prisma: {
    agent: {
      upsert: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
    },
  },
}));

const { buildConnectAction, syncAgentToDb } = await import("../src/commands/connect.js");

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
  protected: false,
  body: "## Identity\n...",
};

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

describe("syncAgentToDb — protected, spawned_by, scope", () => {
  it("syncs protected:true, no spawnedBy, no scope for protected leads", async () => {
    const { prisma } = await import("@ai-org/db");
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
    const { prisma } = await import("@ai-org/db");
    const upsertSpy = vi.mocked(prisma.agent.upsert);
    upsertSpy.mockClear();

    await syncAgentToDb(subAgentProfile, "session-xyz");

    const call = upsertSpy.mock.calls[0]![0];
    expect(call.create.spawnedBy).toBe("dev-lead");
    expect(call.create.scope).toBe("TASK");
    expect(call.create.protected).toBe(false);
    expect(call.update.spawnedBy).toBe("dev-lead");
    expect(call.update.scope).toBe("TASK");
    expect(call.update.protected).toBe(false);
  });

  it("throws when spawnedBy is set but scope is absent", async () => {
    const badProfile = { ...subAgentProfile, scope: undefined as unknown as "task" };
    await expect(syncAgentToDb(badProfile, "session-bad")).rejects.toThrow(
      'spawnedBy and scope must both be set or both be absent',
    );
  });

  it("throws when scope is set but spawnedBy is absent", async () => {
    const badProfile = { ...subAgentProfile, spawnedBy: undefined };
    await expect(syncAgentToDb(badProfile, "session-bad")).rejects.toThrow(
      'spawnedBy and scope must both be set or both be absent',
    );
  });
});
