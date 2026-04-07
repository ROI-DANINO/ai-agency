// Gate formatters produce human-readable CLI strings for each HITL interrupt.
// The CLI prints these, reads input, and passes the decision back via Command(resume=).

function divider(): string {
  return "\u2500".repeat(60);
}

// ─── Gate 1 — Manifest Approval ──────────────────────────────────────────────

export function formatGate1(params: {
  task: string;
  leads: Array<{ id: string; goal: string; dependsOn: string[]; gate: string }>;
}): string {
  const lines = [
    divider(),
    "\u23F8  GATE 1 \u2014 Manifest Approval",
    divider(),
    `Task: ${params.task}`,
    "",
    "Leads:",
    ...params.leads.map((l) => {
      const deps = l.dependsOn.length > 0 ? ` \u2192 depends on: ${l.dependsOn.join(", ")}` : "";
      return `  [${l.gate === "human" ? "\u{1F464}" : "\u{1F916}"}] ${l.id}${deps}\n     Goal: ${l.goal}`;
    }),
    "",
    "Options: approve | reject <notes> | edit",
    divider(),
  ];
  return lines.join("\n");
}

// ─── Gate 2 — Lead Output ────────────────────────────────────────────────────

export function formatGate2(params: {
  leadId: string;
  summary: string;
  meshEventCount: number;
  waitingLeads: string[];
  retryCount: number;
  maxRetries: number;
}): string {
  const waiting =
    params.waitingLeads.length > 0
      ? `Waiting for approval: ${params.waitingLeads.join(", ")}`
      : "No leads waiting on this one.";

  const retryInfo =
    params.retryCount > 0
      ? ` (retry ${params.retryCount}/${params.maxRetries})`
      : "";

  const lines = [
    divider(),
    `\u23F8  GATE 2 \u2014 Lead Output: ${params.leadId}${retryInfo}`,
    divider(),
    `Summary: ${params.summary}`,
    `Mesh events: ${params.meshEventCount}`,
    waiting,
    "",
    "Options: approve | reject <notes> | redirect <new-goal>",
    divider(),
  ];
  return lines.join("\n");
}

// ─── Gate 3 — Early Blocker ─────────────────────────────────────────────────

export function formatGate3(params: {
  leadId: string;
  message: string;
  blockedAt: string;
  downstreamLeads: string[];
}): string {
  const downstream =
    params.downstreamLeads.length > 0
      ? `Downstream impact: ${params.downstreamLeads.join(", ")}`
      : "No downstream leads affected.";

  const lines = [
    divider(),
    `\u23F8  GATE 3 \u2014 Blocker: ${params.leadId}`,
    divider(),
    `Blocked at: ${params.blockedAt}`,
    `Message: ${params.message}`,
    downstream,
    "",
    "Options: resolve <value> | skip | abort",
    divider(),
  ];
  return lines.join("\n");
}

// ─── Gate 4 — Final Synthesis ────────────────────────────────────────────────

export function formatGate4(params: {
  task: string;
  totalDurationMs: number;
  leadSummaries: Array<{ leadId: string; summary: string }>;
  openItems: string[];
}): string {
  const duration = `${Math.round(params.totalDurationMs / 1000)}s`;

  const lines = [
    divider(),
    "\u23F8  GATE 4 \u2014 Final Synthesis",
    divider(),
    `Task: ${params.task}`,
    `Duration: ${duration}`,
    "",
    "Lead outputs:",
    ...params.leadSummaries.map((l) => `  ${l.leadId}: ${l.summary}`),
    ...(params.openItems.length > 0
      ? ["", "Open items:", ...params.openItems.map((i) => `  \u26A0 ${i}`)]
      : []),
    "",
    "Options: approve | reject <lead-id> <notes>",
    divider(),
  ];
  return lines.join("\n");
}

// ─── Retry Limit Gate ────────────────────────────────────────────────────────

export function formatRetryLimit(params: {
  leadId: string;
  retryCount: number;
  maxRetries: number;
}): string {
  const lines = [
    divider(),
    `\u23F8  RETRY LIMIT \u2014 ${params.leadId}`,
    divider(),
    `${params.leadId} has been rejected ${params.retryCount}/${params.maxRetries} times.`,
    "",
    "Options: abort | force-approve | change-goal <new-goal>",
    divider(),
  ];
  return lines.join("\n");
}
