# M2 — Executing: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Lead agent calls the Anthropic API with a real briefing, produces a markdown artifact, and writes it to `.mesh/docs/artifacts/`. The Orchestrator generates its manifest via an LLM call, not a stub.

**Architecture:** Replace `MockHermesClient` with `ApiHermesClient` that calls the Anthropic API directly. Replace `generateStubManifest` in the orchestrator node with an LLM call. Add a minimal F08 model routing config (YAML file + loader) so the orchestrator can resolve which model to use. The Lead agent receives its briefing as a system prompt + task, executes via API, and returns a structured markdown artifact.

**Tech Stack:** `@anthropic-ai/sdk` (add as dependency), YAML config file for model routing, existing LangGraph + TypeScript patterns.

**Prerequisite:** M1 complete (`.mesh/` structure exists).

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `config/model-routing.yaml` | Create | F08 — model assignments per agent tier |
| `packages/cli/src/model-router.ts` | Create | Load model routing config, resolve model for a tier |
| `packages/cli/src/workflow/hermes-api.ts` | Create | `ApiHermesClient` — real Anthropic API calls |
| `packages/cli/src/workflow/artifact.ts` | Create | Parse + validate Lead artifact markdown format |
| `packages/cli/src/workflow/nodes/orchestrator.ts` | Modify | Replace stub manifest with LLM decomposition call |
| `packages/cli/src/workflow/hermes.ts` | Modify | Export `ApiHermesClient` alongside `MockHermesClient` |
| `packages/cli/src/commands/run-workflow.ts` | Modify | Wire `ApiHermesClient` when `ANTHROPIC_API_KEY` is set |
| `packages/cli/tests/workflow/hermes-api.test.ts` | Create | Unit tests for artifact parsing + model router |

---

### Task 1: F08 Model Routing config + loader

**Files:**
- Create: `config/model-routing.yaml`
- Create: `packages/cli/src/model-router.ts`
- Create: `packages/cli/tests/workflow/model-router.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/cli/tests/workflow/model-router.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolveModel, type ModelRoutingConfig } from "../../src/model-router.js";

const config: ModelRoutingConfig = {
  tiers: {
    1: { model: "claude-opus-4-6", maxTokens: 8192 },
    2: { model: "claude-sonnet-4-6", maxTokens: 4096 },
    3: { model: "claude-haiku-4-5-20251001", maxTokens: 2048 },
  },
  overrides: {
    "research-lead": { model: "claude-sonnet-4-6", maxTokens: 6000 },
  },
};

describe("resolveModel", () => {
  it("returns tier model when no override", () => {
    const result = resolveModel(config, { tier: 2, agentId: "dev-lead" });
    expect(result.model).toBe("claude-sonnet-4-6");
    expect(result.maxTokens).toBe(4096);
  });

  it("returns override model when agent has override", () => {
    const result = resolveModel(config, { tier: 2, agentId: "research-lead" });
    expect(result.model).toBe("claude-sonnet-4-6");
    expect(result.maxTokens).toBe(6000);
  });

  it("falls back to tier 2 when tier not in config", () => {
    const config2: ModelRoutingConfig = { tiers: { 2: { model: "claude-sonnet-4-6", maxTokens: 4096 } }, overrides: {} };
    const result = resolveModel(config2, { tier: 1, agentId: "orchestrator" });
    expect(result.model).toBe("claude-sonnet-4-6");
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd packages/cli && npx vitest run tests/workflow/model-router.test.ts
```
Expected: FAIL — "Cannot find module '../../src/model-router.js'"

- [ ] **Step 3: Create `config/model-routing.yaml`**

```yaml
# F08 — Model Routing Configuration
# Tier 1: Orchestrator — highest capability, complex reasoning
# Tier 2: Lead agents — balanced capability + cost
# Tier 3: Sub-agents — fast, focused, low-cost

tiers:
  1:
    model: claude-opus-4-6
    max_tokens: 8192
  2:
    model: claude-sonnet-4-6
    max_tokens: 4096
  3:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048

# Agent-level overrides (optional — only set when a specific agent needs different params)
overrides:
  research-lead:
    model: claude-sonnet-4-6
    max_tokens: 6000
```

- [ ] **Step 4: Create `packages/cli/src/model-router.ts`**

