# Feature 14 — Agency Builder

**Status:** PLACEHOLDER  
**Phase:** 2 — Platform  
**Layer:** Cross-layer  
**Priority:** High  
**Depends on:** All features 01–13

---

## Vision

The meta-feature. This platform is an AI agency — and it can build new AI agencies. Given a domain, a client need, or a project description, the system designs a team configuration, scaffolds the required skills and tools, and produces a working agency ready to deploy. AI agencies building AI agencies.

---

## Core Concept

The Agency Builder is a higher-order workflow. It takes as input a description of what needs to be built, and uses the platform's own capabilities to produce:

1. A team configuration (which roles, which models, which skills)
2. A skills set tailored to the domain
3. An initial tool inventory
4. A project brief and first run plan

The output is a deployable agency — not just a doc, but a configured system ready to run.

---

## Key Capabilities

- Agency brief intake — describe the domain, the client, the goals
- Team configuration generation — recommended roles, model assignments, hierarchy
- Skill scaffolding — auto-generate starter skills for the domain from templates
- Tool recommendation — suggest tools based on the agency's needs
- Project plan generation — first sprint decomposed into tasks
- Agency template library — saved configurations for common agency types (dev agency, marketing agency, research agency, etc.)
- One-click deploy — create the workspace, agents, skills, and tools from the template
- Agency handoff — export a complete agency configuration for a client to run independently

---

## Open Questions

- [ ] What does the human review before an agency is "deployed" — the team config only, or everything?
- [ ] How much does the Agency Builder itself use the platform's agents? (Does the Orchestrator design the agency?)
- [ ] Can agencies be shared publicly (agency template marketplace)?
- [ ] What does "deploy to client" mean — give them access to the web platform, or export a standalone package?
- [ ] Version control for agency templates — how are updates to a template propagated to existing deployments?

---

## Considerations

- This is the flagship feature — the "AI agency that builds AI agencies" concept. It should be treated with that level of ambition.
- The Agency Builder likely uses the platform itself (Orchestrator + Dev Lead + UX Lead) to design new agencies. That recursive use is a powerful demo.
- Keep Phase 1 simple: a guided form that produces a pre-configured template. The AI-driven auto-design comes in Phase 2+.
- The agency template library is the long-term moat — a curated collection of proven agency configurations for different domains.

---

## OSS & References

- **Reference:** All previous features — Agency Builder orchestrates all of them
- **Reference:** `ai-team` — example of a manually configured agency (good template for a "dev agency")

---

## Dependencies

- **01–13** — all features must be operational before Agency Builder can use them

---

## Session Notes
<!-- Fill during design/build session -->
