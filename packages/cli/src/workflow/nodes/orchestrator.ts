import { interrupt } from "@langchain/langgraph";
import { parseManifest, appendHitlLog } from "../manifest.js";
import type { WorkflowState, TaskManifest, HitlDecision } from "../state.js";

/**
 * orchestratorNode — decomposes the task into a TaskManifest and presents
 * Gate 1 (Manifest Approval) for human review.
 *
 * Phase 1: generates a single-lead stub manifest. Replace with LLM call
 * once F08 model routing is wired.
 */
export async function orchestratorNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const manifest = generateStubManifest(state.task, state.threadId);

  // Gate 1 — present manifest for human approval
  const presentedAt = new Date().toISOString();

  const decision = interrupt({
    type: "manifest-approval",
    manifest,
  }) as { decision: HitlDecision; notes: string | null };

  const decidedAt = new Date().toISOString();

  if (decision.decision === "rejected") {
    // Re-run orchestrator with rejection notes injected into task description
    const retryTask = `${state.task}\n\n[Manifest rejected] Notes: ${decision.notes ?? ""}`;
    return orchestratorNode({ ...state, task: retryTask });
  }

  const approvedManifest: TaskManifest = appendHitlLog(
    { ...manifest, approvedAt: decidedAt },
    {
      gate: "manifest-approval",
      leadId: null,
      presentedAt,
      decidedAt,
      decision: decision.decision,
      notes: decision.notes ?? null,
    },
  );

  return { manifest: approvedManifest };
}

// ─── Stub decomposition (Phase 1) ────────────────────────────────────────────

function generateStubManifest(task: string, threadId: string): TaskManifest {
  return parseManifest(`
task: ${task}
thread_id: ${threadId}
requested_by: human
created_at: "${new Date().toISOString()}"
approved_at: null
completed_at: null
leads:
  - id: dev-lead
    goal: "${task}"
    model: auto
    runtime: auto
    tier: 2
    depends_on: []
    gate: human
    max_retries: null
    retry_count: 0
    status: DRAFT
    queued_at: null
    started_at: null
    completed_at: null
    approved_at: null
timeout_minutes: 30
max_retries: 3
mesh_check_interval: 5
hitl_log: []
`);
}
