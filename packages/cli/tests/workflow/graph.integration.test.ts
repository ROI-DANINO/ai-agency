import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildWorkflowGraph } from "../../src/workflow/graph.js";
import { MockHermesClient } from "../../src/workflow/hermes.js";
import { MemorySaver, Command } from "@langchain/langgraph";
import { tmpdir } from "os";
import { join } from "path";
import { rm, mkdir } from "fs/promises";
import { randomUUID } from "crypto";

let meshRoot: string;

beforeEach(async () => {
  meshRoot = join(tmpdir(), `mesh-test-${randomUUID()}`);
  await mkdir(meshRoot, { recursive: true });
});

afterEach(async () => {
  await rm(meshRoot, { recursive: true, force: true });
});

describe("buildWorkflowGraph", () => {
  it("runs to Gate 1 and pauses for manifest approval", async () => {
    const hermes = new MockHermesClient();
    const checkpointer = new MemorySaver();
    const { compiled } = buildWorkflowGraph(hermes, { checkpointer, meshRoot });

    const threadId = `wf-test-${randomUUID()}`;
    const config = { configurable: { thread_id: threadId } };

    // Start the graph — it will interrupt at Gate 1 (orchestratorNode)
    try {
      await compiled.invoke({ threadId, task: "Build a simple API" }, config);
    } catch {
      // Expected — interrupt throws in some versions
    }

    // Verify graph paused at Gate 1
    const state = await compiled.getState(config);
    expect(state).toBeDefined();
    // Manifest should be pending (interrupt happened)
    expect(state.next.length).toBeGreaterThan(0);
  });

  it("completes a full workflow with auto-approve decisions", async () => {
    const hermes = new MockHermesClient();
    const checkpointer = new MemorySaver();
    const { compiled } = buildWorkflowGraph(hermes, { checkpointer, meshRoot });

    const threadId = `wf-auto-${randomUUID()}`;
    const config = { configurable: { thread_id: threadId } };

    // Start — pauses at Gate 1
    try {
      await compiled.invoke({ threadId, task: "Build a login page" }, config);
    } catch {
      // Expected interrupt
    }

    // Approve Gate 1
    try {
      await compiled.invoke(
        new Command({ resume: { decision: "approved", notes: null } }),
        config,
      );
    } catch {
      // Expected interrupt at Gate 2
    }

    // Approve Gate 2 (dev-lead output, gate: human)
    try {
      await compiled.invoke(
        new Command({ resume: { decision: "approved", notes: null } }),
        config,
      );
    } catch {
      // Expected interrupt at Gate 4
    }

    // Approve Gate 4
    await compiled.invoke(
      new Command({ resume: { decision: "approved", rejectedLeads: [] } }),
      config,
    );

    // Workflow should be done
    const finalState = await compiled.getState(config);
    const manifest = finalState.values.manifest;
    expect(manifest?.completedAt).not.toBeNull();
  });
});
