# OSS Fork Sources Assessed: What to Use, What to Skip
Date: 2026-04-05
Type: decision

## What Happened

Reviewed six GitHub repos and three communication platforms as potential fork/inspiration sources for ai-org. The goal: ease the build by standing on good existing work rather than reinventing the wheel, while keeping the Apple-level product vision intact.

The most important call was identifying that `tanbiralam/claude-code` is the **leaked Anthropic Claude Code source** (March 31, 2026 leak). That repo is off-limits — proprietary license, legal risk for a commercial platform. It was on the list as "openclaw" before we identified it.

The communication platforms (Zulip, Matrix, Element) were assessed and ruled out for agent messaging. NATS.io is the right tool there. Matrix is worth a future read for federated identity inspiration but nothing to wire in now.

## Decisions Made

- **oh-my-pi** (MIT, TypeScript/Rust/Bun) — fork as harness reference. Why: production-hardened pi fork with patterns that map directly to our features — 6 agent roles, TTSR briefing pack injection, MCP support, subagent spawning with state handoff, multi-credential round-robin.
- **BMAD-METHOD** (MIT, JavaScript) — pattern mine, don't fork. Why: 12 agent personas and 34+ workflows are a goldmine for F02 (Team Structure) persona definitions and F03 (Skills System) workflow templates.
- **hermes-agent** (MIT, Python) — pattern mine for two things. Why: autonomous skill creation loop is directly relevant to F03; multi-platform notification routing is a reference for n8n HITL design.
- **pi-mono/coding-agent** (MIT, TypeScript) — inspiration only. Why: JSONL branching session storage is a good pattern for F01 profile/session handling; "minimal core" philosophy aligns with write-less-code-wire-more-tools.
- **claw-code** — skip. Why: Rust (wrong stack), experimental, unendorsed by Anthropic.
- **tanbiralam/claude-code** — do not use. Why: leaked proprietary Anthropic source. Legal risk.
- **Zulip / Matrix / Element** — skip for agent messaging. Why: human communication tools, too heavy, NATS handles machine-to-machine. Matrix interesting for future federated identity research only.

## Open Questions

- oh-my-pi's TTSR pattern (context-zero rules injection) may replace or inform how briefing packs work in F01/F03 — worth a deeper read before F03 design session.
- BMAD-METHOD agent personas may already solve the F02 persona definition problem. Read their PM/Architect/Dev/UX personas before designing F02.

## What's Next

No feature status changed this session — this was a research/decision session. The OSS source table is now complete. Next: continue F01 build (Task 3: F03 skeleton design — session-start, session-end, handoff writer, briefing pack reader skills for Milestone 1).

Before F03 design session: read oh-my-pi TTSR and BMAD-METHOD agent personas.
