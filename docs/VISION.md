# Vision

## The Product

An **AI Agency that builds AI Agencies** — a platform for orchestrating persistent teams of AI agents that plan, build, and deliver real work autonomously, with the human staying in control of every meaningful decision.

This is a long, slow project. Every detail is thought through. No shortcuts, no compromises on quality. Apple-level attention to how things feel, how they work, and how they scale.

---

## The Idea

Most AI tools give you a single agent. This gives you a **team** — with roles, memory, skills, and a chain of command. You are the Lead Director. Agents handle execution. The system surfaces decisions to you at the right moment, in the right format, and never acts without your direction on anything that matters.

The meta-goal: the platform itself is an AI agency. It can be used to design, build, and deploy new AI agencies for any domain.

---

## Three Layers

### Layer 1 — CLI Plugin (Phase 1)
Installable into any agentic coding environment: Claude Code, OpenCode, Pi, and others. Platform and model agnostic. The core of the system lives here — skills, memory, agent definitions, workflow engine. Works in the terminal. The plugin is the heartbeat.

### Layer 2 — Web Platform (Phase 2)
A full browser-based management dashboard. Create and manage agents, teams, skills, and tools. Monitor runs, review decision reports, manage clients and projects. Connects to the plugin layer via API.

### Layer 3 — Desktop App (Phase 3 / Future)
A native desktop application — like Claude Desktop or Cursor — that wraps both layers into a first-class local experience. Full UI, offline-capable, tightly integrated with the local agent runtime.

---

## Core Principles

**Model agnostic.** Works with any LLM via LiteLLM + OpenRouter. Claude, Qwen, Nemotron, Kimi, GPT-4o — the system routes to the right model for the right job. No vendor lock-in.

**Human in the loop.** The Orchestrator never makes final calls. Agents bring decisions, blockers, and structured reports to the human. The human decides. This is not optional.

**Persistent agents.** Team Lead agents have stable identity and memory across sessions. They know their domain, their history, and their role. Sub-agents are task-scoped and dismissed when done.

**Token efficiency.** Context is scoped to the role. Agents don't re-read everything — they get briefing packs. Memory is curated, not auto-synced. Lean systems make better decisions and cost less.

**Skills as the unit of capability.** Agent behavior is composed from reusable, versioned prompt templates. Skills are portable, chainable, and platform-independent.

**Write less code, wire more tools.** The goal is to connect great open source systems — not reinvent them. Custom code lives at the seams.

---

## Model Tier Strategy

| Tier | Models | Use For |
|---|---|---|
| Tier 1 — Free/Cheap | GLM, Kimi, Qwen | Long-context research, bulk tasks, drafts |
| Tier 2 — Mid | Nemotron, Claude Haiku, GPT-4o-mini | Team leads, coordination, review |
| Tier 3 — Premium | Claude Sonnet/Opus, GPT-4o | Complex coding, critical logic, final QA |

Routing is automatic based on task type. The human can override.

---

## What "Done" Looks Like

A user installs the plugin into Claude Code. They define a team — PM Lead, Dev Lead, UX Lead, Security Lead — each backed by an appropriate model tier. They describe a project. The Orchestrator decomposes it, routes tasks to leads, leads spawn sub-agents, work happens. Decision moments bubble up as structured reports. The user approves or redirects. The agency delivers.

Then the user does it again for a different client, in a different domain, with a different team configuration. The platform learns from every run.
