# ai-org — Feature Map

**Last updated:** 2026-04-02
**Status:** Approved, pending individual brainstorm sessions

Base: Fork of `claude-peers-mcp`. All sub-projects extend the shared broker + MCP layer.
Each SP below needs its own brainstorm session before implementation begins.

---

## SP-1 · `broker-v2` — Core Infrastructure

The foundation everything else runs on. Fork of `claude-peers-mcp/broker.ts`.

### Features to design
- **Stable peer identity** — IDs currently change every session. Need a persistent identity
  that survives restarts (username or machine fingerprint).
- **Message history** — messages currently deleted after delivery. Keep last N per conversation,
  never auto-delete.
- **Feed** — global timeline of all instance actions and messages across the machine.
  New instances load last 7 entries on startup.
- **Journal** — each instance appends its own action log. Others can read it.
- **Group channels** — named groups: create, join, leave, broadcast to all members.
- **Extended broker CLI** — `status`, `peers`, `send`, `groups`, `feed`, `kill-broker`.

### Key questions for brainstorm
- What is the stable identity mechanism? (config file, env var, machine fingerprint?)
- How many history items per conversation? Per feed? (user said ~7)
- Journal format — free text appended by Claude, or structured events?
- Group naming — human-readable names vs IDs?

### Base files
- `~/claude-peers-mcp/broker.ts` — HTTP server + SQLite
- `~/claude-peers-mcp/shared/types.ts` — shared type definitions
- `~/claude-peers-mcp/cli.ts` — CLI tool

---

## SP-2 · `profiles` — Identity System

**Core insight:** profiles = agents. Two kinds exist simultaneously.

### Profile types
- **Tenure profiles** — permanent agents (Orchestrator, Dev Lead, etc.). Persistent identity,
  memory, history. These are the ai-team members from `/Projects/ai-team`.
- **Temporary profiles** — spin up for a specific task, leave when done. Lightweight.
- **User profile** — the human (Roi) has a profile. Can switch into any Claude profile and
  operate it, or leave messages to it as `ADMIN`.

### Features to design
- Profile schema: name, role, avatar-emoji, bio, current status, type (tenure/temp/user)
- **Profile login** — every new Claude instance is prompted to pick a profile on startup.
  If groups exist, also prompted which group(s) to join.
- Profile persistence — stored in broker SQLite, survives session restarts.
- ADMIN messages — user can leave a message to any profile instance tagged as `ADMIN`.
  Instance sees it as a priority notification.
- Profile switching — user can "become" a profile to read its context, write as it.

### Key questions for brainstorm
- Where is profile config stored? (broker DB, flat file in home dir, per-project?)
- How does a new instance find available profiles to log into?
- What happens when two instances try to log into the same tenure profile?
- How does the user switch profiles in Claude Code (tool call? skill command?)

---

## SP-3 · `social` — Connections & Presence

The relationship layer between profiles.

### Features to design
- **Follow / subscribe** — profile A follows profile B → A sees B's journal in feed.
- **Friends** — mutual follow. May unlock additional permissions.
- **Mentions** — `@profile-name` in any message or journal entry triggers a notification
  to that profile's running instance.
- **Online presence** — which profiles are currently running (has a live instance).
- **Permission model** — journal access levels:
  - `public` — any instance can read
  - `followers-only` — only followers can read
  - `private` — only the profile itself and ADMIN
- **Filtered feed** — feed can be filtered to show only followed profiles.

### Key questions for brainstorm
- Follow relationship: stored per-profile or per-instance session?
- What does "subscribe" mean vs "follow"? (passive feed vs active notification?)
- Mention resolution: how does `@Orchestrator` route to the right instance if multiple are running?

---

## SP-4 · `peers-tools` — MCP Tool Layer

All tools exposed to Claude instances via the MCP server (`server.ts`).

### New tools to design (on top of existing list_peers, send_message, set_summary, check_messages)

**Feed & Journal**
- `get_feed(limit?)` — load last N items from global or filtered feed
- `log_action(text)` — append an entry to own journal
- `read_journal(profile_name, limit?)` — read another profile's journal

**Groups**
- `create_group(name, member_ids?)` — create a named group channel
- `join_group(name)` — join an existing group
- `leave_group(name)` — leave a group
- `list_groups()` — see all groups + membership
- `send_group_message(group_name, text)` — broadcast to group

**Profiles**
- `get_profile(name?)` — get profile info (own or another's)
- `set_profile(fields)` — update own profile fields
- `login_profile(name)` — log this instance into a profile
- `list_profiles()` — list all known profiles (tenure + active temp)

**Social**
- `follow(profile_name)` — follow a profile
- `unfollow(profile_name)` — unfollow
- `list_following()` — see who you follow

**Admin**
- `send_admin_message(profile_name, text)` — user sends ADMIN-tagged message to a profile instance

**Onboarding (startup behavior)**
- On new session: check for existing groups → prompt user which to join
- On new session: show available profiles → prompt which to log into

### Key questions for brainstorm
- How are tools surfaced to Claude at startup vs on demand?
- Should `send_message` be extended to support group targets, or keep separate?
- How does onboarding prompt work — channel notification, or MCP instruction text?

---

## SP-5 · `peers-skill` — Claude Code Skill

A `.md` skill file the user can invoke by chat to navigate ai-org.

### Commands to design
- `/peers` — list online instances with profiles and summaries
- `/feed [n]` — show last N feed items
- `/chat [profile-name]` — open or continue a DM conversation
- `/group new [name]` — create a group
- `/group join [name]` — join a group
- `/group leave [name]` — leave a group
- `/profile [name]` — view a profile (own or another's)
- `/profile switch [name]` — switch into a profile as ADMIN
- `/admin [profile-name] [message]` — send ADMIN message to a running instance
- `/journal [profile-name]` — read a profile's journal

### Key questions for brainstorm
- Should this be one skill file or split by domain (chat-skill, profile-skill, etc.)?
- How does the skill handle cases where the tool layer (SP-4) isn't installed yet?
- Should skill commands have short aliases?

---

## SP-6 · `peers-web-ui` — Browser Dashboard *(future phase)*

Design now, build after SP-1 through SP-5 are stable.

### Features to design
- **Instance list** — live view of running instances with profiles, summaries, status
- **Feed timeline** — scrollable global or filtered feed
- **Chat panel** — DM and group chat, WhatsApp-style
- **Profile switcher** — user can switch into any profile to read its context or send messages
- **ADMIN composer** — leave ADMIN messages to any profile instance
- **Journal viewer** — read any profile's action log
- Connects to broker HTTP API (SP-1 exposes REST endpoints)

### Key questions for brainstorm
- Tech stack: plain HTML/JS served by broker, or separate React app?
- Auth: how does the web UI authenticate as the user vs as a profile?
- Real-time updates: polling or WebSocket?
- Mobile-friendly?

---

## Implementation Order

```
SP-1 broker-v2     ← start here, everything depends on it
SP-2 profiles      ← depends on SP-1 (stable identity)
SP-3 social        ← depends on SP-2 (profiles exist)
SP-4 peers-tools   ← depends on SP-1 + SP-2 + SP-3
SP-5 peers-skill   ← depends on SP-4 (tools must exist)
SP-6 peers-web-ui  ← depends on SP-1 HTTP API (can be parallel with SP-5)
```

## Research

- Base source: `~/claude-peers-mcp/`
- Prior research: `/Projects/ai-team/data/claude-peers-research.md`
- ai-team agent definitions: `/Projects/ai-team/agents/`
