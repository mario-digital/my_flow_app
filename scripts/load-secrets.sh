#!/bin/bash

# MyFlow Secrets Loader using 1Password CLI
#
# This script provides helper functions for running commands with secrets
# injected from 1Password vault.
#
# Usage:
#   ./scripts/load-secrets.sh dev                    # Run both services
#   ./scripts/load-secrets.sh dev:frontend           # Run frontend only
#   ./scripts/load-secrets.sh dev:backend            # Run backend only
#   ./scripts/load-secrets.sh test                   # Run all tests
#
# Prerequisites:
#   - 1Password CLI installed (brew install 1password-cli)
#   - Authenticated with 1Password (op signin)
#   - "MyFlow Development" vault created with all required items

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if 1Password CLI is installed
if ! command -v op &> /dev/null; then
    echo -e "${RED}Error: 1Password CLI (op) is not installed${NC}"
    echo "Install it with: brew install 1password-cli"
    exit 1
fi

# Check if authenticated with 1Password
if ! op vault list &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with 1Password${NC}"
    echo "Please run: op signin"
    exit 1
fi

# Check if MyFlow Development vault exists
if ! op vault get "MyFlow Development" &> /dev/null; then
    echo -e "${RED}Error: 'MyFlow Development' vault not found${NC}"
    echo "Create it with: op vault create 'MyFlow Development'"
    exit 1
fi

echo -e "${GREEN}✓ 1Password CLI configured correctly${NC}"

# Get the root directory (one level up from scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_TEMPLATE="$ROOT_DIR/.env.template"

# Check if .env.template exists
if [ ! -f "$ENV_TEMPLATE" ]; then
    echo -e "${RED}Error: .env.template not found at $ENV_TEMPLATE${NC}"
    exit 1
fi

# Run command with secrets injected from 1Password
run_with_secrets() {
    local command=$1
    echo -e "${GREEN}Running: $command${NC}"
    echo -e "${YELLOW}Loading secrets from 1Password...${NC}"
    cd "$ROOT_DIR"
    op run --env-file=.env.template -- $command
}

# Main command router
case "${1:-help}" in
    dev)
        run_with_secrets "bun run dev"
        ;;
    dev:frontend)
        run_with_secrets "bun run dev:frontend"
        ;;
    dev:backend)
        run_with_secrets "bun run dev:backend"
        ;;
    test)
        run_with_secrets "bun run test"
        ;;
    test:frontend)
        run_with_secrets "bun run test:frontend"
        ;;
    test:backend)
        run_with_secrets "bun run test:backend"
        ;;
    lint)
        run_with_secrets "bun run lint"
        ;;
    format)
        run_with_secrets "bun run format"
        ;;
    *)
        echo "Usage: ./scripts/load-secrets.sh <command>"
        echo ""
        echo "Available commands:"
        echo "  dev              Run both frontend and backend"
        echo "  dev:frontend     Run frontend only"
        echo "  dev:backend      Run backend only"
        echo "  test             Run all tests"
        echo "  test:frontend    Run frontend tests"
        echo "  test:backend     Run backend tests"
        echo "  lint             Run linters"
        echo "  format           Format code"
        echo ""
        echo "Or run any command directly:"
        echo "  op run --env-file=.env.template -- <your-command>"
        ;;
esac