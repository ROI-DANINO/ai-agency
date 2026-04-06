---
status: locked
date: 2026-04-06
updated: 2026-04-06
---

# F03 Skills System — Design

Two outputs:
1. **Skill file format** — frontmatter schema, injection model, chaining
2. **Artifact formats** — briefing-pack, handoff, decision-report

---

## Part 1: Skill File Format

### Skill Types

| Type | Who invokes | How |
|---|---|---|
| `human` | Human via `/skill-name` | Slash command or explicit invoke |
| `agent` | Agent programmatically | `invoke_skill(name)` in agent runtime |
| `behavior` | Runtime, auto-injected | Appended to agent system prompt at session start |

### Frontmatter Schema

```yaml
---
# Required
name: skill-name              # letters, numbers, hyphens only
description: >                # triggers and conditions only — not workflow summary
  Use when...
type: human | agent | behavior

# Required for behavior skills
inject-at: start | end        # where to append in the system prompt

# Optional
user-invocable: true | false  # default true for human, false for agent/behavior
status: active | stub | deprecated
version: 1.0.0                # semver; bump on every change

# Multi-step (optional — for complex workflow skills only)
multi-step: true              # declares that this skill uses step-file architecture
steps-dir: steps/             # relative to skill directory; default is steps/

# Chaining
calls: [skill-name, ...]      # skills this skill explicitly invokes
next: skill-name              # natural continuation after this skill completes
reads: [artifact-type, ...]   # artifact types this skill expects as input
output: artifact-type         # artifact type this skill writes (if any)

# Scoping (Phase 2 — web platform)
# scope: workspace | group | agent
---
```

**Required fields:** `name`, `description`, `type`
**Required for behavior:** `inject-at`
**All others:** optional

### Injection Model

Three ways a skill enters an agent's context:

**1. Explicit placeholder** — in a system prompt template:
```
{{skill:briefing-pack}}
```
Resolved at agent spawn time. The skill content replaces the placeholder verbatim.

**2. Auto-inject (behavior skills only)** — appended to the agent's base system prompt.
- `inject-at: start` — prepended before role instructions
- `inject-at: end` — appended after role instructions
- Order within each position: alphabetical by skill name (stable, deterministic)

**3. Named invocation** — human types `/skill-name` or agent calls `invoke_skill("skill-name")`. Skill content is injected into the current turn.

### Chaining Model

Chains are declared in frontmatter — machine-readable, not prose:

```yaml
# Skill A declares it writes a handoff and the next step is skill B
output: handoff
next: briefing-pack

# Skill B declares it reads a handoff
reads: [handoff]
```

The runtime enforces this: if skill B is invoked and no handoff artifact is present in `artifacts/handoffs/`, the runtime surfaces a warning before proceeding.

Skill chains are linear for Phase 1. DAG-style skill dependencies come with F07 Workflow Engine.

### Versioning

- Skills are **never mutated in place**. Every change = new version bump in frontmatter.
- Git is the version history for Phase 1. No separate versioning system.
- `status: deprecated` marks a skill as retired — runtime warns if invoked.
- Phase 2 (Feature 12 web platform): skills sync to DB with `SkillVersion` records.

### Conflict Resolution (Behavior Skills)

Two behavior skills can declare contradictory rules. Resolution:
- Skills listed earlier in an agent's `behavior-skills` array take precedence.
- Conflicts are flagged by skill-scan at deploy time, not silently resolved at runtime.

### Token Budget

- **Soft limit:** 2000 tokens (~1500 words) per skill file.
- **Hard limit:** Enforced at injection time — skills exceeding 3000 tokens are rejected with an error.
- Heavy reference material (API docs, large tables) goes in a sibling file linked from SKILL.md, not inline.
- Skill navigator loads descriptions only; full skill content loads on demand.
- Complex multi-step skills that would exceed this limit use the step-file architecture below.

### Multi-Step Skill Architecture

For complex workflow skills (e.g., `feature-design`, `session-end`, `project-brief`), procedure is extracted out of SKILL.md entirely. This is structural — SKILL.md cannot grow because it has nowhere to put procedure.

**Directory layout:**

```
skills/human/feature-design/
  SKILL.md       # frontmatter only — structurally cannot contain procedure
  workflow.md    # procedure overview + step routing
  steps/
    step-01.md   # loaded when step 1 begins
    step-02.md   # loaded only after step 1 completes
    step-03.md
```

**SKILL.md for a multi-step skill:**
- Frontmatter only. One line of body: `Follow workflow.md.`
- Always tiny. Presence of `workflow.md` in the directory is the signal this is a complex skill.

**workflow.md:**
- Contains the full procedure overview and routes to step files.
- Can be read to understand the whole skill without loading any step files.
- Declares which step to load first; each step declares the next.

**Rules:**
- Only the current step file is in context. Never load future steps until the current step completes.
- State is tracked via `stepsCompleted: [1, 2]` in the output artifact's frontmatter (if the skill produces one), or in the session context.
- Each file (workflow.md, step files) has its own 3000-token hard limit.
- When a skill grows from simple to complex: extract SKILL.md procedure into workflow.md + steps/. SKILL.md is not touched.

**When to use:**
- Multi-step is opt-in. Only declare it when a skill genuinely needs more than one sequential phase.
- Simple skills stay as a single SKILL.md. Don't over-engineer.
- Indicator: if a skill has more than ~4 sequential phases that each need significant instruction, use workflow.md + steps/.

**HALT conditions:**
Any step file (or workflow.md) may declare a HALT — a point where the skill cannot proceed without human input. Format:

```markdown
**HALT:** [one-sentence reason the agent cannot proceed]
**Needs:** [what the human must provide or decide]
**Resume:** [what to do after the human responds]
```

