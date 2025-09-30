# 13. Testing Strategy

## Testing Pyramid

```
         E2E Tests (~10%)
        /              \
     Integration Tests (~20%)
    /                      \
Frontend Unit (~35%)    Backend Unit (~35%)
```

**Testing Philosophy:**

- **70% Unit Tests:** Fast, isolated, test individual functions/components
- **20% Integration Tests:** Test interactions between modules (API + DB, Component + API)
- **10% E2E Tests:** Test critical user flows end-to-end (login, create flow, complete flow)

## Test Organization

**Frontend Tests (`my_flow_client/tests/`):**

```
my_flow_client/
├── src/
│   ├── components/
│   │   ├── flow-card.tsx
│   │   └── flow-card.test.tsx        # Component unit tests
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── use-flows.ts
│   │   │   └── use-flows.test.ts     # Hook unit tests
│   │   └── utils/
│   │       ├── date.ts
│   │       └── date.test.ts          # Utility unit tests
│   └── app/
│       └── contexts/
│           └── [id]/
│               └── page.test.tsx     # Page component tests
├── tests/
│   ├── integration/
│   │   ├── api-client.test.ts        # API client integration tests
│   │   └── auth-flow.test.ts         # Auth integration tests
│   └── e2e/
│       ├── flows.spec.ts             # E2E flow tests
│       ├── contexts.spec.ts          # E2E context tests
│       └── auth.spec.ts              # E2E auth tests
└── vitest.config.ts                  # Test configuration
```

**Backend Tests (`my_flow_api/tests/`):**

```
my_flow_api/
├── src/
│   ├── services/
│   │   └── flow_service.py
│   ├── repositories/
│   │   └── flow_repository.py
│   └── routers/
│       └── flows.py
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   └── test_flow_service.py     # Service unit tests
│   │   ├── repositories/
│   │   │   └── test_flow_repository.py  # Repository unit tests
│   │   └── models/
│   │       └── test_flow_models.py      # Pydantic model tests
│   ├── integration/
│   │   ├── test_flow_api.py             # API + DB integration
│   │   └── test_auth_middleware.py      # Auth middleware tests
│   ├── e2e/
│   │   └── test_flow_lifecycle.py       # Full flow lifecycle tests
│   └── conftest.py                      # Pytest fixtures
└── pytest.ini                           # Pytest configuration
```

**E2E Tests (`tests/e2e/` at root):**

```
my_flow_app/
└── tests/
    └── e2e/
        ├── flows/
        │   ├── create-flow.spec.ts
        │   ├── complete-flow.spec.ts
        │   └── delete-flow.spec.ts
        ├── contexts/
        │   ├── switch-context.spec.ts
        │   └── theme-change.spec.ts
        └── auth/
            ├── login.spec.ts
            └── logout.spec.ts
```

## Test Examples

**Frontend Component Test (Bun Test):**

```typescript
// src/components/flow-card.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'bun:test';
import { FlowCard } from './flow-card';

describe('FlowCard', () => {
  const mockFlow = {
    id: 'flow-1',
    title: 'Test Flow',
    priority: 'high' as const,
    is_completed: false,
    due_date: new Date('2024-12-31'),
    context_id: 'ctx-1',
    user_id: 'user-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('renders flow title', () => {
    render(<FlowCard flow={mockFlow} />);
    expect(screen.getByText('Test Flow')).toBeTruthy();
  });

  it('shows overdue badge when past due date', () => {
    const overdueFlow = {
      ...mockFlow,
      due_date: new Date('2023-01-01'), // Past date
    };
    render(<FlowCard flow={overdueFlow} />);
    expect(screen.getByText(/overdue/i)).toBeTruthy();
  });

  it('applies completed styling when flow is completed', () => {
    const completedFlow = { ...mockFlow, is_completed: true };
    render(<FlowCard flow={completedFlow} />);
    const card = screen.getByTestId('flow-card');
    expect(card.classList.contains('opacity-60')).toBe(true);
  });
});
```

**Frontend Hook Test:**

