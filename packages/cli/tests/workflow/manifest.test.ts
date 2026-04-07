import { describe, it, expect } from "vitest";
import { parseManifest, serializeManifest, getReadyLeads, appendHitlLog, resolveMaxRetries } from "../../src/workflow/manifest.js";
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
    threadId: "wf-2026-04-07-001",
    requestedBy: "human",
    createdAt: "2026-04-07T10:00:00Z",
    approvedAt: null,
    completedAt: null,
    leads,
    timeoutMinutes: 30,
    maxRetries: 3,
    meshCheckInterval: 5,
    hitlLog: [],
  };
}

describe("parseManifest", () => {
  it("parses a valid YAML manifest", () => {
    const yml = `
task: Build login page
thread_id: wf-2026-04-07-001
requested_by: human
created_at: "2026-04-07T10:00:00Z"
approved_at: null
completed_at: null
leads:
  - id: ux-lead
    goal: Design login UI
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
`;
    const manifest = parseManifest(yml);
    expect(manifest.task).toBe("Build login page");
    expect(manifest.threadId).toBe("wf-2026-04-07-001");
    expect(manifest.leads).toHaveLength(1);
    expect(manifest.leads[0]!.id).toBe("ux-lead");
    expect(manifest.leads[0]!.dependsOn).toEqual([]);
    expect(manifest.leads[0]!.gate).toBe("human");
    expect(manifest.maxRetries).toBe(3);
  });

  it("throws on missing required fields", () => {
    expect(() => parseManifest("task: incomplete")).toThrow();
  });
});

describe("serializeManifest", () => {
  it("round-trips through YAML", () => {
    const original = makeManifest([makeLead({ id: "ux-lead" })]);
    const yml = serializeManifest(original);
    const parsed = parseManifest(yml);
    expect(parsed.task).toBe(original.task);
    expect(parsed.leads[0]!.id).toBe("ux-lead");
  });
});

describe("getReadyLeads", () => {
  it("returns DRAFT leads with no dependencies", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", dependsOn: [], status: "DRAFT" }),
      makeLead({ id: "pm-lead", dependsOn: [], status: "DRAFT" }),
      makeLead({ id: "dev-lead", dependsOn: ["ux-lead"], status: "DRAFT" }),
    ]);
    const ready = getReadyLeads(manifest);
    expect(ready.map((l) => l.id).sort()).toEqual(["pm-lead", "ux-lead"]);
  });

  it("returns lead when all dependencies are APPROVED", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", dependsOn: [], status: "APPROVED" }),
      makeLead({ id: "dev-lead", dependsOn: ["ux-lead"], status: "DRAFT" }),
    ]);
    const ready = getReadyLeads(manifest);
    expect(ready.map((l) => l.id)).toEqual(["dev-lead"]);
  });

  it("does NOT return lead when gate:human dependency is COMPLETED but not APPROVED", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", dependsOn: [], status: "COMPLETED", gate: "human" }),
      makeLead({ id: "dev-lead", dependsOn: ["ux-lead"], status: "DRAFT" }),
    ]);
    const ready = getReadyLeads(manifest);
    expect(ready).toHaveLength(0);
  });

  it("does NOT return already RUNNING or QUEUED leads", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", dependsOn: [], status: "RUNNING" }),
    ]);
    const ready = getReadyLeads(manifest);
    expect(ready).toHaveLength(0);
  });

  it("returns DRAFT lead after rejection (retryCount updated)", () => {
    const manifest = makeManifest([
      makeLead({ id: "ux-lead", dependsOn: [], status: "DRAFT", retryCount: 1 }),
    ]);
    const ready = getReadyLeads(manifest);
    expect(ready).toHaveLength(1);
  });
});

describe("resolveMaxRetries", () => {
  it("uses lead max_retries when set", () => {
    const lead = makeLead({ id: "x", maxRetries: 5 });
    const manifest = makeManifest([lead]);
    expect(resolveMaxRetries(lead, manifest)).toBe(5);
  });

  it("falls back to manifest max_retries when lead value is null", () => {
    const lead = makeLead({ id: "x", maxRetries: null });
    const manifest = makeManifest([lead]);
    expect(resolveMaxRetries(lead, manifest)).toBe(3);
  });
});

describe("appendHitlLog", () => {
  it("appends an entry to hitl_log", () => {
    const manifest = makeManifest([]);
    const updated = appendHitlLog(manifest, {
      gate: "manifest-approval",
      leadId: null,
      presentedAt: "2026-04-07T10:01:00Z",
      decidedAt: "2026-04-07T10:02:00Z",
      decision: "approved",
      notes: null,
    });
    expect(updated.hitlLog).toHaveLength(1);
    expect(updated.hitlLog[0]!.decision).toBe("approved");
  });

  it("does not mutate the original manifest", () => {
    const manifest = makeManifest([]);
    appendHitlLog(manifest, {
      gate: "final-synthesis",
      leadId: null,
      presentedAt: "2026-04-07T10:01:00Z",
      decidedAt: null,
      decision: null,
      notes: null,
    });
    expect(manifest.hitlLog).toHaveLength(0);
  });
});
