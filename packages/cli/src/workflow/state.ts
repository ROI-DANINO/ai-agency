import { Annotation } from "@langchain/langgraph";

// ─── Domain types ────────────────────────────────────────────────────────────

export type LeadStatus =
  | "DRAFT"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "AWAITING_HUMAN"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED";

export interface LeadTask {
  id: string;
  goal: string;
  model: string;
  runtime: string;
  tier: number;
  dependsOn: string[];
  gate: "human" | "auto";
  maxRetries: number | null;
  retryCount: number;
  status: LeadStatus;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  approvedAt: string | null;
}

export type HitlGateType =
  | "manifest-approval"
  | "lead-output"
  | "blocker"
  | "final-synthesis"
  | "retry-limit";

export type HitlDecision =
  | "approved"
  | "rejected"
  | "resolve"
  | "skip"
  | "abort"
  | "force-approve"
  | "change-goal"
  | "redirect";

export interface HitlLogEntry {
  gate: HitlGateType;
  leadId: string | null;
  presentedAt: string;
  decidedAt: string | null;
  decision: HitlDecision | null;
  notes: string | null;
}

export interface TaskManifest {
  task: string;
  threadId: string;
  requestedBy: string;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  leads: LeadTask[];
  timeoutMinutes: number;
  maxRetries: number;
  meshCheckInterval: number;
  hitlLog: HitlLogEntry[];
}

export interface MeshEvent {
  timestamp: string;
  agent: string;
  threadId: string;
  event: "checkpoint" | "blocker" | "completed";
  message: string;
  data: Record<string, unknown>;
}

export interface LeadOutput {
  leadId: string;
  completedAt: string;
  meshEventCount: number;
  summary: string;
}

export interface DecisionReport {
  threadId: string;
  task: string;
  totalDurationMs: number;
  leadOutputs: LeadOutput[];
  openItems: string[];
}

// ─── LangGraph state annotation ──────────────────────────────────────────────

export const WorkflowStateAnnotation = Annotation.Root({
  threadId: Annotation<string>(),
  task: Annotation<string>(),
  manifest: Annotation<TaskManifest | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
  meshSnapshot: Annotation<MeshEvent[]>({
    default: () => [],
    reducer: (prev, next) => [...prev, ...next],
  }),
  pendingBlockers: Annotation<MeshEvent[]>({
    default: () => [],
    reducer: (prev, next) => [...prev, ...next],
  }),
  completedLeads: Annotation<string[]>({
    default: () => [],
    reducer: (prev, next) => [...new Set([...prev, ...next])],
  }),
  leadOutputs: Annotation<Record<string, LeadOutput>>({
    default: () => ({}),
    reducer: (prev, next) => ({ ...prev, ...next }),
  }),
  decisionReport: Annotation<DecisionReport | null>({
    default: () => null,
    reducer: (_prev, next) => next,
  }),
});

export type WorkflowState = typeof WorkflowStateAnnotation.State;
