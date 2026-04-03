# Feature 01 Chat B: Profile Schema, Rank System, and Agent Architecture
Date: 2026-04-03
Type: decision

## What Happened

Worked through the profile schema and agent type design for Feature 01. What started as a schema question turned into a full architectural rethink of the agent hierarchy. The session surfaced something important: the design has been implicitly army-like from the beginning — ranks, chains of command, clear tiers — without that framing being intentional. When "rank" was proposed as a schema field name, it landed immediately. That's a signal the underlying model is right.

The biggest call of the session was the Operator rename. "Orchestrator" was always clunky — too long, too jargon-heavy. "Operator / OP" is cleaner, shorter, and actually more accurate to the role. One of those changes that feels obvious the moment it's made.

The other significant shift: Operator is not a single agent. It's a tier. Multiple independent OP processes exist in parallel, each with a specialty (watcher, reporter, mission), each a real subprocess communicating via the OP Mesh. The initial instinct was to make Operator just a tenure profile with `role: "operator"` — but Roi pushed back correctly. The Operator has structural elevation (system-wide visibility, direct human reporting line, noise filter) that needs to be expressed in the schema, not just in behavior. Adding `rank` as a first-class field was the right fix.

The admin profile also got corrected. The first draft put the user inside the mesh as a participant. Wrong — the user talks to OPs via direct CLI sessions; they're not a mesh node. Admin profile is simpler and cleaner now: user's own profile, superuser access, mesh_default pointing to the admin + op layers.

## Decisions Made

- **Orchestrator renamed to Operator (OP)** — why: shorter, cleaner, less jargon, more accurate
- **Rank system: admin / operator / lead / agent** — why: rank is structural (process model, mesh access, reporting direction), not just behavioral
- **Tenure = real subprocess, temporary = logical** — why: tenure agents need genuine isolation and persistence; temp agents are task-scoped and don't benefit from a separate process
- **Operator is a tier (independent processes per specialty)** — why: watcher needs to run continuously, each OP has focused context, one OP with sub-agents just pushes complexity up without gaining anything
- **4-layer mesh (Admin, OP, Lead, Agent)** — why: named by rank, access is scoped by default, admin can reach anywhere explicitly
- **Admin profile = superuser, not mesh participant** — why: user talks to OPs directly via CLI session, not by writing to a mesh layer
- **Temporary profile lifecycle: spawn → inline → archive** — why: audit trail preserved, handoff artifact is the only output that matters

## Open Questions

- Admin Layer content (notes, session history, config) — TBD in Feature 02/05
- Targeted messaging group addressing via tags — TBD in Feature 06/02
- Chat C: stable ID mechanism, profile storage, fork strategy for claude-peers-mcp

## What's Next

Feature 01 Chat B is locked. Chat C (Identity Foundation & Fork Strategy) is next — the research-heavy one. It answers how IDs are assigned, where profile config lives, and whether to fork claude-peers-mcp or wrap it. Handoff prompt is ready. Feature 01 won't be complete until Chat C is done, but the schema and architecture are now solid enough that Chat C is just plumbing.
