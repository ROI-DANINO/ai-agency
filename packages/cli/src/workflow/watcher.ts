import { watch, type FSWatcher } from "chokidar";
import { readFile } from "fs/promises";
import yaml from "js-yaml";
import type { MeshEvent, WorkflowState } from "./state.js";

// ─── Pure helpers (exported for tests) ────────────────────────────────────────

export function parseMeshEvent(raw: string): MeshEvent {
  const doc = yaml.load(raw) as Record<string, unknown>;
  const eventType = String(doc["event"]);
  if (!["checkpoint", "blocker", "completed"].includes(eventType)) {
    throw new Error(`Invalid mesh event type: ${eventType}`);
  }
  return {
    timestamp: String(doc["timestamp"]),
    agent: String(doc["agent"]),
    threadId: String(doc["thread_id"] ?? ""),
    event: eventType as MeshEvent["event"],
    message: String(doc["message"] ?? ""),
    data: (doc["data"] as Record<string, unknown>) ?? {},
  };
}

export function buildStateUpdate(
  event: MeshEvent,
): Partial<WorkflowState> {
  if (event.event === "blocker") {
    return { pendingBlockers: [event] };
  }
  if (event.event === "completed") {
    return { completedLeads: [event.agent], meshSnapshot: [event] };
  }
  // checkpoint — informational only
  return { meshSnapshot: [event] };
}

// ─── Watcher ──────────────────────────────────────────────────────────────────

export interface WatcherHandle {
  stop(): Promise<void>;
}

/**
 * startMeshWatcher — watches `.mesh/<threadId>/` for new YAML files.
 * On each new file, parses the event and calls onUpdate with state changes.
 * Used by graph.ts to keep LangGraph state in sync with mesh events.
 */
export function startMeshWatcher(
  meshRoot: string,
  threadId: string,
  onUpdate: (update: Partial<WorkflowState>) => Promise<void>,
): WatcherHandle {
  const pattern = `${meshRoot}/**/*.yaml`;

  const watcher: FSWatcher = watch(pattern, {
    ignoreInitial: true,
    persistent: false,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  watcher.on("add", async (filePath: string) => {
    try {
      const raw = await readFile(filePath, "utf-8");
      const event = parseMeshEvent(raw);
      if (event.threadId !== threadId) return; // ignore other threads
      const update = buildStateUpdate(event);
      await onUpdate(update);
    } catch {
      // Malformed event file — ignore and continue
    }
  });

  return {
    stop: () => watcher.close(),
  };
}
