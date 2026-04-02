# Feature 12 — Web Platform

**Status:** PLACEHOLDER  
**Phase:** 2 — Platform  
**Layer:** Web  
**Priority:** High  
**Depends on:** Features 01–10

---

## Vision

The control panel for everything. A full browser-based dashboard where you create and manage agents, configure teams, build skills and tools, monitor runs, review history, and manage clients — all with the clarity and polish of a well-designed product.

---

## Core Concept

A Next.js web application backed by Supabase. Workspace-scoped: every user has a workspace, and all data is isolated by workspace. Every resource shows its scope clearly (scope badges). Every sensitive operation is logged. RBAC is enforced at the database layer, not the UI.

Fork `agentic-ai-platform` as the starting point — it already has the Prisma schema (24 models), NextAuth, Vitest config, and workspace scoping patterns.

---

## Key Capabilities

### Navigation (7-section sidebar)
1. **Dashboard** — workspace overview, active agents, recent runs, pending decisions
2. **Agents** — hierarchy browser (Cluster → Group → Agent), agent detail pages
3. **Skills** — skills bank, create/edit/assign, scope badges, version history
4. **Tools** — tool builder (form + code), test runner, deployment lifecycle
5. **Knowledge** — data sources, ingestion status, vector search testing
6. **Runs** — all agent runs, filterable, log viewer, cost breakdown
7. **Settings** — workspace, model config, API keys, billing

### Agent Detail Page (6 tabs)
- System Prompt — rich editor, `{{skill:name}}` placeholders, live preview
- Skills — assign, reorder, scope badges
- Tools — assign, toggle, scope badges
- Knowledge — data sources, auto-injected memory tools
- LLM Config — model/tier assignment with inheritance indicators
- Run History — paginated past runs

### Platform Features
- Multi-workspace / multi-tenant
- RBAC — workspace roles + resource-level permissions
- Immutable versioning for prompts, skills, tools
- Audit log viewer
- Real-time run log streaming
- Scope badges on every resource
- Inheritance indicators on config fields

---

## Open Questions

- [ ] Authentication — NextAuth (credentials + OAuth) or Supabase Auth?
- [ ] Hosting — self-hosted only, or cloud version?
- [ ] Real-time updates — polling (simple) or WebSocket/SSE?
- [ ] Mobile-friendly — full responsive or desktop-first?
- [ ] White-labeling — can agencies use this under their own brand?
- [ ] Billing integration — Stripe or manual?
- [ ] How does the web platform sync with the CLI plugin — API polling, webhooks, or real-time socket?

---

## Considerations

- Fork `agentic-ai-platform` — don't start from scratch. The schema, auth, and testing infrastructure are already done.
- RBAC must be enforced at the DB layer (Supabase RLS or Prisma middleware) — never rely on UI-level hiding.
- Scope badges must be a design system primitive, not a one-off component. Every resource card, list item, and detail page shows scope.
- Start with self-hosted only. Cloud version is a future concern.

---

## OSS & References

- **Fork:** `agentic-ai-platform` — Prisma schema, NextAuth v5, Vitest, workspace scoping
- **Reference:** `agentic-ai` design spec — full UX spec for all 7 sidebar sections
- **OSS:** Next.js 16 + shadcn/ui + Tailwind v4
- **OSS:** Supabase — Postgres + pgvector + Auth + Storage
- **OSS:** NextAuth v5 — authentication

---

## Dependencies

- **01–10** — all core features must be functional before the web platform has anything to display

---

## Session Notes
<!-- Fill during design/build session -->
