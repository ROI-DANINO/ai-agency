import { StateGraph, MemorySaver, START, END } from "@langchain/langgraph";
import { WorkflowStateAnnotation, type WorkflowState } from "./state.js";
import { orchestratorNode } from "./nodes/orchestrator.js";
import { dispatcherNode, resolveDispatch } from "./nodes/dispatcher.js";
import { leadNodeFactory } from "./nodes/lead.js";
import { collectorNode } from "./nodes/collector.js";
import { startMeshWatcher, type WatcherHandle } from "./watcher.js";
import type { HermesClient } from "./hermes.js";

const DEFAULT_MESH_ROOT = ".mesh";

export interface WorkflowGraphOptions {
  checkpointer?: any;
  meshRoot?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CompiledWorkflow = any;

function buildAndCompile(
  hermes: HermesClient,
  checkpointer: any,
  meshRoot: string,
): CompiledWorkflow {
  const leadNode = leadNodeFactory(hermes, meshRoot);
  const graph = new (StateGraph as any)(WorkflowStateAnnotation);

  graph
    .addNode("orchestrator_node", orchestratorNode)
    .addNode("dispatcher_node", dispatcherNode)
    .addNode("lead_node", leadNode as any)
    .addNode("collector_node", collectorNode);

  graph.addEdge(START, "orchestrator_node");
  graph.addEdge("orchestrator_node", "dispatcher_node");

  // Conditional: if ready leads exist → lead_node, else → collector
  graph.addConditionalEdges("dispatcher_node", (state: WorkflowState) => {
    const manifest = state.manifest;
    if (!manifest) return "COLLECTOR";
    const ready = resolveDispatch(manifest);
    return ready.length > 0 ? "LEAD" : "COLLECTOR";
  }, {
    LEAD: "lead_node",
    COLLECTOR: "collector_node",
  });

  graph.addEdge("lead_node", "dispatcher_node");

  // After collector: loop back if rejected leads need retry, else END
  graph.addConditionalEdges("collector_node", (state: WorkflowState) => {
    const manifest = state.manifest!;
    if (manifest.completedAt != null) return "DONE";
    const hasDraftLeads = manifest.leads.some((l) => l.status === "DRAFT");
    return hasDraftLeads ? "RETRY" : "DONE";
  }, {
    RETRY: "dispatcher_node",
    DONE: END,
  });

  return graph.compile({ checkpointer });
}

export function buildWorkflowGraph(
  hermes: HermesClient,
  options: WorkflowGraphOptions = {},
): {
  compiled: CompiledWorkflow;
  startWatcher: (threadId: string) => WatcherHandle;
} {
  const checkpointer = options.checkpointer ?? new MemorySaver();
  const meshRoot = options.meshRoot ?? DEFAULT_MESH_ROOT;
  const compiled = buildAndCompile(hermes, checkpointer, meshRoot);

  function startWatcher(threadId: string): WatcherHandle {
    return startMeshWatcher(meshRoot, threadId, async (update) => {
      await compiled.updateState(
        { configurable: { thread_id: threadId } },
        update,
      );
    });
  }

  return { compiled, startWatcher };
}
