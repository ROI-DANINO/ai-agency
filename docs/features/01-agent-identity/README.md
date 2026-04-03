# Feature 01 — Agent Identity & Profiles

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin + Cross-layer  
**Priority:** Critical  
**Depends on:** Nothing — this is the foundation everything else builds on

---

## Vision

Every agent in the system has a stable, persistent identity. It knows who it is, what its role is, and what it has done before — across sessions, across terminals, across machines. An agent isn't just a running process; it's a named entity with history.

---

## Core Concept

Three profile types:

- **Tenure profiles** — permanent agents with ongoing roles (Dev Lead, PM Lead, Orchestrator). They persist indefinitely. They have memory, history, and character.
- **Temporary profiles** — task-scoped agents spawned for a specific job and dismissed when done. No persistent state beyond what they hand off.
- **User profiles** — the human operator. Admin-level authority. Can message any agent directly.

Identity is managed by a broker (forked from `claude-peers-mcp`) — a local SQLite-backed service that assigns stable IDs and stores profile data.

---

## Key Capabilities

- Stable agent ID that survives session restarts
- Profile types: tenure / temporary / user-admin
- Profile creation, login, and switching
- Profile store (local broker + optional web platform sync)
- Discovery — new agent instances can find available profiles to log into
- Collision handling — what happens if two instances try to log into the same tenure profile
- Cross-machine identity (future — Phase 2+)

---

## Open Questions

- [ ] What is the identity mechanism? Config file? Env var? Machine fingerprint? Broker-assigned?
- [ ] Where is profile config stored — broker DB only, or flat file + broker?
- [ ] How does a new Claude Code instance discover available tenure profiles?
- [ ] What happens if two instances claim the same tenure profile simultaneously?
- [ ] How does a user switch which profile a session is running as?
- [ ] What metadata lives on a profile? (name, role, model tier, created_at, last_active, …)
- [ ] Cross-machine identity — is this Phase 1 or deferred?

---

## Considerations

- This is the foundation. Every other feature depends on a working identity system. Design it carefully before building anything else.
- The broker (claude-peers-mcp fork) already handles basic identity — the question is how much to extend vs. replace.
- Profile collision is a real risk in multi-terminal workflows. Needs an explicit resolution strategy.
- Keep the identity mechanism simple enough to work without the web platform (CLI-only users).

---

## OSS Stack

- **claude-peers-mcp fork (NATS-backed)** — MCP surface (list_peers, send_message, check_messages) retained; SQLite broker replaced with NATS.io + JetStream. NATS KV stores the peer-to-profile mapping: `(peer_id_session → agent_profile_id)` so stable identity survives session restarts. Cherry-pick PR #24 (worktree fix) + PR #7 (SendMessage fix). — Seam: agents register via MCP; NATS KV maps ephemeral session ID to persistent profile in ai-org DB.
- **agentic-ai-platform Agent model** (fork) — `Agent(id, slug, display_name, rank, process_model, status, groupId)` as the persistent profile store. Add `rank` (`admin | operator | lead | agent`), `process_model` (`tenure | temporary`), `tags`, `mesh_access`, `model_config`, `dismissed_at`, `handoff_ref`. — Seam: Prisma DB is the source of truth for identity; NATS KV holds the live session→profile mapping.
- **Filename-based agent IDs** (pattern from aios/ai-team) — tenure agents have stable slug-based IDs (e.g., `"dev-lead"`, `"pm-lead"`) defined in `.claude/agents/` markdown files. Session peer IDs are ephemeral; the slug is stable. — Seam: profile `slug` is the stable identity; `peer_id` is the runtime handle.

## OSS & References

- **Fork:** `claude-peers-mcp` — broker MCP surface retained; SQLite broker replaced with NATS KV for stable identity mapping
- **Reference:** `ai-team` — tenure/temp profile concept, BMAD persona definitions
- **Reference:** `agentic-ai-platform` Prisma schema — Agent model, ResourceScopeBinding, ResourcePermission

---

## Dependencies

None. This is the root.

---

## Session Notes

### Chat C Design — 2026-04-04

**Stable ID mechanism:** Filename-based slugs. Tenure agents have stable slug-based IDs (e.g., `dev-lead`, `pm-lead`) defined in `.claude/agents/` markdown files. The slug is the stable identity. The NATS KV peer_id is the runtime handle only.

**Profile config storage:** Flat file + DB hybrid.
- `.claude/agents/<slug>.md` — the agent definition (role, model tier, skills, tools). Human-readable, version-controlled.
- Supabase Agent model — runtime state (status, last_active, dismissed_at, handoff_ref). DB is source of truth for live state; flat file is source of truth for identity definition.

**claude-peers-mcp fork strategy:**
- Retain full MCP surface: `list_peers`, `send_message`, `check_messages`, `set_summary`
- Replace SQLite broker with NATS KV: `peer_id → agent_profile_slug` mapping stored in NATS KV bucket `agent-registry`
- Cherry-pick PR #24 (worktree fix) + PR #7 (SendMessage fix) from upstream before diverging
- Seam: agents register via MCP tool calls; NATS KV maps ephemeral peer_id to stable profile slug; Supabase holds full profile state

**Status:** Feature 01 all chats locked → HARMONY

---

### Chat B Design — 2026-04-03
**Doc:** [chat-b-profile-schema.md](chat-b-profile-schema.md)

**Key decisions:**
- Orchestrator renamed to **Operator (OP)** throughout
- Rank system: `admin / operator / lead / agent` — first-class field on all profiles
- Process model: tenure profiles = real Claude Code subprocesses; temporary = logical (inline)
- Operator is a tier (multiple independent processes per specialty), not a single agent
- OP specialties: watcher, reporter, mission — each with different Lead Mesh write access
- Mesh topology: 4 named layers (Admin, OP, Lead, Agent)
- Admin profile = user's own profile with superuser access; mesh_default = admin + op
- Admin Layer content (notes, history) deferred to Feature 02/05
- Temporary profile lifecycle: spawn → inline → archive (audit trail preserved)
- Targeted messaging via `tags` field — full design deferred to Feature 06/02
