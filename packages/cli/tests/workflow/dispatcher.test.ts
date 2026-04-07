import { describe, it, expect } from "vitest";
import { resolveDispatch, applyLeadRejection } from "../../src/workflow/nodes/dispatcher.js";
import type { TaskManifest, LeadTask } from "../../src/workflow/state.js";

function makeLead(overrides: Partial<LeadTask> & { id: string }): LeadTask {
  return {
    goal: "Do something",
    model: "auto",
    runtime: "auto",
    tier: 2,
    dependsOn: [],
    gate: "auto",
    maxRetries: null,
    retryCount: 0,
    status: "DRAFT",
    queuedAt: null,
    startedAt: null,
    completedAt: null,
    approvedAt: null,
    ...overrides,
  };
}

function makeManifest(leads: LeadTask[]): TaskManifest {
  return {
    task: "Test task",
    threadId: "wf-test-001",
    requestedBy: "human",
    createdAt: "2026-04-07T10:00:00Z",
    approvedAt: "2026-04-07T10:01:00Z",
    completedAt: null,
    leads,
    timeoutMinutes: 30,
    maxRetries: 3,
    meshCheckInterval: 5,
    hitlLog: [],
  };
}

describe("resolveDispatch", () => {
  it("returns lead IDs that are ready to run", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", status: "DRAFT" }),
      makeLead({ id: "pm-lead", status: "DRAFT" }),
      makeLead({ id: "dev-lead", dependsOn: ["ux-lead"], status: "DRAFT" }),
    ]);
    const readyIds = resolveDispatch(manifest);
    expect(readyIds.sort()).toEqual(["pm-lead", "ux-lead"]);
  });

  it("returns empty array when all leads are running or done", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", status: "RUNNING" }),
      makeLead({ id: "pm-lead", status: "APPROVED" }),
    ]);
    expect(resolveDispatch(manifest)).toHaveLength(0);
  });

  it("returns dependent lead after its dependency is approved", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", status: "APPROVED" }),
      makeLead({ id: "dev-lead", dependsOn: ["ux-lead"], status: "DRAFT" }),
    ]);
    expect(resolveDispatch(manifest)).toEqual(["dev-lead"]);
  });
});

describe("applyLeadRejection", () => {
  it("sets status to DRAFT, increments retryCount, resets timestamps", () => {
    const manifest = makeManifest([
      makeLead({
        id: "ux-lead",
        status: "COMPLETED",
        retryCount: 0,
        completedAt: "2026-04-07T11:00:00Z",
      }),
    ]);
    const updated = applyLeadRejection(manifest, "ux-lead", "Not detailed enough");
    const lead = updated.leads.find((l) => l.id === "ux-lead")!;
    expect(lead.status).toBe("DRAFT");
    expect(lead.retryCount).toBe(1);
    expect(lead.completedAt).toBeNull();
    expect(lead.startedAt).toBeNull();
  });

  it("embeds rejection note in the lead goal", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", status: "COMPLETED", goal: "Design login UI" }),
    ]);
    const updated = applyLeadRejection(manifest, "ux-lead", "needs dark mode");
    const lead = updated.leads.find((l) => l.id === "ux-lead")!;
    expect(lead.goal).toContain("needs dark mode");
  });

  it("does not mutate the original manifest", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", status: "COMPLETED" }),
    ]);
    applyLeadRejection(manifest, "ux-lead", "retry");
    expect(manifest.leads[0].status).toBe("COMPLETED");
  });
});
