# Session Orient — F07 Ready, claude-peers and OpenViking triaged
Date: 2026-04-07 · 13:10 IL
Type: decision

## What Happened
Short orientation session. Reviewed project state post-F03 merge. Two open threads were triaged and closed, clearing the path to F07 design.

First: claude-peers MCP in the session environment. Confirmed it provides no value for solo work — the `set_summary` / `send_message` calls in session-start flows are noise. No skills actually call claude-peers; it was being called on initiative. Decision: skip all claude-peers MCP calls going forward. The "claude-peers-mcp fork" as an F01 build target is unaffected — that's a separate thing.

Second: OpenViking (`github.com/volcengine/OpenViking`), a file-system-based memory/context model for AI agents. The correlation to claude-peers was explored: OpenViking could serve as a passive communication channel through shared memory (Agent A writes, Agent B loads subtree), but can't replace live coordination. More importantly, its patterns closely match what `.mesh/` is already doing informally — making it relevant to F05 Memory design, not now. Brainstorm deferred until after F07, when mesh feed write patterns are locked.

## Decisions Made
- **Skip claude-peers MCP calls in session flows** — why: solo project, no second Claude instance to coordinate with; pure noise.
- **OpenViking brainstorm deferred to F05** — why: F07 defines mesh feed write patterns, which shapes what "structured context" means; brainstorming now would be on unstable ground.

## Open Questions
- None.

## What's Next
Start F07 Workflow Engine design session — define the async workflow model, Orchestrator protocol, LangGraph StateGraph structure, HITL gate points, and task manifest format.
