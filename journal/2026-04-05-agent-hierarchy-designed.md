# Agent Hierarchy & Team Structure Designed
Date: 2026-04-05
Type: decision

## What Happened

Long brainstorming session, partly in parallel with a Gemini side-chat, to get the full agent hierarchy out of Roi's head and onto paper. Started with a rough sketch in the architecture doc and ended with a complete locked design for Feature 02 plus two new features (Phase 1 mesh, CoS skill) that weren't previously tracked.

Used the visual companion (browser diagrams) to iterate through the hierarchy live. The Gemini session was productive — it surfaced the "reporting bias" hole (OP shouldn't synthesize reports), the infinite loop deadlock risk (leads getting stuck in polite ping-pong), and the state-vs-transport distinction. All three led to real design decisions.

## Decisions Made

- **3-tier hierarchy locked** — Admin → OP → Leads+Workers. Clean separation: Admin decides, OP runs, Leads execute.
- **CoS = OP skill, not a separate agent** — Chief of Staff synthesis function lives on OP as a skill. OP concatenates raw lead outputs; CoS skill synthesizes them into a human-readable decision report. Needs further design before building.
- **3 protected leads** — Recruitment, Knowledge, Operations. Built-in, cannot be removed. Recruitment is Phase 1 manual config, Phase 2 self-recruiting. Why: these are the functions that every company needs regardless of domain; without them the system can't onboard, can't remember, can't track its own health.
- **Phase 1 roster for ai-org** — Dev, PM, UX, Security, DevOps (confirmed Phase 1 — real infra to manage), Quality (recommended recruit, not protected).
- **Conflict = task status field** — `conflicted | decision_required` is set by workflow logic, not LLM judgment. Circuit breaker auto-escalates after N lateral messages. Deterministic escalation, not AI-reasoned.
- **OP concatenates, Feature 09 synthesizes** — OP is strictly a router and concatenator. The HITL reporting layer (Feature 09) owns synthesis. OP never decides what's important.
- **Phase 1 mesh = .md file layer** — No live NATS needed in Phase 1. Agents read inbox.md at session start, write to journal.md and outbox.md at session end. Refinement sprint needed before building. NATS replaces it in Phase 2.
- **Tenure worker** as a new agent type — persistent sub-agent with domain expertise that can spawn task-scoped agents for its session. Architect and CSO Auditor are tenure workers.

## Open Questions

- CoS skill design: what triggers it, what it reads, report format, blocking vs non-blocking classification, token budget
- .md mesh schema: exact format for profile.md, journal.md, inbox.md entries
- Recruitment interview flow (Phase 2): how OP triggers it, what the Admin interview looks like

## What's Next

Three implementation plans written and ready, in order:
1. **Plan A — Feature 02**: implement the hierarchy (agent definitions, tier config, protected leads, Phase 1 roster, escalation config)
2. **Plan B — Phase 1 mesh**: refinement sprint first to lock schema, then build .mesh/ directory layer
3. **Plan C — CoS skill**: design session first to answer the 5 open questions, then build

Feature 01 must be complete before Plan A can execute.
