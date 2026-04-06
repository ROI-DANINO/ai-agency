# Session Infrastructure Fixes + F03 Brainstorm Started
Date: 2026-04-06
Type: decision

## What Happened

Two things this session: infrastructure fixes to the skill pipeline, and a partial F03 brainstorm.

**Skill pipeline fixes.** `session-end` and `project-brief` weren't connected — the handoff was printed to the user but not persisted anywhere. Fixed: `session-end` now writes `journal/HANDOFF.md` on every close, and `project-brief` reads it as the primary handoff source. A second gap: `project-brief` only read the most recent journal, which meant parallel session journals were silently skipped. Fixed: it now reads all journals from the last 3 days. A third gap: there was no mechanism to carry forward "must read before next session" prerequisites. Fixed: `session-end` now includes a `## Prerequisites` section in HANDOFF.md, and `project-brief` loads those files before presenting the brief.

**F03 brainstorm started but not complete.** Clarified the two-layer model: human skills are a workflow framework (like superpowers) that the human invokes directly; agent skills are capabilities that human skill workflows orchestrate. The human doesn't invoke agent skills directly — they surface through human skill workflows. Artifact delivery (briefing-pack, handoff, decision-report) is context-driven, not actively pushed — agents read what they need when context calls for it. Also confirmed: aios is reference only, not adopted.

The brainstorm was paused before reaching the approaches/design stage. Before continuing, two repos must be read: oh-my-pi (TTSR briefing pack injection pattern) and BMAD-METHOD (34+ workflow templates). Neither is cloned locally.

## Decisions Made

- **session-end writes HANDOFF.md** — why: handoff was ephemeral; now persists across sessions
- **project-brief reads all journals from last 3 days** — why: parallel sessions were being silently missed
- **Prerequisites section in HANDOFF.md** — why: "must read before next session" items were buried in prose and ignored
- **Two-layer skill model confirmed** — why: human skills = workflow framework; agent skills = orchestrated by human skills, not invoked directly
- **Artifact delivery is context-driven** — why: no active push mechanism needed; agents read what they need
- **aios = reference only** — why: keeping ai-org self-contained

## Open Questions

- Should superpowers be reset or removed? (still deferred to F03)
- Session miscommunication fix (directives in HANDOFF.md) — discussed but not implemented yet

## What's Next

Fresh session: clone oh-my-pi and BMAD-METHOD, read TTSR pattern and workflow templates, then continue F03 brainstorm from the approaches stage.
