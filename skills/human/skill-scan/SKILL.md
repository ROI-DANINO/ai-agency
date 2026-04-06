---
name: skill-scan
description: >
  Full skill audit — finds issues in the skills surface, writes a report to data/.
  Triggers on: "skill scan", "audit skills", "what skills are broken", "skill audit",
  "/skill-scan"
type: human
user-invocable: true
---

# Skill Scan — Skill Health Audit

Audits the ai-org skills surface for consistency, coverage, and broken registrations.

## Step 1 — Inventory

Collect two lists:

**A. Files on disk**
All `SKILL.md` files under `skills/` in the repo. For each, record:
- Path (e.g. `skills/human/project-brief/SKILL.md`)
- Name from frontmatter `name:` field
- Type: human | agent
- Whether it's in `skills/archive/`

**B. Registry entries**
All entries in `skills-map.md`. For each table row, record:
- Skill name
- Table section (Session Start, Session Close, etc.)

## Step 2 — Cross-check

Find:

1. **Unregistered skills** — in `skills/` on disk but NOT in `skills-map.md`
2. **Ghost entries** — in `skills-map.md` but no matching `SKILL.md` on disk
3. **Archive leaks** — skills in `skills/archive/` that are still in `skills-map.md` (should be removed)
4. **Missing name field** — `SKILL.md` files without a `name:` in frontmatter
5. **Stub skills** — `SKILL.md` files with `status: stub` in frontmatter (note but don't flag as broken)

## Step 3 — Write Report

Create `data/skill-audit-YYYY-MM-DD.md`:

```markdown
# Skill Audit — YYYY-MM-DD

## Summary
- Total skills on disk: N (human: N, agent: N, archive: N)
- Registered in skills-map.md: N
- Issues found: N

## Issues

### Unregistered Skills (on disk, not in registry)
- {path} — {action needed: add to skills-map.md or move to archive}

### Ghost Entries (in registry, no file)
- {skill name} — {action needed: create SKILL.md or remove from registry}

### Archive Leaks
- {skill name} — {action needed: remove from skills-map.md}

### Missing Name Field
- {path} — {action needed: add name: to frontmatter}

## Stubs (not issues, noted for awareness)
- {skill name} — stub, pending full implementation

## No Action Needed
{List of skills that are healthy}
```

## Step 4 — Output

Print a one-line summary: "Skill scan complete — N issues found. Report: data/skill-audit-YYYY-MM-DD.md"

If 0 issues: "Skill scan complete — all skills healthy."
