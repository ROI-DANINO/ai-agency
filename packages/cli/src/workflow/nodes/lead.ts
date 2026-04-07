import { interrupt } from "@langchain/langgraph";
import { appendHitlLog, resolveMaxRetries } from "../manifest.js";
import type { HermesClient } from "../hermes.js";
import type { WorkflowState, TaskManifest, LeadOutput, HitlDecision } from "../state.js";

const DEFAULT_MESH_ROOT = ".mesh";

/**
 * leadNodeFactory — returns a leadNode bound to a HermesClient and mesh root.
 * One instance runs per Lead in the fan-out (via Send API).
 */
export function leadNodeFactory(hermes: HermesClient, meshRoot = DEFAULT_MESH_ROOT) {
  return async function leadNode(
    state: WorkflowState & { currentLeadId: string },
  ): Promise<Partial<WorkflowState>> {
    const { manifest, currentLeadId, threadId } = state;
    const lead = manifest!.leads.find((l) => l.id === currentLeadId)!;

    // Mark as RUNNING
    let updatedManifest: TaskManifest = {
      ...manifest!,
      leads: manifest!.leads.map((l) =>
        l.id === currentLeadId
          ? { ...l, status: "RUNNING", startedAt: new Date().toISOString() }
          : l,
      ),
    };

    // Spawn Lead session via Hermes
    const result = await hermes.spawn({
      leadId: currentLeadId,
      briefing: lead.goal,
      model: lead.model,
      runtime: lead.runtime,
      threadId,
      meshRoot,
    });

    const completedAt = new Date().toISOString();

    // Mark as COMPLETED
    updatedManifest = {
      ...updatedManifest,
      leads: updatedManifest.leads.map((l) =>
        l.id === currentLeadId
          ? { ...l, status: "COMPLETED", completedAt }
          : l,
      ),
    };

    const output: LeadOutput = {
      leadId: currentLeadId,
      completedAt,
      meshEventCount: result.meshEventCount,
      summary: result.summary,
    };

    // Gate 2 — human approval required?
    if (lead.gate === "human") {
      const maxRetries = resolveMaxRetries(lead, updatedManifest);
      const presentedAt = new Date().toISOString();

      const decision = interrupt({
        type: "lead-output",
        leadId: currentLeadId,
        output,
        retryCount: lead.retryCount,
        maxRetries,
        waitingLeads: updatedManifest.leads
          .filter((l) => l.dependsOn.includes(currentLeadId))
          .map((l) => l.id),
      }) as { decision: HitlDecision; notes: string | null };

      const decidedAt = new Date().toISOString();

      updatedManifest = appendHitlLog(updatedManifest, {
        gate: "lead-output",
        leadId: currentLeadId,
        presentedAt,
        decidedAt,
        decision: decision.decision,
        notes: decision.notes ?? null,
      });

      if (decision.decision === "rejected") {
        if (lead.retryCount + 1 >= maxRetries) {
          // Retry limit exceeded — surface retry-limit gate
          const retryDecision = interrupt({
            type: "retry-limit",
            leadId: currentLeadId,
            retryCount: lead.retryCount + 1,
            maxRetries,
            rejectionHistory: updatedManifest.hitlLog
              .filter((e) => e.gate === "lead-output" && e.leadId === currentLeadId),
          }) as { decision: "abort" | "change-goal" | "force-approve"; newGoal?: string; notes?: string };

          if (retryDecision.decision === "force-approve") {
            updatedManifest = {
              ...updatedManifest,
              leads: updatedManifest.leads.map((l) =>
                l.id === currentLeadId ? { ...l, status: "APPROVED", approvedAt: new Date().toISOString() } : l,
              ),
            };
          } else if (retryDecision.decision === "abort") {
            updatedManifest = {
              ...updatedManifest,
              leads: updatedManifest.leads.map((l) =>
                l.id === currentLeadId ? { ...l, status: "REJECTED" } : l,
              ),
            };
          }
          // change-goal: caller handles re-DRAFT with new goal
        } else {
          // Normal reject — back to DRAFT with notes
          updatedManifest = {
            ...updatedManifest,
            leads: updatedManifest.leads.map((l) =>
              l.id === currentLeadId
                ? {
                    ...l,
                    status: "DRAFT",
                    retryCount: l.retryCount + 1,
                    goal: `${l.goal}\n\n[Retry ${l.retryCount + 1}] Rejection notes: ${decision.notes ?? ""}`,
                    completedAt: null,
                    startedAt: null,
                    approvedAt: null,
                  }
                : l,
            ),
          };
        }
        return { manifest: updatedManifest, leadOutputs: { [currentLeadId]: output } };
      }

      // Approved
      updatedManifest = {
        ...updatedManifest,
        leads: updatedManifest.leads.map((l) =>
          l.id === currentLeadId
            ? { ...l, status: "APPROVED", approvedAt: new Date().toISOString() }
            : l,
        ),
      };
    } else {
      // gate: auto — accept immediately
      updatedManifest = {
        ...updatedManifest,
        leads: updatedManifest.leads.map((l) =>
          l.id === currentLeadId
            ? { ...l, status: "APPROVED", approvedAt: new Date().toISOString() }
            : l,
        ),
      };
    }

    return {
      manifest: updatedManifest,
      completedLeads: [currentLeadId],
      leadOutputs: { [currentLeadId]: output },
    };
  };
}
