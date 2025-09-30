# Epic 4: Transition Intelligence & Contextual Mock Data

**Epic Goal:** Add smart context transition features (summaries, suggestions, incomplete flow warnings). Populate app with realistic mock data for demo purposes.

**API Contract:**
```
GET    /api/contexts/{id}/summary           → Context summary
GET    /api/transitions/suggestions         → Transition suggestions
POST   /api/mock-data/generate              → Generate mock data
```

**Parallel Work Sections:**
- **Backend (Stories 4.1-4.3):** Transition logic, context summaries, mock data generation
- **Frontend (Stories 4.4-4.6):** Transition UI, suggestion display, onboarding flow
- **Mock Data (Story 4.7):** Realistic demo data generation

---

## Story 4.1: Context Summary Generation (AI-Powered)

**As a** backend developer,
**I want** AI to generate context summaries showing progress and incomplete flows,
**so that** users get an overview when switching contexts.

### Acceptance Criteria

1. **Summary generation method in `my_flow_api/app/services/ai_service.py`:**
   - `generate_context_summary(context_id: str, user_id: str) -> ContextSummary`
   - Fetches flows (completed and incomplete) for context
   - Fetches recent conversation highlights
   - Uses AI to generate natural language summary: "You have 3 incomplete flows in your Work context. Last activity: discussed Q4 roadmap."

2. **Summary model created in `my_flow_api/app/models/summary.py`:**
   - `ContextSummary`: `context_id`, `incomplete_flows_count`, `completed_flows_count`, `summary_text` (str), `last_activity` (datetime), `top_priorities` (List[FlowResponse])

3. **API endpoint created in `my_flow_api/app/api/v1/contexts.py`:**
   - `GET /api/v1/contexts/{id}/summary` → Returns `ContextSummary`
   - Requires authentication
   - Caches summary for 5 minutes to reduce AI API calls

4. **Unit tests created in `my_flow_api/tests/test_services/test_summary.py`:**
   - Tests summary generation with mock flows and conversations
   - Tests caching behavior
   - At least 80% coverage

5. **Manual testing:**
   - Summary accurately reflects flows and conversations
   - Summary updates when flows are added/completed

---

## Story 4.2: Transition Suggestions Service

**As a** backend developer,
**I want** intelligent transition suggestions when users switch contexts,
**so that** users are reminded of incomplete flows and priorities.

### Acceptance Criteria

1. **Suggestions method in `my_flow_api/app/services/transition_service.py`:**
   - `get_transition_suggestions(from_context_id: str, to_context_id: str, user_id: str) -> TransitionSuggestions`
   - Analyzes incomplete flows in target context
   - Identifies high-priority flows due soon
   - Returns structured suggestions: "Before switching, you have 2 high-priority flows in your Work context due today."

2. **Suggestions model created in `my_flow_api/app/models/transition.py`:**
   - `TransitionSuggestions`: `from_context`, `to_context`, `warnings` (List[str]), `suggestions` (List[str]), `urgent_flows` (List[FlowResponse])

3. **API endpoint created in `my_flow_api/app/api/v1/transitions.py`:**
   - `GET /api/v1/transitions/suggestions?from={context_id}&to={context_id}` → Returns `TransitionSuggestions`
   - Requires authentication

4. **Unit tests created in `my_flow_api/tests/test_services/test_transition.py`:**
   - Tests suggestions with various flow states
   - Tests urgency detection (due today, overdue)
   - At least 80% coverage

---

## Story 4.3: Incomplete Flow Warnings

**As a** backend developer,
**I want** warnings when users have incomplete flows in a context,
**so that** users are aware of pending tasks before switching away.

### Acceptance Criteria

1. **Warning logic in `my_flow_api/app/services/transition_service.py`:**
   - `check_incomplete_flows(context_id: str, user_id: str) -> IncompleteFlowWarning`
   - Counts incomplete flows
   - Identifies overdue flows (past due date)
   - Returns warning object with counts and flow details

2. **Warning model created in `my_flow_api/app/models/transition.py`:**
   - `IncompleteFlowWarning`: `context_id`, `incomplete_count`, `overdue_count`, `overdue_flows` (List[FlowResponse])

3. **Integration with context switch endpoint:**
   - When user switches context, backend returns warning if incomplete flows exist
   - Frontend displays confirmation dialog: "You have 3 incomplete flows in Work. Switch anyway?"

4. **Unit tests created in `my_flow_api/tests/test_services/test_warnings.py`:**
   - Tests warning generation with various flow states
   - Tests overdue detection
   - At least 80% coverage

---

## Story 4.4: Transition Suggestions UI (shadcn/ui)

**As a** frontend developer,
**I want** a UI component showing transition suggestions,
**so that** users see helpful reminders when switching contexts.

### Acceptance Criteria

1. **Suggestions component created in `my_flow_client/components/transitions/transition-suggestions.tsx`:**
   - Uses shadcn/ui `Dialog` or `Alert` component
   - Displays warnings, suggestions, and urgent flows
   - "Continue" button to proceed with switch
   - "View Flows" button to see details before switching

2. **Styling uses CSS design tokens:**
   - Warning indicators use `var(--color-accent-work)` (or context color)
   - Background uses `var(--color-bg-secondary)`
   - Urgent flows highlighted with red accent

