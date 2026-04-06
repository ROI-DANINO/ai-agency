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
