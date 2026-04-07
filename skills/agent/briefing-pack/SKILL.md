---
name: briefing-pack
description: >
  Writes a structured briefing-pack artifact for an agent before it starts a task.
  Called by the Orchestrator to dispatch sub-agents with full context. Produces a
  briefing-pack file that the receiving agent reads via skill://protocol.
  Not directly invocable by humans.
type: agent
status: active
calls: none
next: handoff
reads: task-state
output: briefing-pack-artifact
---

# Briefing Pack — Agent Context Package

This skill creates a structured briefing package that the Orchestrator writes
before dispatching a sub-agent to work on a task. The briefing pack gives the
receiving agent everything it needs: task scope, context, references, team state,
constraints, and predecessor handoffs.

The artifact is written to `artifacts/briefing-packs/YYYY-MM-DD-{agent}-{task}.md`
using the `writeBriefingPack` function from `packages/cli/src/artifacts.ts`.

## When to Invoke

Called by the Orchestrator (or Lead agent) before dispatching any sub-agent to work
on a task. Use when:
- A task from TASKS.md is being assigned to an agent
- An agent is being spun up in a new LangGraph node
- A sub-agent needs context to begin work autonomously

## Step 1 — Gather Context

Collect the following information before writing the artifact:

- **Agent identity**: which agent is receiving this briefing (e.g. "dev-agent", "design-agent")
- **Task ID**: the task identifier from TASKS.md
- **Role**: the agent's role for this task (e.g. "implementer", "reviewer")
- **Task description**: scope and expected output, pulled from TASKS.md
- **Context**: current project state relevant to this task
- **Key references**: list of files/docs the agent should read, with reasons
- **Team state**: what other agents are doing, active tracks
- **Predecessor handoffs**: links to any handoff artifacts from prior agents, or "None — first task"
- **Constraints**: token budget, available tools, deadline

## Step 2 — Write the Artifact

Use `writeBriefingPack` from `packages/cli/src/artifacts.ts`:

```typescript
import { writeBriefingPack } from "packages/cli/src/artifacts.ts";

const filePath = await writeBriefingPack({
  date: "YYYY-MM-DD",
  agent: "agent-name",
  task: "task-id",
  role: "agent-role",
  taskDescription: "Scope and expected output of the task.",
  context: "Current project state and background.",
  keyReferences: [
    { path: "docs/FEATURE-MAP.md", reason: "Feature lock status" },
    { path: "TASKS.md", reason: "Current priorities" },
  ],
  teamState: "Current status of other agents and tracks.",
  predecessorHandoffs: "None — first task or paths to prior handoffs.",
  constraints: {
    tokenBudget: "~8000 tokens",
    toolsAvailable: "read_file, write_file, patch, terminal",
    deadline: "end of current session",
  },
}, repoRoot);
```

The written artifact follows this structure:

```markdown
---
status: written
created_at: ISO-8601-timestamp
agent: agent-name
---

# Briefing Pack — agent-name / task-id
Date: YYYY-MM-DD
Agent: agent-name
Task: task-id
Role: agent-role

## Task
{taskDescription}

## Context
{context}

## Key References
- `docs/FEATURE-MAP.md`: {reason}
- `TASKS.md`: {reason}

## Team State
{teamState}

## Predecessor Handoffs
{predecessorHandoffs or "None — first task"}

## Constraints
- Token budget: {tokenBudget or "N/A"}
- Tools available: {toolsAvailable or "N/A"}
- Deadline: {deadline or "N/A"}
```

## Step 3 — Pass to Receiving Agent

The receiving agent reads this artifact via the skill:// protocol:

```
skill://briefing-pack?artifact=artifacts/briefing-packs/YYYY-MM-DD-{agent}-{task}.md
```

The agent reads the briefing pack before beginning work, using the Key References
section to load prerequisite documents.

## Chaining

- **reads**: TASKS.md, docs/FEATURE-MAP.md, journal/HANDOFF.md (for context gathering)
- **produces**: briefing-pack artifact at `artifacts/briefing-packs/`
- **next**: The receiving agent uses this briefing pack, then calls `handoff` when done
- **calls**: none directly; Orchestrator provides the context data

## Output

File path to the written briefing pack, returned for logging and agent routing.
Confirm: `"Briefing pack written: artifacts/briefing-packs/YYYY-MM-DD-{agent}-{task}.md"`
