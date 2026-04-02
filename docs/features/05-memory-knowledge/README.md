# Feature 05 — Memory & Knowledge

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin + Cross-layer  
**Priority:** Critical  
**Depends on:** 01 Agent Identity

---

## Vision

Agents remember. They carry forward decisions, patterns, and domain knowledge across sessions. The system gets smarter over time without getting bloated. Memory is curated — high signal, low noise — because automated memory accumulation always turns into garbage.

---

## Core Concept

Three tiers of memory, each with a different lifecycle:

```
Tier 1 — Persistent Context (ground truth, rarely changes)
  context/my-goals.md · my-business.md · my-voice.md · project-brief.md
  → read at session start, updated only when fundamentals change

Tier 2 — Curated Memory (extracted learnings, decisions, patterns)
  memory/MEMORY.md (index) + per-topic files
  → written by session-close, maintained by memory-audit skill

Tier 3 — Ephemeral Session Data (daily work, discarded after ~7 days)
  data/daily-brief-*.md · session-log-*.md · notes.md
  → auto-archived by context-clean skill
```

Shared knowledge across agents uses pgvector — semantic search over documents assigned to a team. Agents writing to shared memory defaults to private; explicit opt-in to share.

---

## Key Capabilities

- 3-tier memory model (persistent context / curated memory / ephemeral session)
- MEMORY.md index — pointer file for fast navigation across memory topics
- Session lifecycle skills: daily-brief (load context), session-close (extract memory)
- Memory audit — verify MEMORY.md pointers, flag stale/orphaned entries
- Context clean — archive stale briefs and logs, compact notes
- Briefing packs — role-scoped context snapshots for agents (only what's relevant to their role)
- Shared knowledge via pgvector — semantic search over assigned data sources
- `search_memory(query)` and `save_memory(content)` auto-injected when source assigned
- RBAC-filtered vector search — results scoped to what the agent is authorized to see
- Cross-agent memory contributions (agents can write learnings back, not just read)

---

## Open Questions

- [ ] Memory extraction: manual curation (session-close skill) vs. auto-extraction? Or hybrid?
- [ ] How are briefing packs generated — static file per role, or dynamically assembled?
- [ ] pgvector vs. alternatives (sqlite-vec, Qdrant, Chroma) — which for Phase 1?
- [ ] How does memory scale beyond ~100 files? Optional semantic search layer?
- [ ] What's the archival strategy — local archive dir, or git history?
- [ ] Can sub-agents contribute to shared memory, or only leads?
- [ ] Memory bridge for multi-machine setups — Phase 2 or Phase 1?

---

## Considerations

- The aios memory system is the gold standard reference. Study `memory/MEMORY.md`, `skills/session-close.md`, and `skills/context-clean.md` carefully.
- Curated extraction beats auto-sync every time. The garbage-in-garbage-out problem is real with automated memory.
- Briefing packs are a high-impact feature — they directly reduce token cost per session. Prioritize.
- The 3-tier structure must survive CLI-only mode (no database). Tiers 1 and 2 are pure files.
- pgvector (Tier 3 / shared knowledge) requires Supabase — only available when connected to the web platform.

---

## OSS & References

- **Reference:** `aios` — full memory system: MEMORY.md, session-close, context-clean, memory-audit, briefing-pack concept
- **Reference:** `stam/unified-efficiency-layer-design.md` — briefing-pack design with role-to-context mapping table
- **Reference:** `agentic-ai` design spec — shared memory via pgvector, search_memory / save_memory
- **OSS:** Supabase pgvector — 1536-dim embeddings, RBAC-filtered retrieval
- **OSS:** sqlite-vec — lightweight alternative for CLI-only mode

---

## Dependencies

- **01** Agent Identity — memory is scoped to agent profiles

---

## Session Notes
<!-- Fill during design/build session -->
