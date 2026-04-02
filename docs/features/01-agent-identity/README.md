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

## OSS & References

- **Fork:** `claude-peers-mcp` — broker daemon, SQLite-backed, runs on localhost:7899
- **Reference:** `ai-org` project — SP-1 broker-v2 and SP-2 profiles designs
- **Reference:** `ai-team` — tenure/temp profile concept, how leads persist

---

## Dependencies

None. This is the root.

---

## Session Notes
<!-- Fill during design/build session -->
