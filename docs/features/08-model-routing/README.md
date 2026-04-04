# Feature 08 — Model Routing

**Status:** DESIGNED  
**Phase:** 1 — Foundation  
**Layer:** Cross-layer (infrastructure)  
**Priority:** Critical  
**Depends on:** Nothing — this is infrastructure

---

## Vision

The right model for the right job at the right cost. Routing is invisible to the human and to agents — it just works. Swapping models or adjusting tiers requires zero code changes. Failures are handled gracefully. Cost is tracked and bounded.

---

## Architecture

LiteLLM runs as a local sidecar process. Every agent LLM call goes through it. LiteLLM routes to the correct provider based on a declarative config file. OpenRouter serves as the backend gateway for Tier 1 (Chinese) models, giving access to Kimi, GLM, and Qwen through a single API key. Anthropic is called directly for Tier 2 and Tier 3.

```
Agent LLM call (OpenAI format)
    ↓
LiteLLM sidecar (localhost:4000)
    ↓
  [routing logic in config.yaml]
    ├── Tier 1 → OpenRouter → Kimi / GLM / Qwen
    ├── Tier 2 → Anthropic → Claude Haiku (direct)
    └── Tier 3 → Anthropic → Claude Sonnet / Opus (direct)
    ↓
Token + cost logs → Supabase
```

LiteLLM and OpenRouter are complementary, not alternatives. OpenRouter provides model breadth for Tier 1. LiteLLM provides control, reliable fallback chains, local cost tracking, and budget enforcement — none of which OpenRouter alone can guarantee.

---

## Tier Assignment

| Role | Default Tier | Model |
|---|---|---|
| Operator (OP) | Tier 2 | Claude Haiku |
| All Team Leads | Tier 2 | Claude Haiku |
| Research sub-agents | Tier 1 | Kimi (long context), GLM, Qwen |
| Dev sub-agents (standard) | Tier 2 | Claude Haiku |
| Dev sub-agents (complex/critical) | Tier 3 | Claude Sonnet/Opus |
| QA / final review | Tier 3 | Claude Sonnet |
| Marketing sub-agents | Tier 1–2 | Qwen, GPT-4o-mini |
| Security audit | Tier 3 | Claude Opus |

---

## Escalation Strategy

Tier escalation is **declarative by task type**. Before routing, the system reads the task's `task_type` field and maps it to a tier. No agent judgment required — routing is determined by the task definition.

```yaml
task_type_routing:
  security_audit: tier3
  complex_coding: tier3
  final_qa: tier3
  standard_coding: tier2
  coordination: tier2
  research: tier1
  marketing_draft: tier1
  default: tier2
```

If `task_type` is not set or not in the map, the system falls back to the role's default tier.

**Phase 2 upgrade (noted, not built):** Add agent self-request escalation. The agent can emit a structured signal `{"escalate": "tier3", "reason": "..."}` which the Orchestrator evaluates against policy and approves or denies. This adds agent awareness without removing the declarative default. Research and design required before building.

---

## Fallback Strategy

On failure, the system tries same-tier alternatives first. If the tier is exhausted, it escalates one tier. The failure and any cost delta are logged to Supabase.

```
Primary model fails
  → Try next model in same tier
  → Tier exhausted → escalate one tier
  → Log fallback event + cost delta
```

Example (Tier 2 failure):
```
Claude Haiku unavailable
  → GPT-4o-mini (same tier)
  → Tier exhausted → Claude Sonnet (Tier 3)
  → Log: fallback_event, tier_delta=+1, cost_delta=$x
```

Failure scenarios covered: model unavailable, rate limited, context window exceeded.

**Phase 2 upgrade (noted, not built):** Context-aware fallback — match the response to the failure type. Rate limit → same-tier retry with backoff. Model unavailable → same-tier alternative. Context exceeded → escalate immediately (tier change is appropriate). Requires failure type classification from LiteLLM error responses.

---

## Human Override

Two mechanisms for Phase 1:

**CLI flag — per-run, ephemeral**
```bash
ai-org run task.json --model claude-opus
ai-org run task.json --tier 3
```
Override applies to that run only. Resets when the run ends. No state change.

