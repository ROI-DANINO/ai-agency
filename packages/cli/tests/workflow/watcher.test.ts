import { describe, it, expect } from "vitest";
import { parseMeshEvent, buildStateUpdate } from "../../src/workflow/watcher.js";

describe("parseMeshEvent", () => {
  it("parses a valid blocker YAML event", () => {
    const yaml = `
timestamp: "2026-04-07T11:00:00Z"
agent: dev-lead
thread_id: wf-2026-04-07-001
event: blocker
message: Cannot proceed without API key
data: {}
`;
    const event = parseMeshEvent(yaml);
    expect(event.event).toBe("blocker");
    expect(event.agent).toBe("dev-lead");
    expect(event.message).toBe("Cannot proceed without API key");
  });

  it("parses a completed event", () => {
    const yaml = `
timestamp: "2026-04-07T11:05:00Z"
agent: ux-lead
thread_id: wf-2026-04-07-001
event: completed
message: Done
data: {}
`;
    const event = parseMeshEvent(yaml);
    expect(event.event).toBe("completed");
  });

  it("throws on invalid event type", () => {
    const yaml = `
timestamp: "2026-04-07T11:00:00Z"
agent: dev-lead
thread_id: wf-2026-04-07-001
event: unknown
message: test
data: {}
`;
    expect(() => parseMeshEvent(yaml)).toThrow();
  });
});

describe("buildStateUpdate", () => {
  it("returns pendingBlockers update for blocker event", () => {
    const event = {
      timestamp: "2026-04-07T11:00:00Z",
      agent: "dev-lead",
      threadId: "wf-001",
      event: "blocker" as const,
      message: "blocked",
      data: {},
    };
    const update = buildStateUpdate(event);
    expect(update.pendingBlockers).toHaveLength(1);
    expect(update.pendingBlockers![0]!.agent).toBe("dev-lead");
  });

  it("returns completedLeads update for completed event", () => {
    const event = {
      timestamp: "2026-04-07T11:00:00Z",
      agent: "ux-lead",
      threadId: "wf-001",
      event: "completed" as const,
      message: "done",
      data: {},
    };
    const update = buildStateUpdate(event);
    expect(update.completedLeads).toContain("ux-lead");
  });

  it("returns meshSnapshot update for checkpoint event", () => {
    const event = {
      timestamp: "2026-04-07T11:00:00Z",
      agent: "pm-lead",
      threadId: "wf-001",
      event: "checkpoint" as const,
      message: "halfway",
      data: {},
    };
    const update = buildStateUpdate(event);
    expect(update.meshSnapshot).toHaveLength(1);
    expect(update.pendingBlockers).toBeUndefined();
    expect(update.completedLeads).toBeUndefined();
  });
});
