# Framework Comparison

Evaluation of orchestration frameworks for this specific architecture: multi-agent, HITL-gated, model-agnostic.

---

## Requirements

1. Multi-agent orchestration with defined roles
2. Human-in-the-loop gates — workflow must pause and resume based on human input
3. DAG-based task dependencies
4. Model agnostic (works with LiteLLM proxy)
5. Minimal custom code
6. Python-based (bridges to MCP via FastMCP)

---

## Candidates

### CrewAI

**What it is:** High-level multi-agent framework. Define agents with roles and goals, define tasks, define a crew. The framework handles routing.

**Strengths:**
- Least code of any option — crew + agents + tasks is ~50 lines
- Good role-based agent abstraction
- Built-in task delegation
- Works with LiteLLM
- Active community, good docs

**Weaknesses:**
- Less control over task DAGs — sequential and hierarchical processes only
- HITL support exists but is basic (human input tool)
- Limited state machine control
- Hard to customize the execution loop

**Best for:** Phase 1 MVP. Get something working fast with minimal custom code.

---

### LangGraph

**What it is:** Graph-based agent orchestration from LangChain. Nodes are functions/agents, edges are transitions, state flows through the graph.

**Strengths:**
- Full control over execution flow
- Native support for conditional edges (HITL gates are just conditional nodes)
- Explicit state machine — exactly what the workflow engine needs
- Persistence layer for resumable workflows
- Works with LiteLLM
- Growing rapidly, well-maintained

**Weaknesses:**
- More code than CrewAI — graph definition requires explicit node/edge wiring
- Steeper learning curve
- LangChain dependency (can feel heavy)

**Best for:** Phase 2+ when the workflow engine needs full state machine control. Migration path from CrewAI.

---

### AutoGen (Microsoft)

**What it is:** Conversation-based multi-agent framework. Agents talk to each other in structured conversations.

**Strengths:**
- Good for back-and-forth agent dialogue
- Strong HITL support (human proxy agent)
- Microsoft-backed, well-resourced

**Weaknesses:**
- Conversation metaphor doesn't map well to task DAGs
- More complex than needed for this architecture
- Less control than LangGraph for stateful workflows

**Verdict:** Not the right fit. The task-based architecture doesn't match AutoGen's conversation model.

---

### Dify (Self-hosted)

**What it is:** Full AI application platform — visual workflow builder, agent management, model routing, web UI, API. Self-hostable.

**Strengths:**
- Replaces CrewAI + n8n + parts of the web platform in one tool
- Visual workflow builder (no-code for simple flows)
- Built-in model management, API keys, monitoring
- Strong community, active development
- Docker deployment

**Weaknesses:**
- Less customizable than code-based frameworks
- The visual abstraction breaks down for complex logic
- Adds a dependency that's hard to fork and customize
- If Dify's design doesn't match the vision exactly, you're fighting the framework

**Verdict:** Evaluate seriously as an alternative to building everything from scratch. High risk of lock-in but could accelerate Phase 1 significantly. Best decision: prototype in Dify, migrate to LangGraph if constraints hit.

---

### n8n (Self-hosted)

**What it is:** Visual workflow automation. Nodes for APIs, webhooks, databases, AI models.

**Role in this stack:** Not an agent orchestrator — an integration layer. Use it alongside CrewAI/LangGraph for:
- Scheduled triggers (daily briefing at 8am)
- Notification routing (Telegram, Slack, email)
- Webhook handling (GitHub, Linear events)
- Data pipelines (ingestion into knowledge base)

**Verdict:** Not a replacement for agent orchestration, but essential for the integration layer.

---

## Recommendation

**Phase 1:** Start with **CrewAI + LiteLLM + n8n**
- CrewAI handles agent orchestration (fast to build)
- LiteLLM handles model routing
- n8n handles scheduling, notifications, integrations
- Build HITL as a custom CrewAI tool that pauses and waits for human response

**Phase 2:** Migrate workflow engine to **LangGraph**
- When the workflow engine (feature 07) needs full state machine control
- LangGraph's persistence layer makes resumable HITL workflows much cleaner

**Consider Dify:** Run a 1-week spike. If it covers 80% of needs, use it for Phase 1. If it constrains the vision, abandon and build with CrewAI.

---

## Open Questions

- [ ] Spike Dify — can it handle the HITL pattern this architecture needs?
- [ ] Test CrewAI + LiteLLM compatibility (should work, confirm)
- [ ] Evaluate LangGraph persistence layer for resumable HITL workflows
- [ ] n8n self-hosted resource requirements — can it run on the same machine as the platform?
