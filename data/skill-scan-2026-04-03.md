# Skill Scan — 2026-04-03

## Context

`ai-org` is an application project using the design-think-build methodology, built on top of the AIOS platform. It has no local `skills/` directory — its skills come from installed plugins and the AIOS generic skill layer. This scan adapts the standard skill-scan framework accordingly.

**Scanned sources:**
- `~/.claude/aios-plugins/plugins/` — locally developed skills (session-end)
- `~/.claude/plugins/cache/aios/` — @aios marketplace plugins (13 plugins)
- `~/.claude/plugins/cache/claude-plugins-official/` — official plugins (superpowers, frontend-design, code-review, context7, skill-creator, github)
- `/home/roking/Desktop/Projects/aios/skills/` — AIOS generic skills (session-close, daily-brief, skill-navigator, etc.)
- `CLAUDE.md` — project skill references
- Session system reminder — live skills this session

## Summary

- **2 critical** · **3 warnings** · **5 info**
- Scanned: 0 local project skills, 13 @aios plugins, 6 official plugins, 26 AIOS generic skills

---

## Critical

- [x] **`session-end`** — SKILL.md exists at `~/.claude/aios-plugins/plugins/session-end/skills/session-end/SKILL.md` but has NO `.claude-plugin/plugin.json`. The plugin is not registered and cannot be invoked as `/session-end`. The skill was built last session but is effectively dead.
  > _Fixed: created `.claude-plugin/plugin.json`. Will be active next session restart._

- [x] **`skills-map.md` (project-local)** — `skill-navigator` auto-fires every session and reads `skills-map.md` to route. This project has no local `skills-map.md`, so it falls back to the AIOS generic one. That map has no knowledge of project-specific skills (`session-end`, `project-brief`). Skill routing for this project is broken by default.
  > _Fixed: created `skills-map.md` in project root with project-relevant skills only._

---

## Warning

- [x] **`docs/superpowers/`** — An undocumented artifact directory. Contains design specs (`specs/`) and plans (`plans/`) for superpowers-style session work. Not listed in CLAUDE.md's key docs. File naming convention differs from the rest of the project (no established home in `docs/features/` or `.project-session/`). This will grow quietly and become confusing.
  > _Fixed: Feature 01 Chat A spec → `docs/features/01-agent-identity/chat-a-session-flow.md`. Session-end build artifacts → `.project-session/`. `docs/superpowers/` deleted._

- [ ] **`daily-brief` vs `project-brief` — overlap, no disambiguation** — Both are loaded. `project-brief` is the correct session-start skill for this project (CLAUDE.md says so). `daily-brief` falls into "generic mode" when run here (no `context/my-goals.md`), giving a weak brief. The ambiguity is a trap — the wrong one might be invoked, especially via `skill-navigator` routing.
  > _Direction: ai-org does NOT use AIOS generic skills. Take inspiration, rebuild better (Apple-level). This means: no daily-brief, no session-close, no note, no dev-audit etc. — only project-specific skills purpose-built for this project's workflow. project-brief and session-end are the right model. Backlog: audit which AIOS skills this project needs versions of and build them._

- [ ] **CLAUDE.md lacks skill guidance** — Only mentions `/project-brief`. Doesn't reference `/session-end` (the project session-close skill), `/skill-scan`, or any other project-relevant skills. A new session or subagent has no map of what skills are active.
  > _Direction: ai-org needs a complete, purpose-built skill system — not a patched CLAUDE.md. Two layers: (1) Human workflow skills (Roi building the platform: orient, design phases, capture, close) and (2) Agent workflow skills (the agentic teams operating within the platform: accept, execute, escalate, report). These serve different users but share the same design philosophy — interlocking workflows with clean handoffs, no dead ends. The skill system itself is a working demonstration of what the platform will eventually offer. Design this as Feature 03 (Skills System) approaches — but start prototyping the human-layer skills now since every session depends on them._

---

## Info

- [ ] **Gstack/web-app skills are noise for this project** — The following skills are loaded but irrelevant to an AI agency platform design project: `canary`, `setup-browser-cookies`, `connect-chrome`, `setup-deploy`, `land-and-deploy`, `qa`, `qa-only`, `cso` (web-oriented), `gstack-upgrade`, `benchmark`, `codex`. These are gstack web-app deployment tools. They won't break anything, but they add routing noise.
  > _Nothing to touch now. Future planning note: when designing agent-layer skills, audit installed plugins for capabilities that could be wired INTO specific agent roles rather than used directly. E.g. `cso` → Security Lead agent, `qa` → QA Lead agent, `codex` → adversarial review within a Dev Lead skill, `canary` → Ops agent post-deploy. The noise skills may become building blocks, not standalone tools. Capture this when designing Feature 03 (Skills System) and Feature 04 (Tools Layer)._

- [ ] **`session-close` (AIOS generic) and `session-end` (project-specific) do the same job** — `session-close` is functional. `session-end` is tailored for ai-org (journal entries, .project-session/ logs, handoff prompts) but broken. Once `session-end` is fixed, it should supersede `session-close` for this project — but there's no disambiguation in CLAUDE.md.

- [ ] **`rust-analyzer-lsp`** — Installed but disabled. No Rust in this project. Fine to leave disabled.

- [ ] **`claude-md-management`** — Installed with `scope: local` for a different project (`CAPTIONATE_v1`). Will not load here. No action needed.

- [ ] **`project-brief` + `project-brief-sessions` are in the AIOS skills-map with incomplete entries** — Both were auto-appended by the `update-skills-map.sh` hook with `<!-- TODO: add triggers -->` placeholders. These are skills-map hygiene issues in the AIOS project, not in ai-org — but they affect skill-navigator routing quality.
  > _Noted in AIOS `data/notes.md` as #next fix. Relevant here because before ai-org had its own `skills-map.md`, skill-navigator was falling back to the AIOS map — broken routing for `project-brief` was a live issue. Now mitigated by our local `skills-map.md`. AIOS fix is still needed for completeness._

---

## Gaps (not in skill-scan severity tiers, but relevant to this project)

- **No design-phase skill** — The project's core workflow is design phases (Orient → Design → Harmony → Build). All of this is embedded in `project-brief`. As the project grows, a dedicated `/feature-design` or `/design-phase` skill would make sense — but only once the workflow is stable across 2-3 features.

- **No session-start skip for handoff prompts** — When a new chat opens with a handoff prompt ("Phase: Design"), project-brief jumps straight to that phase. But CLAUDE.md still says "run /project-brief" unconditionally. This could cause confusion if a new session opens mid-handoff.

---
_Triage notes will appear below each item._
