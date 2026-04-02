# Feature 13 — Project Management

**Status:** PLACEHOLDER  
**Phase:** 2 — Platform  
**Layer:** Web + Cross-layer  
**Priority:** Medium  
**Depends on:** 12 Web Platform, 02 Team Structure

---

## Vision

Every agency deployment is a project. Projects have clients, scopes, deliverables, costs, and lifecycles. The system manages these so the human can focus on directing work rather than tracking it.

---

## Core Concept

A project represents one "agency engagement" — a specific client, a defined scope, a dedicated team configuration, and a budget. Projects are isolated from each other. Work, memory, and runs in Project A cannot bleed into Project B.

---

## Key Capabilities

- Project creation — name, client, scope description, team template, budget
- Client management — client profiles, contact info, project history
- Project isolation — each project gets its own workspace context, agent memory, and run history
- Cost tracking — per-project spend breakdown by model tier, cumulative vs. budget
- Spend alerts — notify human when project hits cost thresholds
- Deliverable tracking — define expected outputs, mark as delivered
- Project lifecycle — active, paused, delivered, archived
- Project templates — pre-configured team + skill setups for common project types
- Cross-project insights — patterns across projects (e.g., "security audits average X tokens")

---

## Open Questions

- [ ] Is a "project" a separate workspace, or a context within a workspace?
- [ ] Client auth — can clients log in to view progress, or is this internal only?
- [ ] Deliverable format — free-form description or structured schema?
- [ ] Budget tracking — by tokens, by cost (USD), or both?
- [ ] How are project templates created — by the user, or built-in?
- [ ] Multi-client workspace — one workspace for all clients, or one workspace per client?

---

## Considerations

- Project isolation is critical for any agency use case. A leaked context between clients is a trust-destroying bug.
- Cost tracking should be visible and proactive — not something you discover after the fact.
- Keep project management lightweight in Phase 1. Full client portal (Phase 3+) can come later.

---

## OSS & References

- **Reference:** `agentic-ai-platform` Prisma schema — workspace model as project isolation boundary
- **OSS:** Supabase RLS — row-level security for project data isolation

---

## Dependencies

- **12** Web Platform — project management lives in the dashboard
- **02** Team Structure — projects use team configurations

---

## Session Notes
<!-- Fill during design/build session -->
