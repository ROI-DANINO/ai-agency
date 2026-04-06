---
name: capture
description: >
  Mid-session decision or question capture — project-aware note taking.
  Triggers on: "capture", "note this", "save this", "remember this", "/capture"
type: human
user-invocable: true
status: stub
---

# Capture — Mid-Session Note

> **Status: Stub** — Full implementation pending F03 Skills System build.

This skill will capture mid-session decisions, questions, and observations to
`artifacts/session/current-context.md`, making them available to `session-end`
when writing the journal.

**Coming in:** F03 Skills System build (Milestone 1).

For now, add decisions and questions directly to the conversation — `session-end`
will pick them up from the transcript when writing the journal entry.
