# Completeness Review — Phase 1 Build-to-Date
Date: 2026-04-07
Type: gap analysis

## Summary

Phase 1 · M2 · Executable. Features built: F01, F02, F03, F07 (75 tests). Features designed only: F08. Next: F09 HITL Reporting.

This review covers two passes:
- **B — Feature-by-feature gap scan:** what each feature left out, stubbed, or left unconnected
- **A — Critical path trace:** following the actual runtime path from `aios run-workflow` to a surfaced HITL decision, noting every gap along the way

---

## B — Feature-by-Feature Gap Scan

### F08 Model Routing — DESIGNED, never built
- Zero LiteLLM code exists anywhere in the codebase
- `orchestratorNode` has an inline comment: *"Replace with LLM call once F08 model routing is wired"*
- Stub manifest hardcodes `model: auto` / `runtime: auto` — these strings are passed to MockHermesClient and ignored
- All agent dispatch is effectively model-unaware until F08 is built

### F01 Agent Identity — status drift
- FEATURE-MAP says `BUILDING`. TASKS.md says complete. Should be `BUILT`.
- `profile.ts` and `connect` command are real and working
- `toolPack` field is missing from `AgentProfile` — explicitly blocked in TASKS.md pending F07/F09 scope settlement
- `mesh_read` / `mesh_write` exist in the profile schema but have no enforcement code

### F02 Team Structure — status drift
- FEATURE-MAP says `DESIGNED`. TASKS.md says complete. Should be `BUILT`.
- `.mesh/` scaffold, `spawnedBy`/`scope`/`protected` fields, 7 lead symlinks — all real
- NATS is in the OSS stack but not wired. The "team" is profiles and a directory; agents don't actually message each other yet.

### F03 Skills System — status drift + injection gap
- FEATURE-MAP says `DESIGNED`. TASKS.md says complete. Should be `BUILT`.
- `skills.ts` is thorough: `resolveSkillPath`, `resolveSkillPack`, `validateChains`, token budget enforcement, multi-step detection — all real
- **Injection seam missing:** `AgentProfile.skill_pack` is read and stored, but no code ever calls `resolveSkillPack()` at agent spawn time. Skills exist as a resolution system but are never injected into sessions.

### F07 Workflow Engine — built, known stubs
- Real LangGraph graph, 5 working HITL gate formatters, SqliteSaver checkpointing wired
- Known stubs (by design for Phase 1):
  - `MockHermesClient` — always returns success immediately
  - `generateStubManifest` — hardcoded single-lead, no real LLM decomposition
  - MeshWatcher is wired but never meaningfully exercised (mock completes before chokidar fires)

---

## A — Critical Path Trace

> Entry point: `aios run-workflow "build me a feature"` → HITL decision surfaces to human

**1. MockHermes hardcoded** (`run-workflow.ts:29`)
`new MockHermesClient()` is hardcoded. The `--mock` flag defaults to `true`. No path exists to swap in a real Hermes client without a code change.

**2. No real task decomposition** (`nodes/orchestrator.ts:48`)
`generateStubManifest()` returns a hardcoded single-lead manifest. The task string is echoed verbatim as the lead's goal. No LLM call, no DAG.

**3. Fragile interrupt detection** (`run-workflow.ts:64–74`)
Interrupts are detected via `err.message.includes("interrupt")` in a try/catch on the stream. LangGraph JS doesn't guarantee this error shape — this may break on version changes or in non-error interrupt paths.

**4. Resume API is wrong** (`run-workflow.ts:52–53`) — **High severity**
Workflow resume passes:
```ts
compiled.stream({ type: "__resume__", data: resumeValue }, config)
```
The correct LangGraph JS resume API is `new Command({ resume: value })`. The current code likely restarts the graph from scratch on resume rather than continuing from the interrupt point. Every multi-interrupt workflow is potentially broken.

**5. MeshWatcher / MockHermes race** (`watcher.ts` + `hermes.ts`)
MockHermesClient writes to `.mesh/` synchronously and returns. The chokidar watcher fires asynchronously. In a real session the event would arrive before the watcher processes it. Low impact with mock, potentially a real ordering issue with a real Hermes.

**6. HITL surface is readline only**
All 5 gate types print to terminal and block on `readline.question()`. There's no structured output written, no webhook to n8n, no async notification path. This is F09's job — but F09 doesn't exist yet.

**7. No decision report artifact**
`hitl_log` on the manifest captures decisions in memory / SQLite. Nothing reads it to produce a structured report. The platform doesn't leave a record a human could review later.

---

## Fix Backlog

| # | Gap | Severity | When it bites | Suggested fix |
|---|---|---|---|---|
| 1 | LangGraph resume API wrong (`__resume__` vs `Command`) | **High** | Every multi-interrupt workflow right now | Replace stream call with `new Command({ resume: value })` per LangGraph JS docs; verify interrupt/resume tests cover full cycle |
| 2 | FEATURE-MAP statuses don't match reality (F01/F02/F03) | Medium | Skills read FEATURE-MAP for state; wrong status can mislead | Update F01 → `BUILT`, F02 → `BUILT`, F03 → `BUILT` |
| 3 | F08 never built — model routing is a no-op | Medium | F09 design, any real agent dispatch | Design + build F08 before or alongside any feature that needs real model selection |
| 4 | Skill injection seam missing — `skill_pack` not used at spawn | Medium | F04/F05 build, any real agent session | Wire `resolveSkillPack(profile.skill_pack, repoRoot)` into the agent spawn path |
| 5 | MockHermes hardcoded in `run-workflow.ts` | Medium | The moment a real Hermes client exists | Add `--hermes <path>` flag or env var; make client injectable |
| 6 | `toolPack` missing from `AgentProfile` | Low | F04 (Tools Layer) build | Add `tool_pack: string[]` to profile frontmatter schema + `AgentProfile` type |
| 7 | NATS not wired — no agent messaging substrate | Low | F06 (Agent Communication) build | Out of scope until F06; note as F06 precondition |
| 8 | n8n not wired — HITL path is blocking readline | Low | F09 design | F09 spec should define the webhook contract; n8n wiring is F09 build work |
| 9 | `mesh_read`/`mesh_write` not enforced | Low | Any agent that should have scoped mesh access | Add enforcement at meshWatcher event dispatch; can be done in F09 or as a standalone patch |
