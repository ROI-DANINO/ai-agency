# Build Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the full 3-phase build roadmap — design all Phase 1 features, build them milestone by milestone, then repeat for Phase 2 and Phase 3.

**Architecture:** Design-all-first, then build in milestone order. Each phase is a complete, shippable product before the next phase begins. Per-feature implementation plans are written at build time, not here.

**Tech Stack:** Claude Code plugin (skills + agent definitions), NATS.io, LangGraph, LiteLLM, Mem0, Supabase pgvector, Docker exec, Deno V8, Next.js, FastMCP, Tauri.

---

## How This Plan Works

This is a **process plan**, not a feature implementation plan. It defines:
1. Which design sessions to run, in order, with exact handoff prompts
2. What each build milestone delivers and how to validate it
3. Where per-feature implementation plans get written (at build time)

Each feature's code-level implementation plan lives at: `docs/superpowers/plans/YYYY-MM-DD-feature-NN-<name>.md`

---

## Phase 1 — The Mesh (CLI Plugin)

### Current State (as of 2026-04-04)

| Feature | Status |
|---|---|
| F08 Model Routing | DESIGNED ✓ |
| F01 Agent Identity | DESIGNING — Chat A + B locked, Chat C next |
| F02, F03, F04, F05, F07, F09 | PLACEHOLDER |

---

## Part 1: Phase 1 Design Sessions

Design order: F01 (finish) → F03-skeleton → F05-skeleton → F02 → F07-light → F09-light → F04 → F03-full → F05-full

---

### Task 1: Feature 01 Chat C — Lock Stable ID, Profile Storage, Fork Strategy

**Files:**
- Update: `docs/features/01-agent-identity/README.md` (Session Notes)
- Create: `.project-session/2026-04-04-feature01-chat-c.md`

All three Chat C decisions were pre-answered by OSS research (2026-04-04):
- Stable ID: filename-based slugs (`dev-lead`, `pm-lead`)
- Profile storage: flat file + DB hybrid (`.claude/agents/` + Supabase Agent model)
- Fork strategy: replace SQLite broker with NATS KV, cherry-pick PRs #24 + #7, retain MCP surface

- [ ] **Step 1: Read current feature doc**

Read `docs/features/01-agent-identity/README.md` and `docs/features/01-agent-identity/chat-b-profile-schema.md` to confirm Chat B decisions.

- [ ] **Step 2: Write Chat C session notes into feature README**

Add to `docs/features/01-agent-identity/README.md` under `## Session Notes`:

```markdown
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
```

- [ ] **Step 3: Write session log**

Create `.project-session/2026-04-04-feature01-chat-c.md`:

```markdown
# Design Chat C — Feature 01: Agent Identity & Profiles
Date: 2026-04-04

## Decisions Made

- Stable ID: filename-based slugs in `.claude/agents/<slug>.md`
- Profile storage: flat file (definition) + Supabase DB (runtime state)
- Fork: claude-peers-mcp — NATS KV replaces SQLite broker; MCP surface retained; cherry-pick PRs #24 + #7

## Status
Feature 01 all chats → HARMONY
```

- [ ] **Step 4: Commit**

```bash
git add docs/features/01-agent-identity/README.md .project-session/2026-04-04-feature01-chat-c.md
git commit -m "design: feature 01 chat c locked — stable ID, profile storage, fork strategy"
```

---

### Task 2: Feature 01 Harmony Check

**Files:**
- Read: `docs/features/01-agent-identity/README.md`, `docs/features/08-model-routing/README.md`, `docs/features/02-team-structure/README.md`
- Update: `docs/features/01-agent-identity/README.md`
- Update: `docs/FEATURE-MAP.md` (status: DESIGNING → BUILDING)
- Create: `.project-session/2026-04-04-feature01-harmony.md`

- [ ] **Step 1: Read all three feature READMEs in parallel**

Read `docs/features/01-agent-identity/README.md`, `docs/features/08-model-routing/README.md`, `docs/features/02-team-structure/README.md`.

- [ ] **Step 2: Check pattern consistency**

