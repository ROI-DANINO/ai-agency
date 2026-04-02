# Feature 09 — HITL Reporting (Human-in-the-Loop)

**Status:** PLACEHOLDER  
**Phase:** 2 — Platform  
**Layer:** Cross-layer  
**Priority:** Critical  
**Depends on:** 07 Workflow Engine

---

## Vision

The human is never surprised and never bypassed. At every meaningful decision point, the system pauses and delivers a structured, scannable report that gives exactly what's needed to make a good call — no more, no less. The human decides. Agents resume.

---

## Core Concept

When a workflow reaches a human gate, the Orchestrator (or relevant Lead) compiles a **Decision Report** and delivers it to the human's inbox. The human reads it, makes a decision, and the system continues.

A Decision Report is structured, not conversational:
- What decision is needed
- What the agents recommend and why
- What the alternatives are
- What happens if no decision is made (default path)
- Deadline / urgency

---

## Decision Report Format (Example)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION REQUIRED — Project: [Name]
Submitted by: Dev Lead (Winston)
Urgency: Medium | Deadline: 2h before next phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXT
The authentication system design is complete. Before implementation begins,
a decision is needed on session token storage strategy.

OPTIONS
  A) JWT in HttpOnly cookies (recommended)
     → Secure against XSS, standard practice, slightly more complex logout
  B) Session tokens in DB
     → More control over invalidation, higher DB load, extra infrastructure

RECOMMENDATION
Option A — JWT in HttpOnly cookies. Industry standard, no additional
infrastructure, and adequate for the project's scale.

IMPACT IF NO DECISION IN 2H
Dev Lead will proceed with Option A and log the decision as auto-approved.

RESPOND
  /approve A    — proceed with JWT cookies
  /approve B    — proceed with DB sessions
  /defer        — pause implementation, needs more discussion
  /reject       — rethink the approach entirely
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Key Capabilities

- Structured decision report format (context, options, recommendation, deadline, response commands)
- Human inbox — aggregated view of all pending decisions across projects
- Response commands — approve, reject, defer, redirect
- Notification delivery — CLI, Telegram, Slack, email, web dashboard (configurable)
- Urgency levels — informational, medium, high, blocking
- Timeout with default — if no response by deadline, system logs as auto-approved and continues
- Conflict reports — when two leads disagree, both sides presented with Orchestrator summary
- Daily briefing — morning summary of decisions pending, team status, open questions

---

## Open Questions

- [ ] Primary notification channel — what does the user want? (Telegram is likely fastest for mobile)
- [ ] How are responses captured? (Reply to message, CLI command, web UI, all three?)
- [ ] Can the human request more information before deciding, or only approve/reject/defer?
- [ ] How long is a report stored if not acted on? Does it expire?
- [ ] Multiple humans — can reports be delegated to a team member? (Phase 2+ feature)
- [ ] How does the daily briefing differ from individual decision reports?

---

## Considerations

- The format matters enormously. Reports must be scannable in under 30 seconds. If a human reads a report and needs to ask a follow-up question before deciding, the report failed.
- Default paths for unresponded reports are critical for flow. Agents can't block indefinitely.
- Telegram is probably the best Phase 1 notification channel — it's mobile-first, has a simple bot API, and the user likely already uses it.
- The `ai-team` project has a good daily briefing template — steal it for the morning summary format.

---

## OSS & References

- **OSS:** Telegram Bot API — simple, mobile-first, easy to set up
- **OSS:** n8n — can handle notification routing (email, Slack, webhook) without custom code
- **Reference:** `ai-team` — daily briefing format, conflict resolution protocol
- **Reference:** The architecture prompt provided — "executive decision reports" concept

---

## Dependencies

- **07** Workflow Engine — HITL gates live inside the workflow engine

---

## Session Notes
<!-- Fill during design/build session -->
