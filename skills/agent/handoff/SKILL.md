---
name: handoff
description: >
  Writes a handoff artifact when work transfers from one agent to another.
  Called by agents completing a task segment, not directly by humans.
type: agent
user-invocable: false
status: stub
---

# Handoff — Work Transfer Artifact

> **Status: Stub** — Full implementation in F03 Skills System build.

This skill will write a handoff artifact to
`artifacts/handoffs/YYYY-MM-DD-{from}-to-{to}-{task}.md` when one agent
completes its portion of work and passes to the next.

A handoff contains:
- What was completed (with file paths and decisions made)
- What remains to be done
- Open questions the next agent must resolve
- Relevant context the next agent needs (not in the briefing pack)
- Suggested first action for the receiving agent

**Coming in:** F03 Skills System build + F02 Team Structure wiring.