```typescript
// src/lib/hooks/use-flows.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFlows } from './use-flows';
import * as apiClient from '../api-client';

describe('useFlows', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches flows for a context', async () => {
    const mockFlows = [
      { id: 'flow-1', title: 'Flow 1', is_completed: false },
      { id: 'flow-2', title: 'Flow 2', is_completed: true },
    ];

    mock.module('../api-client', () => ({
      get: mock(() => Promise.resolve(mockFlows)),
    }));

    const { result } = renderHook(() => useFlows('ctx-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockFlows);
  });

  it('handles API errors gracefully', async () => {
    mock.module('../api-client', () => ({
      get: mock(() => Promise.reject(new Error('Network error'))),
    }));

    const { result } = renderHook(() => useFlows('ctx-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Network error');
  });
});
```

**Backend Service Test (Pytest):**

```python
# tests/unit/services/test_flow_service.py
import pytest
from datetime import datetime, timedelta
from src.services.flow_service import FlowService, FlowStatus
from src.models.flow import Flow

@pytest.fixture
def mock_flow_repo(mocker):
    return mocker.Mock()

@pytest.fixture
def mock_context_repo(mocker):
    return mocker.Mock()

@pytest.fixture
def flow_service(mock_flow_repo, mock_context_repo):
    return FlowService(mock_flow_repo, mock_context_repo)

@pytest.mark.asyncio
async def test_compute_status_overdue(flow_service):
    """Test that overdue flows are marked as OVERDUE"""
    flow = Flow(
        id="flow-1",
        title="Test Flow",
        context_id="ctx-1",
        user_id="user-1",
        is_completed=False,
        due_date=datetime.utcnow() - timedelta(days=1),  # Yesterday
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    result = flow_service._compute_status(flow)

    assert result.status == FlowStatus.OVERDUE
    assert result.days_until_due == -1

@pytest.mark.asyncio
async def test_compute_status_due_today(flow_service):
    """Test that flows due today are marked as DUE_TODAY"""
    flow = Flow(
        id="flow-1",
        title="Test Flow",
        context_id="ctx-1",
        user_id="user-1",
        is_completed=False,
        due_date=datetime.utcnow(),  # Today
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    result = flow_service._compute_status(flow)

    assert result.status == FlowStatus.DUE_TODAY
    assert result.days_until_due == 0

@pytest.mark.asyncio
async def test_get_flows_calls_repository(flow_service, mock_flow_repo, mock_context_repo):
    """Test that get_flows delegates to repository correctly"""
    mock_context_repo.exists.return_value = True
    mock_flow_repo.find_by_context.return_value = []

    await flow_service.get_flows("ctx-1", "user-1")

    mock_context_repo.exists.assert_called_once_with("ctx-1", "user-1")
    mock_flow_repo.find_by_context.assert_called_once_with("ctx-1")
```

**Backend API Integration Test:**

```python
# tests/integration/test_flow_api.py
import pytest
from httpx import AsyncClient
from src.main import app
from src.database import get_database

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def authenticated_headers():
    # In real tests, generate valid JWT token for testing
    return {"Authorization": "Bearer test-token"}

@pytest.mark.asyncio
async def test_create_flow(client, authenticated_headers):
    """Test creating a new flow via API"""
    response = await client.post(
        "/api/v1/contexts/ctx-1/flows",
        json={
            "title": "New Flow",
            "priority": "high",
            "due_date": "2024-12-31T23:59:59Z",
        },
        headers=authenticated_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Flow"
    assert data["priority"] == "high"
    assert "id" in data

@pytest.mark.asyncio
async def test_list_flows(client, authenticated_headers):
    """Test listing flows via API"""
    response = await client.get(
        "/api/v1/contexts/ctx-1/flows",
        headers=authenticated_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
```

**E2E Test (Playwright):**

