#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backend_dir="$repo_root/my_flow_api"

export UV_CACHE_DIR="${UV_CACHE_DIR:-$repo_root/.uv-cache}"

if command -v uv >/dev/null 2>&1; then
  (cd "$backend_dir" && PYTHONPATH=. uv run pytest "$@")
else
  echo "WARNING: uv not found; falling back to system Python for backend tests"
  (cd "$backend_dir" && PYTHONPATH=. python -m pytest "$@")
fi
