#!/bin/bash
# Test script to simulate CI/CD linting locally

set -e

# Change to the script's directory (my_flow_client)
cd "$(dirname "$0")"

echo "Simulating CI/CD environment..."
echo "Working directory: $(pwd)"
echo "ESLint config: $(ls -la eslint.config.mjs 2>/dev/null || echo 'NOT FOUND')"

# Run ESLint exactly as CI/CD would
echo ""
echo "Running: eslint . --max-warnings=0"
npx eslint . --max-warnings=0

echo ""
echo "✅ Lint passed!"
