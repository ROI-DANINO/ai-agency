# Architecture

High-level system architecture. Each layer has its own concerns, its own tech, and its own deployment story.

---

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     LAYER 3: Desktop App                    │
│              (Tauri/Electron — Phase 3, future)             │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 2: Web Platform                    │
│         Next.js + Supabase — management dashboard           │
│       Auth · Workspaces · Agent config · Run history        │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 1: CLI Plugin                      │
│     Installable to Claude Code · OpenCode · Pi · etc.       │
│   Skills · Memory · Agent defs · Workflow · MCP bridge      │
└─────────────────────────────────────────────────────────────┘
              ↑                            ↑
     [LiteLLM Proxy]              [claude-peers-mcp]
     Model-agnostic               Agent identity +
     routing layer                messaging broker
```

---

## Agent Hierarchy

```
Human (Lead Director)
    ↑ decision reports
    │
Orchestrator (Qwen 3.6 via OpenRouter)
    → task decomposition + routing
    │
    ├── PM Lead (Nemotron)
    │       └── sub-agents: Analyst, Scrum Master
    ├── Dev Lead (Nemotron)
    │       └── sub-agents: Architect, Developer, QA
    ├── UX Lead (Nemotron)
    │       └── sub-agents: UX Researcher, UI Designer
    └── Security Lead (Nemotron)
            └── sub-agents: CSO Auditor, Pen Tester
```

**Persistent agents:** Orchestrator + all Leads. They have stable identity, memory, and roles across sessions.  
**Task-scoped agents:** All sub-agents. Spawned for a specific objective, dismissed when done.

---

## Model Tier Routing

| Tier | Models | Assigned To |
|---|---|---|
| Tier 1 | GLM, Kimi, Qwen | Research sub-agents, long-context tasks, bulk drafts |
| Tier 2 | Nemotron, Claude Haiku, GPT-4o-mini | All Team Leads, coordination, reviews |
| Tier 3 | Claude Sonnet/Opus, GPT-4o | Complex coding, critical architecture, final QA, security |

Routing is managed by LiteLLM. The Orchestrator declares which tier a task requires. The human can override.

---

## Data Flow

```
Human input
    ↓
Orchestrator decomposes task
    ↓
Team Lead receives task + briefing pack (role-scoped context snapshot)
    ↓
Lead spawns sub-agent(s) with dependencies (DAG)
    ↓
Sub-agents execute using tools + memory
    ↓
Results bubble up to Lead → Lead writes summary + open decisions
    ↓
Decision report delivered to human (via HITL layer)
    ↓
Human approves / redirects
    ↓
Next phase begins
```

---

## Key Principles

**Write less code, wire more tools.** Custom code lives only at the integration seams. Never reinvent what already exists well.

**Briefing packs over full context.** Each agent receives only the context relevant to its role. Not everything — the right things.

**Immutable versioning.** Skills, tools, and prompts are never mutated in place. New versions are created. This enables rollback, A/B, and auditability.

**RBAC from day one.** Every resource has a scope (workspace / cluster / group / agent). Permissions are enforced at the DB layer, not the UI layer.

**Deterministic routing, non-deterministic reasoning.** Skill chains, escalation rules, and safety gates are deterministic (markdown + rules). Planning, design, and generation are AI reasoning. Never mix them.

**Token efficiency is a design constraint, not an afterthought.** Measure token cost per feature. Briefing packs, context loaders, and log rotation are first-class features.

---

## OSS Stack Decisions

See `research/forks-and-oss.md` for detailed rationale. Summary:

| Concern | Decision | Alternative Considered |
|---|---|---|
| Model routing | LiteLLM | Direct OpenRouter API |
| Orchestration | CrewAI (start), LangGraph (scale) | AutoGen, Dify |
| Integrations | n8n self-hosted | Zapier, custom webhooks |
| Database | Supabase (PostgreSQL + pgvector) | PlanetScale, Neon |
| Identity/messaging | claude-peers-mcp (fork) | Build from scratch |
| Web framework | Next.js 16 + shadcn/ui | SvelteKit, Remix |
| Plugin bridge | FastMCP | SDK-based MCP |

---

## What to Fork

| Fork Source | What We Take | Why Not Build Fresh |
|---|---|---|
| `claude-peers-mcp` | Identity broker + messaging | Working SQLite broker, proven message passing |
| `agentic-ai-platform` | Prisma schema (24 models), NextAuth setup, Vitest config | Hardest parts already done, solid architecture |

Everything else: install as dependency, don't fork.
