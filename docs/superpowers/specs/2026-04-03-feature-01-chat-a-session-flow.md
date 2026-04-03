# Feature 01 — Chat A Design: Session Flow & Agent Activation

**Date:** 2026-04-03  
**Feature:** 01 — Agent Identity & Profiles  
**Chat:** A of 3 — Session Flow & Agent Activation  
**Status:** Locked

---

## Scope

This document covers how a human starts a session, how the Orchestrator activates, how Leads get spawned, how tier/backend routing is set, and how profile collisions are handled. Profile schema, agent types, and broker internals are Chat B and C scope.

---

## Q3 — Discovery & Connection

### Mental Model

The human connects to the Orchestrator. That is the only entry point for normal use. The Orchestrator is always the first agent up. Leads are persistent background processes — spawned lazily (when a task needs them) or explicitly (when the human requests one directly). Sub-agents are task-scoped and dismissed when done.

The human never manages agent processes. They connect to their team.

### Connection Flow

```
$ ai-org connect [team-name]

Connecting to Agency...
✓ Orchestrator online
✓ Ready — 0 active agents, 0 pending tasks

>
```

Simple by default. No menus, no prompts, no profile selection. The Orchestrator is the entry point.

### Direct Lead Connection (Power-User Path)

The human can also connect directly to any Lead:

```
$ ai-org connect --as dev-lead
```

This is the power-user path — for cases where the human wants to talk to a Lead directly (e.g., technical discussion about the codebase without routing through the Orchestrator). The Lead must either already be running or gets spawned on demand.

### Lead Spawning

Leads are spawned when:
1. A task arrives that requires them (lazy, automatic)
2. The human explicitly requests one (`/connect dev-lead` or similar)

Once spawned, a Lead stays running in the background for the duration of the session. It is a persistent background instance — not dismissed between tasks.

**Open question for Chat B:** Is a Lead a real subprocess (own terminal, own Claude Code process) or a logical agent (peer within the Orchestrator's process)? The right answer may be context-dependent and needs explicit design. This is the first question for Chat B.

### Progressive Disclosure

- Connect is minimal — no noise at startup
- Team state (who's up, who isn't) is available on request
- Leads surface naturally as tasks need them
- The human never thinks about processes — they think about their team

---

## Q4 — Collision Handling

### Heartbeat + Auto-Reclaim

The broker tracks a heartbeat per held profile, updated every 30 seconds by the live instance.

On connection attempt to a held profile:

| Condition | Behavior |
|---|---|
| Heartbeat fresh (< 90s) | Hard reject: "Orchestrator is active in another session" |
| Heartbeat stale (≥ 90s) | Auto-reclaim: log the takeover, show a brief notice, continue |

```
$ ai-org connect
⚠  Prior session found — last active 8 minutes ago (appears crashed).
   Auto-reclaimed. Checkpoint restored.

✓ Connected as Orchestrator
```

No user input required for the common crash-recovery case. A genuinely active session in another terminal is never accidentally stolen — the heartbeat keeps it fresh.

Implementation details (threshold tuning, checkpoint format, log schema) deferred to development phase.

---

## Q6 — Tier / Backend at Session Start

### Decision: No Connect-Time Prompt

For Phase 1, the real backend choice is:
- **Anthropic direct** — Claude Haiku / Sonnet / Opus
- **OpenRouter** — GLM, Qwen, Kimi (long-context, cheaper)

This is already handled by Feature 08's `task_type → tier → model` YAML. The routing table makes the right call without human input at connect time.

No connect-time tier prompt. Zero friction by default.

Mid-session overrides use the Feature 08 session skills already locked: `/use-model`, `/use-tier`.

### Phase 2 Note

The "main tier + flexibility range" concept (e.g., main=2, flex=±1) is the right connect-time UX for Phase 2 — when the human manages multiple workspaces or projects with different cost profiles. Keep it parked and named for Phase 2 design.

---

## Decisions Summary

| Question | Decision |
|---|---|
| Entry point | `ai-org connect [team]` → Orchestrator always |
| Direct Lead access | `ai-org connect --as <lead>` supported |
| Lead spawning | Lazy (task-triggered) or explicit request |
| Lead lifecycle | Persistent for session once spawned |
| Collision — stale | Auto-reclaim (heartbeat ≥ 90s old) |
| Collision — live | Hard reject |
| Tier at connect | No prompt — Feature 08 YAML handles it |
| Session override | `/use-model`, `/use-tier` (Feature 08) |

---

## Open Questions for Chat B

1. **Subprocess vs logical agent** — Is a Lead a real Claude Code subprocess (own process, own terminal) or a logical peer within the Orchestrator? Design this explicitly. The answer affects how the broker claims profiles, how handoffs work, and how collision is detected.
2. **Profile schema** — What fields does a tenure profile carry? (name, role, model tier, created_at, last_active, skill pack, ...)
3. **Temporary profile lifecycle** — How are task-scoped sub-agents created and dismissed? What (if anything) persists after dismissal?
4. **Broker internals** — What exactly gets extended from `claude-peers-mcp`? What stays stock?

---

## Handoff to Chat B

Chat B picks up here. The session flow and activation model are locked. Chat B owns:

- The subprocess vs logical agent architectural decision (start here)
- Profile schema design for all three profile types (tenure, temporary, user)
- Broker extension design — what we fork vs what we add
- Profile creation and registration flow (how a new agent gets its ID)

Chat B should **not** revisit Q3/Q4/Q6 — those are locked. It can reference this doc for the activation model when designing how profiles are claimed and how spawning works.
