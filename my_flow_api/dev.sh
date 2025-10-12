#!/usr/bin/env zsh
# Development server with 1Password secret injection

export PYTHONPATH=.
export PYTHONUNBUFFERED=1
op run --env-file=.env.template -- uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