Verify across the three features:
- Agent rank system consistent? (`admin / operator / lead / agent`)
- Model tier assignment: does F08's routing config accept the same rank names F01 defines?
- F02's team hierarchy — does it build cleanly on F01's profile schema (slug, rank, process_model, mesh_access)?
- Token efficiency: does the briefing pack pattern from F01 session notes match what F02 will need?

- [ ] **Step 3: Write harmony report into feature README**

Add to `docs/features/01-agent-identity/README.md` under Session Notes:

```markdown
### Harmony Check — 2026-04-04
**Neighbors checked:** F08 (upstream), F02 (downstream)
**Issues found:** [none / list any]
**Resolutions:** [list if any]
**Harmony score:** 🟢 Green
```

- [ ] **Step 4: Update FEATURE-MAP.md**

Change Feature 01 status from `DESIGNING` to `BUILDING`.

- [ ] **Step 5: Write session log and commit**

```bash
git add docs/features/01-agent-identity/README.md docs/FEATURE-MAP.md
git add .project-session/2026-04-04-feature01-harmony.md
git commit -m "design: feature 01 harmony check passed — status BUILDING"
```

---

### Task 3: Feature 03 Skeleton Design — Session Skills

**Files:**
- Read: `docs/features/03-skills-system/README.md`, `docs/features/01-agent-identity/README.md`
- Update: `docs/features/03-skills-system/README.md`
- Update: `docs/FEATURE-MAP.md` (F03 status: PLACEHOLDER → BUILDING)
- Create: `.project-session/YYYY-MM-DD-feature03-skeleton-design.md`

The skeleton scope is: session-start skill, session-end skill, handoff writer, briefing pack reader. This is the minimum needed for Milestone 1 (/admin works). The full skill library (chaining, /admin /op /lead skills) is Task 9.

- [ ] **Step 1: Orient — read F03 README and F01 decisions**

Understand the aios skill pattern (markdown + YAML frontmatter + skills-map.md registry) and the session management flow from F01.

- [ ] **Step 2: Design skeleton scope**

Answer in the session notes:
- What does `session-start` do for admin? (reads mesh state, builds briefing pack, presents it)
- What does `session-end` do? (writes handoff artifact, updates mesh state)
- What format is the handoff artifact? (markdown file in `.project-session/`)
- What format is the briefing pack? (structured markdown, role-scoped)

- [ ] **Step 3: Write design decisions into F03 README and session log**

- [ ] **Step 4: Update FEATURE-MAP.md and commit**

---

### Task 4: Feature 05 Skeleton Design — Memory (Flat File Layer)

**Files:**
- Read: `docs/features/05-memory-knowledge/README.md`, `docs/features/01-agent-identity/README.md`
- Update: `docs/features/05-memory-knowledge/README.md`
- Update: `docs/FEATURE-MAP.md`
- Create: `.project-session/YYYY-MM-DD-feature05-skeleton-design.md`

The skeleton scope is: flat file memory layer (the aios 3-tier pattern: working memory / session notes / long-term), briefing pack builder, mesh state reader. Mem0 + pgvector is Task 10.

- [ ] **Step 1: Orient — read F05 README and aios memory pattern**

The aios 3-tier model: working memory (in-session scratchpad), session notes (persisted per session), long-term (curated across sessions). Confirm how this maps to the mesh briefing pack for each role.

- [ ] **Step 2: Design flat file layer**

Answer:
- Where do session notes live? (`.project-session/<role>/<date>.md`)
- What goes in the briefing pack per role? (admin: mesh status + recent decisions; op: task assignments + lead status; lead: active task + context)
- How does the briefing pack builder read mesh state? (scans `.project-session/` for recent handoffs)

- [ ] **Step 3: Write design decisions and commit**

---

### Task 5: Feature 02 Design — Team Structure & Hierarchy

**Files:**
- Read: `docs/features/02-team-structure/README.md`, `docs/features/01-agent-identity/README.md`
- Update: `docs/features/02-team-structure/README.md`
- Update: `docs/FEATURE-MAP.md`
- Create: `.project-session/YYYY-MM-DD-feature02-design.md`

