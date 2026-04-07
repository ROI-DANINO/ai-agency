import { Send } from "@langchain/langgraph";
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
 * dispatcherNode — reads the manifest DAG, sends each ready lead to lead_node.
 * Returns Send[] for LangGraph fan-out. Routes to collector_node if no leads are ready.
 */
export async function dispatcherNode(
  state: WorkflowState,
): Promise<Send[] | { manifest: TaskManifest }> {
  const manifest = state.manifest!;
  const readyIds = resolveDispatch(manifest);

  if (readyIds.length === 0) {
    // Nothing more to dispatch — collector will handle synthesis
    return { manifest };
  }

  // Mark ready leads as QUEUED
  const updatedManifest: TaskManifest = {
    ...manifest,
    leads: manifest.leads.map((lead) =>
      readyIds.includes(lead.id)
        ? { ...lead, status: "QUEUED", queuedAt: new Date().toISOString() }
        : lead,
    ),
  };

  return readyIds.map(
    (leadId) =>
      new Send("lead_node", {
        ...state,
        manifest: updatedManifest,
        currentLeadId: leadId,
      }),
  );
}