HALTs are the skill-level equivalent of HITL gates in F09. They surface decisions that are too significant to assume.

### On-Demand Skill Loading (`skill://`)

Skills are not all pre-loaded into context. The system uses lazy loading:

- `skill://name` is an internal URL that resolves to the full content of a skill file on demand.
- The system prompt lists skill names + descriptions only. Full content fetched via `skill://` when needed.
- This mirrors the rulebook pattern: the agent knows what skills exist and what they're for; it fetches content only when it needs to execute one.

This is the primary mechanism for token efficiency across the skill system.

---

## Part 2: Artifact Formats

Artifacts are structured markdown files written by skills and read by subsequent skills or the human. They live in `artifacts/` at repo root, never in `skills/` or `docs/`.

```
artifacts/
  briefing-packs/
  handoffs/
  decision-reports/
```

Naming convention: `YYYY-MM-DD-{context}.md` — always prefixed with date for sort order.

---

### briefing-pack

**Written by:** Orchestrator or Lead agent before dispatching a sub-agent  
**Read by:** The receiving agent at session/task start  
**Skill:** `skills/agent/briefing-pack/SKILL.md`  
**Path:** `artifacts/briefing-packs/YYYY-MM-DD-{agent}-{task-id}.md`

```markdown
# Briefing Pack — {Agent Name} / {Task Name}
Date: YYYY-MM-DD
Agent: {agent-name}
Task: {task-id}
Role: {agent role — e.g. "Dev Lead"}

## Task
{Task description. Scope and expected output in 2–4 sentences.}

## Context
{Relevant memory entries from Mem0 query. Only what's needed — not everything.}

## Key References
- `{file-path}`: {why it's relevant}
- `{doc-url}`: {why it's relevant}

## Team State
{Who is working on what. Escalation path. Blockers.}

## Predecessor Handoffs
{Links to handoff artifacts from agents whose work this task depends on.
If none: "None — this is the first task in the chain."}

## Constraints
- Token budget: {N tokens for this task}
- Tools available: {list}
- Deadline: {blocking | non-blocking}
```

---

### handoff

**Written by:** Agent completing a task segment  
**Read by:** The next agent in the chain  
**Skill:** `skills/agent/handoff/SKILL.md`  
**Path:** `artifacts/handoffs/YYYY-MM-DD-{from}-to-{to}-{task-id}.md`

```markdown
# Handoff — {from-agent} → {to-agent}
Date: YYYY-MM-DD
From: {agent-name}
To: {agent-name}
Task: {task-id}

## Completed
- {What was done. Include file paths and any decisions made.}

## Remaining
- {What still needs to happen — scoped to this task chain, not the whole project.}

## Open Questions
- {Questions the receiving agent must resolve before proceeding.}

## Context
{Anything the next agent needs that won't be in their briefing pack.
Keep it short — the briefing pack carries the bulk context.}

## First Action
{One concrete suggested first action for the receiving agent.}
```

---

### decision-report

**Written by:** Lead or Orchestrator agent at a HITL gate  
**Read by:** Human  
**Skill:** `skills/agent/decision-report/SKILL.md`  
**Path:** `artifacts/decision-reports/YYYY-MM-DD-{feature}-{slug}.md`

```markdown
# Decision Report — {Feature} / {Decision Topic}
Date: YYYY-MM-DD
Requires: human approval
Blocks: {what work is blocked until this resolves}
Deadline: urgent | non-blocking

## The Decision
{One clear question. One sentence.}

## Context
{What led here. What was tried. What's known. 3–5 sentences.}

## Options

### Option A: {Name}
{Description — what this means in practice.}
**Tradeoffs:** {pros / cons}

### Option B: {Name}
{Description.}
**Tradeoffs:** {pros / cons}

## Recommendation
{Lead agent's recommendation, with one-sentence rationale.
If no recommendation: "No preference — both options are viable."}

## Impact
{What changes — in code, in schedule, in architecture — depending on the answer.}
```

---

## Open Questions — Resolved

| Question | Decision |
|---|---|
| Flat files vs. DB? | Flat markdown for Phase 1 CLI; DB in Phase 2 (Feature 12) |
| Skill versioning in CLI? | Frontmatter `version` field + git history. No separate system. |
| CLI ↔ web sync? | Defer to Feature 12. CLI is source of truth for Phase 1. |
| Skill marketplace? | Defer to Phase 2. |
| Skill navigator routing? | Keywords + trigger phrases in `description`. skills-map.md is the index. Pattern matching, no ML for Phase 1. |
| Behavior skill conflicts? | Explicit precedence via array order. Flagged by skill-scan at deploy, not silently resolved at runtime. |
| Max skill size? | Soft 2000 tokens, hard 3000 tokens. Reference material in sibling files. Complex workflows use step-file architecture. |
| Single-file vs. step-file for complex skills? | Structural separation: simple skills = SKILL.md only. Complex skills = SKILL.md (frontmatter only) + workflow.md + steps/. The presence of workflow.md is the signal. `multi-step: true` in frontmatter declares it. Migration path: extract procedure into workflow.md + steps/ without touching SKILL.md. |
| How are skills loaded into context efficiently? | `skill://name` on-demand protocol. System prompt lists names+descriptions only; full content fetched lazily. |
| Trigger-based (TTSR-style) injection? | Deferred to Phase 2. Adds meaningful complexity; behavior skills cover the always-on case for Phase 1. |

---

## What's Not in Phase 1

- Skill scope badges (workspace / group / agent) — Feature 12
- Live preview of resolved system prompts — Feature 12
- Public marketplace / registry — Phase 2
- DAG-style skill chains — Feature 07
- Web-to-CLI skill sync — Feature 12
- Trigger-based (TTSR-style) mid-session skill injection — Phase 2
