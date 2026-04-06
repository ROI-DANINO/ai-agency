---
date: 2026-04-06
type: implementation-plan
feature: Skills Track 2 — ai-org Claude Code Plugin
status: ready-to-execute
depends-on: Track 1 (complete ✓)
blocks: Milestone 1 build
---

# Implementation Plan — ai-org Claude Code Plugin (Track 2)

## Goal

Restructure the ai-org repo as a deployable Claude Code plugin. Move from scattered `@aios` plugin entries to a single `ai-org@ai-org` plugin with its own skill surface, artifacts layer, and deploy script.

**End state:** `deploy.sh` copies the plugin to `~/.claude/skills/`, all human skills appear in the `/` menu, `TASKS.md` and journal skills work via the plugin.

---

## Pre-conditions

- Track 1 complete ✓ (archive cleared, 6 AIOS plugins disabled)
- Spec locked: `docs/superpowers/specs/2026-04-05-ai-org-plugin-design.md`
- No existing `skills/` dir in repo (clean slate)

---

## Steps

### Step 1 — Create repo directory scaffold

Create these dirs at repo root (all empty to start):

```
agents/
skills/
  human/
  agent/
  archive/
tools/
memory/
workflow/
hitl/
artifacts/
  briefing-packs/
  handoffs/
  decision-reports/
  session/
```

Add `.gitkeep` in each leaf dir so git tracks them.

**Files to create:**
- `agents/.gitkeep`
- `skills/human/.gitkeep`
- `skills/agent/.gitkeep`
- `skills/archive/.gitkeep`
- `tools/.gitkeep`
- `memory/.gitkeep`
- `workflow/.gitkeep`
- `hitl/.gitkeep`
- `artifacts/briefing-packs/.gitkeep`
- `artifacts/handoffs/.gitkeep`
- `artifacts/decision-reports/.gitkeep`
- `artifacts/session/.gitkeep`

---

### Step 2 — Create manifest.yaml

**File:** `manifest.yaml` (repo root)

```yaml
name: ai-org
version: 0.1.0
registry: ai-org
description: AI Agency Platform — Phase 1 CLI Plugin
runtime-dirs:
  - agents
  - skills
  - tools
  - memory
  - workflow
  - hitl
  - artifacts
files:
  - manifest.yaml
  - skills-map.md
```

---

### Step 3 — Create deploy.sh

**File:** `deploy.sh` (repo root, executable)

```bash
#!/bin/bash
set -euo pipefail

PLUGIN_DIR="$HOME/.claude/skills/ai-org"
DIRS=(agents skills tools memory workflow hitl artifacts)

mkdir -p "$PLUGIN_DIR"
for dir in "${DIRS[@]}"; do
  rm -rf "$PLUGIN_DIR/$dir"
  cp -r "$dir" "$PLUGIN_DIR/$dir"
done
cp manifest.yaml skills-map.md "$PLUGIN_DIR/"
echo "ai-org plugin deployed → $PLUGIN_DIR"
```

---

### Step 4 — Create human skills

Each skill lives at `skills/human/{name}/SKILL.md`.

#### 4a. project-brief

```
skills/human/project-brief/SKILL.md
```

Content: session start skill. Reads TASKS.md, recent journal, presents project status brief, runs phase workflow (design-think-build orientation). Calls task-sync internally before presenting brief.

#### 4b. session-end

```
skills/human/session-end/SKILL.md
```

Content: session close skill. Checks for meaningful work to journal, writes journal entry to `journal/YYYY-MM-DD-{topic}.md`, writes local session log, produces handoff prompt for next session.

#### 4c. task-sync

```
skills/human/task-sync/SKILL.md
```

Content: reads 4 sources (FEATURE-MAP.md, build roadmap, recent journal entries, open questions from design docs), writes TASKS.md, clears `.tasks-dirty` flag.

#### 4d. skill-scan

```
skills/human/skill-scan/SKILL.md
```

Content: audits skills surface — finds skills in `skills/` not in `skills-map.md`, finds `skills-map.md` entries with no matching file, writes report to `data/skill-audit-YYYY-MM-DD.md`.

#### 4e. feature-design (stub)

```
skills/human/feature-design/SKILL.md
```

Content: stub for focused design sessions. Not yet implemented — creates placeholder that surfaces "feature-design skill coming in F03 build."

