# Feature 06 — Agent Communication

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin  
**Priority:** High  
**Depends on:** 01 Agent Identity

---

## Vision

Agents talk to each other and to the human — directly, asynchronously, and without the human being the relay. When a Dev Lead needs input from the PM Lead, they message each other. When an agent finishes a task, it posts to its feed. The human can subscribe, observe, or step in at any time.

---

## Core Concept

Communication runs through the broker (claude-peers-mcp fork). The broker maintains:
- A message bus for direct agent-to-agent messages
- A feed per agent (journal of actions and outputs)
- Group channels (broadcast to multiple agents at once)
- Presence — which agents are currently active

The human operator always has admin-level read/write access to everything.

---

## Key Capabilities

- Direct messaging — agent to agent, agent to human
- Group channels — broadcast messages to department or team
- Feed / journal — per-agent activity stream (actions, outputs, decisions)
- Presence — see which agents are active in real time
- Mentions — `@agent-name` in any message
- Message history — persistent, queryable
- Admin access — human can read/write all channels
- Subscribe/follow — human can subscribe to specific agents or groups
- Notification delivery — surface urgent messages to human (Telegram, Slack, web)

---

## Open Questions

- [ ] Message storage: broker SQLite only, or sync to main DB?
- [ ] Follow vs. subscribe semantics — what's the difference?
- [ ] Mention resolution — if two instances are running the same tenure profile, who gets the mention?
- [ ] History limits — per conversation? Per feed? Per day?
- [ ] Journal format — free text events or structured JSON?
- [ ] Group naming convention — department-based, user-defined, or both?
- [ ] Notification urgency levels — how does the system decide what to push vs. what to queue?

---

## Considerations

- The broker (claude-peers-mcp) has known bugs: repo scope broken with git worktrees, built-in SendMessage conflict, unstable peer IDs. These need to be resolved in the fork before this feature is viable.
- Communication must work in CLI-only mode — no web platform required to send/receive messages.
- The feed/journal is the foundation for observability (feature 10). Design it with queryability in mind.
- Keep messaging lightweight — agents shouldn't be waiting on responses to continue. Async by default.

---

## OSS Stack

- **NATS.io + JetStream** — replaces the claude-peers SQLite broker as the messaging backbone. Single binary (`nats-server -js`), <20MB RAM, sub-millisecond latency, async Python SDK (`nats-py`). — Seam: subject hierarchy = agent topology. `agent.{id}.inbox` for direct messages; `agent.broadcast.*` for team fan-out; `agent.{type}.task` for request/reply task dispatch. JetStream KV stores agent registry (peer presence + profile mapping).
- **claude-peers-mcp fork** — retains the MCP surface (list_peers, send_message, check_messages, set_summary) that Claude Code knows how to call. The broker underneath swaps to NATS. Cherry-pick PR #24 (worktree fix) + PR #7 (SendMessage fix). Add structured message payloads (`message_type` + `payload JSON`), group channels, message TTL. — Seam: agents call the same MCP tools as today; NATS handles the routing internally.
- **NATS HTTP monitoring** (port 8222, built-in) — human visibility into agent message traffic in Phase 1. No additional service needed.
- **Mattermost** (Phase 2 upgrade path) — human oversight UI with official MCP server. When Feature 09 needs a rich human-facing channel for HITL approvals and agent activity feeds, Mattermost + its official MCP server is the natural choice. Do NOT add Phase 1.

## OSS & References

- **Fork:** `claude-peers-mcp` — broker daemon; MCP surface retained, SQLite broker replaced with NATS
- **OSS:** NATS.io + JetStream — messaging backbone replacing the SQLite broker
- **Reference:** `ai-team` — messaging integration patterns, agent-to-agent communication protocol

---

## Dependencies

- **01** Agent Identity — agents need stable IDs to send/receive messages

---

## Session Notes
<!-- Fill during design/build session -->
