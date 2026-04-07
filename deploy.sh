#!/bin/bash
set -euo pipefail

# Deploy ai-org skills and runtime to Hermes.
# Human skills      -> ~/.hermes/skills/ai-org-human/
# Agent skills      -> ~/.hermes/skills/ai-org-agent/
# Runtime dirs      -> ~/.hermes/skills/ai-org/runtime/
# Shared metadata   -> ~/.hermes/skills/ai-org-human/ (manifest, skills-map)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

HERMES_SKILLS="$HOME/.hermes/skills"
HUMAN_DIR="$HERMES_SKILLS/ai-org-human"
AGENT_DIR="$HERMES_SKILLS/ai-org-agent"
RUNTIME_DIR="$HERMES_SKILLS/ai-org/runtime"

RUNTIME_DIRS=(agents artifacts .mesh)

echo "Deploying ai-org to Hermes..."
echo ""

# --- 1. Deploy human skills ---
mkdir -p "$HUMAN_DIR"
deployed_human=()
for skill_dir in "$SCRIPT_DIR"/skills/human/*/; do
  [ -d "$skill_dir" ] || continue
  skill_name=$(basename "$skill_dir")
  dest="$HUMAN_DIR/$skill_name"
  rm -rf "$dest"
  cp -r "$skill_dir" "$dest"
  deployed_human+=("$skill_name")
  echo "  human skill: $skill_name → $dest"
done

echo ""

# --- 2. Deploy agent skills ---
mkdir -p "$AGENT_DIR"
deployed_agent=()
for skill_dir in "$SCRIPT_DIR"/skills/agent/*/; do
  [ -d "$skill_dir" ] || continue
  skill_name=$(basename "$skill_dir")
  dest="$AGENT_DIR/$skill_name"
  rm -rf "$dest"
  cp -r "$skill_dir" "$dest"
  deployed_agent+=("$skill_name")
  echo "  agent skill: $skill_name → $dest"
done

echo ""

# --- 3. Copy manifest and skill map into human skills dir ---
echo "  metadata: manifest.yaml → $HUMAN_DIR/"
cp "$SCRIPT_DIR/manifest.yaml" "$HUMAN_DIR/"
echo "  metadata: skills-map.md → $HUMAN_DIR/"
cp "$SCRIPT_DIR/skills-map.md" "$HUMAN_DIR/"

echo ""

# --- 4. Deploy runtime dirs ---
mkdir -p "$RUNTIME_DIR"
for dir in "${RUNTIME_DIRS[@]}"; do
  src="$SCRIPT_DIR/$dir"
  [ -d "$src" ] || continue
  rm -rf "$RUNTIME_DIR/$dir"
  cp -r "$src" "$RUNTIME_DIR/$dir"
  echo "  runtime dir: $dir → $RUNTIME_DIR/$dir"
done

echo ""

# --- Summary ---
echo "═════════════════════════════════════"
echo "  ai-org deployed to Hermes"
echo "═════════════════════════════════════"
echo ""
echo "  Human skills (${#deployed_human[@]}):"
for s in "${deployed_human[@]}"; do
  echo "    ✓ $s"
done
echo ""
echo "  Agent skills (${#deployed_agent[@]}):"
for s in "${deployed_agent[@]}"; do
  echo "    ✓ $s"
done
echo ""
echo "  Runtime dirs:  agents, artifacts, .mesh"
echo ""
echo "  Skills root:   $HERMES_SKILLS"
echo "═════════════════════════════════════"
