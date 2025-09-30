# Git Hooks (Husky)

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Hooks Configuration

### Pre-Commit Hook
Runs **before** every commit to ensure code quality:

1. **Lint-Staged** - Auto-format and lint only staged files
   - Frontend: Prettier formatting + ESLint fixes
   - Backend: Ruff formatting + Ruff linting with auto-fix

2. **Type Checking**
   - Frontend: TypeScript compiler (`tsc --noEmit`)
   - Backend: mypy static type checker

**Result:** If any check fails, the commit is blocked.

### Pre-Push Hook
Runs **before** pushing to remote to ensure tests pass:

1. **Frontend Tests** - Vitest test suite
2. **Backend Tests** - pytest test suite

**Result:** If any test fails, the push is blocked.

## Lint-Staged Configuration

Configured in root `package.json`:

```json
"lint-staged": {
  "my_flow_client/src/**/*.{ts,tsx}": [
    "bun --cwd my_flow_client run format",
    "bun --cwd my_flow_client x eslint --fix"
  ],
  "my_flow_api/src/**/*.py": [
    "uv run --project my_flow_api ruff format",
    "uv run --project my_flow_api ruff check --fix"
  ]
}
```

## Bypassing Hooks (Emergency Only)

**Not recommended**, but if you need to bypass hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# Skip pre-push hook
git push --no-verify
```

## Testing Hooks Manually

```bash
# Test pre-commit
./.husky/pre-commit

# Test pre-push
./.husky/pre-push
```

## Installation

Hooks are automatically installed when you run:
```bash
bun install  # triggers "prepare" script which runs "husky"
```

## Benefits

✅ **Consistent Code Quality** - All commits meet quality standards
✅ **Catch Issues Early** - Problems found before review
✅ **Auto-Formatting** - Code formatted automatically
✅ **Prevent Broken Builds** - Tests must pass before pushing
✅ **Team Standards** - Everyone follows same rules
