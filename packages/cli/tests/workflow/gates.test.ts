import { describe, it, expect } from "vitest";
import {
  formatGate1,
  formatGate2,
  formatGate3,
  formatGate4,
  formatRetryLimit,
} from "../../src/workflow/gates.js";

describe("formatGate1", () => {
  it("includes task description and lead count", () => {
    const output = formatGate1({
      task: "Build login page",
      leads: [
        { id: "ux-lead", goal: "Design UI", dependsOn: [], gate: "human" },
        { id: "dev-lead", goal: "Implement", dependsOn: ["ux-lead"], gate: "auto" },
      ],
    });
    expect(output).toContain("Build login page");
    expect(output).toContain("ux-lead");
    expect(output).toContain("dev-lead");
    expect(output).toContain("approve");
    expect(output).toContain("reject");
  });
});

describe("formatGate2", () => {
  it("includes lead ID, output summary, and waiting leads", () => {
    const output = formatGate2({
      leadId: "ux-lead",
      summary: "Login UI designed with dark mode",
      meshEventCount: 5,
      waitingLeads: ["dev-lead"],
      retryCount: 0,
      maxRetries: 3,
    });
    expect(output).toContain("ux-lead");
    expect(output).toContain("Login UI designed with dark mode");
    expect(output).toContain("dev-lead");
    expect(output).toContain("approve");
    expect(output).toContain("reject");
  });
});

describe("formatGate3", () => {
  it("includes blocker agent, message, and downstream impact", () => {
    const output = formatGate3({
      leadId: "dev-lead",
      message: "Cannot proceed without DB credentials",
      blockedAt: "2026-04-07T11:00:00Z",
      downstreamLeads: ["security-lead"],
    });
    expect(output).toContain("dev-lead");
    expect(output).toContain("Cannot proceed without DB credentials");
    expect(output).toContain("security-lead");
    expect(output).toContain("resolve");
    expect(output).toContain("skip");
    expect(output).toContain("abort");
  });
});

describe("formatGate4", () => {
  it("includes summary of lead outputs and approve/reject options", () => {
    const output = formatGate4({
      task: "Build login page",
      totalDurationMs: 120000,
      leadSummaries: [{ leadId: "ux-lead", summary: "Done" }],
      openItems: [],
    });
    expect(output).toContain("Build login page");
    expect(output).toContain("ux-lead");
    expect(output).toContain("approve");
    expect(output).toContain("reject");
  });
});

describe("formatRetryLimit", () => {
  it("includes retry count and all available options", () => {
    const output = formatRetryLimit({
      leadId: "ux-lead",
      retryCount: 3,
      maxRetries: 3,
    });
    expect(output).toContain("ux-lead");
    expect(output).toContain("3");
    expect(output).toContain("abort");
    expect(output).toContain("force-approve");
    expect(output).toContain("change-goal");
  });
});
