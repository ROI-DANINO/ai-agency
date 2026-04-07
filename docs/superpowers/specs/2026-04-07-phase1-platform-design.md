# Phase 1 Platform Design — ai-org
**Date:** 2026-04-07  
**Status:** Approved  
**Scope:** Full Phase 1 vision reset — replaces ad-hoc feature-by-feature framing with a unified product architecture

---

## What It Is

An **AI agency OS** you open inside your coding environment.

`/org` is the entry point. It orients you, understands your project, and routes you into a workflow. Agents execute work in the background, communicate through a structured mesh, and surface decisions to you at meaningful gates. You stay in control. The platform documents everything.

The unit of work is a **markdown artifact** — a structured document a Lead agent produces containing: what was done, links to code changes, open decisions, and calls to other leads. Every workflow produces artifacts. Artifacts accumulate into the mesh.

---

## Three Layers

```
┌─────────────────────────────────────────────┐
│  HUMAN LAYER                                │
│  /org → session brief → dialog → workflow   │
│  HITL gates → Telegram decisions            │
└───────────────────┬─────────────────────────┘
                    │ LangGraph (state + gates)
┌───────────────────▼─────────────────────────┐
│  ORCHESTRATION LAYER                        │
│  Orchestrator decomposes task → manifest    │
│  Hermes spawns Lead agents (API calls)      │
│  Collector gathers artifacts + decisions    │
└───────────────────┬─────────────────────────┘
                    │ reads/writes
┌───────────────────▼─────────────────────────┐
│  MESH LAYER                                 │
│  Channels (Slack) — activity feed           │
│  Docs (Notion) — persistent artifacts       │
│  Agent profiles — who they are + can do     │
└─────────────────────────────────────────────┘
```

---

## The Mesh (Slack + Notion)

Lives at `.mesh/` — inspectable markdown files, zero server required. Phase 2 upgrades to NATS for real-time pub/sub.

### Channels (Slack layer) — event stream per topic

```
.mesh/
  channels/
    decisions/     ← human decision requests + outcomes
    blockers/      ← agent-reported blockers
    dev/           ← lead activity: started, completed, called another lead
    ops/           ← system events: workflow started/stopped/resumed
```

Each post is a timestamped markdown file:
```
2026-04-07T18:00-dev-lead-completed.md
```

### Docs (Notion layer) — persistent artifacts

```
  docs/
    tasks/         ← task manifests (one per workflow run)
    artifacts/     ← lead output documents
    decisions/     ← decision records (what was decided + why)
    context/       ← org profile, business context, team config
```

### Agent profiles

```
  agents/
    orchestrator.md
    dev-lead.md
    research-lead.md
```

Each profile contains: role, tier, skills available, MCPs wired, what it can produce.

---

## Agent Model

Three tiers. Phase 1 agents are **direct Anthropic API calls with structured system prompts**. Phase 2 upgrades to full Claude Code sessions with native skill execution and MCP access.

| Tier | Role | What it does | Output |
|------|------|-------------|--------|
| 1 | Orchestrator | Decomposes task → manifest, monitors leads, handles HITL | Task manifest |
| 2 | Lead | Executes a subtask, writes artifact, can call another lead | Markdown artifact |
| 3 | Sub-agent | Single focused action (search, write, transform) | Section of artifact |

A Lead's execution context = its profile (system prompt) + skills as structured instructions + the task briefing. It writes output to `.mesh/docs/artifacts/` and posts a summary event to `.mesh/channels/dev/`.

### Phase 1 vs Phase 2 agent execution

| Capability | Phase 1 | Phase 2 |
|-----------|---------|---------|
| Execution | Anthropic API call | Full Claude Code session |
| Skills | Described in system prompt | Executed as `/commands` |
| MCPs | Tool definitions via API | Natively wired |
| Communication | Writes to `.mesh/` files | claude-peers MCP + `.mesh/` |
| Cost | Low | Higher (full sessions) |

---

## Lead Artifact Format

Every Lead agent produces one artifact per task. Structure:

```markdown
# Artifact — {task description}
**Lead:** dev-lead  
**Thread:** {thread_id}  
**Completed:** 2026-04-07T18:00Z

## What Was Done
{1-3 paragraph summary of the work}

## Code Changes
- `packages/cli/src/workflow/state.ts` — added HitlGateType union
- `packages/cli/src/workflow/graph.ts` — wired collector node

## Open Decisions
- [ ] Should Gate 2 auto-approve when lead.gate === 'auto'? (blocking: plan-lead)
- [ ] Timeout default: 30m or configurable per workflow?

## Calls to Other Leads
- `review-lead` briefed with: "Review the workflow graph changes above"

## Notes
{anything the human should know that doesn't fit above}
```

This format is the atom of communication in the mesh. HITL Decision Reports are compiled from these artifacts.

---

## Workflows

A workflow is a **LangGraph graph** triggered by the `/org` dialog. Workflows are the platform's skill chains — analogous to the superpowers brainstorm → writing-plans → executing-plans chain.

### Built-in workflows for Phase 1

| Workflow | Chain | HITL gates |
|----------|-------|-----------|
| `feature-design` | brainstorm → design doc → plan | After brainstorm, after design |
| `feature-build` | plan → implement → review → artifact | After implement, after review |
| `research` | gather → synthesize → decision report | After synthesis |
| `daily-brief` | scan mesh → summarize → present | None (read-only) |

