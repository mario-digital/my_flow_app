# Data Models

Define the core data models/entities that will be shared between frontend and backend.

## Context Model

**Purpose:** Represents a user's life domain (work, personal, rest, social) with visual identity and metadata for context switching.

**Key Attributes:**
- `id`: string (MongoDB ObjectId) - Unique identifier
- `user_id`: string - Owner of the context (from Logto JWT sub claim)
- `name`: string (1-50 chars) - Display name (e.g., "Work", "Personal")
- `color`: string (hex format) - Accent color for visual distinction
- `icon`: string (emoji) - Visual icon representation
- `created_at`: datetime - Creation timestamp
- `updated_at`: datetime - Last modification timestamp

### TypeScript Interface

```typescript
// Shared between frontend and backend (generated from Pydantic)
interface Context {
  id: string;
  user_id: string;
  name: string;
  color: string; // Hex format: #3B82F6
  icon: string;  // Emoji: 💼, 🏠, 🌙, 🎉
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

interface ContextCreate {
  name: string;
  color: string;
  icon: string;
}

interface ContextUpdate {
  name?: string;
  color?: string;
  icon?: string;
}
```

### Relationships
- **One-to-Many with Flow:** A Context can have multiple Flows (cascade delete when context is deleted)
- **Many-to-One with User:** Multiple Contexts belong to a single user (enforced via `user_id` field)

---

## Flow Model

**Purpose:** Represents an actionable task or sequence of tasks extracted from AI conversation within a specific context, with optional due dates for time-sensitive flows.

**Key Attributes:**
- `id`: string (MongoDB ObjectId) - Unique identifier
- `context_id`: string (MongoDB ObjectId) - Parent context reference
- `user_id`: string - Owner (derived from context, used for authorization)
- `title`: string (1-200 chars) - Short description of the flow
- `description`: string (optional) - Detailed notes or AI-extracted context
- `priority`: "low" | "medium" | "high" - User-set or AI-inferred priority
- `is_completed`: boolean - Completion status
- `due_date`: datetime (optional) - When the flow should be completed
- `reminder_enabled`: boolean - Whether to show reminders for this flow
- `created_at`: datetime - Creation timestamp
- `updated_at`: datetime - Last modification timestamp
- `completed_at`: datetime (optional) - Completion timestamp

### TypeScript Interface

```typescript
interface Flow {
  id: string;
  context_id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  due_date?: string; // ISO 8601 datetime
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface FlowCreate {
  context_id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high"; // Defaults to "medium"
  due_date?: string; // ISO 8601 datetime
  reminder_enabled?: boolean; // Defaults to true if due_date is set
}

interface FlowUpdate {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string | null; // Can clear due date by setting to null
  reminder_enabled?: boolean;
}

// Backend computed properties for due date logic
interface FlowWithStatus extends Flow {
  status: "overdue" | "due_today" | "due_soon" | "normal";
  days_until_due?: number; // Negative if overdue
}
```

### Relationships
- **Many-to-One with Context:** Multiple Flows belong to a single Context (foreign key: `context_id`)
- **Deleted on Cascade:** When a Context is deleted, all associated Flows are deleted

---

## UserPreferences Model

**Purpose:** Stores app-specific user preferences and settings that Logto doesn't handle. Authentication and profile data (name, email, avatar) are managed by Logto.

**Key Attributes:**
- `id`: string (MongoDB ObjectId) - Unique identifier
- `user_id`: string - Logto user identifier (from JWT sub claim, unique index)
- `onboarding_completed`: boolean - Has user completed onboarding flow
- `onboarding_completed_at`: datetime (optional) - When onboarding was completed
- `current_context_id`: string (optional) - Last active context for quick restoration
- `theme`: string (optional) - UI theme preference: "light" | "dark" | "system"
- `notifications_enabled`: boolean - Global notification toggle
- `created_at`: datetime - Creation timestamp
- `updated_at`: datetime - Last modification timestamp

### TypeScript Interface

```typescript
interface UserPreferences {
  id: string;
  user_id: string; // From Logto JWT (e.g., "logto_user_abc123")
  onboarding_completed: boolean;
  onboarding_completed_at?: string; // ISO 8601 datetime
  current_context_id?: string;
  theme?: "light" | "dark" | "system";
  notifications_enabled: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface UserPreferencesCreate {
  user_id: string;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  current_context_id?: string;
  theme?: "light" | "dark" | "system";
  notifications_enabled?: boolean;
}

interface UserPreferencesUpdate {
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  current_context_id?: string;
  theme?: "light" | "dark" | "system";
  notifications_enabled?: boolean;
}
```

### Relationships
- **One-to-One with User (Logto):** Each user has exactly one UserPreferences document
- **Auto-created on first login:** If preferences don't exist, create with defaults
- **Soft reference to Context:** `current_context_id` references a Context but doesn't enforce FK (context may be deleted)

### Default Values
```typescript
const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at"> = {
  onboarding_completed: false,
  onboarding_completed_at: undefined,
  current_context_id: undefined,
  theme: undefined, // System default
  notifications_enabled: true,
};
```

---

## Conversation Model

**Purpose:** Stores chat history between user and AI within a context for continuity and flow extraction.

**Key Attributes:**
- `id`: string (MongoDB ObjectId) - Unique identifier
- `context_id`: string - Parent context reference
- `user_id`: string - Owner (for authorization and isolation)
- `messages`: Message[] - Array of message objects
- `created_at`: datetime - Creation timestamp
- `updated_at`: datetime - Last modification timestamp

### TypeScript Interface

```typescript
interface Message {
  role: "user" | "assistant" | "system";
  content: string; // Max 10,000 characters
  timestamp: string | null; // ISO 8601 datetime, auto-set if not provided
}

interface Conversation {
  id: string;
  context_id: string;
  user_id: string;
  messages: Message[];
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

interface ConversationCreate {
  context_id: string;
}

interface ConversationRequest {
  messages: Message[];
  context_id: string;
  conversation_id?: string; // If continuing an existing conversation
  is_context_switch?: boolean; // True if first message after context switch
}
```

### Relationships
- **Many-to-One with Context**: A Context can have multiple Conversations
- **Many-to-One with User**: Each Conversation belongs to a single user (enforced via `user_id`)
- **Message Array**: Messages are embedded documents within the conversation (not separate collection)

### Security
- All repository methods enforce user isolation at the data access layer (defense-in-depth)
- Atomic operations prevent TOCTOU race conditions when appending messages

---

## Database Indexes (MongoDB)

**Contexts Collection:**
- Index on `user_id` (for listing all user contexts)
- Compound index on `(user_id, created_at desc)` (for sorted listing)

**Flows Collection:**
- Index on `context_id` (for listing flows within a context)
- Compound index on `(context_id, is_completed, priority)` (for filtered/sorted queries)
- Compound index on `(context_id, due_date, is_completed)` (for due date queries and reminders)
- Compound index on `(user_id, due_date, is_completed)` (for cross-context reminder queries)
- Index on `user_id` (for user-level flow queries)

**UserPreferences Collection:**
- Unique index on `user_id` (enforce one preferences doc per user, fast lookup)

**Conversations Collection:**
- Index on `user_id` (for user isolation queries)
- Index on `context_id` (for fetching conversation history per context)
- Compound index on `(user_id, context_id)` (for user's conversations in a context)
- Compound index on `(context_id, updated_at desc)` (for recent conversations per context)
- Compound index on `(user_id, _id)` (for efficient user-scoped lookups)

---
