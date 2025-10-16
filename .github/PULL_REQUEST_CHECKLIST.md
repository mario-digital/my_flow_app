# Pull Request Quality Checklist

Use this checklist to ensure your PR meets all quality standards before requesting review.

## Before Opening PR

- [ ] **Branch is up to date** with `main`
- [ ] **All commits** follow conventional commit format
- [ ] **Pre-commit hooks** passed without errors
- [ ] **Pre-push hooks** passed all tests

## Code Quality

### Linting and Formatting
- [ ] Frontend: `bun run lint` passes
- [ ] Backend: `uv run ruff check .` passes
- [ ] Code is properly formatted (auto-formatted by pre-commit)

### Type Safety
- [ ] Frontend: `bun run typecheck` passes (no TypeScript errors)
- [ ] Backend: `uv run mypy src/` passes (no type errors)

### Code Review Self-Check
- [ ] No commented-out code (remove or explain why it's kept)
- [ ] No debug console.log or print statements (or explain why needed)
- [ ] No TODO comments without associated issue number
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Functions are small and focused (< 50 lines ideally)
- [ ] Variable and function names are descriptive

## Testing

### Test Coverage
- [ ] Frontend: Tests pass with `bun run test`
- [ ] Backend: Tests pass with `./scripts/run_backend_tests.sh`
- [ ] Coverage is **≥ 80%** for changed files
- [ ] New features have corresponding tests
- [ ] Bug fixes have regression tests

### Test Quality
- [ ] Tests are independent (don't rely on execution order)
- [ ] Tests use meaningful descriptions
- [ ] Tests cover happy path and error cases
- [ ] E2E tests updated if user flow changed

## Documentation

- [ ] **README.md** updated if setup changed
- [ ] **API documentation** updated if endpoints changed
- [ ] **Code comments** added for complex logic
- [ ] **Type definitions** updated if data models changed
- [ ] **Architecture docs** updated if design changed

## Security

- [ ] No secrets or API keys in code
- [ ] No hardcoded URLs (use environment variables)
- [ ] Input validation added for user inputs
- [ ] Authentication/authorization checked for new endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (escaped outputs)

## Performance

- [ ] No N+1 queries or unnecessary database calls
- [ ] Images optimized (if adding new images)
- [ ] No blocking operations on main thread
- [ ] Async/await used properly
- [ ] No memory leaks (subscriptions cleaned up)

## Breaking Changes

If your PR includes breaking changes:

- [ ] Breaking changes documented in PR description
- [ ] Migration guide provided
- [ ] Version bump planned (major version)
- [ ] Backward compatibility considered

## User Experience

For UI changes:

- [ ] Tested on Chrome, Firefox, Safari
- [ ] Mobile responsive (tested on different screen sizes)
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Accessibility checked (keyboard navigation, screen readers)
- [ ] Screenshots added to PR description

## Final Checks

- [ ] **PR title** is clear and descriptive
- [ ] **PR description** uses the template
- [ ] **Related issues** linked
- [ ] **Reviewers** assigned
- [ ] **Labels** added (or will be auto-added)
- [ ] **CI checks** are passing
- [ ] Ready for review

---

## Quick Command Reference

```bash
# Run all quality checks locally
bun run lint        # Lint all code
bun run format      # Format all code
bun run typecheck   # Type check all code
bun run test        # Run all tests

# Individual checks
cd my_flow_client && bun run lint
cd my_flow_client && bun run typecheck
cd my_flow_client && bun run test -- --coverage

cd my_flow_api && uv run ruff check .
cd my_flow_api && uv run mypy src/
./scripts/run_backend_tests.sh

# Pre-push simulation (runs all checks)
.husky/pre-push
```

## Help

If checks are failing:

1. Read the error message carefully
2. Check the relevant documentation
3. Ask for help in the PR comments
4. Tag a maintainer if stuck

Remember: The goal is high-quality, maintainable code that works reliably! 🎯