Full orient → design → harmony cycle. Key decisions to lock: Operator tier architecture (watcher/reporter/mission specialties), Lead tier structure, mesh topology formalization, BMAD persona adaptation.

- [ ] **Step 1: Orient — read F02 README and F01 decisions**

Constraints from F01: rank system (`admin/operator/lead/agent`), Operator specialties (watcher/reporter/mission), mesh topology (4 layers), profile schema fields.

- [ ] **Step 2: Design the team structure**

Lock: how many Lead profiles in Phase 1? (Dev Lead, PM Lead minimum; UX Lead, Security Lead Phase 1 or Phase 2?) What's the BMAD persona pattern for each? What's the inline subagent pattern for temporary profiles?

- [ ] **Step 3: Harmony check against F01 and F07-light (upcoming)**

- [ ] **Step 4: Write decisions, update FEATURE-MAP.md, commit**

---

### Task 6: Feature 07 Light Design — Task Router

**Files:**
- Read: `docs/features/07-workflow-engine/README.md`, `docs/features/02-team-structure/README.md`
- Update: `docs/features/07-workflow-engine/README.md`
- Update: `docs/FEATURE-MAP.md`
- Create: `.project-session/YYYY-MM-DD-feature07-light-design.md`

Scope for Phase 1: sequential task list, lead assignment, interrupt() pattern for HITL. No parallel DAG. The full LangGraph upgrade is Phase 2.

- [ ] **Step 1: Orient — read F07 README**

Key question: what is the data model for a task in Phase 1? (id, title, assigned_lead, status, dependencies: none in Phase 1, created_at, completed_at)

- [ ] **Step 2: Design task router**

Lock:
- Where does the task list live? (mesh state file: `.project-session/tasks.md` or DB?)
- How does OP assign a task to a lead? (writes to task list with `assigned_to: dev-lead`)
- How does the interrupt() pattern work in Phase 1? (OP session pauses, surfaces decision, human responds in terminal, session resumes)
- What's the task state machine? (`pending → assigned → in_progress → review → done`)

- [ ] **Step 3: Harmony check and commit**

---

### Task 7: Feature 09 Light Design — In-Session HITL

**Files:**
- Read: `docs/features/09-hitl-reporting/README.md`, `docs/features/07-workflow-engine/README.md`
- Update: `docs/features/09-hitl-reporting/README.md`
- Update: `docs/FEATURE-MAP.md`
- Create: `.project-session/YYYY-MM-DD-feature09-light-design.md`

Scope for Phase 1: structured decision report format, rendered in terminal, human approves/redirects before session continues. n8n + Telegram is Phase 2.

- [ ] **Step 1: Orient — read F09 README**

Lock: what does a Phase 1 Decision Report look like? Fields: decision_id, type (approve/redirect/escalate), context (1-3 sentences), options (A/B/C), recommendation, impact.

- [ ] **Step 2: Design in-session HITL**

- How is the decision report presented? (formatted markdown block in terminal, clearly delimited)
- How does the human respond? (types A/B/C or free text)
- How does the session resume after approval? (OP continues from where interrupt() was called)
- What gets written to mesh state after a decision? (decision log entry)

- [ ] **Step 3: Harmony check and commit**

---

### Task 8: Feature 04 Design — Tools Layer

**Files:**
- Read: `docs/features/04-tools-layer/README.md`, `docs/features/01-agent-identity/README.md`
- Update: `docs/features/04-tools-layer/README.md`
- Update: `docs/FEATURE-MAP.md`
- Create: `.project-session/YYYY-MM-DD-feature04-design.md`

Full design: MCP tool definitions, Docker exec sandbox for Python tools, Deno V8 isolates for JS/TS, tool registry (which tools are available to which agent roles).

- [ ] **Step 1: Orient — read F04 README**

Key decisions: what tools do Leads need in Phase 1? (file read/write, shell exec, web fetch, code execution) How does the tool registry map tools to agent ranks?

- [ ] **Step 2: Design tool layer**

Lock: tool definition format (MCP JSON schema), sandbox strategy (Docker exec for Python, Deno V8 for JS), tool authorization (which rank can call which tool), tool result format.

