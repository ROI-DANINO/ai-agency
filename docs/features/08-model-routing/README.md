# Feature 08 — Model Routing

**Status:** PLACEHOLDER  
**Phase:** 1 — Foundation  
**Layer:** Cross-layer (infrastructure)  
**Priority:** Critical  
**Depends on:** Nothing — this is infrastructure

---

## Vision

The right model for the right job at the right cost. The system automatically routes tasks to the appropriate model tier without the human having to think about it. Swapping models requires zero code changes.

---

## Core Concept

LiteLLM acts as a universal proxy. Every agent call goes through LiteLLM, which routes to the correct provider (OpenRouter, Anthropic, OpenAI, Ollama, etc.) based on the model name. The platform defines three tiers, and roles are assigned to tiers. The human can override any routing decision.

```
Agent makes LLM call
    ↓
LiteLLM proxy
    ↓
Route by tier assignment
    ↓
Tier 1: OpenRouter → Qwen / GLM / Kimi
Tier 2: OpenRouter → Nemotron / Haiku / GPT-4o-mini
Tier 3: Anthropic → Sonnet/Opus | OpenAI → GPT-4o
```

---

## Key Capabilities

- LiteLLM as universal model proxy — one API, all providers
- Three-tier routing: Tier 1 (cheap/Chinese), Tier 2 (mid/fast), Tier 3 (premium)
- Role-to-tier assignment: Orchestrator = Tier 2 (Qwen 3.6), Leads = Tier 2 (Nemotron), Sub-agents = Tier 1 or 3 depending on task
- Task-type routing — complex coding escalates to Tier 3 automatically
- Human override — manually force a specific model for any run
- Fallback chains — if primary model is unavailable, fall back to next in tier
- Cost tracking — log tokens and estimated cost per run per tier
- Cost alerts — configurable spend thresholds
- Model comparison runs — same task, two models, compare outputs (for evaluation)

---

## Tier Assignment

| Role | Default Tier | Model |
|---|---|---|
| Orchestrator | Tier 2 | Qwen 3.6 (via OpenRouter) |
| All Team Leads | Tier 2 | Nemotron (via OpenRouter) |
| Research sub-agents | Tier 1 | Kimi (long context), GLM, Qwen |
| Dev sub-agents (standard) | Tier 2 | Nemotron, Claude Haiku |
| Dev sub-agents (complex/critical) | Tier 3 | Claude Sonnet/Opus |
| QA / final review | Tier 3 | Claude Sonnet, GPT-4o |
| Marketing sub-agents | Tier 1–2 | Qwen, GPT-4o-mini |
| Security audit | Tier 3 | Claude Opus, GPT-4o |

---

## Open Questions

- [ ] Where is LiteLLM deployed — local sidecar process, or hosted?
- [ ] How does tier escalation work mid-task — can an agent request Tier 3 for a specific subtask?
- [ ] Cost tracking storage — log to file, SQLite, or Supabase?
- [ ] How are API keys managed — .env file, secrets manager, or per-workspace in web platform?
- [ ] Fallback strategy — same tier different model, or downgrade tier?
- [ ] Should model selection be configurable per-workspace (different clients = different budgets)?
- [ ] How does the human override model routing — CLI flag, skill invocation, or web UI?

---

## Considerations

- LiteLLM is the key to model agnosticism. Without it, swapping models requires code changes everywhere. Install it early, before any agent code is written.
- OpenRouter gives access to Qwen, Nemotron, Kimi, GLM, and dozens of others through a single API key. Use it for Tier 1 and Tier 2.
- The tier strategy should be conservative: default to Tier 2, escalate to Tier 3 only when task type explicitly requires it. This keeps costs predictable.
- "Manus" mentioned in Tier 3 context — clarify whether this refers to a model or an agent system. As of April 2026, Manus is an agent platform, not a model.

---

## OSS & References

- **OSS:** LiteLLM — `pip install litellm` — universal proxy, drop-in OpenAI-compatible API
- **OSS:** OpenRouter — model gateway (access Qwen, Nemotron, Kimi, GLM via one API key)
- **Reference:** Architecture doc — tier assignment table

---

## Dependencies

None. This is infrastructure that everything else depends on.

---

## Session Notes

### Orient — 2026-04-02
All 7 open questions identified. 4 answered, 3 parked for design phase.

**Answered:**
- LiteLLM deployment: local process (sidecar) for Phase 1
- Cost tracking: Supabase
- API keys: .env Phase 1, Infisical Phase 2
- Per-workspace: single workspace Phase 1; telemetry is a future research track

**Parked for Design Phase:**
- Mid-task tier escalation mechanism (user wants to understand options first)
- Fallback strategy (leaning same-tier first then escalate — not locked)
- Human override mechanism (CLI flag + skill + web UI all seem relevant)

**Notes:**
- Remove "Manus" from tier table — it's an agent platform, not a model
- Present escalation and override as options with examples, not just a recommendation
