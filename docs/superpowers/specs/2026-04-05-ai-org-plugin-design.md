# Design — ai-org Claude Code Plugin (Skills Track 2)
Date: 2026-04-05

## Summary

The ai-org repo IS the Phase 1 CLI plugin product. The repo reorganizes around a
concern-grouped structure that communicates the system's mental model. Source files
live in the repo; a `deploy.sh` script copies runtime dirs to
`~/.claude/aios-plugins/plugins/ai-org/`. One plugin entry replaces the current
scattered `@aios` entries.

---

## Repo Structure

```
ai-org/
  manifest.yaml          ← plugin identity, version, runtime dir list
  deploy.sh              ← copies runtime dirs to ~/.claude/aios-plugins/plugins/ai-org/
  skills-map.md          ← plugin-level skill index (root, deployed)

  agents/                ← agent identity configs, role profiles, team definitions
  skills/                ← all skills: human-facing, agent-internal, and archive
  tools/                 ← tool definitions agents can call
  memory/                ← memory patterns, briefing pack templates
  workflow/              ← workflow configs, DAG templates
  hitl/                  ← decision report templates, approval patterns
  artifacts/             ← MD-file runtime communication layer

  docs/                  ← design docs, vision, feature map (NOT deployed)
  journal/               ← session journal entries (NOT deployed)
  data/                  ← session data, notes (NOT deployed)
  .project-session/      ← session logs (NOT deployed)
  CLAUDE.md              ← NOT deployed
  TASKS.md               ← NOT deployed
  README.md              ← NOT deployed
```

---

## Skills Surface

Skills split into two groups by who invokes them.

```
skills/
  human/                 ← user-invocable; appear in the / menu
    project-brief/       ← session start, project orient, phase workflow
    session-end/         ← session close, journal entry, handoff prompt
    task-sync/           ← manual TASKS.md sync (also called internally)
    capture/             ← mid-session decision/question capture [TODO]
    feature-design/      ← focused design session for a feature phase [TODO]
    skill-scan/          ← skill health audit

  agent/                 ← internal; invoked by skills or agents, not humans
    briefing-pack/       ← builds a context pack for an agent before a task
    handoff/             ← writes a handoff artifact when work transfers
    decision-report/     ← structures a HITL decision surface for the human
    (more added as F01–F09 build out)

  archive/               ← retired skills; never deleted, just moved here
```

**Rule:** Nothing lives in `skills/` that is not registered in `skills-map.md`.
`skill-scan` enforces this. Unregistered skills do not exist from the plugin's
perspective.

**task-sync:** Lives in `skills/human/`. Human-invocable and also called internally
by `project-brief`. Same skill file, two entry points. Not a separate plugin concern.

---

## Artifacts Layer

The agent-to-agent communication layer. Agents write MD files; the next agent reads
them. No ephemeral state passing, no reliance on chat history.

```
artifacts/
  briefing-packs/        ← context package written before an agent starts a task
    YYYY-MM-DD-{agent}-{task}.md
  handoffs/              ← what one agent passes to the next when work transfers
    YYYY-MM-DD-{from}-to-{to}-{task}.md
  decision-reports/      ← HITL surfaces waiting for human input
    YYYY-MM-DD-{feature}-{decision}.md
  session/               ← per-session scratchpad (cleared on session-end)
    current-context.md
```

**Deployed as empty scaffold.** Templates live in `memory/`. Actual artifacts are
written at runtime inside `~/.claude/aios-plugins/plugins/ai-org/artifacts/`.

**Distinct from TASKS.md.** Artifacts are ephemeral and task-scoped. TASKS.md is
persistent project state, governed by `task-sync`, lives at root. They operate at
different scopes but share the same MD-file communication philosophy.

---

## Deploy Mechanism

**`manifest.yaml`:**

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

**`deploy.sh`:**

```bash
#!/bin/bash
PLUGIN_DIR="$HOME/.claude/aios-plugins/plugins/ai-org"
DIRS=(agents skills tools memory workflow hitl artifacts)

mkdir -p "$PLUGIN_DIR"
for dir in "${DIRS[@]}"; do
  rm -rf "$PLUGIN_DIR/$dir"
  cp -r "$dir" "$PLUGIN_DIR/$dir"
done
cp manifest.yaml skills-map.md "$PLUGIN_DIR/"
echo "ai-org plugin deployed → $PLUGIN_DIR"
```

**`settings.json` change:**

The current scattered plugin entries are replaced with a single entry:

```json
"enabledPlugins": {
  "ai-org@ai-org": true
}
```

Remove: `project-brief@aios`, `session-end@aios` (and any other skills migrated into
the unified plugin).

**When to deploy:** Any time a skill file changes. Later can be wired to a git hook.
Explicit for now.

---

## Governance

**Adding a skill:**
1. Create `skills/human/{name}/SKILL.md` or `skills/agent/{name}/SKILL.md`
2. Add entry to `skills-map.md`
3. Run `deploy.sh`

**Retiring a skill:**
1. Move to `skills/archive/{name}/`
2. Remove from `skills-map.md`
3. Run `deploy.sh`

**Versioning:**
`manifest.yaml` version bumps manually when something meaningful ships. No ceremony —
`0.1.0 → 0.2.0` when a phase completes.

---

## What This Unlocks

- Single plugin entry for the entire Phase 1 product
- Clean separation between runtime (deployed) and project housekeeping (not deployed)
- Artifacts layer is in place before agents exist — the communication pattern is ready
- `capture` and `feature-design` skills are designed, ready to build
- F03 Skills System design can reference this as the CLI layer pattern
