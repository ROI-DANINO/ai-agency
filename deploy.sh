#!/bin/bash
set -euo pipefail

# Deploy ai-org plugin to Claude Code skills directory.
# Human-facing skills are flattened into ~/.claude/skills/{name}/
# so Claude Code discovers them in the / menu.
# Runtime dirs (agents, artifacts, etc.) go to ~/.claude/aios-plugins/plugins/ai-org/

CLAUDE_SKILLS="$HOME/.claude/skills"
PLUGIN_DIR="$HOME/.claude/aios-plugins/plugins/ai-org"
RUNTIME_DIRS=(agents tools memory workflow hitl artifacts)

echo "Deploying ai-org plugin..."

# 1. Deploy human-invocable skills flat into ~/.claude/skills/{name}/
for skill_dir in skills/human/*/; do
  skill_name=$(basename "$skill_dir")
  dest="$CLAUDE_SKILLS/$skill_name"
  rm -rf "$dest"
  cp -r "$skill_dir" "$dest"
  echo "  skill: $skill_name → $dest"
done

# 2. Deploy runtime dirs to plugin location
mkdir -p "$PLUGIN_DIR"
for dir in "${RUNTIME_DIRS[@]}"; do
  rm -rf "$PLUGIN_DIR/$dir"
  cp -r "$dir" "$PLUGIN_DIR/$dir"
done

# 3. Deploy skills (full tree) and root files to plugin location
rm -rf "$PLUGIN_DIR/skills"
cp -r skills "$PLUGIN_DIR/skills"
cp manifest.yaml skills-map.md "$PLUGIN_DIR/"

echo "ai-org plugin deployed → $PLUGIN_DIR"
echo "human skills deployed → $CLAUDE_SKILLS"