- [ ] **Step 3: Harmony check against F01 (rank-based tool auth) and F03 (skills invoke tools)**

- [ ] **Step 4: Write decisions and commit**

---

### Task 9: Feature 03 Full Design — Complete Skill Library

**Files:**
- Read: `docs/features/03-skills-system/README.md` (skeleton decisions from Task 3)
- Update: `docs/features/03-skills-system/README.md`
- Create: `.project-session/YYYY-MM-DD-feature03-full-design.md`

Extends the skeleton. Full scope: /admin skill, /op skill, /[lead] skill, skill chaining, mesh-aware session-end that integrates with Mem0.

- [ ] **Step 1: Orient — review skeleton decisions and F04 tool definitions**

The full skill library builds directly on the skeleton. What's already decided (session-start/end, handoff writer, briefing reader) is fixed. This session adds the role-specific skills on top.

- [ ] **Step 2: Design full skill library**

Lock: /admin skill flow (steps: connect → briefing → read feed → post decision → session-end), /op skill flow (connect → briefing → run specialty tools → HITL if needed → assign tasks → session-end), /[lead] skill flow (connect → briefing → pick task → spawn subagents → use tools → write results → session-end).

- [ ] **Step 3: Harmony check and commit**

---

### Task 10: Feature 05 Full Design — Memory (Mem0 + pgvector)

**Files:**
- Read: `docs/features/05-memory-knowledge/README.md` (skeleton decisions from Task 4)
- Update: `docs/features/05-memory-knowledge/README.md`
- Create: `.project-session/YYYY-MM-DD-feature05-full-design.md`

Extends skeleton. Full scope: Mem0 self-hosted on Supabase pgvector, `memory.add()` at session end, `memory.search()` at session start, 3-tier memory model with vector retrieval.

- [ ] **Step 1: Orient — review skeleton decisions**

The flat file layer is already designed. This session adds the vector memory layer on top. The skeleton briefing pack builder will be upgraded to incorporate Mem0 search results.

- [ ] **Step 2: Design Mem0 integration**

Lock: what gets passed to `memory.add()` at session end? (role, slug, session summary, key decisions made, tasks completed) What query gets passed to `memory.search()` at session start? (current task + role context) How are Mem0 results merged into the briefing pack?

- [ ] **Step 3: Harmony check and commit**

---

### Milestone: Phase 1 Design Complete ✓

All 8 Phase 1 features designed. FEATURE-MAP.md shows all at BUILDING status. Ready to start build phase.

```bash
# Verify all Phase 1 features are BUILDING status
grep -A1 "Feature" docs/FEATURE-MAP.md | grep -E "BUILDING|DESIGNED"
```

Expected: F08 DESIGNED, F01–F05, F07, F09 all BUILDING.

---

## Part 2: Phase 1 Build

Build order: Milestone 1 complete → validate → Milestone 2 → validate → Milestone 3 → validate.

Each feature gets its own implementation plan written at build time. Plans go to `docs/superpowers/plans/YYYY-MM-DD-feature-NN-<name>.md`.

---

### Task 11: Write Per-Feature Implementation Plans for Milestone 1

For each M1 feature, write a code-level implementation plan before building anything.

- [ ] **Step 1: Write F08 implementation plan**

```
docs/superpowers/plans/YYYY-MM-DD-feature-08-model-routing.md
```

Covers: LiteLLM proxy setup, tier config file format, OpenRouter integration, routing rule engine, tests.

- [ ] **Step 2: Write F01 implementation plan**

```
docs/superpowers/plans/YYYY-MM-DD-feature-01-agent-identity.md
```

Covers: claude-peers-mcp fork (cherry-pick PRs, replace SQLite with NATS KV), `.claude/agents/` file format, Supabase Agent model migration, /admin /op /lead connection flow, tests.

- [ ] **Step 3: Write F03 skeleton implementation plan**

```
docs/superpowers/plans/YYYY-MM-DD-feature-03-skills-skeleton.md
```

Covers: session-start skill, session-end skill, handoff writer, briefing pack reader, mesh state file format, tests.