```typescript
// tests/e2e/flows/create-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should create a new flow', async ({ page }) => {
    // Navigate to context
    await page.click('text=Work');
    await expect(page).toHaveURL(/\/contexts\/.+/);

    // Click "New Flow" button
    await page.click('button:has-text("New Flow")');

    // Fill in flow details
    await page.fill('input[name="title"]', 'Write E2E Tests');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('input[name="due_date"]', '2024-12-31');
    await page.click('button:has-text("Create")');

    // Verify flow appears in list
    await expect(page.locator('text=Write E2E Tests')).toBeVisible();
    await expect(page.locator('[data-testid="flow-card"]')).toContainText('High');
  });

  test('should show validation error for empty title', async ({ page }) => {
    await page.click('text=Work');
    await page.click('button:has-text("New Flow")');

    // Try to submit without title
    await page.click('button:has-text("Create")');

    // Verify error message
    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('should complete a flow', async ({ page }) => {
    await page.click('text=Work');

    // Find first incomplete flow
    const flowCard = page.locator('[data-testid="flow-card"]').first();
    await flowCard.locator('button[aria-label="Complete flow"]').click();

    // Verify flow is marked as completed
    await expect(flowCard).toHaveClass(/opacity-60/);
    await expect(flowCard.locator('svg[data-testid="check-icon"]')).toBeVisible();
  });
});
```

## Test Configuration

**Frontend Test Configuration (`vitest.config.ts`):**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Backend Test Configuration (`pytest.ini`):**

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
addopts =
    --verbose
    --cov=src
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=80
markers =
    unit: Unit tests (isolated, no external dependencies)
    integration: Integration tests (DB, external services)
    e2e: End-to-end tests (full application stack)
```

**E2E Test Configuration (`playwright.config.ts`):**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Coverage Requirements

**Coverage Targets:**

- **Frontend:** 80% line coverage (components, hooks, utilities)
- **Backend:** 80% line coverage (services, repositories, routers)
- **E2E:** Cover critical user flows (login, CRUD operations, error handling)

**Coverage Exclusions:**

- Configuration files (`.config.ts`, `next.config.js`)
- Type definitions (`*.d.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Generated files (`.next/`, `dist/`)

**CI Coverage Check:**

```yaml
# .github/workflows/frontend-ci.yml
- name: Run tests with coverage
  run: cd my_flow_client && bun test --coverage

- name: Check coverage thresholds
  run: |
    if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) -lt 80 ]; then
      echo "Coverage below 80%"
      exit 1
    fi
```

## Design Rationale

1. **Why 70/20/10 Testing Pyramid (not 60/30/10)?**
   - **Trade-off:** More unit tests = faster feedback but less integration coverage
   - **Decision:** 70% unit tests provide fastest feedback loop; 20% integration catches cross-module issues
   - **Assumption:** Well-designed modules minimize integration bugs; unit tests catch most issues

2. **Why Bun Test for Frontend (not Jest)?**
   - **Trade-off:** Bun Test is newer (less mature) vs Jest's stability
   - **Decision:** Bun Test is 3x faster than Jest; aligns with Bun runtime choice
   - **Assumption:** Team values speed over ecosystem maturity; Bun Test is stable enough

3. **Why Playwright for E2E (not Cypress)?**
   - **Trade-off:** Playwright supports multiple browsers vs Cypress's better DX
   - **Decision:** Multi-browser testing (Chrome, Firefox, Safari) catches browser-specific bugs
   - **Questionable:** Cypress has better debugging experience; consider if team prefers it

4. **Why 80% Coverage Threshold (not 90%)?**
   - **Trade-off:** Higher coverage = more comprehensive but slower test writing
   - **Decision:** 80% balances thoroughness with pragmatism; 90%+ often tests trivial code
   - **Assumption:** Critical paths are covered; diminishing returns above 80%

5. **Why Integration Tests for API + DB (not just mocked unit tests)?**
   - **Trade-off:** Integration tests slower but catch real DB issues
   - **Decision:** MongoDB query behavior (indexes, aggregations) best tested with real DB
   - **Assumption:** Docker-based test DB is fast enough (~50ms setup per test)

6. **Why Co-located Tests (not separate test directory)?**
   - **Trade-off:** Co-located = easier discoverability vs separate = cleaner structure
   - **Decision:** `flow-card.test.tsx` next to `flow-card.tsx` reduces friction
   - **Assumption:** Developers modify tests alongside implementation

7. **Why Test Each Layer Separately (not just E2E)?**
   - **Trade-off:** E2E tests cover everything but are slow and brittle
   - **Decision:** Unit tests provide fast feedback; E2E tests validate critical flows only
   - **Assumption:** 100% E2E coverage would take 10x longer with 5x flakiness

---
