# Feature 02 — Team Structure & Hierarchy

**Status:** DESIGNED  
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

- [x] Is the hierarchy fixed or customizable? — Fixed defaults (3 protected leads) + recruited leads for Phase 1. User-configurable departments is Phase 2.
- [x] How are sub-agents assigned? — Dynamic per task. Leads spawn task-scoped agents as needed.
- [x] Conflict detection? — Task status field (`conflicted | decision_required`), not LLM judgment. Circuit breaker: N lateral messages → auto-escalate to OP.
- [x] Orchestrator model tier? — OP = Tier 2 (Claude Haiku). CoS synthesis = OP skill, not a separate agent.
- [x] Custom departments? — Phase 2. Recruitment Lead handles team onboarding via Admin interview.
- [x] Dismissing sub-agents? — Writes handoff artifact before dismissal. Same pattern as aios handoff skill.
- [x] Parallel sub-agents per lead? — Defined in Feature 07 (Workflow Engine). Not blocked here.

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

### Design — 2026-04-05

Full hierarchy designed. All open questions resolved.

**Key decisions:**
- 3-tier structure: Admin → OP → Leads+Workers
- CoS = OP skill (not a separate agent). Faces up, synthesizes reports for Admin. Needs further design.
- 3 protected leads (built-in, cannot be removed): Recruitment, Knowledge, Operations
- Phase 1 roster for ai-org: Dev, PM, UX, Security, DevOps, Quality (recommended)
- Agent types: Persistent Lead · Tenure Worker (persistent, can spawn) · Task-scoped sub-agent
- Conflict is a task status field, not LLM judgment. Circuit breaker auto-escalates after N lateral messages.
- OP concatenates raw outputs. CoS skill synthesizes them. OP never synthesizes.
- Phase 1 comms mesh = .md file layer. Phase 2 = NATS + Mem0 + full social primitives.
- Horizontal lead comms via NATS. Informational stays lateral. Conflicts escalate to OP → Admin.

**Full spec:** `docs/superpowers/specs/2026-04-05-agent-hierarchy-design.md`  
**Implementation plans:** Plan A (Feature 02) → Plan B (.md mesh) → Plan C (CoS skill)