**Skill invocation — session-scoped**
```
/use-model claude-opus
/use-tier 3
/reset-model
```
Sets a session-level override flag. All routing in the session uses that model/tier until reset or session ends.

**Phase 2 upgrade (noted, not built):** Persistent override in `agent_config.yaml` — for roles that should always use a specific model regardless of tier defaults. Surfaced via web UI in Phase 2.

---

## Cost Tracking

LiteLLM logs all token usage and estimated cost per call. Logs are pushed to Supabase. Configurable spend thresholds trigger alerts before limits are hit.

```yaml
router_settings:
  provider_budget_config:
    anthropic:
      budget_limit: 50
      time_period: 1d
    openrouter:
      budget_limit: 20
      time_period: 1d
```

Global budget cap enforced at the LiteLLM proxy level — if the daily budget is hit, calls return a structured error rather than silently continuing.

---

## LiteLLM Config (Phase 1 skeleton)

```yaml
model_list:
  - model_name: tier1-research
    litellm_params:
      model: openrouter/moonshot/moonshot-v1-128k
      api_key: os.environ/OPENROUTER_API_KEY

  - model_name: tier1-general
    litellm_params:
      model: openrouter/qwen/qwen-2-72b-instruct
      api_key: os.environ/OPENROUTER_API_KEY

  - model_name: tier2
    litellm_params:
      model: anthropic/claude-haiku-4-5-20251001
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: tier3
    litellm_params:
      model: anthropic/claude-sonnet-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

router_settings:
  routing_strategy: "usage-based-routing"
  fallbacks:
    - {"tier2": ["openrouter/openai/gpt-4o-mini"]}
    - {"tier1-research": ["tier1-general"]}
  
  provider_budget_config:
    anthropic:
      budget_limit: 50
      time_period: 1d
    openrouter:
      budget_limit: 20
      time_period: 1d

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

---

## Open Questions

- [x] Where is LiteLLM deployed — local sidecar process for Phase 1
- [x] How does tier escalation work mid-task — declarative task_type mapping; agent self-request is a Phase 2 upgrade
- [x] Cost tracking storage — Supabase
- [x] How are API keys managed — .env Phase 1, Infisical Phase 2
- [x] Fallback strategy — same-tier first, then escalate; failure-type-aware fallback is a Phase 2 upgrade
- [x] Per-workspace model config — single workspace for Phase 1
- [x] How does the human override model routing — CLI flag + skill invocation for Phase 1; persistent config for Phase 2
- [x] LiteLLM vs. OpenRouter — LiteLLM as local proxy + OpenRouter as Tier 1 backend; complementary, not alternatives

---

## Dependencies

None. This is infrastructure that everything else depends on.

---

## Phase 2 Upgrades (parked, not forgotten)

1. **Agent self-request escalation** — agents signal escalation need; Orchestrator approves/denies against policy
2. **Failure-type-aware fallback** — rate limit vs. unavailable vs. context exceeded each get different responses
3. **Persistent model override** — per-agent-role config in `agent_config.yaml`, surfaced via web UI
4. **Infisical for API key management** — replaces .env

---

## Session Notes

### Orient — 2026-04-02
All 7 open questions identified. 4 answered, 3 parked for design phase.

### Design — 2026-04-03

All open questions resolved. Architecture locked.

**Key decisions:**
- LiteLLM + OpenRouter are complementary — LiteLLM as local proxy, OpenRouter as Tier 1 backend
- Escalation: declarative task_type mapping for Phase 1. Agent self-request escalation is a Phase 2 research + design item
- Fallback: same-tier first, then escalate one tier. Failure-type-aware fallback is Phase 2
- Human override: CLI flag (per-run) + skill invocation (session-scoped) for Phase 1. Persistent config for Phase 2

**Rationale for LiteLLM over OpenRouter-only:**
OpenRouter alone has documented fallback failures on rate limits and generic provider errors. It has no local cost tracking or budget enforcement. LiteLLM is free, self-hosted, and solves all three — at the seam, where custom logic belongs.
