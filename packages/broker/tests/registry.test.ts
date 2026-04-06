import { describe, it, expect, beforeAll, afterEach } from "vitest";
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
    await registry.forceSet(staleEntry);

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
    await new Promise((r) => setTimeout(r, 10));
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
