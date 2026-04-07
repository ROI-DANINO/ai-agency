### [2026-04-07] — ai-org
after F07 (Option B: LangGraph + Hermes MCP), consider a forked Option A version — pure skill chain workflow, no LangGraph, sequential HITL-native feel

### [2026-04-07] — ai-org
next: brainstorm spec review for F07 design, then write implementation plan #next

### [2026-04-05] — ai-org
peer comms via claude-peers didn't land in the skills-cleanup session — user had to paste handoff manually. claude-peers message sending works but the receiving session may not surface it visibly enough. investigate or use a different handoff mechanism next time. #blocker

### [2026-04-05] — ai-org
Feature map, agent skills map, and tools map should all be managed by the same systematic mechanism behind the tasks manager — a unified apple-level product data management system. Everything that tracks project state lives under one coherent, token-efficient, auto-updating architecture. #direction #idea

### [2026-04-03] — ai-org
Skills & tools audit and organization (before Feature 01 Chat B) #next

### [2026-04-03] — ai-org
Chat C phase: Socratic exploration of OSS repos (pi-mono, oh-my-pi, BMAD-METHOD, hermes-agent, claw-code, tanbiralam/claude-code) — continue from Roi's perspective, no deep analysis first, let insights surface organically #next

### [2026-04-03] — ai-org
Socratic Explorer Skill concept for design/planning phase: Socratic teacher mode — guide through open-ended questions, never give direct answers/code/analysis first, let insights surface organically, start by asking what drew Roi to a project and how it might fit/clash with his vision #next

### [2026-04-07] — ai-org
Hermes as sub-agent runtime (Option B) deferred: need FastMCP bridge (~50 lines, F11 subset), NATS running, and Hermes profiles for leads. Design decision: does Hermes replace LangGraph for sub-agent spawning, or sit alongside it? Must decide before F07 design begins. #decision