```typescript
import { readFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";

export interface ModelAssignment {
  model: string;
  maxTokens: number;
}

export interface ModelRoutingConfig {
  tiers: Record<number, ModelAssignment>;
  overrides: Record<string, ModelAssignment>;
}

export function resolveModel(
  config: ModelRoutingConfig,
  params: { tier: number; agentId: string },
): ModelAssignment {
  // Agent-level override takes priority
  if (config.overrides[params.agentId]) {
    return config.overrides[params.agentId];
  }
  // Tier assignment
  if (config.tiers[params.tier]) {
    return config.tiers[params.tier];
  }
  // Fallback to tier 2
  return config.tiers[2] ?? { model: "claude-sonnet-4-6", maxTokens: 4096 };
}

export async function loadModelRoutingConfig(repoRoot: string): Promise<ModelRoutingConfig> {
  const configPath = join(repoRoot, "config", "model-routing.yaml");
  const raw = await readFile(configPath, "utf-8");
  const doc = yaml.load(raw) as Record<string, unknown>;

  const tiers: Record<number, ModelAssignment> = {};
  for (const [k, v] of Object.entries(doc["tiers"] as Record<string, Record<string, unknown>>)) {
    tiers[Number(k)] = {
      model: String(v["model"]),
      maxTokens: Number(v["max_tokens"]),
    };
  }

  const overrides: Record<string, ModelAssignment> = {};
  const rawOverrides = (doc["overrides"] ?? {}) as Record<string, Record<string, unknown>>;
  for (const [k, v] of Object.entries(rawOverrides)) {
    overrides[k] = {
      model: String(v["model"]),
      maxTokens: Number(v["max_tokens"]),
    };
  }

  return { tiers, overrides };
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
cd packages/cli && npx vitest run tests/workflow/model-router.test.ts
```
Expected: PASS — 3 tests pass

- [ ] **Step 6: Commit**

```bash
git add config/model-routing.yaml packages/cli/src/model-router.ts packages/cli/tests/workflow/model-router.test.ts
git commit -m "feat(f08): model routing config + resolveModel — tier-based with agent overrides"
```

---

### Task 2: Lead artifact format

**Files:**
- Create: `packages/cli/src/workflow/artifact.ts`
- Create: `packages/cli/tests/workflow/artifact.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/cli/tests/workflow/artifact.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { parseArtifact, formatArtifactPrompt, type LeadArtifact } from "../../src/workflow/artifact.js";

const SAMPLE_ARTIFACT = `# Artifact — Implement state types for workflow engine
**Lead:** dev-lead
**Thread:** thread-123
**Completed:** 2026-04-07T18:00:00Z

## What Was Done
Added TypeScript state types for the LangGraph workflow engine. Defined
LeadTask, TaskManifest, and WorkflowState interfaces.

## Code Changes
- \`packages/cli/src/workflow/state.ts\` — new file with all domain types

## Open Decisions
- [ ] Should HitlGateType include 'timeout' as a gate? (blocking: orchestrator design)

## Calls to Other Leads
- None

## Notes
All types are exported. The WorkflowStateAnnotation uses Annotation.Root pattern.
`;

describe("parseArtifact", () => {
  it("parses lead and thread from artifact", () => {
    const result = parseArtifact(SAMPLE_ARTIFACT);
    expect(result.leadId).toBe("dev-lead");
    expect(result.threadId).toBe("thread-123");
  });

  it("extracts open decisions", () => {
    const result = parseArtifact(SAMPLE_ARTIFACT);
    expect(result.openDecisions).toHaveLength(1);
    expect(result.openDecisions[0]).toContain("HitlGateType");
  });

  it("extracts calls to other leads", () => {
    const result = parseArtifact(SAMPLE_ARTIFACT);
    expect(result.callsToLeads).toHaveLength(0);
  });
});

