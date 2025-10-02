#!/bin/bash
# Development server with 1Password secret injection

export PYTHONPATH=.
op run --env-file=../.env.template -- uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