### Workflow definition

Each workflow = YAML manifest + registered LangGraph graph.

```yaml
# .mesh/workflows/feature-design.yaml
name: feature-design
description: Design a feature from scratch — brainstorm through implementation plan
leads:
  - id: research-lead
    goal: "Gather context and existing patterns for {feature}"
    tier: 2
    gate: auto
  - id: design-lead
    goal: "Produce a design document for {feature}"
    tier: 2
    depends_on: [research-lead]
    gate: human          # HITL gate after design
  - id: plan-lead
    goal: "Write implementation plan from the approved design"
    tier: 2
    depends_on: [design-lead]
    gate: human          # HITL gate after plan
```

Adding a workflow = writing the YAML + registering the graph node.

---

## `/org` and Session Lifecycle

```
/org (first time)
  → Interview: business context, team needs, what agents can do
  → Writes to .mesh/docs/context/org-profile.md
  → Presents team roster (agent profiles)

/org (subsequent)
  → Session brief: open tasks, last session summary, next steps
  → Dialog: "Run feature-design for F07?" → workflow begins

During session:
  → Leads execute in background, post to channels, write artifacts
  → HITL gates pause via Telegram when decisions needed
  → Human can check mesh feed at any time

/org end  (or /session-end)
  → Collects artifacts from this session
  → Writes journal entry to journal/
  → Produces handoff prompt for next session

Stop / resume:
  → LangGraph thread_id persists state across process restarts
  → /org resume → reads last active thread_id → continues workflow

"Bad idea" / go back:
  → Reject at current HITL gate with notes
  → Lead retries with rejection notes appended to briefing
  → Retry limit exceeded → escalate to Orchestrator
```

---

## HITL — Telegram Direct (no n8n)

When a workflow hits a human gate:

1. Orchestrator compiles a **Decision Report**
2. Telegram Bot API sends it as a formatted message with inline buttons
3. Human taps a button → Telegram webhook → `hitl-server.ts` → `Command(resume=value)` → workflow continues

### Decision Report format

```
⏸ DECISION NEEDED
Project: Auth System Redesign
From: Dev Lead

Session token storage strategy.

✅ Recommended: JWT in HttpOnly cookies
   → Industry standard, no extra infrastructure

Alternative: Store tokens in database
   → More control but higher complexity

Default in 2h: proceeds with JWT if no response.

[Approve ✅]  [Reject ❌]  [Defer ⏳]  [More info 🔍]
```

**Format rules:**
- One decision per message — never bundle multiple decisions
- Recommendation + one alternative only
- Default path always stated
- Buttons: Approve, Reject, Defer, More info

---

## Milestones (Reset)

These replace the previous M1–M5. Each gate is real, not scaffold-complete.

| # | Name | Features | Gate condition |
|---|------|----------|----------------|
| M1 | **Oriented** | `/org` command, onboarding interview, session brief | Human opens `/org`, gets a real brief, org profile written to `.mesh/` |
| M2 | **Executing** | Hermes (real API calls), Orchestrator decomposes with LLM (requires F08 model routing wired), Lead produces real artifact | A Lead agent calls the Anthropic API, does work, writes a markdown artifact to `.mesh/` |
| M3 | **Communicating** | Structured mesh (channels + docs), agents post events as they work | Human opens `.mesh/` and sees a readable feed of what agents did |
| M4 | **Decided** | Telegram Bot API direct, inline buttons, webhook resume | Human approves a HITL gate from their phone, workflow resumes |
| M5 | **Capable** | Multiple workflows, multiple Lead types, stop/resume, session lifecycle complete | Human manages a full feature from design through build entirely via `/org` |

---

## What Changes from Current Build

| Current | New |
|---------|-----|
| F07 Hermes = mock | Hermes spawns real Anthropic API calls |
| F07 Orchestrator = stub manifest | Orchestrator generates manifest via LLM call |
| F09 = n8n webhook path | F09 = direct Telegram Bot API + webhook handler |
| `.mesh/` = per-lead YAML events | `.mesh/` = structured channels + docs (Slack+Notion) |
| No `/org` command | `/org` is the platform entry point |
| Milestones = scaffold-complete | Milestones = gate-condition-complete |

---

## Milestone–Feature Mapping

| Milestone | Features required |
|-----------|------------------|
| M1 Oriented | F01 (agent identity), F02 (team structure), new: `/org` skill |
| M2 Executing | F08 (model routing — must be built, not just designed), F07 (real Hermes + LLM orchestrator) |
| M3 Communicating | F07 (mesh structure redesign — channels + docs), F03 (skills wired to workflows) |
| M4 Decided | F09 (Telegram direct, no n8n), F07 (HITL gates integrated with Telegram webhook) |
| M5 Capable | F04 (tools via MCP), F05 (memory), full workflow library |

---

## Out of Scope for Phase 1

- NATS real-time pub/sub (Phase 2)
- Full Claude Code agent sessions (Phase 2)
- Web UI / dashboard (Phase 2)
- claude-peers MCP as primary mesh transport (Phase 2)
- Multiple concurrent users (Phase 2)
