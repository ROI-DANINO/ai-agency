# Issues Brainstorm: Product Identity, Model Defaults, Peer ID Strategy
Date: 2026-04-03
Type: decision

## What Happened

Reviewed a remote branch where a previous Claude instance had analyzed the project
and flagged four issues. Worked through each one.

The most clarifying moment: Roi described the product as a full agency with a
Slack-like social network for agents — and the platform as a "mother system" that
replicates itself to build specialized agencies for any domain. That framing sharpened
every other decision in the session.

## Decisions Made

- **Feature 06 (Agent Communication) stays in Phase 2** — Phase 1 is internal scaffolding,
  not a product demo. The social layer belongs on a web surface that can render it properly.
  Splitting it across phases produces a half-built experience.

- **Identity is database-first, broker is just transport** — claude-peers-mcp's unstable
  peer IDs (new ID every session restart) stop being a blocker once agent identity lives
  in a database, not in the broker. The broker delivers messages; the database says who you are.
  Cherry-pick PR #24 (worktree fix) and PR #7 (SendMessage fix) into the fork.

- **Nemotron removed from model tier table** — active agentic failures documented across
  multiple projects (infinite tool loops, malformed output). Not safe for a Team Lead role.

- **OpenRouter as the model gateway, LiteLLM likely unnecessary** — OpenRouter covers
  the full model pool (Claude, Kimi, GLM, Qwen, DeepSeek) in one interface.
  Decision deferred to Feature 08 design.

- **README rewritten** — old README described the prior ai-org social network phase.
  New README leads with the mother system concept.

- **This journal + session-end skill** — designed and planned for implementation.
  Journal lives in the repo (public). Skill closes sessions, writes journal entries
  when meaningful, outputs fresh chat handoff prompts.

## Open Questions

- Does iRyoDev/cpmc stabilise enough to replace the louislva fork as the message transport?
  Revisit in 3–4 weeks.
- Full model tier design still open — belongs in Feature 08 design session.
- Credits purchase UI for Anthropic + OpenRouter — belongs in Feature 12 design session.

## What's Next

Feature 08 (Model Routing) is first in the build order. Inputs are now cleaner:
OpenRouter as the gateway, model pool defined, Nemotron out, LiteLLM optional.
Start with the orient phase: read `docs/features/08-model-routing/README.md`.
