# Feature 02 — Team Structure & Hierarchy

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin + Cross-layer  
**Priority:** Critical  
**Depends on:** 01 Agent Identity

---

## Vision

A structured team of agents organized into a clear hierarchy — like a real company department structure — where every agent knows its role, who it reports to, and what it owns. The human is always at the top, never bypassed.

---

## Core Concept

```
Human (Lead Director)
    ↓
Orchestrator
    ↓
Team Leads (PM, Dev, UX, Security)
    ↓
Sub-agents (Analyst, Architect, Developer, QA, ...)
```

The hierarchy is not just organizational — it's operational. Tasks flow down. Decisions and reports flow up. Conflicts escalate to the Orchestrator, then to the human if unresolved.

---

## Key Capabilities

- Hierarchy levels: Workspace → Cluster → Group → Agent
- Built-in role templates: Orchestrator, PM Lead, Dev Lead, UX Lead, Security Lead
- Sub-agent types per department (Research, Development, Marketing, QA)
- Role assignment — which model tier runs which role
- Conflict escalation protocol — automatic routing to Orchestrator then human
- Daily briefing — structured summary delivered to human as their "inbox"
- Custom role creation (beyond the built-in templates)
- BMAD-method persona templates (John the PM, Winston the Dev Lead, Sally the UX Lead)

---

## Open Questions

- [ ] Is the hierarchy fixed (the 4 departments) or fully customizable by the user?
- [ ] How are sub-agents assigned to leads — static assignment or dynamic per task?
- [ ] What is the conflict detection mechanism? How does the system know two leads disagree?
- [ ] Does the Orchestrator model need to be different from the Lead model? (Qwen 3.6 vs Nemotron)
- [ ] Can a user create entirely custom departments / roles beyond the built-ins?
- [ ] What does "dismissing" a sub-agent look like — does it write a handoff before ending?
- [ ] How many sub-agents can run in parallel per lead?

---

## Considerations

- The Orchestrator is a coordinator, never a decision-maker. This must be architecturally enforced, not just prompted.
- BMAD-method personas (from ai-team) are battle-tested and should be the default role templates.
- The hierarchy needs to work in CLI-only mode (no web platform) — everything must be expressible in markdown agent definitions.
- Sub-agent scope creep is a real risk — each sub-agent must have a clearly defined "what you never do" section.

---

## OSS Stack

- **agentic-ai-platform fork** — provides the hierarchy schema wholesale: `Workspace → Cluster → Group → Agent` with FK-enforced cascade. Adopt as-is, add `rank` field (`admin | operator | lead | agent`) to Agent model. — Seam: Prisma schema; platform builds on top, no schema redesign needed.
- **ResourceScopeBinding + ResourcePermission** (from agentic-ai-platform) — flexible scoped visibility and per-resource access control; adopt for team-level permission gates. — Seam: `can(actor, action, resource)` function in app layer.
- **AuditLog pattern** (from agentic-ai-platform) — append-only, JSON metadata; adopt for all HITL decision trails and agent actions. — Seam: every mutation writes an audit row.
- **ai-team agent role definitions** — 14 BMAD persona definitions (Orchestrator, PM Lead, Dev Lead, UX Lead, Security Lead + sub-agents); copy markdown files, don't fork the repo.

## OSS & References

- **Reference:** `ai-team` — 14 fully defined agent roles with personas, escalation rules, output formats
- **Reference:** BMAD method agent templates
- **Reference:** `agentic-ai` design spec — Workspace → Cluster → Group → Agent hierarchy
- **Reference:** `agentic-ai-platform` Prisma schema — Cluster, Group, Agent models

---

## Dependencies

- **01** Agent Identity — agents need stable identities before team structure can be defined

---

## Session Notes
<!-- Fill during design/build session -->
