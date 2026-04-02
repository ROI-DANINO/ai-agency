# ai-org

## Session Start — Design-Think-Build Method

This project uses the design-think-build methodology.
**Run `/project-brief` at the start of every session.**
It will orient you to the current project state and guide the work.

---

## What This Project Is

An AI Agency Platform — a system for orchestrating persistent teams of AI agents that plan, build, and deliver real work, with the human staying in control of every meaningful decision.

## Key Docs

- `docs/VISION.md` — product vision and core principles
- `docs/ARCHITECTURE.md` — system layers, agent hierarchy, OSS stack decisions
- `docs/FEATURE-MAP.md` — 15-feature roadmap with dependency graph and build order
- `docs/features/` — per-feature design docs and session notes
- `docs/research/` — OSS analysis, model assessment, framework comparison
- `.project-session/` — session logs

## Build Order (Phase 1)

08 Model Routing → 01 Agent Identity → 02 Team Structure → 07 Workflow Engine → 09 HITL Reporting → 03 Skills → 04 Tools → 05 Memory

## Core Constraints

- Every feature is fully designed before any line is built
- Human in the loop is non-negotiable — never act on anything meaningful without surfacing it
- Write less code, wire more tools — custom code lives only at seams
- Token efficiency is a design constraint, not an afterthought
