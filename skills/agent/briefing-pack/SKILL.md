---
name: briefing-pack
description: >
  Writes a context briefing pack artifact for an agent before it starts a task.
  Called by orchestration layer, not directly by humans.
type: agent
user-invocable: false
status: stub
---

# Briefing Pack — Agent Context Package

> **Status: Stub** — Full implementation in F03 Skills System build.

This skill will write a structured briefing pack to
`artifacts/briefing-packs/YYYY-MM-DD-{agent}-{task}.md` before an agent starts work.

A briefing pack contains:
- Task description and scope
- Relevant context from memory (Mem0 query results)
- Links to key design docs
- Current team state and escalation path
- Handoff artifacts from predecessor agents

**Coming in:** F03 Skills System build (Milestone 1) + F05 Memory integration.
