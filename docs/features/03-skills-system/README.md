# Feature 03 — Skills System

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** CLI Plugin + Cross-layer  
**Priority:** Critical  
**Depends on:** 02 Team Structure

---

## Vision

Skills are the building blocks of agent behavior — reusable, versioned prompt templates that agents compose to do their jobs. A skill is a portable SOP: it works in Claude Code today, OpenCode tomorrow, and any future platform the day after.

---

## Core Concept

A skill is a named markdown file with a specific job. Skills are injected into agent system prompts at `{{skill:name}}` placeholders, or auto-appended in order. Skills are chainable — the end of one skill points to the next.

Two kinds of skills:
- **Workflow skills** — SOPs for doing work (brainstorming, writing a plan, running QA, shipping)
- **Behavior skills** — always-on rules injected into a role's base prompt (tone, escalation rules, tool usage)

---

## Key Capabilities

- Skills bank — create, version, search, and assign skills
- `{{skill:name}}` placeholder injection in system prompts
- Auto-append for skills without a fixed position
- Skill chains — each skill declares its natural next step
- Skill navigator — auto-routing to the right skill based on user intent (silent, runs every turn)
- Scoped sharing — skills can be private, shared at group/cluster/workspace level
- Live preview — resolved system prompt with all skills injected, visible before running
- Versioning — skills never mutated in place; new versions created
- Skill scan — health audit detecting dead aliases, missing registrations, broken chains
- Platform portability — skills are plain markdown, installable to any agentic platform

---

## Open Questions

- [ ] Skills as flat markdown files (like aios) vs. stored in DB (like agentic-ai-platform)?
- [ ] How does skill versioning work in the CLI layer — git tags? frontmatter version field?
- [ ] How are skills synced between CLI (local files) and web platform (DB)?
- [ ] Should there be a public skill marketplace / registry?
- [ ] How does the skill navigator decide which skill to invoke? (keywords? ML? rule-based?)
- [ ] Can two skills conflict — e.g., two behavior skills with contradictory rules?
- [ ] What's the max size of a skill? Is there a token budget?

---

## Considerations

- The aios skills system is the strongest reference — 40+ skills proven in daily use. Study it deeply before designing this.
- Portability is non-negotiable. Skills must work in any platform without modification.
- The `{{skill:name}}` injection pattern (from agentic-ai) and the `/slash-command` invocation pattern (from aios) can coexist — same file, different entry points.
- Skill chains must be machine-readable (frontmatter metadata), not just markdown prose — this was a known weakness in aios v1.
- Token efficiency: skills should be loaded selectively, not all at once.

---

## OSS Stack

- **aios skills system** (reference, not fork) — provides the proven implementation pattern: markdown files + YAML frontmatter + tool permission list + skills-map.md as the master registry with trigger phrases. — Seam: skills-map.md is the index; skill-navigator reads it silently and matches intent.
- **agentic-ai-platform Skill model** (schema reference) — `Skill(id, name, description, category, instructions, version, status)` with immutable versioning (`SkillVersion`); adopt for the DB layer when web platform is built (Feature 12). — Seam: CLI layer = flat markdown files; web layer = same content in DB.
- **Handoff artifact pattern** (from aios) — inter-skill communication via structured markdown deliverables (`deliverables/handoff-<from>-to-<to>-*.md`); adopt for skill chains. — Seam: one skill writes, next skill reads; no ephemeral context passing.

## OSS & References

- **Reference:** `aios` — 40+ battle-tested skills, skill chains, skill navigator, skill scan
- **Reference:** `agentic-ai` design spec — skills bank with `{{placeholder}}` injection, scope badges, live preview
- **Reference:** `agentic-ai-platform` Prisma schema — Skill model with versioning

---

## Dependencies

- **02** Team Structure — skills are assigned to roles within the team hierarchy

---

## Session Notes
<!-- Fill during design/build session -->
