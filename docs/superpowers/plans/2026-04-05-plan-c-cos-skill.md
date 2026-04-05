# Plan C — Chief of Staff (CoS) Skill on OP
**Follows:** `specs/2026-04-05-agent-hierarchy-design.md`  
**Depends on:** Plan A (OP agent must exist), Plan B (mesh must exist — CoS reads from #decisions channel)  
**Status:** Needs design session before building  
**Session note:** CoS is marked "needs further design" in the spec. Run a design session first.

---

## Goal

Design and implement the CoS skill. By end of this plan:
- CoS skill exists as a `.md` skill file on OP
- OP invokes CoS after receiving lead outputs
- CoS produces a structured decision report for Admin
- Blocking vs non-blocking decisions are classified correctly

---

## Design Session First (before building)

These questions must be answered before a line is written:

1. **What triggers CoS?** OP receives output from a lead → always runs CoS? Or only when `status: decision_required`?
2. **What does CoS read?** Raw lead outputs only? Or also channel logs, #decisions history?
3. **What is the decision report format?** (header, summary, decision items, non-blocking flags, recommended next action)
4. **How does CoS classify blocking vs non-blocking?** Rule-based (based on task_type)? Or does CoS reason about it?
5. **Token budget for CoS?** It reads potentially large lead outputs — how do we keep it efficient?

---

## Steps (after design session)

### 1. Write the CoS skill file

`.claude/skills/cos-report.md`

The skill instructs OP how to:
- Collect lead outputs into a structured context block
- Identify decision points (items with `status: decision_required`)
- Classify each as blocking (pipeline halts) or non-blocking (safe default, flagged for review)
- Format the final decision report

### 2. Define the decision report format

```markdown
# Decision Report — {date} {time}

## Summary
{1-3 sentence company status}

## Decisions Required (Blocking)
- [ ] {decision}: {context} | Options: A / B | Recommended: A
- [ ] ...

## Flagged for Review (Non-Blocking)
- {item}: proceeded with {safe default} | Review when available

## In Progress (No Action Needed)
- {task}: {lead} working, ETA {n/a or estimate}
```

### 3. Wire CoS into OP's workflow

In OP's agent definition, add CoS as a post-routing step:

```
OP receives lead output
  → if status is decision_required: invoke cos-report skill
  → CoS generates report
  → Report written to Admin inbox (.mesh/agents/admin/inbox.md)
  → Report also logged to .mesh/channels/#decisions.md
```

### 4. Test with a real scenario

Run a simulated task where two leads produce outputs, one conflicted. Verify:
- CoS produces a clean, readable report
- Blocking decision is flagged correctly
- Admin inbox receives the report
- OP does not make the decision itself

---

## Done When

- [ ] Design session complete, all 5 questions answered
- [ ] `cos-report.md` skill written
- [ ] Decision report format defined
- [ ] OP workflow updated to invoke CoS
- [ ] Tested with simulated conflict scenario
