# OSS Stack Locked — All Phase 1 Features Wired
Date: 2026-04-04
Type: decision

## What Happened

This session was pure research and synthesis — no building, just locking. The task was to take the 15-feature platform map and actually answer the question: "what OSS tool goes where, and why?" The answer wasn't obvious for most of them.

We ran 4 parallel subagents: two mining local repos (agentic-ai-platform, claude-peers-mcp, aios, ai-team, hermes-integration, pi_agency), two doing online research (agent comms alternatives, web UI options, memory tools, sandboxing, n8n deep-dive). The synthesis took all four reports and locked one clear call per feature — no "maybe" left in the stack.

The two surprises: NATS.io turned out to be the obvious answer for agent communications (purpose-built message routing with an existing MCP server — it just maps cleanly, nothing else does), and Paperclip (github.com/paperclipai/paperclip) turned out to actually exist and be exactly what the user remembered — 46K stars, MIT, purpose-built for "run a company of AI agents." That one needs a deeper read before Feature 12 is designed.

The other meaningful call: LangGraph over CrewAI. LangGraph 1.0 shipped in October 2025 and its `interrupt()` / `Command(resume=...)` pattern handles HITL pause/resume cleanly without any additional infrastructure. That decision had been deferred as "CrewAI → LangGraph"; it's now locked as LangGraph from day one.

## Decisions Made

- **LangGraph 1.0 over CrewAI** — why: LangGraph 1.0 is stable; `interrupt()` maps directly to HITL gates; AsyncSqliteSaver needs zero infrastructure for Phase 1. CrewAI is simpler but doesn't have native HITL.
- **NATS.io for agent communications** — why: subject hierarchy = agent topology (no mapping needed); single binary <20MB; existing MCP server; replaces claude-peers SQLite broker without touching the MCP surface.
- **Mem0 self-hosted over raw pgvector** — why: the extraction pipeline + deduplication + scoped retrieval is non-trivial to build custom; Mem0 gives it for free and runs on the same Supabase Postgres instance already planned.
- **Docker exec + Deno V8 for tool sandbox** — why: Phase 1 tools are platform-authored (known code, not untrusted input); cloud sandbox (E2B) adds latency and cloud dependency for a problem that doesn't exist yet. vm2 is out — deprecated with critical CVEs.
- **n8n confirmed for HITL notifications** — why: Wait Node + Webhook is native HITL pause/resume; ~100 lines of platform glue code; n8n owns all the notification routing.
- **Paperclip as Feature 12 secondary candidate** — why: it was purpose-built for this exact use case; 46K stars, MIT, self-hosted. Need to read the source to determine if UI layer is decoupable from the execution runtime before committing to agentic-ai-platform as the Feature 12 fork target.
- **Temporal: noted migration path for Phase 3** — why: battle-hardened for multi-machine durable workflows, but operational overhead (Postgres + server + worker) is unjustifiable for Phase 1 local single-machine use.

## Open Questions

- Can Paperclip's React UI + Postgres schema be decoupled from its execution runtime (heartbeats, task checkout)? This determines which repo to fork for Feature 12.
- Feature 01 Chat C still open: stable agent ID mechanism, profile storage (flat file + DB hybrid design), fork strategy for claude-peers-mcp (now informed by NATS research).

## What's Next

Feature 01 Chat C — Identity Foundation & Fork Strategy. The NATS research directly answers the fork strategy question (replace SQLite broker with NATS KV, keep MCP surface, cherry-pick PRs #24 + #7). The stable ID question is resolved in principle (filename-based slugs as the stable identity; ephemeral peer IDs are transport only). Profile storage design is the remaining open question: how exactly does the flat-file CLI layer relate to the Prisma DB layer?

After Chat C, Feature 01 is DESIGNING-complete and moves to harmony check.
