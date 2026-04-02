# Feature 15 — Desktop App

**Status:** PLACEHOLDER — FUTURE (Phase 3)  
**Phase:** 3 — Future  
**Layer:** Desktop  
**Priority:** Medium  
**Depends on:** All features 01–14

---

## Vision

A native desktop application that wraps the entire platform into a first-class local experience. Like Claude Desktop or Cursor — an app you install, launch, and live inside. The agent runtime is local, the UI is native, and it all works offline.

---

## Core Concept

A Tauri (or Electron) application that bundles the plugin layer and connects to the web platform. The desktop app is the full experience: terminal, agent browser, run logs, HITL inbox, skills editor — all in one window, no browser required.

---

## Key Capabilities

- Native desktop app (macOS, Windows, Linux)
- Bundled local agent runtime (LiteLLM proxy + broker sidecar)
- Full web platform UI embedded (or native-reimplemented)
- Terminal integration — run agent commands from inside the app
- HITL inbox as desktop notifications
- Offline mode — agent work continues without internet (local models via Ollama)
- Auto-update
- Deep OS integration — file system access, clipboard, system tray

---

## Open Questions

- [ ] Tauri (Rust + web views, smaller bundle) vs Electron (Node.js, larger but easier)?
- [ ] Does the desktop app embed the web platform UI, or is it a native reimplementation?
- [ ] Offline/local model support — Ollama integration for Tier 1 models offline?
- [ ] Is the desktop app a separate product or the same product as the web platform?
- [ ] macOS first, then cross-platform?

---

## Considerations

- This is Phase 3. Don't let desktop app requirements constrain Phase 1 and 2 decisions.
- Tauri is the modern choice — smaller bundles, better performance, Rust backend. But Electron has a larger ecosystem.
- The desktop app is primarily a packaging and UX concern — the underlying platform features don't change.
- Local model support (Ollama) would be the key differentiator for a desktop-only tier.

---

## OSS & References

- **OSS:** Tauri — Rust-based cross-platform desktop app framework
- **OSS:** Electron — Node.js desktop app framework
- **OSS:** Ollama — local LLM runtime (Tier 1 offline support)

---

## Dependencies

- **01–14** — all features must be stable before desktop packaging begins

---

## Session Notes
<!-- Fill during design/build session -->
