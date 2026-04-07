# F07 Spawning Model — Architecture Decision
Date: 2026-04-07 · 12:55 IL
Type: decision

## What Happened
Session oriented around Hermes's F03 work (uncommitted), verified it was clean (44/44 CLI tests passing), and resolved the one open question blocking F07 design: how sub-agent spawning works in the workflow engine.

Reviewed F07 design doc, ARCHITECTURE.md, and the "deterministic routing, non-deterministic reasoning" principle. Evaluated two options: LangGraph owning the full spawn tree vs. LangGraph owning only the Orchestrator→Lead layer with Hermes owning Lead→Sub-agent spawning.

Resolved the HITL visibility gap in the Hermes-managed layer: the mesh feed (built in F02) is the observability layer for sub-agent work. F09 HITL reads from the mesh feed, not just LangGraph state.

## Decisions Made
- **Option B adopted for F07** — LangGraph owns Orchestrator → Lead dispatch (parallel fan-out, HITL gates at lead level); Hermes owns Lead → Sub-agent spawn (dynamic, on demand inside each lead's node). Why: keeps LangGraph deterministic at the top without pre-defining every sub-agent in the graph; leads retain genuine autonomy over task decomposition.
- **Mesh feed is the F07 observability layer** — sub-agents document work to the mesh feed as they run; LangGraph does not need to track every sub-agent node. Why: .mesh/ scaffold already exists from F02; feeds naturally into F09 HITL reporting without coupling it to LangGraph state.
- **F07 open question resolved** — Hermes vs LangGraph spawning decision that was blocking F07 design is now locked.

## Open Questions
- None blocking F07 design.

## What's Next
F07 design session — define the async workflow model, Orchestrator protocol, LangGraph node graph, HITL gate points, and task manifest format (what a Lead writes before spawning sub-agents).
