import { interrupt } from "@langchain/langgraph";
import { appendHitlLog, applyLeadRejection } from "../manifest.js";
import type { WorkflowState, DecisionReport, HitlDecision } from "../state.js";

/**
 * collectorNode — aggregates all lead outputs, handles pending blockers (Gate 3),
 * then presents Gate 4 (Final Synthesis) for human review.
 *
 * If the human rejects at Gate 4, rejected leads go back to DRAFT and the
 * function returns updated manifest for dispatcher to re-run them.
 */
export async function collectorNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  let manifest = state.manifest!;
  const workflowStartedAt = new Date(manifest.createdAt).getTime();

  // ── Gate 3: pending blockers ────────────────────────────────────────────────
  if (state.pendingBlockers.length > 0) {
    for (const blocker of state.pendingBlockers) {
      const presentedAt = new Date().toISOString();

      const decision = interrupt({
        type: "blocker",
        leadId: blocker.agent,
        message: blocker.message,
        blockedAt: blocker.timestamp,
        downstreamLeads: manifest.leads
          .filter((l) => l.dependsOn.includes(blocker.agent))
          .map((l) => l.id),
      }) as { decision: "resolve" | "skip" | "abort"; notes: string | null };

      manifest = appendHitlLog(manifest, {
        gate: "blocker",
        leadId: blocker.agent,
        presentedAt,
        decidedAt: new Date().toISOString(),
        decision: decision.decision,
        notes: decision.notes ?? null,
      });

      if (decision.decision === "abort") {
        manifest = {
          ...manifest,
          leads: manifest.leads.map((l) =>
            l.id === blocker.agent ? { ...l, status: "REJECTED" } : l,
          ),
        };
      }
      // resolve/skip: lead continues — mesh_watcher will re-spawn or lead completes
    }
  }

  // ── Build DecisionReport ────────────────────────────────────────────────────
  const allOutputs = Object.values(state.leadOutputs);
  const report: DecisionReport = {
    threadId: state.threadId,
    task: manifest.task,
    totalDurationMs: Date.now() - workflowStartedAt,
    leadOutputs: allOutputs,
    openItems: state.pendingBlockers.map((b) => `[${b.agent}] ${b.message}`),
  };

  // ── Gate 4: Final Synthesis ─────────────────────────────────────────────────
  const presentedAt = new Date().toISOString();

  const decision = interrupt({
    type: "final-synthesis",
    report,
    manifest,
  }) as { decision: HitlDecision; rejectedLeads?: Array<{ id: string; notes: string }> };

  const decidedAt = new Date().toISOString();

  manifest = appendHitlLog(manifest, {
    gate: "final-synthesis",
    leadId: null,
    presentedAt,
    decidedAt,
    decision: decision.decision,
    notes: null,
  });

  if (decision.decision === "approved") {
    manifest = { ...manifest, completedAt: decidedAt };
    return { manifest, decisionReport: report };
  }

  // Rejected: apply rejection to named leads → dispatcher will re-run them
  for (const { id, notes } of decision.rejectedLeads ?? []) {
    manifest = applyLeadRejection(manifest, id, notes);
  }

  return { manifest, decisionReport: report };
}
