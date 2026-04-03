# Research: Paperclip (Paiperclip)

**Status:** Complete — identified, assessed, decision pending deeper read  
**Researched:** 2026-04-04

## Answer

**Paperclip is real.** The user's spelling "Paiperclip" was a phonetic variant. The correct name is **Paperclip** by Paperclip AI.

**GitHub:** https://github.com/paperclipai/paperclip  
**Stars:** 46,100 | **Forks:** 7,300 | **License:** MIT | **Active:** Yes (1,833+ commits on master)

---

## What It Is

Paperclip is a self-hosted AI agent orchestration platform built around the concept of a "zero-human company." Their tagline:

> "If Claude is an employee, Paperclip is the company."

Tech stack: Node.js 20+ / TypeScript / pnpm / React UI / PostgreSQL (embedded for local dev, configurable external for production).

---

## What It Does

Paperclip models a company as an org chart of AI agents with:

- **Org chart** — agents have roles, titles, reporting lines (matches ai-org's Workspace → Cluster → Group → Agent hierarchy)
- **Task/ticket system** — full audit trails and tool-call traces per task
- **Monthly budgets per agent** — automatic throttling with atomic cost enforcement
- **Heartbeats** — scheduled agent wake-up cycles for autonomous operation
- **Goal alignment** — tasks trace back to company mission
- **HITL governance** — approve hires, override strategy, pause or terminate any agent at any time
- **Multi-company isolation** — one deployment can run many companies with separate data

---

## Relevance to AIOS

**Concept alignment:** Very high. Paperclip was built for exactly the use case ai-org is targeting — persistent teams of AI agents with human oversight. The org chart model, agent budgets, HITL governance, and task tracing map directly to the platform vision.

**Possible fork target for Feature 12 (Web Platform):** Paperclip's React UI + Postgres schema may be a better fork target than agentic-ai-platform for Feature 12 specifically, if its agent execution runtime (heartbeats, task checkout) can be decoupled from the UI layer.

---

## Open Question (Action Required)

Before committing to agentic-ai-platform as the Feature 12 fork target, read Paperclip's source to determine:

1. Can the React UI + Postgres schema be cleanly separated from the execution runtime?
2. Does Paperclip's execution model (heartbeats, task checkout) compete with or complement the planned LangGraph + CrewAI stack?
3. How much of Paperclip's UI would need to be discarded vs. kept?

**If the UI is decoupable:** Paperclip's UI layer + Postgres schema may save significant Feature 12 build time.  
**If the UI is tightly coupled to the runtime:** Use agentic-ai-platform as the dashboard shell (schema + auth already done) and reference Paperclip for schema/UX design patterns only.

---

## Apple Lens Assessment

| Criterion | Score | Notes |
|---|---|---|
| Inevitability | HIGH | Purpose-built for agent team management; concept maps directly to vision |
| API quality | MEDIUM | No published REST API docs found; control appears to be primarily React UI + internal Node.js API |
| Operational cost | LOW-MEDIUM | Embedded Postgres for local dev; external Postgres for production; standard Node.js stack |
| Exit cost | LOW | MIT license, clean Node.js/React, data in Postgres — fork and own it |

---

## Related

- `docs/research/forks-and-oss.md` — Paperclip listed as secondary fork candidate for Feature 12
- `docs/features/12-web-platform/README.md` — Feature 12 design will consider Paperclip vs. agentic-ai-platform
- `data/notes.md` [2026-03-29] — original "investigate Paperclip as a UI layer" note
