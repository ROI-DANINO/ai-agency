# Feature 11 — Plugin Bridge

**Status:** PLACEHOLDER  
**Phase:** 2 — Platform  
**Layer:** CLI Plugin  
**Priority:** High  
**Depends on:** 03 Skills System, 04 Tools Layer

---

## Vision

The platform works wherever you code. Install it into Claude Code today, OpenCode tomorrow, Pi the day after. The plugin bridge is the translation layer — it exposes the platform's capabilities as MCP tools and skills that any agentic coding environment can consume.

---

## Core Concept

The platform's core runs as a local service (LiteLLM proxy + broker + workflow engine). The plugin bridge is an MCP server that sits between this service and any agentic coding environment. The environment doesn't need to know how the platform works — it just calls MCP tools.

```
Claude Code / OpenCode / Pi
    ↓ MCP tool calls
Plugin Bridge (FastMCP server)
    ↓ HTTP / local IPC
Platform Core (LiteLLM + broker + workflow + skills)
```

Each platform adapter handles the platform-specific integration:
- **Claude Code adapter** — native Agent Teams integration, hooks, slash commands
- **OpenCode adapter** — MCP tools exposed via OpenCode's plugin API
- **Pi adapter** — MCP tools over the Pi agent network

---

## Key Capabilities

- MCP server exposing platform capabilities as tools: spawn agent, send message, run skill, query memory, create task, get briefing, submit decision
- Platform adapters: Claude Code (native), OpenCode, Pi (headless)
- Claude Code native version — tighter integration: Agent Teams, hooks, slash command aliases
- Skill installation — platform skills installable as slash commands in target environment
- Auth — plugin authenticates to the platform (API key or local socket)
- Hot reload — skill changes reflected without restarting the environment
- Offline mode — plugin works without web platform (CLI-only, local broker)
- Version compatibility — plugin version must match platform version

---

## MCP Tool Set (Draft)

| Tool | Description |
|---|---|
| `spawn_agent` | Create and start an agent with a given role and task |
| `send_message` | Send a message to an agent or group |
| `run_skill` | Invoke a skill by name with optional arguments |
| `query_memory` | Semantic search over agent's accessible memory |
| `create_task` | Add a task to the workflow engine |
| `get_briefing` | Get the current human inbox (pending decisions, status) |
| `submit_decision` | Respond to a pending HITL decision report |
| `list_agents` | List active agents and their current status |
| `get_run_log` | Retrieve logs for a specific run |

---

## Open Questions

- [ ] Which platforms does Phase 1 target? Claude Code only, or Claude Code + OpenCode together?
- [ ] How does auth work for the plugin — local socket (no auth needed) or API key?
- [ ] How does skill installation work — copy files, symlinks, or dynamic loading?
- [ ] Can the plugin work with a remote platform (cloud-hosted), or only local?
- [ ] What's the upgrade path — how does a user update the plugin?
- [ ] Should there be a single plugin package (all platforms) or separate packages per platform?

---

## Considerations

- FastMCP makes building an MCP server trivial in Python — ~50 lines for the core server. Use it.
- The Claude Code native version should feel first-class — not just an MCP wrapper but with proper Agent Teams integration, hooks, and slash command aliases that match the platform's skill names.
- The plugin is the most visible part of the product for CLI users. It must be fast, reliable, and low-friction to install.
- Start with Claude Code only in Phase 1. Add OpenCode and Pi as Phase 2 adapters.

---

## OSS & References

- **OSS:** FastMCP — Python MCP server builder, minimal boilerplate
- **Reference:** `aios` — skills as slash commands pattern, plugin portability design
- **Reference:** `ai-org` project — SP-4 peers-tools and SP-5 peers-skill MCP tool design

---

## Dependencies

- **03** Skills System — skills exposed via plugin
- **04** Tools Layer — tools accessible via plugin

---

## Session Notes
<!-- Fill during design/build session -->
