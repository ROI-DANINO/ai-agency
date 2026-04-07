# M3+M4 — Communicating + Decided: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal (M3):** The mesh has structured channels + docs. Human opens `.mesh/` and reads a coherent feed of what agents did.

**Goal (M4):** Human approves a HITL gate from Telegram. Workflow resumes. n8n is gone.

**Architecture:** M3 adds a `MeshWriter` class that agents use to post structured events. The existing `.mesh/channels/dev/` pattern becomes the standard. M4 replaces the n8n webhook path in `hitl-server.ts` with a Telegram Bot API webhook handler — the bot sends Decision Reports and receives button taps that resume LangGraph via `Command(resume=)`.

**Tech Stack:** Telegram Bot API (direct HTTP — no n8n, no library required beyond `fetch`), existing LangGraph resume pattern, existing `.mesh/` file conventions.

**Prerequisites:** M1 + M2 complete.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/cli/src/mesh/writer.ts` | Create | `MeshWriter` — structured channel posts + doc writes |
| `packages/cli/src/mesh/reader.ts` | Create | `MeshReader` — read feed, list artifacts, get context |
| `packages/cli/src/telegram/bot.ts` | Create | Telegram Bot API client — send messages + inline buttons |
| `packages/cli/src/telegram/decision-report.ts` | Create | Format Decision Reports as Telegram messages |
| `packages/cli/src/commands/hitl-server.ts` | Rewrite | Replace n8n callback with Telegram webhook handler |
| `packages/cli/src/workflow/telegram.ts` | Remove | Superseded by `telegram/decision-report.ts` |
| `packages/cli/tests/mesh/writer.test.ts` | Create | Tests for MeshWriter |
| `packages/cli/tests/telegram/decision-report.test.ts` | Create | Tests for Decision Report formatting |

---

### Task 1: `MeshWriter` — structured channel posts

**Files:**
- Create: `packages/cli/src/mesh/writer.ts`
- Create: `packages/cli/tests/mesh/writer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/cli/tests/mesh/writer.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readdir, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { MeshWriter } from "../../src/mesh/writer.js";

let tmpDir: string;
let writer: MeshWriter;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "mesh-writer-test-"));
  writer = new MeshWriter(tmpDir);
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("MeshWriter.postToChannel", () => {
  it("writes a timestamped markdown file to the channel directory", async () => {
    await writer.postToChannel("dev", {
      agent: "dev-lead",
      threadId: "t-001",
      event: "completed",
      message: "Finished implementing state types",
      data: {},
    });

    const files = await readdir(join(tmpDir, ".mesh", "channels", "dev"));
    expect(files.filter(f => f.endsWith(".md"))).toHaveLength(1);
  });

  it("file content contains the message", async () => {
    await writer.postToChannel("dev", {
      agent: "dev-lead",
      threadId: "t-001",
      event: "completed",
      message: "Finished implementing state types",
      data: {},
    });

    const files = await readdir(join(tmpDir, ".mesh", "channels", "dev"));
    const content = await readFile(join(tmpDir, ".mesh", "channels", "dev", files[0]!), "utf-8");
    expect(content).toContain("Finished implementing state types");
    expect(content).toContain("dev-lead");
  });
});

