---
name: decision-report
description: >
  Structures a HITL decision surface for the human at an approval gate.
  Called by lead agents when a task reaches a decision requiring human input.
  Produces a decision-report artifact that the human reviews and responds to.
  Not directly invocable by humans.
type: agent
status: active
calls: none
next: brief
reads: current-task-context
output: decision-report-artifact
---

# Decision Report — HITL Surface

This skill creates a structured decision report when a task reaches a human
approval gate (HITL — Human In The Loop). The report presents the decision
required, context, options with tradeoffs, a recommendation, and impact analysis.

The artifact is written to `artifacts/decision-reports/YYYY-MM-DD-{feature}-{decision}.md`
using the `writeDecisionReport` function from `packages/cli/src/artifacts.ts`.

## When to Invoke

Called by the Lead agent (or any agent with escalation authority) when:
- A design decision requires human approval before proceeding
- A tradeoff has meaningful consequences that the human should own
- The human has flagged a decision as require-their-input in their preferences
- An open question in TASKS.md reaches its decision point

## Step 1 — Gather Decision Data

Collect the following before writing:

- **Requires**: who must approve (e.g. "human approval", "lead approval")
- **Blocks**: what work is blocked pending this decision (e.g. "feature/onboarding")
- **Deadline**: urgency level — "urgent" (blocks work now), "non-blocking" (parallel work possible), or a specific time
- **The decision**: one clear, answerable question
- **Context**: what led to this decision point
- **Options**: 2–3 paths with names, descriptions, and tradeoffs
- **Recommendation**: the lead agent's recommended option
- **Impact**: what changes depending on the human's answer

## Step 2 — Write the Artifact

Use `writeDecisionReport` from `packages/cli/src/artifacts.ts`:

```typescript
import { writeDecisionReport } from "packages/cli/src/artifacts.ts";

const filePath = await writeDecisionReport({
  date: "YYYY-MM-DD",
  requires: "human approval",
  blocks: "feature/onboarding",
  deadline: "non-blocking",
  theDecision: "Should email verification be synchronous (block signup) or async (allow login with unverified flag)?",
  context: "Design phase for onboarding complete. Implementation cannot proceed until the auth flow is finalized. Both approaches are technically viable with different UX and security implications.",
  options: [
    {
      label: "A",
      name: "Synchronous verification",
      description: "User must verify email before any app access. Classic approach — verify link expires in 24h.",
      tradeoffs: "Higher security, lower conversion. Simple flow but adds friction at signup.",
    },
    {
      label: "B",
      name: "Asynchronous verification",
      description: "User gets full app access immediately. Limited features until verified (e.g. no email notifications).",
      tradeoffs: "Better UX and conversion. More complex — must track verification state everywhere.",
    },
  ],
  recommendation: "Option B — async verification. Matches the project's UX-first philosophy. Limited-feature approach keeps security while not blocking the user.",
  impact: "Option A: simpler data model, one flow. Option B: adds isVerified flag to User model, conditional logic in notification system. Either way, the other onboarding features (profile setup, team invite) are not affected.",
}, repoRoot);
```

The written artifact follows this structure:

```markdown
---
status: written
created_at: ISO-8601-timestamp
---

# Decision Report — feature/onboarding / Should email verification be...
Date: YYYY-MM-DD
Requires: human approval
Blocks: feature/onboarding
Deadline: non-blocking

## The Decision
Should email verification be synchronous (block signup) or async (allow login with unverified flag)?

## Context
Design phase for onboarding complete. Implementation cannot proceed until the auth flow is finalized. Both approaches are technically viable with different UX and security implications.

## Options

### Option A: Synchronous verification
User must verify email before any app access. Classic approach — verify link expires in 24h.
**Tradeoffs:** Higher security, lower conversion. Simple flow but adds friction at signup.

### Option B: Asynchronous verification
User gets full app access immediately. Limited features until verified (e.g. no email notifications).
**Tradeoffs:** Better UX and conversion. More complex — must track verification state everywhere.

## Recommendation
Option B — async verification. Matches the project's UX-first philosophy. Limited-feature approach keeps security while not blocking the user.

## Impact
Option A: simpler data model, one flow. Option B: adds isVerified flag to User model, conditional logic in notification system. Either way, the other onboarding features (profile setup, team invite) are not affected.
```

## Step 3 — Present to Human

The decision report is presented to the human at the HITL gate. The LangGraph
workflow uses `interrupt()` to pause execution and surface the report.

The human reads the report (or references it via skill:// protocol):

```
skill://decision-report?artifact=artifacts/decision-reports/YYYY-MM-DD-{feature}-{decision}.md
```

The human responds with their decision. The LangGraph workflow resumes
after `interrupt()` receives the answer, and the chosen option is recorded
in TASKS.md `## Done`.

## Chaining

- **reads**: current task context, briefing pack, any prior handoffs for background
- **produces**: decision-report artifact at `artifacts/decision-reports/`
- **next**: human response — workflow resumes via LangGraph `interrupt()`
- **calls**: none directly; the HITL mechanism handles the pause and resume

## Output

File path to the written decision report, returned for logging and HITL tracking.
Confirm: `"Decision report written: artifacts/decision-reports/YYYY-MM-DD-{feature}-{decision}.md"`