3. **Integration with Context Switcher:**
   - When user selects new context, fetch suggestions from API
   - Display dialog if warnings exist
   - Allow user to proceed or cancel switch

4. **Component props typed with TypeScript:**
   ```typescript
   interface TransitionSuggestionsProps {
     fromContext: Context;
     toContext: Context;
     suggestions: TransitionSuggestions;
     onContinue: () => void;
     onCancel: () => void;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/transitions/transition-suggestions.test.tsx`:**
   - Tests rendering with mock suggestions
   - Tests "Continue" and "Cancel" actions
   - At least 80% coverage

6. **Storybook story created:**
   - Shows suggestions with 2 warnings and 3 urgent flows
   - Shows empty state (no warnings)
   - Dark mode only

---

## Story 4.5: Context Summary Dashboard Widget

**As a** frontend developer,
**I want** a dashboard widget showing summaries for all contexts,
**so that** users can see their progress at a glance.

### Acceptance Criteria

1. **Dashboard widget created in `my_flow_client/components/dashboard/context-summary-widget.tsx`:**
   - Uses shadcn/ui `Card` components
   - Displays each context with:
     - Context name, icon, color indicator
     - Incomplete flows count
     - Last activity timestamp
     - Mini progress bar (completed vs incomplete)
   - Click to switch to context

2. **Styling uses CSS design tokens:**
   - Context cards use `var(--color-bg-secondary)`
   - Progress bars use context accent colors
   - Spacing and borders use design tokens

3. **Data fetching:**
   - TanStack Query hook: `useContextSummaries()`
   - Fetches summaries for all user contexts
   - Caches for 5 minutes (summaries don't change frequently)

4. **Component props typed with TypeScript:**
   ```typescript
   interface ContextSummaryWidgetProps {
     contexts: Context[];
     summaries: ContextSummary[];
     onContextClick: (contextId: string) => void;
     className?: string;
   }
   ```

5. **Unit tests created in `my_flow_client/__tests__/components/dashboard/context-summary-widget.test.tsx`:**
   - Tests rendering with mock contexts and summaries
   - Tests click to switch context
   - At least 80% coverage

6. **Storybook story created:**
   - Shows dashboard with 4 context summaries
   - Shows loading state
   - Dark mode only

---

## Story 4.6: Onboarding Flow for New Users

**As a** frontend developer,
**I want** an onboarding flow that creates sample contexts and flows,
**so that** new users understand the app quickly.

### Acceptance Criteria

1. **Onboarding modal created in `my_flow_client/components/onboarding/onboarding-modal.tsx`:**
   - Uses shadcn/ui `Dialog` component
   - Multi-step wizard (3 steps):
     - Step 1: Welcome screen explaining contexts
     - Step 2: Create first context (with name, icon, color picker)
     - Step 3: Add first flow manually or via AI chat
   - "Skip" button to dismiss

2. **Sample context creation:**
   - "Get Started" button creates 4 default contexts: Work, Personal, Rest, Social
   - Each context has sample flows (3-5 flows per context)
   - Uses mock data generation API or frontend-only data

3. **Onboarding trigger:**
   - Modal appears on first login (checks if user has 0 contexts)
   - Can be manually triggered from settings

4. **Styling uses CSS design tokens:**
   - Modal background uses `var(--color-bg-primary)`
   - Buttons use context accent colors
   - Spacing and typography use design tokens

5. **Unit tests created in `my_flow_client/__tests__/components/onboarding/onboarding-modal.test.tsx`:**
   - Tests multi-step wizard navigation
   - Tests sample context creation
   - Tests skip action
   - At least 80% coverage

6. **Storybook story created:**
   - Shows each onboarding step
   - Shows completed state
   - Dark mode only

---

## Story 4.7: Mock Data Generation (Backend & Frontend)

**As a** developer,
**I want** realistic mock data for demo purposes,
**so that** the app looks populated and users can evaluate functionality.

### Acceptance Criteria

1. **Mock data script created in `my_flow_api/scripts/generate_mock_data.py`:**
   - Generates 4 contexts: Work, Personal, Fitness, Learning
   - Generates 20-30 flows per context (mix of completed and incomplete)
   - Generates conversation history (10-15 messages per context)
   - Uses realistic text (e.g., "Finish Q4 presentation", "Call dentist for appointment")

2. **API endpoint created in `my_flow_api/app/api/v1/mock_data.py`:**
   - `POST /api/v1/mock-data/generate` → Generates mock data for authenticated user
   - Protected endpoint (only available in development/staging, not production)
   - Returns: `{"contexts_created": 4, "flows_created": 100, "conversations_created": 4}`

3. **Frontend mock data button:**
   - Settings page includes "Generate Mock Data" button (only visible in dev mode)
   - Calls API endpoint and refreshes all contexts/flows

4. **Quality criteria:**
   - Mock flows have varied priorities (high, medium, low)
   - Mock flows have realistic due dates (some overdue, some upcoming, some far future)
   - Mock conversations include flow extraction examples
   - Mock data demonstrates all features (completed flows, incomplete flows, context switching)

5. **Unit tests created in `my_flow_api/tests/test_scripts/test_mock_data.py`:**
   - Tests mock data generation
   - Verifies correct counts and data structure
   - At least 80% coverage

6. **Documentation:**
   - README includes instructions for generating mock data
   - Example: `op run -- python scripts/generate_mock_data.py --user-id=<user_id>`

---