describe("MeshWriter.writeArtifact", () => {
  it("writes artifact to docs/artifacts with correct filename", async () => {
    await writer.writeArtifact("dev-lead", "t-001", "# Artifact content");
    const files = await readdir(join(tmpDir, ".mesh", "docs", "artifacts"));
    expect(files.some(f => f.includes("dev-lead"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd packages/cli && npx vitest run tests/mesh/writer.test.ts
```
Expected: FAIL — "Cannot find module '../../src/mesh/writer.js'"

- [ ] **Step 3: Create `packages/cli/src/mesh/writer.ts`**

```typescript
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { MeshChannel } from "./index.js";

export interface ChannelPost {
  agent: string;
  threadId: string;
  event: "started" | "checkpoint" | "completed" | "blocker" | "decision";
  message: string;
  data: Record<string, unknown>;
}

export class MeshWriter {
  private meshRoot: string;

  constructor(repoRoot: string) {
    this.meshRoot = join(repoRoot, ".mesh");
  }

  async postToChannel(channel: MeshChannel, post: ChannelPost): Promise<string> {
    const dir = join(this.meshRoot, "channels", channel);
    await mkdir(dir, { recursive: true });

    const timestamp = new Date().toISOString();
    const slug = `${post.agent}-${post.event}`.replace(/[^a-z0-9-]/gi, "-");
    const filename = `${timestamp}-${slug}.md`.replace(/:/g, "-");

    const content = [
      `# ${post.agent} — ${post.event}`,
      `**Time:** ${timestamp}`,
      `**Thread:** ${post.threadId}`,
      `**Agent:** ${post.agent}`,
      "",
      post.message,
      ...(Object.keys(post.data).length > 0
        ? ["", "```json", JSON.stringify(post.data, null, 2), "```"]
        : []),
    ].join("\n");

    const filePath = join(dir, filename);
    await writeFile(filePath, content, "utf-8");
    return filePath;
  }

  async writeArtifact(leadId: string, threadId: string, content: string): Promise<string> {
    const dir = join(this.meshRoot, "docs", "artifacts");
    await mkdir(dir, { recursive: true });
    const filename = `${threadId}-${leadId}.md`;
    const filePath = join(dir, filename);
    await writeFile(filePath, content, "utf-8");
    return filePath;
  }

  async writeDecisionRecord(threadId: string, gate: string, decision: string, notes: string | null): Promise<void> {
    const dir = join(this.meshRoot, "docs", "decisions");
    await mkdir(dir, { recursive: true });
    const timestamp = new Date().toISOString();
    const filename = `${timestamp}-${threadId}-${gate}.md`.replace(/:/g, "-");
    const content = [
      `# Decision — ${gate}`,
      `**Thread:** ${threadId}`,
      `**Decided:** ${timestamp}`,
      `**Decision:** ${decision}`,
      ...(notes ? [`**Notes:** ${notes}`] : []),
    ].join("\n");
    await writeFile(join(dir, filename), content, "utf-8");
  }

  async postDecisionRequest(params: {
    threadId: string;
    gate: string;
    report: string;
  }): Promise<void> {
    await this.postToChannel("decisions", {
      agent: "orchestrator",
      threadId: params.threadId,
      event: "decision",
      message: `DECISION NEEDED — Gate: ${params.gate}\n\n${params.report}`,
      data: { gate: params.gate, status: "pending" },
    });
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd packages/cli && npx vitest run tests/mesh/writer.test.ts
```
Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/mesh/writer.ts packages/cli/tests/mesh/writer.test.ts
git commit -m "feat(mesh): MeshWriter — structured channel posts + artifact writes"
```

---

### Task 2: Telegram Decision Report formatter

**Files:**
- Create: `packages/cli/src/telegram/decision-report.ts`
- Create: `packages/cli/tests/telegram/decision-report.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/cli/tests/telegram/decision-report.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  formatDecisionReport,
  type DecisionReportParams,
} from "../../src/telegram/decision-report.js";

const params: DecisionReportParams = {
  gate: "lead-output",
  leadId: "dev-lead",
  summary: "Implemented TypeScript state types for the workflow engine.",
  recommendation: "Approve — implementation is complete and tests pass.",
  alternative: "Reject and request more test coverage.",
  defaultAction: "Approves automatically",
  defaultMinutes: 120,
  threadId: "thread-abc123",
};

describe("formatDecisionReport", () => {
  it("includes gate type in output", () => {
    const report = formatDecisionReport(params);
    expect(report.text).toContain("lead-output");
  });

  it("includes recommendation", () => {
    const report = formatDecisionReport(params);
    expect(report.text).toContain("Approve — implementation is complete");
  });

  it("returns 4 inline buttons", () => {
    const report = formatDecisionReport(params);
    expect(report.buttons).toHaveLength(4);
    const labels = report.buttons.map(b => b.text);
    expect(labels).toContain("Approve ✅");
    expect(labels).toContain("Reject ❌");
    expect(labels).toContain("Defer ⏳");
    expect(labels).toContain("More info 🔍");
  });

  it("button callback_data encodes threadId and decision", () => {
    const report = formatDecisionReport(params);
    const approveBtn = report.buttons.find(b => b.text === "Approve ✅")!;
    expect(approveBtn.callback_data).toContain("thread-abc123");
    expect(approveBtn.callback_data).toContain("approved");
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd packages/cli && npx vitest run tests/telegram/decision-report.test.ts
```
Expected: FAIL — "Cannot find module '../../src/telegram/decision-report.js'"

- [ ] **Step 3: Create `packages/cli/src/telegram/decision-report.ts`**

```typescript
export interface InlineButton {
  text: string;
  callback_data: string;
}

export interface FormattedDecisionReport {
  text: string;
  buttons: InlineButton[];
}

export interface DecisionReportParams {
  gate: string;
  leadId?: string;
  summary: string;
  recommendation: string;
  alternative: string;
  defaultAction: string;
  defaultMinutes: number;
  threadId: string;
}

export function formatDecisionReport(params: DecisionReportParams): FormattedDecisionReport {
  const header = params.leadId
    ? `⏸ *DECISION NEEDED*\nGate: ${params.gate}\nFrom: ${params.leadId}`
    : `⏸ *DECISION NEEDED*\nGate: ${params.gate}`;

  const text = [
    header,
    "",
    params.summary,
    "",
    `✅ *Recommended:* ${params.recommendation}`,
    "",
    `Alternative: ${params.alternative}`,
    "",
    `_Default in ${params.defaultMinutes}m: ${params.defaultAction}._`,
  ].join("\n");

  const encodeCallback = (decision: string) =>
    JSON.stringify({ threadId: params.threadId, gate: params.gate, decision });

  const buttons: InlineButton[] = [
    { text: "Approve ✅", callback_data: encodeCallback("approved") },
    { text: "Reject ❌", callback_data: encodeCallback("rejected") },
    { text: "Defer ⏳", callback_data: encodeCallback("deferred") },
    { text: "More info 🔍", callback_data: encodeCallback("more-info") },
  ];

  return { text, buttons };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd packages/cli && npx vitest run tests/telegram/decision-report.test.ts
```
Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/telegram/decision-report.ts packages/cli/tests/telegram/decision-report.test.ts
git commit -m "feat(telegram): Decision Report formatter — text + inline buttons"
```

---

### Task 3: Telegram Bot API client

**Files:**
- Create: `packages/cli/src/telegram/bot.ts`

No tests for this — it wraps the Telegram HTTP API directly. Tested manually.

- [ ] **Step 1: Create `packages/cli/src/telegram/bot.ts`**

```typescript
import type { FormattedDecisionReport } from "./decision-report.js";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const BASE = "https://api.telegram.org";

async function telegramPost(token: string, method: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${text}`);
  }
  return res.json();
}

export class TelegramBot {
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  static fromEnv(): TelegramBot {
    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    const chatId = process.env["TELEGRAM_CHAT_ID"];
    if (!botToken || !chatId) {
      throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set");
    }
    return new TelegramBot({ botToken, chatId });
  }

  async sendDecisionReport(report: FormattedDecisionReport): Promise<void> {
    await telegramPost(this.config.botToken, "sendMessage", {
      chat_id: this.config.chatId,
      text: report.text,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [report.buttons.map(b => ({ text: b.text, callback_data: b.callback_data }))],
      },
    });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await telegramPost(this.config.botToken, "answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text: text ?? "Decision received.",
    });
  }

  async setWebhook(url: string): Promise<void> {
    await telegramPost(this.config.botToken, "setWebhook", { url });
  }
}
```

- [ ] **Step 2: Compile check**

```bash
cd packages/cli && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/telegram/bot.ts
git commit -m "feat(telegram): TelegramBot — sendDecisionReport + webhook setup"
```

---

### Task 4: Rewrite `hitl-server.ts` — drop n8n, add Telegram webhook

**Files:**
- Rewrite: `packages/cli/src/commands/hitl-server.ts`
- Modify: `packages/cli/tests/commands/hitl-server.test.ts` — update tests

- [ ] **Step 1: Read the current hitl-server.ts**

Read `packages/cli/src/commands/hitl-server.ts` to understand the current callback pattern before rewriting.

- [ ] **Step 2: Read the current hitl-server tests**

Read `packages/cli/tests/commands/hitl-server.test.ts` to understand what behaviors must be preserved.

- [ ] **Step 3: Rewrite `packages/cli/src/commands/hitl-server.ts`**

```typescript
import { Command } from "commander";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { buildWorkflowGraph } from "../workflow/graph.js";
import { MockHermesClient, ApiHermesClient } from "../workflow/hermes.js";
import { TelegramBot } from "../telegram/bot.js";
import { formatDecisionReport } from "../telegram/decision-report.js";
import { MeshWriter } from "../mesh/writer.js";
import { Command as LangCommand } from "@langchain/langgraph";
import { resolve } from "path";

const REPO_ROOT = process.env["AI_ORG_ROOT"] ?? resolve(process.cwd());

// In-memory map: threadId → compiled workflow (for resume)
const workflows = new Map<string, { compiled: ReturnType<typeof buildWorkflowGraph>["compiled"] }>();

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(json);
}

export function createHitlServerCommand(): Command {
  const cmd = new Command("hitl-server");
  cmd.description("Start the HITL server — handles Telegram webhooks and workflow resume");
  cmd.option("--port <n>", "Port to listen on", "3456");

  cmd.action(async (opts: { port: string }) => {
    const port = parseInt(opts.port, 10);
    const hermes = process.env["ANTHROPIC_API_KEY"]
      ? new ApiHermesClient()
      : new MockHermesClient();
    const writer = new MeshWriter(REPO_ROOT);

    const server = createServer(async (req, res) => {
      const url = req.url ?? "/";

      // ── POST /hitl/resume — internal resume (tests + CLI use) ─────────────
      if (req.method === "POST" && url === "/hitl/resume") {
        const body = await readBody(req) as { threadId?: string; decision?: string; notes?: string };
        const { threadId, decision, notes } = body;

        if (!threadId || !decision) {
          return send(res, 400, { error: "threadId and decision required" });
        }

        const entry = workflows.get(threadId);
        if (!entry) {
          return send(res, 404, { error: `No workflow for threadId: ${threadId}` });
        }

        const result = await entry.compiled.invoke(
          new LangCommand({ resume: { decision, notes: notes ?? null } }),
          { configurable: { thread_id: threadId } },
        );

        const done = result?.manifest?.completedAt != null;
        await writer.writeDecisionRecord(threadId, "hitl-resume", decision, notes ?? null);

        return send(res, 200, { status: done ? "completed" : "waiting", threadId });
      }

      // ── POST /telegram/webhook — Telegram button tap ───────────────────────
      if (req.method === "POST" && url === "/telegram/webhook") {
        const body = await readBody(req) as {
          callback_query?: {
            id: string;
            data: string;
          };
        };

        const cq = body.callback_query;
        if (!cq) return send(res, 200, { ok: true });

        let parsed: { threadId: string; gate: string; decision: string };
        try {
          parsed = JSON.parse(cq.data);
        } catch {
          return send(res, 400, { error: "Invalid callback_data" });
        }

        const { threadId, decision } = parsed;
        const entry = workflows.get(threadId);
        if (!entry) return send(res, 404, { error: "Workflow not found" });

        await entry.compiled.invoke(
          new LangCommand({ resume: { decision, notes: null } }),
          { configurable: { thread_id: threadId } },
        );

        // Acknowledge the button tap to Telegram
        if (process.env["TELEGRAM_BOT_TOKEN"] && process.env["TELEGRAM_CHAT_ID"]) {
          const bot = TelegramBot.fromEnv();
          await bot.answerCallbackQuery(cq.id, `Decision: ${decision}`).catch(() => {});
        }

        return send(res, 200, { ok: true });
      }

      // ── POST /hitl/start — register a workflow for a threadId ─────────────
      if (req.method === "POST" && url === "/hitl/start") {
        const body = await readBody(req) as { threadId?: string; task?: string };
        const { threadId, task } = body;

        if (!threadId || !task) {
          return send(res, 400, { error: "threadId and task required" });
        }

        const { compiled, startWatcher } = buildWorkflowGraph(hermes);
        workflows.set(threadId, { compiled });
        startWatcher(threadId);

        // Start the workflow (will pause at first interrupt)
        compiled.invoke({ threadId, task }, { configurable: { thread_id: threadId } })
          .catch(console.error);

        return send(res, 200, { status: "started", threadId });
      }

      send(res, 404, { error: "Not found" });
    });

    server.listen(port, () => {
      console.log(`\n  HITL server running on port ${port}`);
      console.log(`  POST /hitl/start     — register + start a workflow`);
      console.log(`  POST /hitl/resume    — resume at current gate`);
      console.log(`  POST /telegram/webhook — Telegram button handler\n`);

      if (process.env["TELEGRAM_BOT_TOKEN"] && process.env["TELEGRAM_CHAT_ID"]) {
        console.log("  Telegram: configured ✓");
      } else {
        console.log("  Telegram: not configured (set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)");
      }
    });
  });

  return cmd;
}
```

- [ ] **Step 4: Update the hitl-server tests**

The existing tests use `POST /hitl/resume`. Update `packages/cli/tests/commands/hitl-server.test.ts` — replace any references to the n8n callback pattern with the new `/hitl/start` + `/hitl/resume` flow:

```typescript
// Replace the test that starts a workflow via n8n with:
it("starts a workflow via /hitl/start and resumes via /hitl/resume", async () => {
  // POST /hitl/start
  const startRes = await fetch(`http://localhost:${port}/hitl/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId: "test-thread-001", task: "Test task" }),
  });
  expect(startRes.status).toBe(200);
  const startBody = await startRes.json() as { status: string };
  expect(startBody.status).toBe("started");

  // Wait briefly for workflow to reach Gate 1
  await new Promise(r => setTimeout(r, 100));

  // POST /hitl/resume — approve Gate 1
  const resumeRes = await fetch(`http://localhost:${port}/hitl/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId: "test-thread-001", decision: "approved", notes: null }),
  });
  expect(resumeRes.status).toBe(200);
});
```

- [ ] **Step 5: Run all hitl tests**

```bash
cd packages/cli && npx vitest run tests/commands/hitl-server.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/commands/hitl-server.ts packages/cli/tests/commands/hitl-server.test.ts
git commit -m "feat(f09): hitl-server — drop n8n, add Telegram webhook handler"
```

---

## M3+M4 Gate Check

```bash
# M3 — Communicating
ai-org run-workflow --task "Research TypeScript error handling patterns"
# After workflow completes:
ls .mesh/channels/dev/     # timestamped .md files
ls .mesh/docs/artifacts/   # lead artifact .md files
cat .mesh/channels/dev/*.md  # readable feed of agent activity

# M4 — Decided (requires Telegram bot setup)
export TELEGRAM_BOT_TOKEN=...
export TELEGRAM_CHAT_ID=...
ai-org hitl-server --port 3456
# In another terminal:
curl -X POST http://localhost:3456/hitl/start \
  -H "Content-Type: application/json" \
  -d '{"threadId":"demo-001","task":"Build a login form"}'
# → Telegram message arrives with inline buttons
# → Tap Approve
# → Workflow resumes
```
