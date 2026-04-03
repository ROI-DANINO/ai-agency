# Research: Open-Source Slack Alternatives as Agent Communication Layer

**Status:** Complete — decision locked  
**Researched:** 2026-04-04

## Question

Could an open-source Slack alternative serve as the communication backbone for AIOS agents — replacing or augmenting the current claude-peers MCP approach?

## Decision

**NATS.io with JetStream** is the answer for agent-to-agent communication. No Slack alternative is needed for Phase 1.

The Slack alternatives (Mattermost, Zulip, Matrix) are designed for *human* communication. The right primitive for agent communication is a messaging bus with a clean subject hierarchy — not a chat tool that agents participate in. NATS was built for this.

For human visibility into agent communication: NATS has a built-in monitoring endpoint (port 8222). For Phase 2+, Mattermost can be added as a human-facing oversight UI.

---

## Candidates Evaluated

### NATS.io — ADOPT
**What it is:** Single-binary pub/sub and streaming system. JetStream adds durable messaging, key-value store, and persistent logs. Sub-millisecond latency. <20MB RAM at idle. CNCF project.

**Agent API programmability:** Excellent. Python SDK (`nats-py`) is async/await-native. Core patterns: publish a subject, subscribe with a handler, request/reply with timeout.

**Channel model maps to agent patterns:**
- Direct messages: `agent.{agent_id}.inbox` (subject-per-agent)
- Broadcasts: `agent.broadcast.*` (fan-out pub/sub)  
- Task handoffs: request/reply on `agent.{type}.task`
- Status updates: JetStream KV store for shared state

**MCP/Claude Code integration:** Native. Multiple MCP servers published (sinadarbouy/mcp-nats, bmorphism/nats-mcp-server, gooseus/mcp-nats). Embedded mode starts a full NATS+JetStream server inside the MCP process — ideal for local single-machine use.

**Apple lens:**
- Inevitability: HIGH — subject hierarchy maps 1:1 to agent topology; no adaptation
- API quality: HIGH — stable v2 API, async Python SDK, CNCF project
- Operational cost: VERY LOW — single binary, start with `nats-server -js`
- Exit cost: LOW — subjects are strings; migrating means rebinding handlers, no proprietary state

---

### Conduit — NOT A MESSAGING TOOL
Conduit (by Meroxa) is a data pipeline ETL tool — a Kafka Connect replacement. It moves data between stores via source/destination connectors. Not a messaging bus. The "Conduit" reference in ai-team Phase 4 notes was for data pipeline connectors, not agent communication. Skip.

---

### Mattermost — SKIP Phase 1, consider Phase 2-3
**What it is:** Self-hosted Slack replacement. REST + WebSocket API. Official MCP server (mattermost/mattermost-mcp, production-quality, OAuth 2.0).

**Why skip Phase 1:** REST per message is wrong for tight agent coordination (too slow, too much overhead). Mattermost is fundamentally a human communication tool. Self-hosting requires PostgreSQL + app server (~200-400MB RAM).

**Phase 2-3 use case:** Human oversight UI. When Feature 09 (HITL Reporting) needs humans to visually track agent activity and approve decisions in a familiar UI, Mattermost + its official MCP server is the natural choice. Claude Code can read channels, post messages, manage files via the official MCP server.

---

### Zulip — SKIP
**What it is:** Open-source team messaging with topic-threaded model. Good bot/API story.

**Why skip:** Self-hosting requires ~6 services (Django + Postgres + Redis + RabbitMQ + Tornado + memcached). Operational cost unjustifiable for Phase 1 local-only build. The threading model is elegant for human-readable logs, but not worth the overhead when NATS + a log viewer achieves the same result at zero cost.

---

### Matrix/Element — SKIP
**What it is:** Federated messaging protocol. Federation is a first-class feature — not a toggle you can disable.

**Why skip:** Federation-first design is a structural mismatch for Phase 1 local-only single-machine use. The setup presumes federation even when disabled. No native MCP integration found. Skip.

---

## Five Open Questions — Answered

**1. Does any of these offer a programmable API good enough for agent-to-agent messaging?**
Yes: NATS.io. The others are human chat tools with bot APIs bolted on. NATS was built for programmatic message routing. The subject hierarchy is the agent topology.

**2. How does the threading/channel model map to agent coordination patterns?**
NATS subjects map naturally:
- `agent.{id}.inbox` → direct messages
- `agent.broadcast.*` → team broadcasts  
- `agent.{type}.task` → task dispatch (request/reply)
- JetStream KV → shared state (agent status, presence)

**3. Could this replace claude-peers, or complement it?**
Replace the broker function. NATS replaces the SQLite + REST broker underneath. The claude-peers MCP surface (list_peers, send_message, check_messages) can remain as the API layer, backed by NATS KV for peer registry and NATS subjects for message routing. Alternatively, the existing NATS MCP servers may cover enough of the surface to fold claude-peers entirely.

**4. What's the operational overhead of self-hosting vs. the simplicity of file-based or MCP messaging?**
NATS: `nats-server -js` — single binary, no Docker required, <20MB RAM, starts in milliseconds. This is comparable to running SQLite. No meaningful overhead increase over the existing claude-peers broker.

**5. Does any of these have an existing Claude Code / MCP integration?**
NATS: Yes — multiple MCP servers including embedded mode. Mattermost: Yes — official production-quality MCP server. Others: No.

---

## Feature 06 OSS Decision

**Primary:** NATS.io with JetStream  
**Stack:**
- `nats-server -js` for local development
- Embedded NATS MCP server for Claude Code integration
- Subject schema defines the agent topology
- NATS built-in HTTP monitoring (port 8222) for human visibility in Phase 1

**Migration path:**
- Phase 2: Add Mattermost as human oversight layer (official MCP server + Claude Code integration)
- Phase 3+: NATS scales horizontally; no migration needed for the messaging layer

**What to build custom:** ~30 lines — subject schema definition + agent registry in NATS KV
