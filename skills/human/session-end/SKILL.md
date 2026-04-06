---
name: session-end
description: >
  Session close skill for the ai-org project. Writes a journal entry for
  meaningful work done, updates local session log, produces a handoff prompt
  for the next session.
  Triggers on: "end session", "wrap up", "close session", "I'm done",
  "handoff", "session end", "/session-end"
type: human
user-invocable: true
---

# Session End — Session Close

## Step 1 — Assess the Session

Review the conversation. Determine if meaningful work happened:
- A design decision was made or locked
- A plan was written
- Code was built or changed
- An open question was resolved
- A new open question was surfaced

If nothing meaningful happened (pure exploration, no decisions), skip journal and
go straight to Step 4.

## Step 2 — Write Journal Entry

Create a file at `journal/YYYY-MM-DD-{topic-slug}.md` where:
- `YYYY-MM-DD` = today's date
- `{topic-slug}` = 2–4 word kebab-case summary of the session topic

Use this structure:

```markdown
# {Title — what this session was about}
Date: YYYY-MM-DD
Type: decision | plan | build | exploration

## What Happened
1–3 paragraphs. What was the actual work. What changed. What was decided.
Be specific — someone reading this in 3 months should understand exactly what happened.

## Decisions Made
- **{Decision}** — why: {one sentence rationale}
(repeat for each meaningful decision)

## Open Questions
- {Question or unresolved item, if any}

## What's Next
What should happen next session, in 1–3 lines.
```

## Step 3 — Run task-sync

After journaling, run task-sync to update TASKS.md with the current state.
Clear `.tasks-dirty` if present.

## Step 4 — Handoff Prompt

Output a ready-to-paste handoff prompt for the next session:

```
---
HANDOFF — {date} — {topic}

Last session: {1 sentence summary}
State: {current phase/milestone}
Next: {top 1–2 items from TASKS.md Now}
Key files: {2–3 files most relevant to continue the work}
---
```

## Tone

Efficient. The journal is a record, not a narrative. Decisions and rationale,
not blow-by-blow. The handoff is for the next session's project-brief to consume.
