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

**Recommendation:** Good default for Tier 2 orchestration. Monitor closely in early runs. Have Nemotron as fallback.

---

## Team Leads: Nemotron (via OpenRouter)

**Role:** Domain leads — PM, Dev, UX, Security — receiving tasks and managing sub-agents

**Strengths:**
- NVIDIA-trained, strong reasoning and instruction following
- Cost-effective for sustained multi-turn coordination
- Good at structured report generation (decision reports, PRDs, ADRs)
- Available via OpenRouter

**Potential Bottlenecks:**
- Less established for agentic use cases than Claude/GPT
- May require more explicit prompting for escalation rules
- Tool use reliability — test carefully before production use

**Recommendation:** Evaluate Nemotron vs. Claude Haiku for Team Lead role. Haiku may be more reliable for agentic tool use at similar cost.

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
| **Nemotron** (NVIDIA) | Team leads, coordination, structured reports | Via OpenRouter |
| **Claude Haiku** | Fast agentic tool use, coordination | Most reliable for tool calling at low cost |
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

- [ ] Validate Nemotron tool use reliability before committing it to Team Lead role
- [ ] Benchmark Qwen 3.6 vs. Claude Haiku for Orchestrator task decomposition quality
- [ ] Clarify "Manus" reference in Tier 3 — is this a model or an agent system?
- [ ] Kimi context window — confirm current limit (varies by version)
- [ ] Test GLM availability and latency via OpenRouter
