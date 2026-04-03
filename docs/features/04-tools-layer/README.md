# Feature 04 — Tools Layer

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin + Cross-layer  
**Priority:** Critical  
**Depends on:** 01 Agent Identity

---

## Vision

Tools are what agents can actually *do* — the hands of the system. Every department has a defined toolset. Tools are versioned, tested, deployable, and scoped so agents only access what they're authorized to use.

---

## Core Concept

Two paths to create a tool:

- **Form mode (no-code):** Define a name, parameters, and a webhook URL. The platform proxies LLM tool calls to the webhook. No code required.
- **Code mode:** Write a TypeScript/Python handler directly. Full runtime access. Sandboxed execution.

Tools are assigned to agents with scope rules. When an agent is assigned a data source, memory tools (`search_memory`, `save_memory`) are auto-injected.

---

## Key Capabilities

- Dual-mode tool builder: form (no-code webhook) + code (sandboxed handler)
- Tool testing — run with JSON input, inspect output, before assigning to agents
- Tool versioning — dev / staging / prod deployment stages
- Rollback support
- Scoped assignment — tool can be assigned to a specific agent, group, cluster, or workspace
- "Used by N agents" counter before deletion (safety)
- Tool health monitoring — last tested, last deployed, error rate
- Department toolsets — pre-defined tool collections per role (Research tools, Dev tools, etc.)
- Auto-inject tools based on assigned data sources

---

## Open Questions

- [ ] Sandbox strategy for code tools — Docker? vm2? Deno? Python subprocess?
- [ ] Should tools be language-agnostic (TypeScript + Python) or pick one?
- [ ] Is there a tool marketplace — shared tools across workspaces?
- [ ] How are tool secrets managed? (API keys for webhook auth, etc.)
- [ ] What tools come built-in vs. user-created? (web search, file ops, GitHub, browser…)
- [ ] How does tool execution work in CLI-only mode vs. web platform mode?
- [ ] Rate limiting and cost controls per tool?

---

## Considerations

- The no-code form mode lowers barriers massively — non-developers can wire in APIs without writing handlers.
- Sandbox isolation is critical for code-mode tools. Never run user code in the main process.
- The "used by N agents" pattern (from agentic-ai) is a small but essential safety feature — prevents accidental breaking changes.
- Tool versioning must be immutable — published versions are never mutated. This matches the skills system pattern.
- Consider built-in tools for common operations: web_search, read_file, write_file, run_shell, github_pr, browse_url.

---

## OSS Stack

- **agentic-ai-platform schema** (fork) — `MCPTool`, `ToolVersion`, `ToolDeployment`, `ToolTestRun` models adopted wholesale. Immutable versioning (never mutate published versions), 3-tier deployment (DEV/STAGING/PROD), test run audit trail. — Seam: Prisma schema; platform builds tool CRUD and assignment logic on top.
- **FastMCP** — Python MCP server builder (~50 lines to expose a tool). — Seam: MCP Plugin Bridge (Feature 11) uses FastMCP to expose platform tools to Claude Code and other runtimes.
- **Docker exec** — sandbox for Python-based code tools. Known, platform-authored tools run in Docker exec isolation. — Seam: tool handler invokes Docker exec; stdout/stderr returned as tool result.
- **Deno V8 isolates** — sandbox for JavaScript/TypeScript tools. Fast (~10ms start), no full Linux environment needed, sufficient for JS tool execution. — Seam: Deno subprocess per tool invocation; no shared process state.
- **E2B** (Phase 2 upgrade path) — cloud Firecracker microVMs for full Linux environments. Only if the platform adds untrusted/user-supplied code execution. Do NOT add Phase 1. vm2: DO NOT USE (deprecated, critical CVEs).

## OSS & References

- **Reference:** `agentic-ai` design spec — dual-mode MCP tool builder, testing, deployment lifecycle
- **Reference:** `agentic-ai-platform` Prisma schema — MCPTool, ToolVersion, ToolDeployment, ToolTestRun models
- **OSS:** FastMCP — Python MCP server builder
- **OSS:** Docker exec / Deno V8 isolates — sandboxed code execution (vm2 is deprecated with critical CVEs — do not use)

---

## Dependencies

- **01** Agent Identity — tools are scoped to agents/groups/clusters

---

## Session Notes
<!-- Fill during design/build session -->
