# F03 Skills System — Full Build & Hermes Wiring
Date: 2026-04-07 · 03:28 IL
Type: build

## What Happened
Built the complete F03 Skills System platform implementation and wired the project onto Hermes as the primary development agent. This was the transition from Claude Code to Hermes-native development.

Two parallel tracks completed:

**Track 1 — Hermes Profiles:** Created 6 Hermes profiles for core Lead agents (mission-op, dev-lead, pm-lead, ux-lead, security-lead, quality-lead) with role-specific SOUL.md files, model configuration, and skill assignments. Security Lead uses deepseek/deepseek-chat-v3.1:free; all others use qwen/qwen3.6-plus:free.

**Track 2 — Platform Code:** Built the full skills system CLI infrastructure:
- `packages/cli/src/skills.ts` (450 lines) — skill resolver, registry reader, chain validator, skill:// protocol
- `packages/cli/src/artifacts.ts` (487 lines) — artifact writers for briefing-pack, handoff, decision-report, session
- `packages/cli/src/commands/skills.ts` — 5 CLI subcommands: list, chain, resolve, artifacts, scan
- Connected skill injection into the connect command so agents get their full system prompt on connect
- 44 tests written and passing across 4 test files

**Skill wiring:** All 11 main agent profiles and all 22 sub-agent profiles updated with skill_pack arrays based on role. Three agent skill stubs (briefing-pack, handoff, decision-report) fully implemented with proper artifact templates and chaining metadata.

**Infrastructure:** deploy.sh rewritten to target Hermes. superpowers plugin documented as Claude Code reference in forks-and-oss.md.

**Model research:** OpenRouter model mapping researched and documented. Tier system confirmed: not restricted to free models.

## Decisions Made
- **F03 implements both Hermes profiles AND platform code** -- dual approach, not either/or
- **Model tiers not restricted to free** -- use best model for role regardless of cost
- **Security Lead uses DeepSeek** -- deepseek/deepseek-chat-v3.1:free for security domain specialization
- **Hermes is primary coding agent** -- Claude Code is reference only, superpowers catalogued but not used
- **All existing agents get wired** -- 11 main + 22 sub-agents, not just 6 core
- **6 core Phase 1 agents** confirmed: mission-op, dev-lead, pm-lead, ux-lead, security-lead, quality-lead

## Open Questions
- Hermes vs LangGraph for sub-agent spawning (F07) -- still pending, must decide before F07 design
- 19 non-core agent profiles wired but Phase 2 work deferred

## What's Next
F07 Workflow Engine design needed next -- async linear workflow, task decomposition, DAG execution. Then F09 HITL Reporting. F03 build is complete.