describe("formatArtifactPrompt", () => {
  it("returns a string containing the lead id and task", () => {
    const prompt = formatArtifactPrompt({ leadId: "dev-lead", threadId: "t1", goal: "Implement X" });
    expect(prompt).toContain("dev-lead");
    expect(prompt).toContain("Implement X");
    expect(prompt).toContain("## What Was Done");
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd packages/cli && npx vitest run tests/workflow/artifact.test.ts
```
Expected: FAIL — "Cannot find module '../../src/workflow/artifact.js'"

- [ ] **Step 3: Create `packages/cli/src/workflow/artifact.ts`**

```typescript
export interface LeadArtifact {
  leadId: string;
  threadId: string;
  completedAt: string;
  summary: string;
  codeChanges: string[];
  openDecisions: string[];
  callsToLeads: string[];
  raw: string;
}

export function parseArtifact(markdown: string): LeadArtifact {
  const leadMatch = markdown.match(/\*\*Lead:\*\*\s+(.+)/);
  const threadMatch = markdown.match(/\*\*Thread:\*\*\s+(.+)/);
  const completedMatch = markdown.match(/\*\*Completed:\*\*\s+(.+)/);

  // Extract What Was Done section
  const summaryMatch = markdown.match(/## What Was Done\n([\s\S]*?)(?=\n## |\n---|\z)/);

  // Extract open decisions (unchecked checkboxes)
  const openDecisions: string[] = [];
  const decisionsSection = markdown.match(/## Open Decisions\n([\s\S]*?)(?=\n## |\n---|\z)/);
  if (decisionsSection) {
    const lines = decisionsSection[1].split("\n");
    for (const line of lines) {
      if (line.match(/^- \[ \]/)) {
        openDecisions.push(line.replace(/^- \[ \]\s*/, "").trim());
      }
    }
  }

  // Extract calls to other leads
  const callsToLeads: string[] = [];
  const callsSection = markdown.match(/## Calls to Other Leads\n([\s\S]*?)(?=\n## |\n---|\z)/);
  if (callsSection) {
    const lines = callsSection[1].split("\n");
    for (const line of lines) {
      if (line.match(/^-/) && !line.includes("None")) {
        callsToLeads.push(line.replace(/^-\s*/, "").trim());
      }
    }
  }

  // Extract code changes
  const codeChanges: string[] = [];
  const codeSection = markdown.match(/## Code Changes\n([\s\S]*?)(?=\n## |\n---|\z)/);
  if (codeSection) {
    const lines = codeSection[1].split("\n");
    for (const line of lines) {
      if (line.match(/^-/)) {
        codeChanges.push(line.replace(/^-\s*/, "").trim());
      }
    }
  }

  return {
    leadId: leadMatch?.[1]?.trim() ?? "unknown",
    threadId: threadMatch?.[1]?.trim() ?? "unknown",
    completedAt: completedMatch?.[1]?.trim() ?? new Date().toISOString(),
    summary: summaryMatch?.[1]?.trim() ?? "",
    codeChanges,
    openDecisions,
    callsToLeads,
    raw: markdown,
  };
}

export function formatArtifactPrompt(params: {
  leadId: string;
  threadId: string;
  goal: string;
}): string {
  const now = new Date().toISOString();
  return `You are a Lead agent in an AI agency. Your role is to complete a focused task
and produce a structured markdown artifact documenting your work.

**Lead:** ${params.leadId}
**Thread:** ${params.threadId}
**Task:** ${params.goal}

Produce a markdown document in exactly this format:

# Artifact — ${params.goal}
**Lead:** ${params.leadId}
**Thread:** ${params.threadId}
**Completed:** ${now}

## What Was Done
{1-3 paragraphs summarizing the work completed}

## Code Changes
- \`path/to/file.ts\` — {what changed}
(write "- None" if no code was changed)

## Open Decisions
- [ ] {decision needed, with context} (blocking: {who needs this})
(write "- None" if no decisions needed)

## Calls to Other Leads
- \`{lead-id}\` briefed with: "{their task}"
(write "- None" if no other leads needed)

## Notes
{anything the human should know}

---

Complete the task now and return only the artifact markdown. No preamble.`;
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd packages/cli && npx vitest run tests/workflow/artifact.test.ts
```
Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/workflow/artifact.ts packages/cli/tests/workflow/artifact.test.ts
git commit -m "feat(workflow): Lead artifact format — parse + prompt template"
```

---

### Task 3: `ApiHermesClient` — real Anthropic API calls

**Files:**
- Create: `packages/cli/src/workflow/hermes-api.ts`
- Create: `packages/cli/tests/workflow/hermes-api.test.ts`
- Modify: `packages/cli/src/workflow/hermes.ts`

- [ ] **Step 1: Install Anthropic SDK**

```bash
cd packages/cli && pnpm add @anthropic-ai/sdk
```
Expected: added `@anthropic-ai/sdk` to package.json

- [ ] **Step 2: Write failing tests**

Create `packages/cli/tests/workflow/hermes-api.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { formatArtifactPrompt, parseArtifact } from "../../src/workflow/artifact.js";

// We test the formatArtifactPrompt + parseArtifact round-trip here.
// ApiHermesClient itself is only tested via integration (needs API key).

describe("artifact prompt round-trip", () => {
  it("prompt contains the goal", () => {
    const prompt = formatArtifactPrompt({
      leadId: "dev-lead",
      threadId: "t-abc",
      goal: "Write state types for the workflow engine",
    });
    expect(prompt).toContain("Write state types for the workflow engine");
    expect(prompt).toContain("dev-lead");
    expect(prompt).toContain("t-abc");
  });

  it("parseArtifact handles missing sections gracefully", () => {
    const minimal = `# Artifact — test\n**Lead:** dev-lead\n**Thread:** t1\n**Completed:** 2026-01-01T00:00:00Z\n\n## What Was Done\nDid stuff.\n\n## Code Changes\n- None\n\n## Open Decisions\n- None\n\n## Calls to Other Leads\n- None\n\n## Notes\nN/A`;
    const result = parseArtifact(minimal);
    expect(result.openDecisions).toHaveLength(0);
    expect(result.callsToLeads).toHaveLength(0);
    expect(result.codeChanges).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run to verify pass (these test existing code)**

```bash
cd packages/cli && npx vitest run tests/workflow/hermes-api.test.ts
```
Expected: PASS — 2 tests pass

- [ ] **Step 4: Create `packages/cli/src/workflow/hermes-api.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";
import { formatArtifactPrompt, parseArtifact } from "./artifact.js";
import type { HermesClient, SpawnResult } from "./hermes.js";
import type { MeshEvent } from "./state.js";

/**
 * ApiHermesClient — spawns a Lead agent via direct Anthropic API call.
 * The Lead receives a structured briefing and must return a markdown artifact.
 */
export class ApiHermesClient implements HermesClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(params: {
    apiKey?: string;
    model?: string;
    maxTokens?: number;
  } = {}) {
    this.client = new Anthropic({
      apiKey: params.apiKey ?? process.env["ANTHROPIC_API_KEY"],
    });
    this.model = params.model ?? "claude-sonnet-4-6";
    this.maxTokens = params.maxTokens ?? 4096;
  }

  async spawn(params: {
    leadId: string;
    briefing: string;
    model: string;
    runtime: string;
    threadId: string;
    meshRoot: string;
  }): Promise<SpawnResult> {
    const model = params.model !== "auto" ? params.model : this.model;
    const prompt = formatArtifactPrompt({
      leadId: params.leadId,
      threadId: params.threadId,
      goal: params.briefing,
    });

    const message = await this.client.messages.create({
      model,
      max_tokens: this.maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("\n");

    const artifact = parseArtifact(raw);

    // Write artifact to mesh
    const artifactDir = join(params.meshRoot, "docs", "artifacts");
    await mkdir(artifactDir, { recursive: true });
    const filename = `${params.threadId}-${params.leadId}.md`;
    await writeFile(join(artifactDir, filename), raw, "utf-8");

    // Write completion event to mesh channel
    const devChannelDir = join(params.meshRoot, "channels", "dev");
    await mkdir(devChannelDir, { recursive: true });
    const event: MeshEvent = {
      timestamp: new Date().toISOString(),
      agent: params.leadId,
      threadId: params.threadId,
      event: "completed",
      message: `Lead ${params.leadId} completed: ${params.briefing.slice(0, 80)}`,
      data: {
        artifactPath: join("docs", "artifacts", filename),
        openDecisionCount: artifact.openDecisions.length,
        callsToLeads: artifact.callsToLeads,
      },
    };
    const eventFilename = `${Date.now()}-${params.leadId}-completed.yaml`;
    await writeFile(join(devChannelDir, eventFilename), yaml.dump(event), "utf-8");

    return {
      leadId: params.leadId,
      success: true,
      summary: artifact.summary.slice(0, 200),
      meshEventCount: 1,
    };
  }
}
```

- [ ] **Step 5: Export from `packages/cli/src/workflow/hermes.ts`**

Add to the bottom of `hermes.ts`:

```typescript
export { ApiHermesClient } from "./hermes-api.js";
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd packages/cli && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/workflow/hermes-api.ts packages/cli/src/workflow/hermes.ts packages/cli/tests/workflow/hermes-api.test.ts
git commit -m "feat(f07): ApiHermesClient — real Anthropic API Lead spawning"
```

---

### Task 4: LLM-powered Orchestrator

**Files:**
- Modify: `packages/cli/src/workflow/nodes/orchestrator.ts`

The orchestrator currently calls `generateStubManifest`. Replace with an LLM call that decomposes the task into a real manifest.

- [ ] **Step 1: Update `packages/cli/src/workflow/nodes/orchestrator.ts`**

Replace the entire file:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { interrupt } from "@langchain/langgraph";
import { parseManifest, appendHitlLog } from "../manifest.js";
import type { WorkflowState, TaskManifest, HitlDecision } from "../state.js";

const DECOMPOSE_SYSTEM = `You are an Orchestrator agent. Your job is to decompose a task into a manifest
of Lead agents that can execute it in parallel where possible.

Return ONLY valid YAML in this exact format — no preamble, no explanation:

task: {the original task}
thread_id: {thread_id}
requested_by: human
created_at: "{iso timestamp}"
approved_at: null
completed_at: null
leads:
  - id: {lead-slug}
    goal: "{specific goal for this lead}"
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

Rules:
- Use 1-3 leads. Don't over-decompose.
- Use depends_on to express sequential dependencies (array of lead ids).
- gate: human for leads whose output needs human review; gate: auto for mechanical tasks.
- Lead ids must be kebab-case, descriptive (e.g. research-lead, dev-lead, review-lead).`;

export async function orchestratorNode(
  state: WorkflowState,
  options?: { apiKey?: string; model?: string },
): Promise<Partial<WorkflowState>> {
  const manifest = await decomposeTask(state.task, state.threadId, options);

  const presentedAt = new Date().toISOString();
  const decision = interrupt({
    type: "manifest-approval",
    manifest,
  }) as { decision: HitlDecision; notes: string | null };
  const decidedAt = new Date().toISOString();

  if (decision.decision === "rejected") {
    const retryTask = `${state.task}\n\n[Manifest rejected] Notes: ${decision.notes ?? ""}`;
    return orchestratorNode({ ...state, task: retryTask }, options);
  }

  const approvedManifest: TaskManifest = appendHitlLog(
    { ...manifest, approvedAt: decidedAt },
    {
      gate: "manifest-approval",
      leadId: null,
      presentedAt,
      decidedAt,
      decision: decision.decision,
      notes: decision.notes ?? null,
    },
  );

  return { manifest: approvedManifest };
}

async function decomposeTask(
  task: string,
  threadId: string,
  options?: { apiKey?: string; model?: string },
): Promise<TaskManifest> {
  const apiKey = options?.apiKey ?? process.env["ANTHROPIC_API_KEY"];
  const model = options?.model ?? "claude-sonnet-4-6";

  // Fall back to stub if no API key (keeps tests passing)
  if (!apiKey) {
    return generateStubManifest(task, threadId);
  }

  const client = new Anthropic({ apiKey });
  const now = new Date().toISOString();

  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    system: DECOMPOSE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Task: ${task}\nthread_id: ${threadId}\ncreated_at: "${now}"`,
      },
    ],
  });

  const raw = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("\n");

  try {
    return parseManifest(raw);
  } catch {
    // If LLM returns malformed YAML, fall back to stub
    console.warn("[orchestrator] LLM manifest parse failed, falling back to stub");
    return generateStubManifest(task, threadId);
  }
}

function generateStubManifest(task: string, threadId: string): TaskManifest {
  return parseManifest(`
task: ${task}
thread_id: ${threadId}
requested_by: human
created_at: "${new Date().toISOString()}"
approved_at: null
completed_at: null
leads:
  - id: dev-lead
    goal: "${task}"
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
`);
}
```

- [ ] **Step 2: Run existing integration tests to confirm they still pass**

```bash
cd packages/cli && npx vitest run tests/workflow/
```
Expected: existing tests pass (stub path still works when no API key)

- [ ] **Step 3: Wire `ApiHermesClient` in `run-workflow.ts`**

In `packages/cli/src/commands/run-workflow.ts`, find where `MockHermesClient` is instantiated and replace:

```typescript
// Before:
import { MockHermesClient } from "../workflow/hermes.js";
const hermes = new MockHermesClient();

// After:
import { MockHermesClient, ApiHermesClient } from "../workflow/hermes.js";
const hermes = process.env["ANTHROPIC_API_KEY"]
  ? new ApiHermesClient({ model: "claude-sonnet-4-6" })
  : new MockHermesClient();
```

- [ ] **Step 4: Compile check**

```bash
cd packages/cli && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/workflow/nodes/orchestrator.ts packages/cli/src/commands/run-workflow.ts
git commit -m "feat(f07): LLM orchestrator + ApiHermesClient wired — real execution path"
```

---

## M2 Gate Check

M2 is complete when:

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run a real workflow
ai-org run-workflow --task "Research best practices for TypeScript error handling"

# Verify artifact was written
ls .mesh/docs/artifacts/
cat .mesh/docs/artifacts/*.md   # should be a real structured artifact

# Verify channel event was written
ls .mesh/channels/dev/
cat .mesh/channels/dev/*.yaml   # should show completed event with summary
```
