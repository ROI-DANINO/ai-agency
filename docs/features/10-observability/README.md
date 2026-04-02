# Feature 10 — Observability & Monitoring

**Status:** PLACEHOLDER  
**Phase:** 2 — Platform  
**Layer:** Cross-layer  
**Priority:** High  
**Depends on:** 07 Workflow Engine

---

## Vision

Full visibility into what every agent is doing, why, and at what cost — without having to ask. Runs are inspectable. Decisions are traceable. Token spend is visible. Health problems surface automatically before they become blockers.

---

## Core Concept

Every agent run produces a structured log. Logs are queryable, streamable, and retained. A team health audit runs periodically — 5 parallel sub-agents checking skill health, memory integrity, log bloat, conflict staleness, and token efficiency. Problems are surfaced proactively.

---

## Key Capabilities

- Run logs — per-run log with entries for: system context, skill injection, tool calls, tool results, LLM input/output, token count, final output
- Near real-time log streaming during active runs
- Run history — paginated, filterable, searchable
- Token usage per run, per agent, per project
- Cost tracking per model tier per run
- Team health audit — parallel sub-agent health checks on a schedule
- Health check domains: prompt health, memory integrity, log bloat, conflict staleness, token efficiency
- Scope badges — visual indicators everywhere showing permission scope of resources
- Audit log — append-only record of sensitive operations (deployments, permission changes, prompt rollbacks)
- Alerting — configurable thresholds for token spend, error rates, run durations

---

## Open Questions

- [ ] Log storage — files (CLI mode) vs. database (web platform mode) vs. both?
- [ ] How long are logs retained? Configurable per workspace?
- [ ] Health audit schedule — daily, weekly, or triggered?
- [ ] What counts as a "health problem" — thresholds for log bloat, stale memory, etc.?
- [ ] Does the health audit auto-fix issues, or just report them?
- [ ] Real-time streaming — polling (simple) or WebSocket/SSE (better UX)?
- [ ] AgentOps integration — worth using for the observability layer, or build custom?

---

## Considerations

- Run logs as first-class data (from agentic-ai) is the right philosophy. Structured, queryable logs enable debugging, auditability, and reasoning about agent behavior.
- The team health audit (from stam/unified-efficiency-layer) is a proven pattern — 5 parallel sub-agents, each checking one domain. Reuse this design.
- Scope badges everywhere (from agentic-ai) should be a cross-cutting concern — built into the design system, not bolted on later.
- AgentOps is worth evaluating — it's open source and provides agent monitoring out of the box.

---

## OSS & References

- **OSS:** AgentOps — open source agent monitoring platform
- **Reference:** `agentic-ai` design spec — run logs schema, near-real-time polling pattern, scope badges
- **Reference:** `stam/unified-efficiency-layer-design.md` — team-health 5-agent audit design
- **Reference:** `agentic-ai-platform` Prisma schema — AuditLog model

---

## Dependencies

- **07** Workflow Engine — runs are owned by the workflow engine

---

## Session Notes
<!-- Fill during design/build session -->
