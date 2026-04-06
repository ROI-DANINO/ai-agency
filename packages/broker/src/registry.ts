import type { KV } from "nats";
import { JSONCodec, KvWatchOptions } from "nats";
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

    return { ok: true, entry: newEntry };
  }

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
    try {
      const iter = await this.kv.history({ headers_only: false } as KvWatchOptions);
      const seen = new Set<string>();
      for await (const entry of iter) {
        // history() delivers all entries including deletes; skip deleted ones
        if (entry.operation === "DEL" || entry.operation === "PURGE") {
          seen.add(entry.key);
          continue;
        }
        if (seen.has(entry.key)) continue;
        seen.add(entry.key);
        try {
          if (entry.value.length > 0) {
            results.push(jc.decode(entry.value));
          }
        } catch {
          // skip malformed entries
        }
        if (iter.getProcessed() > 0 && (iter as any).info?.endOfInitial) break;
      }
    } catch {
      // fallback to keys() if history fails
      const keys = await this.kv.keys();
      for await (const key of keys) {
        const entry = await this.get(key);
        if (entry !== null) results.push(entry);
      }
    }
    return results;
  }
}
