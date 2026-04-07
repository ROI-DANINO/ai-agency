import yaml from "js-yaml";
import type { TaskManifest, LeadTask, HitlLogEntry } from "./state.js";

// ─── Parse (YAML → TaskManifest) ─────────────────────────────────────────────

export function parseManifest(raw: string): TaskManifest {
  const doc = yaml.load(raw) as Record<string, unknown>;

  if (!doc["task"] || !doc["thread_id"] || !doc["leads"]) {
    throw new Error("Invalid manifest: missing required fields (task, thread_id, leads)");
  }

  const leads = (doc["leads"] as Record<string, unknown>[]).map(parseLeadTask);

  return {
    task: String(doc["task"]),
    threadId: String(doc["thread_id"]),
    requestedBy: String(doc["requested_by"] ?? "human"),
    createdAt: String(doc["created_at"] ?? new Date().toISOString()),
    approvedAt: (doc["approved_at"] as string | null) ?? null,
    completedAt: (doc["completed_at"] as string | null) ?? null,
    leads,
    timeoutMinutes: Number(doc["timeout_minutes"] ?? 30),
    maxRetries: Number(doc["max_retries"] ?? 3),
    meshCheckInterval: Number(doc["mesh_check_interval"] ?? 5),
    hitlLog: ((doc["hitl_log"] ?? []) as HitlLogEntry[]),
  };
}

function parseLeadTask(raw: Record<string, unknown>): LeadTask {
  return {
    id: String(raw["id"]),
    goal: String(raw["goal"] ?? ""),
    model: String(raw["model"] ?? "auto"),
    runtime: String(raw["runtime"] ?? "auto"),
    tier: Number(raw["tier"] ?? 2),
    dependsOn: ((raw["depends_on"] ?? []) as string[]),
    gate: (raw["gate"] as "human" | "auto") ?? "auto",
    maxRetries: raw["max_retries"] != null ? Number(raw["max_retries"]) : null,
    retryCount: Number(raw["retry_count"] ?? 0),
    status: (raw["status"] as LeadTask["status"]) ?? "DRAFT",
    queuedAt: (raw["queued_at"] as string | null) ?? null,
    startedAt: (raw["started_at"] as string | null) ?? null,
    completedAt: (raw["completed_at"] as string | null) ?? null,
    approvedAt: (raw["approved_at"] as string | null) ?? null,
  };
}

// ─── Serialize (TaskManifest → YAML) ─────────────────────────────────────────

export function serializeManifest(manifest: TaskManifest): string {
  const doc = {
    task: manifest.task,
    thread_id: manifest.threadId,
    requested_by: manifest.requestedBy,
    created_at: manifest.createdAt,
    approved_at: manifest.approvedAt,
    completed_at: manifest.completedAt,
    leads: manifest.leads.map(serializeLeadTask),
    timeout_minutes: manifest.timeoutMinutes,
    max_retries: manifest.maxRetries,
    mesh_check_interval: manifest.meshCheckInterval,
    hitl_log: manifest.hitlLog,
  };
  return yaml.dump(doc, { lineWidth: 120 });
}

function serializeLeadTask(lead: LeadTask): Record<string, unknown> {
  return {
    id: lead.id,
    goal: lead.goal,
    model: lead.model,
    runtime: lead.runtime,
    tier: lead.tier,
    depends_on: lead.dependsOn,
    gate: lead.gate,
    max_retries: lead.maxRetries,
    retry_count: lead.retryCount,
    status: lead.status,
    queued_at: lead.queuedAt,
    started_at: lead.startedAt,
    completed_at: lead.completedAt,
    approved_at: lead.approvedAt,
  };
}

// ─── DAG helpers ─────────────────────────────────────────────────────────────

/**
 * Returns leads that are DRAFT and have all dependencies APPROVED
 * (or AUTO-completed with gate:auto).
 */
export function getReadyLeads(manifest: TaskManifest): LeadTask[] {
  return manifest.leads.filter((lead) => {
    if (lead.status !== "DRAFT") return false;
    return lead.dependsOn.every((depId) => {
      const dep = manifest.leads.find((l) => l.id === depId);
      if (!dep) return false;
      if (dep.gate === "auto") return dep.status === "COMPLETED" || dep.status === "APPROVED";
      return dep.status === "APPROVED";
    });
  });
}

/**
 * Resolves effective max_retries for a lead:
 * uses lead-level override if set, otherwise falls back to manifest global.
 */
export function resolveMaxRetries(lead: LeadTask, manifest: TaskManifest): number {
  return lead.maxRetries ?? manifest.maxRetries;
}

// ─── hitl_log ─────────────────────────────────────────────────────────────────

/** Returns a new manifest with the entry appended (immutable). */
export function appendHitlLog(
  manifest: TaskManifest,
  entry: HitlLogEntry,
): TaskManifest {
  return {
    ...manifest,
    hitlLog: [...manifest.hitlLog, entry],
  };
}
