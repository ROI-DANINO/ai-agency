import { Command } from "commander";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { buildWorkflowGraph } from "../workflow/graph.js";
import { MockHermesClient } from "../workflow/hermes.js";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import {
  formatGate1,
  formatGate2,
  formatGate3,
  formatGate4,
  formatRetryLimit,
} from "../workflow/gates.js";
import type { TaskManifest } from "../workflow/state.js";
import { resolve } from "path";

const REPO_ROOT = process.env["AI_ORG_ROOT"] ?? resolve(process.cwd());
const MESH_ROOT = `${REPO_ROOT}/.mesh`;
const DB_PATH = `${REPO_ROOT}/.workflow.db`;

export function createRunWorkflowCommand(): Command {
  const cmd = new Command("run-workflow");
  cmd
    .description("Run a workflow — decomposes task and coordinates Lead agents")
    .argument("<task>", "Task description")
    .option("--thread-id <id>", "Resume an existing workflow thread")
    .option("--mock", "Use MockHermesClient (Phase 1 default)", true)
    .action(async (task: string, opts: { threadId?: string; mock: boolean }) => {
      const hermes = new MockHermesClient();
      const checkpointer = SqliteSaver.fromConnString(DB_PATH);
      const { compiled, startWatcher } = buildWorkflowGraph(hermes, {
        checkpointer,
        meshRoot: MESH_ROOT,
      });

      const threadId =
        opts.threadId ??
        `wf-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      const config = { configurable: { thread_id: threadId } };

      const watcher = startWatcher(threadId);
      const rl = readline.createInterface({ input, output });

      console.log(`\n▶ Workflow ${threadId}`);
      console.log(`  Task: ${task}\n`);

      try {
        let resumeValue: unknown = { threadId, task };
        let isResume = false;

        while (true) {
          const stream = compiled.stream(
            isResume ? { type: "__resume__", data: resumeValue } : resumeValue,
            config,
          );

          let interrupted = false;
          let interruptPayload: unknown = null;

          try {
            for await (const event of stream) {
              void event;
            }
          } catch (err: unknown) {
            if (
              err instanceof Error &&
              err.message.includes("interrupt")
            ) {
              interrupted = true;
              const state = await compiled.getState(config);
              interruptPayload = state.tasks?.[0]?.interrupts?.[0]?.value;
            } else {
              throw err;
            }
          }

          if (!interrupted) break;

          const payload = interruptPayload as Record<string, unknown>;
          const gateType = payload?.["type"] as string;

          resumeValue = await handleGate(rl, gateType, payload, compiled, config);
          isResume = true;
        }

        const finalState = await compiled.getState(config);
        const manifest = finalState.values.manifest as TaskManifest | null;
        if (manifest?.completedAt) {
          console.log(`\n✓ Workflow completed at ${manifest.completedAt}`);
          console.log(`  Thread: ${threadId}\n`);
        }
      } finally {
        await watcher.stop();
        rl.close();
      }
    });

  return cmd;
}

async function handleGate(
  rl: readline.Interface,
  gateType: string,
  payload: Record<string, unknown>,
  // compiled and config are unused in this Phase 1 stub
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _compiled: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _config: any,
): Promise<unknown> {
  switch (gateType) {
    case "manifest-approval": {
      const manifest = payload["manifest"] as TaskManifest;
      console.log(
        formatGate1({
          task: manifest.task,
          leads: manifest.leads.map((l) => ({
            id: l.id,
            goal: l.goal,
            dependsOn: l.dependsOn,
            gate: l.gate,
          })),
        }),
      );
      const answer = await rl.question("> ");
      if (answer.startsWith("reject")) {
        return { decision: "rejected", notes: answer.replace("reject", "").trim() || null };
      }
      return { decision: "approved", notes: null };
    }

    case "lead-output": {
      const out = payload["output"] as Record<string, unknown>;
      console.log(
        formatGate2({
          leadId: String(payload["leadId"]),
          summary: out["summary"] as string,
          meshEventCount: Number(out["meshEventCount"]),
          waitingLeads: payload["waitingLeads"] as string[],
          retryCount: Number(payload["retryCount"]),
          maxRetries: Number(payload["maxRetries"]),
        }),
      );
      const answer = await rl.question("> ");
      if (answer.startsWith("reject")) {
        return { decision: "rejected", notes: answer.replace("reject", "").trim() || null };
      }
      return { decision: "approved", notes: null };
    }

    case "blocker": {
      console.log(
        formatGate3({
          leadId: String(payload["leadId"]),
          message: String(payload["message"]),
          blockedAt: String(payload["blockedAt"]),
          downstreamLeads: payload["downstreamLeads"] as string[],
        }),
      );
      const answer = await rl.question("> ");
      if (answer.startsWith("abort")) return { decision: "abort", notes: null };
      if (answer.startsWith("skip")) return { decision: "skip", notes: null };
      return { decision: "resolve", notes: answer.replace("resolve", "").trim() || null };
    }

    case "final-synthesis": {
      const report = payload["report"] as {
        task: string;
        totalDurationMs: number;
        leadOutputs: Array<{ leadId: string; summary: string }>;
        openItems: string[];
      };
      console.log(
        formatGate4({
          task: report.task,
          totalDurationMs: report.totalDurationMs,
          leadSummaries: report.leadOutputs,
          openItems: report.openItems,
        }),
      );
      const answer = await rl.question("> ");
      if (answer.startsWith("reject")) {
        const parts = answer.replace("reject", "").trim().split(" ");
        const leadId = parts[0] ?? "";
        const notes = parts.slice(1).join(" ") || "No notes";
        return {
          decision: "rejected",
          rejectedLeads: leadId ? [{ id: leadId, notes }] : [],
        };
      }
      return { decision: "approved", rejectedLeads: [] };
    }

    case "retry-limit": {
      console.log(
        formatRetryLimit({
          leadId: String(payload["leadId"]),
          retryCount: Number(payload["retryCount"]),
          maxRetries: Number(payload["maxRetries"]),
        }),
      );
      const answer = await rl.question("> ");
      if (answer.startsWith("force-approve")) return { decision: "force-approve" };
      if (answer.startsWith("change-goal")) {
        return { decision: "change-goal", newGoal: answer.replace("change-goal", "").trim() };
      }
      return { decision: "abort" };
    }

    default:
      return { decision: "approved" };
  }
}
