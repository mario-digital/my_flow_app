# Contributing to MyFlow

Thank you for your interest in contributing to MyFlow! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this standard. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Bun** 1.x+
- **Python** 3.12+
- **uv** (Astral's Python package manager)
- **1Password CLI** (for secret management)
- **MongoDB** (Atlas free tier recommended)

### Initial Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/my_flow_app.git
   cd my_flow_app
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/my_flow_app.git
   ```

4. Install dependencies:
   ```bash
   bun install
   cd my_flow_api && uv sync && cd ..
   ```

5. Set up 1Password secrets:
   ```bash
   op signin
   ./scripts/setup-1password.sh
   ```

6. Run development servers:
   ```bash
   op run --env-file=.env.template -- bun run dev
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements
- `chore/description` - Maintenance tasks

Example: `feature/add-flow-filtering`

### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Run quality checks** (these will also run automatically on commit):
   ```bash
   bun run lint        # Lint all code
   bun run format      # Format all code
   bun run typecheck   # Type check all code
   bun run test        # Run all tests
   ```

4. **Commit your changes** with a meaningful commit message (see guidelines below)

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

## Pull Request Process

### Before Submitting

- [ ] All tests pass locally
- [ ] Code is properly formatted and linted
- [ ] Type checking passes
- [ ] Test coverage meets requirements (80%+)
- [ ] Documentation is updated if needed
- [ ] Commit messages follow the guidelines
- [ ] PR description is clear and complete

### PR Requirements

1. **Title**: Clear and descriptive (e.g., "Add flow filtering by priority")
2. **Description**: Use the PR template to provide:
   - Summary of changes
   - Related issues
   - Testing performed
   - Screenshots (for UI changes)
3. **Tests**: Include tests for new functionality
4. **Documentation**: Update relevant docs

### Review Process

1. CI checks must pass (linting, type checking, tests, build)
2. At least one maintainer approval required
3. All review comments must be resolved
4. PR must be up-to-date with `main` branch

### After Approval

- **Squash and merge** is preferred for clean history
- Delete your branch after merge
- Update your fork:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

## Coding Standards

### Frontend (TypeScript)

**Style:**
- ESLint: Next.js recommended config + accessibility rules
- Prettier: 2-space indentation, single quotes, trailing commas
- TypeScript: Strict mode enabled

**Best Practices:**
- Prefer Server Components over Client Components
- Use TanStack Query for server state
- Follow the three-layer design token architecture
- Keep components focused and composable
- Use proper TypeScript types (no `any`)

**File Organization:**
```
my_flow_client/src/
├── app/              # Pages and layouts (Server Components by default)
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui primitives (Client Components)
│   └── ...          # Feature-specific components
├── hooks/           # Custom React hooks (Client-side only)
├── lib/             # Utilities and helpers
└── types/           # TypeScript type definitions
```

### Backend (Python)

**Style:**
- Ruff: 100-character line length, isort integration
- mypy: Strict type checking enforced
- Type hints: Required for all functions

**Architecture:**
- Follow Clean Architecture layers: Routers → Services → Repositories → DB
- Use dependency injection via FastAPI `Depends()`
- All database operations must be async
- Use Pydantic for request/response validation

**File Organization:**
```
my_flow_api/src/
├── main.py           # FastAPI app entry point
├── config.py         # Pydantic Settings
├── database.py       # MongoDB connection
├── routers/          # API endpoints (controllers)
├── services/         # Business logic
├── repositories/     # Data access
├── models/           # Pydantic schemas
├── middleware/       # Custom middleware
└── adapters/         # External integrations
```

## Testing Requirements

### Coverage Requirements

- **Frontend:** 80%+ line coverage
- **Backend:** 80%+ line coverage
- **E2E:** Critical user flows covered

### Testing Pyramid (70/20/10)

```
         E2E Tests (~10%)
        /              \
   Integration Tests (~20%)
  /                        \
Unit Tests (~70% - 35% Frontend + 35% Backend)
```

### Writing Tests

**Frontend (Vitest):**
```typescript
// my_flow_client/src/components/my-component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**Backend (pytest):**
```python
# my_flow_api/tests/unit/services/test_flow_service.py
import pytest
from src.services.flow_service import FlowService

@pytest.mark.asyncio
async def test_get_flows_by_context(flow_service):
    """Test retrieving flows for a specific context."""
    flows = await flow_service.get_flows("context-id-123", "user-id-456")
    assert isinstance(flows, list)
    assert all(flow.context_id == "context-id-123" for flow in flows)
```

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements

### Examples

```
feat(frontend): add flow filtering by priority

- Add priority filter dropdown to flow list
- Update FlowList component with filter state
- Add tests for filter functionality

Closes #123
```

```
fix(backend): resolve race condition in flow completion

The mark_complete endpoint had a TOCTOU vulnerability when multiple
requests tried to complete the same flow. Fixed by using atomic
find_one_and_update operation.

Closes #456
```

## Questions?

If you have questions or need help:

1. Check existing [Issues](https://github.com/OWNER/my_flow_app/issues)
2. Review the [Documentation](./docs/)
3. Open a new issue with your question

Thank you for contributing! 🎉

