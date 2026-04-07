import { getReadyLeads } from "../manifest.js";
import type { WorkflowState, TaskManifest } from "../state.js";

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

/** Returns IDs of leads ready to dispatch (DRAFT + deps satisfied). */
export function resolveDispatch(manifest: TaskManifest): string[] {
  return getReadyLeads(manifest).map((l) => l.id);
}

/**
 * Marks a lead as DRAFT with notes embedded in goal (for re-dispatch).
 * Increments retryCount, resets runtime timestamps.
 */
export function applyLeadRejection(
  manifest: TaskManifest,
  leadId: string,
  notes: string,
): TaskManifest {
  return {
    ...manifest,
    leads: manifest.leads.map((lead) => {
      if (lead.id !== leadId) return lead;
      return {
        ...lead,
        status: "DRAFT",
        retryCount: lead.retryCount + 1,
        goal: `${lead.goal}\n\n[Retry ${lead.retryCount + 1}] Rejection notes: ${notes}`,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
        approvedAt: null,
      };
    }),
  };
}

// ─── LangGraph node ────────────────────────────────────────────────────────────

/**
 * dispatcherNode — reads the manifest DAG, marks ready leads as QUEUED,
 * sets currentLeadId to the first ready lead for the lead_node to process.
 * The graph edges handle routing: → lead_node if ready leads exist, → collector otherwise.
 */
export async function dispatcherNode(
  state: WorkflowState,
): Promise<Partial<WorkflowState>> {
  const manifest = state.manifest!;
  const readyIds = getReadyLeads(manifest);

  if (readyIds.length === 0) {
    // Nothing to dispatch
    return { manifest };
  }

  // Mark first ready lead as QUEUED and set as current
  const lead = readyIds[0]!;
  const updatedManifest: TaskManifest = {
    ...manifest,
    leads: manifest.leads.map((l) =>
      l.id === lead.id
        ? { ...l, status: "QUEUED", queuedAt: new Date().toISOString() }
        : l,
    ),
  };

  return {
    manifest: updatedManifest,
    currentLeadId: lead.id,
  };
}
