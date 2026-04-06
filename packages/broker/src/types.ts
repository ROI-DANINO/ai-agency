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
