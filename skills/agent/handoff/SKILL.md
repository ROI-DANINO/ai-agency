---
name: handoff
description: >
  Writes a handoff artifact when work transfers from one agent to another.
  Called by agents completing a task segment to pass context to the next agent.
  Not directly invocable by humans. Consumes briefing-pack output and feeds
  into the next agent's briefing.
type: agent
status: active
calls: none
next: briefing-pack
reads: briefing-pack
output: handoff-artifact
---

# Handoff — Work Transfer Artifact

This skill creates a structured handoff artifact when one agent completes its
portion of work and passes to the next agent in a chain. The handoff captures
what was done, what remains, open questions, and suggested next steps.

The artifact is written to `artifacts/handoffs/YYYY-MM-DD-{from}-to-{to}-{task}.md`
using the `writeHandoff` function from `packages/cli/src/artifacts.ts`.

## When to Invoke

Called by any agent that is completing a task segment and transferring work to
another agent. Use when:
- An agent has finished its assigned portion and passes to the next in the chain
- Work transitions between roles (e.g. design-agent → dev-agent)
- A task reaches a checkpoint requiring a different agent type

## Step 1 — Gather Handoff Data

Collect the following before writing:

- **From**: current agent identity (e.g. "design-agent")
- **To**: receiving agent identity (e.g. "dev-agent")
- **Task ID**: the task identifier from the briefing pack
- **Completed**: array of specific items finished (with file paths and decisions)
- **Remaining**: array of items left for the next agent
- **Open questions**: unresolved items the next agent must address
- **Context**: relevant background not covered in the briefing pack
- **First action**: one concrete suggestion for what the receiving agent should do first

## Step 2 — Write the Artifact

Use `writeHandoff` from `packages/cli/src/artifacts.ts`:

```typescript
import { writeHandoff } from "packages/cli/src/artifacts.ts";

const filePath = await writeHandoff({
  date: "YYYY-MM-DD",
  from: "design-agent",
  to: "dev-agent",
  task: "task-id",
  completed: [
    "Architecture draft written at docs/features/01-onboarding/design.md",
    "Data model locked — see PRD §3",
  ],
  remaining: [
    "Implement User model in packages/cli/src/models/",
    "Write unit tests for auth flow",
  ],
  openQuestions: [
    "Should email verification be synchronous or async?",
  ],
  context: "Design phase complete. Build phase begins. Token budget remaining: ~6000.",
  firstAction: "Read docs/features/01-onboarding/design.md and implement the User model per §2.",
}, repoRoot);
```

The written artifact follows this structure:

```markdown
---
status: written
created_at: ISO-8601-timestamp
agent: design-agent
---

# Handoff — design-agent → dev-agent
Date: YYYY-MM-DD
From: design-agent
To: dev-agent
Task: task-id

## Completed
- Architecture draft written at docs/features/01-onboarding/design.md
- Data model locked — see PRD §3

## Remaining
- Implement User model in packages/cli/src/models/
- Write unit tests for auth flow

## Open Questions
- Should email verification be synchronous or async?

## Context
Design phase complete. Build phase begins. Token budget remaining: ~6000.

## First Action
Read docs/features/01-onboarding/design.md and implement the User model per §2.
```

## Step 3 — Chain to Next Agent

The receiving agent reads this handoff via the skill:// protocol:

```
skill://handoff?artifact=artifacts/handoffs/YYYY-MM-DD-{from}-to-{to}-{task}.md
```

The next agent's briefing pack (written by `briefing-pack`) should reference this
handoff in its `predecessorHandoffs` field.

## Chaining

- **reads**: briefing-pack artifact for this task, current work products
- **produces**: handoff artifact at `artifacts/handoffs/`
- **next**: feeds into the next agent's briefing-pack (via predecessorHandoffs)
- **calls**: none directly; the LangGraph router dispatches the next agent

## Output

File path to the written handoff artifact, returned for logging and team state tracking.
Confirm: `"Handoff written: artifacts/handoffs/YYYY-MM-DD-{from}-to-{to}-{task}.md"`
