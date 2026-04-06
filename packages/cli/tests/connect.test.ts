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