- [ ] **Step 4: Write F05 skeleton implementation plan**

```
docs/superpowers/plans/YYYY-MM-DD-feature-05-memory-skeleton.md
```

Covers: flat file 3-tier memory layer, briefing pack builder, mesh state reader, role-scoped output, tests.

---

### Task 12: Build Milestone 1 — /admin works

Execute each per-feature plan in order. F08 first (no dependencies), then F01 (uses F08 routing), then F03sk + F05sk (use F01 identity).

- [ ] **Step 1: Execute F08 plan**

Follow `docs/superpowers/plans/*-feature-08-model-routing.md` using executing-plans or subagent-driven-development.

- [ ] **Step 2: Execute F01 plan**

Follow `docs/superpowers/plans/*-feature-01-agent-identity.md`.

- [ ] **Step 3: Execute F03 skeleton plan**

- [ ] **Step 4: Execute F05 skeleton plan**

- [ ] **Step 5: Validate Milestone 1 end-to-end**

```bash
# Start a Claude Code session and type:
/admin
```

Expected behavior:
- Session connects as admin profile
- Shows mesh briefing (current state, recent decisions, task summary)
- Allows posting a decision that persists to `.project-session/`
- Session-end writes handoff artifact

If this works: Milestone 1 is done. Commit: `feat: milestone 1 complete — /admin works`

---

### Task 13: Write Per-Feature Implementation Plans for Milestone 2

- [ ] **Step 1: Write F02 plan** — `docs/superpowers/plans/*-feature-02-team-structure.md`

Covers: Operator tier agent definitions, Lead tier agent definitions, rank-based profile hierarchy, mesh topology config, Supabase schema additions (rank field, TaskDependency), tests.

- [ ] **Step 2: Write F07 light plan** — `docs/superpowers/plans/*-feature-07-light-task-router.md`

Covers: task data model, task list storage (mesh state), lead assignment flow, interrupt() integration, task state machine, tests.

- [ ] **Step 3: Write F09 light plan** — `docs/superpowers/plans/*-feature-09-light-hitl.md`

Covers: Decision Report markdown format, terminal rendering, human response parsing (A/B/C or free text), session resume after approval, decision log persistence, tests.

---

### Task 14: Build Milestone 2 — /op works

- [ ] **Step 1: Execute F02 plan**
- [ ] **Step 2: Execute F07 light plan**
- [ ] **Step 3: Execute F09 light plan**

- [ ] **Step 4: Validate Milestone 2 end-to-end**

```bash
/op
```

Expected behavior:
- Session connects as Operator profile
- Shows op briefing (mesh state, lead status, pending tasks)
- Runs specialty tool (analyst scans state, reporter prepares brief)
- Surfaces a Decision Report mid-session
- On approval, writes task assignments for leads
- Session-end writes handoff

Commit: `feat: milestone 2 complete — /op works`

---

### Task 15: Write Per-Feature Implementation Plans for Milestone 3

- [ ] **Step 1: Write F04 plan** — `docs/superpowers/plans/*-feature-04-tools-layer.md`

Covers: MCP tool definitions, Docker exec sandbox, Deno V8 isolate setup, tool registry (rank-based authorization), tests.

- [ ] **Step 2: Write F03 full plan** — `docs/superpowers/plans/*-feature-03-skills-full.md`

Covers: /admin skill implementation, /op skill implementation, /[lead] skill implementation, skill chaining, mesh-aware session-end with Mem0 integration.

- [ ] **Step 3: Write F05 full plan** — `docs/superpowers/plans/*-feature-05-memory-full.md`

Covers: Mem0 self-hosted setup on Supabase pgvector, `memory.add()` at session end, `memory.search()` at session start, briefing pack upgrade to include vector results.

---

### Task 16: Build Milestone 3 — /[lead] works

- [ ] **Step 1: Execute F04 plan**
- [ ] **Step 2: Execute F03 full plan**
- [ ] **Step 3: Execute F05 full plan**

- [ ] **Step 4: Validate Milestone 3 end-to-end**

