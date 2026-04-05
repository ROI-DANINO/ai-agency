# Plan B — Phase 1 .md Communication Mesh
**Follows:** `specs/2026-04-05-agent-hierarchy-design.md`  
**Depends on:** Plan A (agent identities must exist before mesh profiles can be created)  
**Status:** Ready to execute after Plan A  
**Session note:** Needs a refinement sprint before building — read spec section on mesh first.

---

## Goal

Build the file-based communication layer. By end of this plan:
- Every persistent agent has a profile, journal, inbox, and outbox
- Channels exist for cross-team communication
- Session start/end protocol is defined and agents follow it
- The mesh is readable by any Claude Code instance

---

## Steps

### 1. Refinement sprint — nail the file schema

Before writing any files, lock the exact format for each file type. One session, one output: `docs/features/02-team-structure/mesh-schema.md`.

Decisions to make in that session:
- What fields does `profile.md` contain? (id, role, tier, status, last-active, owned-tasks)
- What is the append format for `inbox.md` and `outbox.md`? (timestamp, from, to, subject, body)
- What is the journal entry format? (date, summary, decisions-made, handoffs-written)
- Channel format — same as inbox or different?

### 2. Create the .mesh/ directory structure

```
.mesh/
  agents/
    op/
    dev-lead/
    pm-lead/
    ux-lead/
    security-lead/
    devops-lead/
    quality-lead/
    recruitment-lead/
    knowledge-lead/
    operations-lead/
    architect/
    cso-auditor/
    standards-keeper/
  channels/
    #general.md
    #dev.md
    #pm.md
    #security.md
    #decisions.md    ← all escalated decisions logged here
    #ops.md
  dms/              ← created on first use
```

Each agent directory gets: `profile.md`, `journal.md`, `inbox.md`, `outbox.md`.

### 3. Populate profile.md for all persistent agents

Each profile contains:
- Agent ID, display name, role
- Department, model tier
- Current status (active / idle / suspended)
- Last active timestamp
- What this agent owns
- What this agent never does

### 4. Write session start/end protocol as a skill

Create `.claude/skills/mesh-session.md`:

**Session start:**
1. Read `inbox.md` — process any new messages
2. Read `journal.md` (last 3 entries) — restore context
3. Read relevant `#channel.md` for department updates

**Session end:**
1. Write journal entry (summary, decisions, handoffs)
2. Write outbox entries for any messages sent this session
3. Update `profile.md` last-active timestamp
4. Write to channel files if broadcasting

### 5. Add .mesh/ to .gitignore or track selectively

Decision: track `profile.md` files in git (stable, versioned), gitignore `inbox.md`/`outbox.md`/`journal.md` (high-churn, personal to agent).

---

## Done When

- [ ] Schema doc written and approved
- [ ] .mesh/ directory structure created
- [ ] All persistent agent profiles populated
- [ ] Session protocol skill written
- [ ] .gitignore updated
