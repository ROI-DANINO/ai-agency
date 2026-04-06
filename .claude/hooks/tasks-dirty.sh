#!/usr/bin/env bash
# Mark .tasks-dirty when key project files are written/edited.
# Called by PostToolUse hook. Reads CLAUDE_TOOL_INPUT (JSON) for file_path.
set -euo pipefail

DIRTY_FLAG="/home/roking/Desktop/Projects/ai-org/.tasks-dirty"

file_path=$(python3 -c "
import os, json, sys
raw = os.environ.get('CLAUDE_TOOL_INPUT', '{}')
try:
    d = json.loads(raw)
    print(d.get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || true)

case "$file_path" in
  */journal/*.md|\
  */.project-session/*.md|\
  */docs/FEATURE-MAP.md|\
  */docs/features/*/README.md)
    touch "$DIRTY_FLAG"
    ;;
esac