```bash
/dev-lead
```

Expected behavior:
- Session connects as Dev Lead profile
- Shows lead briefing (assigned task, relevant memory from past sessions, available tools)
- Picks up task assigned by OP
- Spawns inline subagent (architect for planning, developer for implementation)
- Uses tools (code execution, file read/write)
- Writes results + decisions back to mesh
- Session-end persists to Mem0

Commit: `feat: milestone 3 complete — /[lead] works`

---

### Milestone: Phase 1 Complete ✓

The mesh works. `/admin`, `/op`, `/[lead]` all functional. Linear async model delivering real work.

Update FEATURE-MAP.md: all Phase 1 features → DONE.

```bash
git tag phase-1-complete
```

---

## Part 3: Phase 2 Design Sessions

Begin after Phase 1 is complete. Same methodology: design all → build all.

Design order: F06 → F07↑ → F09↑ → F10 → F11 → F12 → F13 → F14 → F16

### Task 17–25: Phase 2 Feature Design Sessions

For each feature, run a full orient → design → harmony cycle. At the start of each session, paste the handoff prompt from the previous session. The design doc for each lives at `docs/features/NN-<name>/README.md`.

| Task | Feature | Key Design Questions |
|---|---|---|
| 17 | F06 Agent Communication | NATS subject hierarchy design, JetStream retention policy, MCP surface compatibility with Phase 1 |
| 18 | F07 full — Workflow Engine | LangGraph StateGraph schema, parallel branch design, checkpoint strategy, upgrade path from F07 light |
| 19 | F09 full — HITL | n8n workflow templates, webhook payload format, Telegram message structure, async resume mechanism |
| 20 | F10 Observability | Event schema for all agent actions, token tracking per session, audit trail storage, query patterns |
| 21 | F11 Plugin Bridge | FastMCP server architecture, capability negotiation, platform-specific adapters (OpenCode, Pi) |
| 22 | F12 Web Platform | agentic-ai-platform fork assessment vs Paperclip, Prisma schema gaps, NextAuth v5 setup, UI scope |
| 23 | F13 Project Management | Project/client/deliverable data model, linkage to agent runs, reporting format |
| 24 | F14 Agency Builder | Agency template format, configuration UI scope, deployment mechanism, meta-product flow |
| 25 | F16 Adaptive Intelligence | Pattern detection algorithms, HITL proposal types (skill/agent/tuning), approval workflow, application mechanism |

Each session: read feature README → orient → design → harmony → update FEATURE-MAP.md → commit.

---

### Task 26: Build Phase 2

Write per-feature implementation plans for Phase 2 features, then execute in build order.

Build order: F06 → F07↑ → F09↑ → F10 → F11 → F12 → F13 → F14 → F16

Validate end-to-end after each milestone group:
- After F06 + F07↑ + F09↑: real-time mesh with parallel tasks and async HITL working
- After F10 + F11: observability running, plugin bridge connecting to other environments
- After F12 + F13: web dashboard live, projects and runs visible
- After F14 + F16: agency builder working, adaptive intelligence surfacing first suggestions

```bash
git tag phase-2-complete
```

---

## Part 4: Phase 3 Design + Build

### Task 27: Feature 15 Design — Desktop App

Full orient → design → harmony. Key decisions: Tauri vs Electron final call, window/panel structure, offline-capable data sync strategy, OS integration surface (notifications, file system, tray).

### Task 28: Build Phase 3

Write F15 implementation plan. Execute. Validate: full desktop experience wrapping CLI plugin + web platform.

```bash
git tag phase-3-complete
```

---

## Quality Bar (Apple-Level Throughout)

Every milestone validation is a full end-to-end test of the user experience, not just unit tests passing:

- The briefing pack is clear, role-scoped, and actionable — not a raw data dump
- The Decision Report is readable, the options are meaningful, the approval flow feels natural
- Session handoffs are seamless — opening a new session feels like picking up where you left off
- Error states are handled gracefully — a missing profile, a failed tool call, an unreachable NATS server all produce useful messages
- Token efficiency is measured at each milestone — briefing packs should not bloat as history grows