#### 4f. capture (stub)

```
skills/human/capture/SKILL.md
```

Content: mid-session decision/question capture. Stub — notes not yet implemented.

---

### Step 5 — Create agent skills (stubs)

These are invoked by other skills/agents, not humans directly.

#### 5a. briefing-pack

```
skills/agent/briefing-pack/SKILL.md
```

Stub: writes a briefing pack artifact to `artifacts/briefing-packs/`. Full implementation in F03 build.

#### 5b. handoff

```
skills/agent/handoff/SKILL.md
```

Stub: writes a handoff artifact to `artifacts/handoffs/`. Full implementation in F03 build.

#### 5c. decision-report

```
skills/agent/decision-report/SKILL.md
```

Stub: structures a HITL decision surface for the human. Full implementation in F09 build.

---

### Step 6 — Update skills-map.md

Move `skills-map.md` (currently at repo root, already there) to reflect the new plugin structure. Update entries to show correct skill paths and add agent-internal skills section.

Current skills-map.md already has: project-brief, task-sync, session-end, skill-scan.
Add: feature-design, capture, briefing-pack, handoff, decision-report.
Update: mark stubs as `status: stub`.

---

### Step 7 — Wire settings.json

**File:** `~/.claude/settings.json`

Add `ai-org` skill entry (Claude Code skills are picked up from `~/.claude/skills/{name}/SKILL.md`). The deploy.sh puts skills at `~/.claude/skills/ai-org/skills/human/{name}/SKILL.md`.

Verify that Claude Code's skill discovery picks up from the deployed location.

> **Note:** Claude Code skill discovery path needs verification during implementation — confirm whether skills are at `~/.claude/skills/{name}/SKILL.md` (flat) or nested. Adjust deploy.sh if needed to flatten skill dirs into `~/.claude/skills/`.

---

### Step 8 — Run deploy.sh and verify

```bash
chmod +x deploy.sh
./deploy.sh
```

Verify:
1. `~/.claude/skills/ai-org/` exists with correct structure
2. Human skills appear in `/` menu in Claude Code
3. `/project-brief` triggers project-brief skill
4. `/session-end` triggers session-end skill
5. `/task-sync` runs and writes TASKS.md correctly
6. `/skill-scan` runs and produces audit report

---

### Step 9 — Commit and push

```bash
git add agents/ skills/ tools/ memory/ workflow/ hitl/ artifacts/ manifest.yaml deploy.sh skills-map.md
git commit -m "Track 2: ai-org plugin scaffold, skills surface, deploy mechanism"
git push -u origin claude/brainstorm-project-tracking-xqTdT
```

---

## File Summary

| File | Action |
|------|--------|
| `manifest.yaml` | Create |
| `deploy.sh` | Create (chmod +x) |
| `skills-map.md` | Update (add new skills, add agent section) |
| `agents/.gitkeep` | Create |
| `skills/human/project-brief/SKILL.md` | Create |
| `skills/human/session-end/SKILL.md` | Create |
| `skills/human/task-sync/SKILL.md` | Create |
| `skills/human/skill-scan/SKILL.md` | Create |
| `skills/human/feature-design/SKILL.md` | Create (stub) |
| `skills/human/capture/SKILL.md` | Create (stub) |
| `skills/agent/briefing-pack/SKILL.md` | Create (stub) |
| `skills/agent/handoff/SKILL.md` | Create (stub) |
| `skills/agent/decision-report/SKILL.md` | Create (stub) |
| `tools/.gitkeep` | Create |
| `memory/.gitkeep` | Create |
| `workflow/.gitkeep` | Create |
| `hitl/.gitkeep` | Create |
| `artifacts/**/.gitkeep` | Create (4 subdirs) |

---

## What This Unlocks

- Single plugin entry for all Phase 1 work
- Human skills wired and usable immediately
- Artifacts layer ready for agents (F01 onward)
- F03 Skills System design can reference this as the canonical CLI layer
- Milestone 1 build can start (plugin = foundation)

## What Comes After

Track 2 complete → **Milestone 1 build** begins:
- F08 Model Routing implementation
- F01 Agent Identity implementation  
- F02 Team Structure implementation

No Track 3. The "tracks" were a cleanup/setup phase. After Track 2, work transitions to the main Phase 1 feature builds.
