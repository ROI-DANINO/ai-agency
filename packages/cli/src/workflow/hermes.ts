import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import type { MeshEvent } from "./state.js";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface SpawnResult {
  leadId: string;
  success: boolean;
  summary: string;
  meshEventCount: number;
}

export interface HermesClient {
  /**
   * Spawn a Lead session. Returns when the session completes.
   * The session writes events to .mesh/<leadId>/ as it runs.
   */
  spawn(params: {
    leadId: string;
    briefing: string;
    model: string;
    runtime: string;
    threadId: string;
    meshRoot: string;
  }): Promise<SpawnResult>;
}

// ─── Mock (Phase 1) ────────────────────────────────────────────────────────────

/**
 * MockHermesClient — simulates a Lead session by writing a `completed` mesh
 * event and returning immediately. Used for tests and Phase 1 CLI runs.
 */
export class MockHermesClient implements HermesClient {
  async spawn(params: {
    leadId: string;
    briefing: string;
    model: string;
    runtime: string;
    threadId: string;
    meshRoot: string;
  }): Promise<SpawnResult> {
    const dir = join(params.meshRoot, params.leadId);
    await mkdir(dir, { recursive: true });

    const event: MeshEvent = {
      timestamp: new Date().toISOString(),
      agent: params.leadId,
      threadId: params.threadId,
      event: "completed",
      message: `[mock] Lead session completed for goal: ${params.briefing.slice(0, 80)}`,
      data: { mock: true },
    };

    const filename = `${Date.now()}-completed.yaml`;
    await writeFile(join(dir, filename), yaml.dump(event), "utf-8");

    return {
      leadId: params.leadId,
      success: true,
      summary: event.message,
      meshEventCount: 1,
    };
  }
}
