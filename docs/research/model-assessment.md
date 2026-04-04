# Model Assessment

Research on model selection for each tier and role. Update this as models evolve.

---

## Orchestrator: Qwen 3.6 (via OpenRouter)

**Role:** Task decomposition, routing decisions, conflict coordination

**Strengths:**
- Strong instruction following and structured output
- Cost-effective for high-frequency coordination tasks
- Good at multi-step reasoning and task breakdown
- Available via OpenRouter with competitive pricing

**Potential Bottlenecks:**
- Not a "reasoning model" — may struggle with deeply ambiguous decompositions
- Context window — verify limit before assigning long-context orchestration tasks
- Less tested for agentic routing vs. Claude/GPT family
- Response latency on OpenRouter can vary

**Recommendation:** Good default for Tier 2 orchestration. Monitor closely in early runs. Have Claude Haiku or GPT-4o-mini as fallback.

---

## Team Leads: Claude Haiku

**Role:** Domain leads — PM, Dev, UX, Security — receiving tasks and managing sub-agents

**Decision (2026-04-03):** Nemotron removed. Active, documented failures in agentic pipelines — infinite tool loops, malformed output. Claude Haiku is the default for Team Leads.

**Strengths:**
- Most reliable model for agentic tool use at Tier 2 cost
- Fast, strong instruction following
- Consistent structured output for decision reports, PRDs, ADRs
- Native Anthropic tool use support — no prompt engineering workarounds

**Potential Bottlenecks:**
- Less context window than Kimi/Qwen for very long documents
- Anthropic API dependency (not via OpenRouter) — separate key required

**Recommendation:** Default for all Team Lead roles. GPT-4o-mini is a viable alternative if Anthropic API is unavailable.

---

## Tier 1 — Free / Cheap

| Model | Best For | Context Window | Notes |
|---|---|---|---|
| **Kimi** (Moonshot) | Long-context research, document analysis | 128k–1M | Best for reading large docs, research tasks |
| **GLM** (Zhipu) | General tasks, summarization | 128k | Solid Chinese model, free tier available |
| **Qwen** (Alibaba) | Research, drafting, analysis | 32k–128k | Strong multilingual, good for structured output |

Use for: Research sub-agents, bulk drafting, initial analysis, anything that doesn't require premium reasoning.

---

## Tier 2 — Mid / Cost-Effective

| Model | Best For | Notes |
|---|---|---|
| **Claude Haiku** | Team leads, fast agentic tool use, coordination | Most reliable for tool calling at low cost — default Team Lead |
| **GPT-4o-mini** | General coordination, drafting | Fallback if Anthropic unavailable |
| **GPT-4o-mini** | General coordination, drafting | Good balance of speed/cost/quality |

Use for: All Team Leads, light coordination, reviews that don't require deep reasoning.

---

## Tier 3 — Premium / Complex

| Model | Best For | Notes |
|---|---|---|
| **Claude Sonnet** | Complex coding, architecture, nuanced reasoning | Best price/performance in Tier 3 |
| **Claude Opus** | Critical decisions, deep analysis, final QA | Highest quality, highest cost |
| **GPT-4o** | Complex coding, multimodal tasks | Strong alternative to Claude Opus |

Use for: Complex development tasks, final QA, security audits, architecture decisions, any task where errors are costly.

---

## Tier Routing Rules (Draft)

| Task Type | Tier | Reason |
|---|---|---|
| Research / web search | 1 | Low complexity, high volume |
| Drafting / summarization | 1 | No deep reasoning needed |
| Coordination / routing | 2 | Moderate reasoning, frequent calls |
| Code review (standard) | 2 | Pattern matching, known standards |
| Architecture decisions | 3 | High stakes, nuanced tradeoffs |
| Complex implementation | 3 | Accuracy critical |
| Security audit | 3 | Cannot afford misses |
| Final QA | 3 | Last gate before human review |

---

## Open Questions

- [x] Nemotron for Team Leads — removed 2026-04-03, active agentic failures confirmed. Claude Haiku is default.
- [ ] Benchmark Qwen 3.6 vs. Claude Haiku for Orchestrator task decomposition quality
- [x] "Manus" — confirmed agent platform, not a model. Remove from all tier tables.
- [ ] Kimi context window — confirm current limit (varies by version)
- [ ] Test GLM availability and latency via OpenRouter
