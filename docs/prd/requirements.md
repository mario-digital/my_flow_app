# Requirements

## Functional

- FR1: Users can create, edit, and delete named contexts (e.g., "Work", "Personal", "Fitness", "Family")
- FR2: Each context has a distinct visual identity (color, icon) for quick recognition
- FR3: Users can switch between contexts with a single interaction (dropdown or shortcut)
- FR4: Within each context, users can converse with an AI assistant about their tasks and plans
- FR5: The AI assistant extracts actionable "flows" (task sequences) from conversation and displays them as structured items
- FR6: Users can view all flows associated with the current context
- FR7: Users can manually mark flows as complete or delete them
- FR8: Users can edit flow details (title, description, priority) after AI extraction
- FR9: The system preserves conversation history and flow state when switching between contexts
- FR10: Users can view a summary of their current context including active flows and recent conversation highlights
- FR11: The AI provides contextual suggestions when transitioning between contexts (e.g., "You have 3 incomplete flows in your Work context")
- FR12: Users authenticate via a secure third-party identity provider (Logto)
- FR13: All user data (contexts, flows, conversations) is private and isolated per user account
- FR14: The system supports real-time AI streaming responses for natural conversation flow
- FR15: Users can archive completed contexts and flows for historical reference
- FR16: The system provides a dashboard view showing all contexts with flow counts and completion status
- FR17: Users can search across all contexts and flows using keywords

## Non Functional

- NFR1: The application must support real-time AI streaming with response latency under 2 seconds
- NFR2: Context switching operations must complete in under 500ms to maintain flow
- NFR3: The system must handle at least 100 concurrent users without performance degradation
- NFR4: All user data must be encrypted at rest and in transit
- NFR5: The application must achieve 99% uptime during MVP evaluation period
- NFR6: The frontend must be responsive and work on desktop browsers (Chrome, Firefox, Safari, Edge)
- NFR7: The application must use MongoDB free tier (512MB storage limit) efficiently
- NFR8: API response times must be under 200ms for CRUD operations (excluding AI inference)
- NFR9: The application must be deployable to Vercel (frontend) and Railway/Render (backend) free tiers
- NFR10: All backend code must have at least 80% test coverage
- NFR11: All frontend code must have at least 70% test coverage
- NFR12: The application must implement proper error handling and user-friendly error messages
- NFR13: The system must support graceful degradation if AI services are temporarily unavailable
- NFR14: All code must follow TypeScript strict mode (frontend) and Python type hints with mypy (backend)
- NFR15: The application must meet WCAG AA accessibility standards for keyboard navigation and screen readers

---
