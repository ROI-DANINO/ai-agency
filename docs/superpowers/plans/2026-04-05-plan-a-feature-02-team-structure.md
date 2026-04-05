# Plan A — Feature 02: Team Structure & Hierarchy
**Follows:** `specs/2026-04-05-agent-hierarchy-design.md`  
**Status:** Ready to execute  
**Session note:** Work this plan in its own session. Read the spec first.

---

## Goal

Implement the agent hierarchy as designed. By end of this plan, the system has:
- A defined 3-tier structure in code/config
- All protected leads configured
- Roi's Phase 1 roster configured for ai-org
- Agent identity files for each persistent agent
- Tier routing rules wired to Feature 08 (LiteLLM)

---

## Prerequisites

- Feature 01 (Agent Identity) — BUILDING. Must be complete before this plan executes.
- Feature 08 (Model Routing) — DESIGNED. LiteLLM config must exist.

---

## Steps

### 1. Define agent identity files for all persistent agents

For each persistent lead and tenure worker, create an agent definition file:

```
.claude/agents/
  op.md                    ← Operator
  leads/
    dev-lead.md
    pm-lead.md
    ux-lead.md
    security-lead.md
    devops-lead.md
    quality-lead.md
    recruitment-lead.md    ← protected
    knowledge-lead.md      ← protected
    operations-lead.md     ← protected
  tenure/
    architect.md           ← Dev dept tenure worker
    cso-auditor.md         ← Security dept tenure worker
    standards-keeper.md    ← Quality dept tenure worker
```

Each file contains: role, persona, model tier, department, what it owns, what it never does, escalation rules, tool permissions.

### 2. Define tier assignments in LiteLLM config

Extend the existing `litellm-config.yaml`:

```yaml
# Add role → tier mapping
role_tier_map:
  op: tier2
  dev-lead: tier2
  pm-lead: tier2
  ux-lead: tier2
  security-lead: tier2
  devops-lead: tier2
  quality-lead: tier2
  recruitment-lead: tier2
  knowledge-lead: tier2
  operations-lead: tier2
  architect: tier2           # tenure worker
  cso-auditor: tier3         # tenure worker — security needs Tier 3
  developer: tier2           # task-scoped
  qa: tier3                  # task-scoped — final QA = Tier 3
  researcher: tier1          # task-scoped — research = Tier 1
  pen-tester: tier3          # task-scoped
```

### 3. Define the protected lead configs

Mark Recruitment, Knowledge, and Operations leads as `protected: true` in their agent definition frontmatter. The system must refuse to delete or disable these.

### 4. Define Roi's Phase 1 roster config

Create `config/phase1-roster.yaml`:

```yaml
# ai-org Phase 1 agent roster
workspace: ai-org
phase: 1

protected_leads:
  - recruitment-lead
  - knowledge-lead
  - operations-lead

recruited_leads:
  - dev-lead
  - pm-lead
  - ux-lead
  - security-lead
  - devops-lead
  - quality-lead    # recommended, not protected
```

### 5. Wire escalation protocol

Define conflict escalation rules in `config/escalation.yaml`:

```yaml
circuit_breaker:
  max_lateral_messages: 5      # leads auto-escalate to OP after this
  
task_status_values:
  - pending
  - in_progress
  - blocked          # waiting on dependency
  - conflicted       # lead disagreement, escalate to OP
  - decision_required # OP escalates to Admin
  - complete

escalation_chain:
  conflicted: op
  decision_required: admin
```

### 6. Close open questions in Feature 02 README

Update `docs/features/02-team-structure/README.md`:
- Mark all open questions as resolved
- Add session notes with locked decisions
- Update status from PLACEHOLDER → DESIGNED

---

## Done When

- [ ] All persistent agent `.md` files exist with complete role definitions
- [ ] Tier assignments wired in LiteLLM config
- [ ] Protected leads marked and enforced
- [ ] Phase 1 roster config file exists
- [ ] Escalation config defined
- [ ] Feature 02 README updated to DESIGNED
