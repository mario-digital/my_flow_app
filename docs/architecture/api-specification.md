# API Specification

This section defines the complete REST API for My Flow, following OpenAPI 3.1 specification. The API is implemented by FastAPI backend and consumed by Next.js frontend via TanStack Query or Server Components.

## Base URL

**Production:** `https://api.myflow.app` (Railway deployment)
**Development:** `http://localhost:8000`

## Authentication

All API endpoints (except health checks) require authentication via **Logto JWT tokens**.

**Header Required:**
```
Authorization: Bearer <logto_jwt_token>
```

The JWT token contains the `sub` claim with the user's Logto ID, which maps to `user_id` in our data models. FastAPI middleware validates the token and extracts `user_id` for authorization.

**Token Validation:**
- Verify signature using Logto's public key (JWKS endpoint)
- Check expiration (`exp` claim)
- Validate issuer (`iss` claim matches Logto domain)
- Extract `sub` claim as `user_id`

## API Endpoints Overview

| Resource | Endpoints | Methods | Purpose |
|----------|-----------|---------|---------|
| Health | `/health` | GET | Service health check |
| Contexts | `/api/v1/contexts` | GET, POST | List and create contexts |
| Contexts | `/api/v1/contexts/{context_id}` | GET, PATCH, DELETE | Manage single context |
| Flows | `/api/v1/contexts/{context_id}/flows` | GET, POST | List and create flows in context |
| Flows | `/api/v1/flows/{flow_id}` | GET, PATCH, DELETE | Manage single flow |
| Flows | `/api/v1/flows` | GET | List all flows across contexts |
| Flows | `/api/v1/flows/due` | GET | Get flows with upcoming due dates |
| UserPreferences | `/api/v1/preferences` | GET, PATCH | Get and update user preferences |
| AI Chat | `/api/v1/ai/chat` | POST | Stream AI conversation (future) |

## OpenAPI 3.1 Specification

```yaml
openapi: 3.1.0
info:
  title: My Flow API
  version: 1.0.0
  description: |
    REST API for My Flow context-aware task management application.

    ## Authentication
    All endpoints (except /health) require Bearer token authentication via Logto JWT.

    ## Rate Limiting
    - 100 requests per minute per user for standard endpoints
    - 20 requests per minute for AI endpoints
  contact:
    name: My Flow Support
    email: support@myflow.app

servers:
  - url: https://api.myflow.app
    description: Production
  - url: http://localhost:8000
    description: Development

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Logto JWT token

  schemas:
    # Context Schemas
    Context:
      type: object
      required: [id, user_id, name, color, icon, created_at, updated_at]
      properties:
        id:
          type: string
          description: MongoDB ObjectId
          example: "507f1f77bcf86cd799439011"
        user_id:
          type: string
          description: Logto user identifier
          example: "logto_user_abc123"
        name:
          type: string
          minLength: 1
          maxLength: 50
          example: "Work"
        color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
          example: "#3B82F6"
        icon:
          type: string
          description: Emoji character
          example: "💼"
        created_at:
          type: string
          format: date-time
          example: "2025-09-30T10:00:00Z"
        updated_at:
          type: string
          format: date-time
          example: "2025-09-30T10:00:00Z"

    ContextCreate:
      type: object
      required: [name, color, icon]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 50
        color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
        icon:
          type: string
      example:
        name: "Work"
        color: "#3B82F6"
        icon: "💼"

    ContextUpdate:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 50
        color:
          type: string
          pattern: '^#[0-9A-Fa-f]{6}$'
        icon:
          type: string
      example:
        name: "Professional"
        color: "#2563EB"

    # Flow Schemas
    Flow:
      type: object
      required: [id, context_id, user_id, title, priority, is_completed, reminder_enabled, created_at, updated_at]
      properties:
        id:
          type: string
          example: "507f1f77bcf86cd799439012"
        context_id:
          type: string
          example: "507f1f77bcf86cd799439011"
        user_id:
          type: string
          example: "logto_user_abc123"
        title:
          type: string
          minLength: 1
          maxLength: 200
          example: "Review Q4 budget proposal"
        description:
          type: string
          nullable: true
          example: "Focus on marketing and R&D allocations"
        priority:
          type: string
          enum: [low, medium, high]
          example: "high"
        is_completed:
          type: boolean
          example: false
        due_date:
          type: string
          format: date-time
          nullable: true
          example: "2025-10-15T17:00:00Z"
        reminder_enabled:
          type: boolean
          example: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        completed_at:
          type: string
          format: date-time
          nullable: true

    FlowWithStatus:
      allOf:
        - $ref: '#/components/schemas/Flow'
        - type: object
          properties:
            status:
              type: string
              enum: [overdue, due_today, due_soon, normal]
              example: "due_soon"
            days_until_due:
              type: number
              nullable: true
              example: 3

    FlowCreate:
      type: object
      required: [context_id, title]
      properties:
        context_id:
          type: string
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
        priority:
          type: string
          enum: [low, medium, high]
          default: medium
        due_date:
          type: string
          format: date-time
          nullable: true
        reminder_enabled:
          type: boolean
          default: true
      example:
        context_id: "507f1f77bcf86cd799439011"
        title: "Review Q4 budget proposal"
        description: "Focus on marketing and R&D allocations"
        priority: "high"
        due_date: "2025-10-15T17:00:00Z"
        reminder_enabled: true

    FlowUpdate:
      type: object
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          nullable: true
        priority:
          type: string
          enum: [low, medium, high]
        due_date:
          type: string
          format: date-time
          nullable: true
        reminder_enabled:
          type: boolean
      example:
        priority: "medium"
        due_date: "2025-10-20T17:00:00Z"

    # UserPreferences Schemas
    UserPreferences:
      type: object
      required: [id, user_id, notification_preferences, ui_preferences, created_at, updated_at]
      properties:
        id:
          type: string
        user_id:
          type: string
        default_context_id:
          type: string
          nullable: true
        notification_preferences:
          type: object
          required: [email_reminders, browser_notifications, reminder_lead_time]
          properties:
            email_reminders:
              type: boolean
            browser_notifications:
              type: boolean
            reminder_lead_time:
              type: number
              description: Minutes before due date
              example: 60
        ui_preferences:
          type: object
          required: [flow_list_view, context_sort_order]
          properties:
            flow_list_view:
              type: string
              enum: [compact, detailed]
            context_sort_order:
              type: string
              enum: [recent, alphabetical, custom]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    UserPreferencesUpdate:
      type: object
      properties:
        default_context_id:
          type: string
          nullable: true
        notification_preferences:
          type: object
          properties:
            email_reminders:
              type: boolean
            browser_notifications:
              type: boolean
            reminder_lead_time:
              type: number
        ui_preferences:
          type: object
          properties:
            flow_list_view:
              type: string
              enum: [compact, detailed]
            context_sort_order:
              type: string
              enum: [recent, alphabetical, custom]
      example:
        notification_preferences:
          reminder_lead_time: 120
        ui_preferences:
          flow_list_view: "compact"

    # Error Schemas
    Error:
      type: object
      required: [detail]
      properties:
        detail:
          type: string
          example: "Resource not found"

    ValidationError:
      type: object
      required: [detail]
      properties:
        detail:
          type: array
          items:
            type: object
            properties:
              loc:
                type: array
                items:
                  type: string
              msg:
                type: string
              type:
                type: string
      example:
        detail:
          - loc: ["body", "name"]
            msg: "field required"
            type: "value_error.missing"

paths:
  /health:
    get:
      summary: Health check
      description: Check if the API service is running
      security: []
      tags: [Health]
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time

  # CONTEXTS
  /api/v1/contexts:
    get:
      summary: List all contexts
      description: Get all contexts for the authenticated user, sorted by creation date descending
      tags: [Contexts]
      parameters:
        - name: sort
          in: query
          schema:
            type: string
            enum: [recent, alphabetical]
            default: recent
      responses:
        '200':
          description: List of contexts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Context'
        '401':
          description: Unauthorized

    post:
      summary: Create context
      description: Create a new context for the authenticated user
      tags: [Contexts]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ContextCreate'
      responses:
        '201':
          description: Context created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Context'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
        '401':
          description: Unauthorized

  /api/v1/contexts/{context_id}:
    parameters:
      - name: context_id
        in: path
        required: true
        schema:
          type: string

    get:
      summary: Get context
      description: Get a single context by ID (must belong to authenticated user)
      tags: [Contexts]
      responses:
        '200':
          description: Context details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Context'
        '404':
          description: Context not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized

    patch:
      summary: Update context
      description: Update context properties (must belong to authenticated user)
      tags: [Contexts]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ContextUpdate'
      responses:
        '200':
          description: Context updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Context'
        '404':
          description: Context not found
        '401':
          description: Unauthorized

    delete:
      summary: Delete context
      description: Delete context and all associated flows (must belong to authenticated user)
      tags: [Contexts]
      responses:
        '204':
          description: Context deleted successfully
        '404':
          description: Context not found
        '401':
          description: Unauthorized

  # FLOWS
  /api/v1/contexts/{context_id}/flows:
    parameters:
      - name: context_id
        in: path
        required: true
        schema:
          type: string

    get:
      summary: List flows in context
      description: Get all flows for a specific context
      tags: [Flows]
      parameters:
        - name: completed
          in: query
          schema:
            type: boolean
          description: Filter by completion status
        - name: priority
          in: query
          schema:
            type: string
            enum: [low, medium, high]
          description: Filter by priority
      responses:
        '200':
          description: List of flows
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FlowWithStatus'
        '404':
          description: Context not found
        '401':
          description: Unauthorized

    post:
      summary: Create flow
      description: Create a new flow in the specified context
      tags: [Flows]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FlowCreate'
      responses:
        '201':
          description: Flow created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Flow'
        '400':
          description: Validation error
        '404':
          description: Context not found
        '401':
          description: Unauthorized

  /api/v1/flows:
    get:
      summary: List all flows
      description: Get all flows across all contexts for the authenticated user
      tags: [Flows]
      parameters:
        - name: completed
          in: query
          schema:
            type: boolean
        - name: priority
          in: query
          schema:
            type: string
            enum: [low, medium, high]
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 100
      responses:
        '200':
          description: List of flows
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FlowWithStatus'
        '401':
          description: Unauthorized

  /api/v1/flows/due:
    get:
      summary: Get flows with upcoming due dates
      description: Get flows with due dates within the next 7 days (or custom timeframe)
      tags: [Flows]
      parameters:
        - name: days
          in: query
          schema:
            type: integer
            default: 7
            minimum: 1
            maximum: 90
          description: Number of days ahead to check
        - name: include_overdue
          in: query
          schema:
            type: boolean
            default: true
      responses:
        '200':
          description: List of flows with due dates
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FlowWithStatus'
        '401':
          description: Unauthorized

  /api/v1/flows/{flow_id}:
    parameters:
      - name: flow_id
        in: path
        required: true
        schema:
          type: string

    get:
      summary: Get flow
      description: Get a single flow by ID (must belong to authenticated user)
      tags: [Flows]
      responses:
        '200':
          description: Flow details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FlowWithStatus'
        '404':
          description: Flow not found
        '401':
          description: Unauthorized

    patch:
      summary: Update flow
      description: Update flow properties (must belong to authenticated user)
      tags: [Flows]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FlowUpdate'
      responses:
        '200':
          description: Flow updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Flow'
        '404':
          description: Flow not found
        '401':
          description: Unauthorized

    delete:
      summary: Delete flow
      description: Delete a flow (must belong to authenticated user)
      tags: [Flows]
      responses:
        '204':
          description: Flow deleted successfully
        '404':
          description: Flow not found
        '401':
          description: Unauthorized

  /api/v1/flows/{flow_id}/complete:
    parameters:
      - name: flow_id
        in: path
        required: true
        schema:
          type: string

    post:
      summary: Mark flow as complete
      description: Toggle flow completion status
      tags: [Flows]
      responses:
        '200':
          description: Flow completion toggled
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Flow'
        '404':
          description: Flow not found
        '401':
          description: Unauthorized

  # USER PREFERENCES
  /api/v1/preferences:
    get:
      summary: Get user preferences
      description: Get preferences for the authenticated user (auto-creates with defaults if not exists)
      tags: [UserPreferences]
      responses:
        '200':
          description: User preferences
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPreferences'
        '401':
          description: Unauthorized

    patch:
      summary: Update user preferences
      description: Update user preferences (partial update supported)
      tags: [UserPreferences]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserPreferencesUpdate'
      responses:
        '200':
          description: Preferences updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPreferences'
        '400':
          description: Validation error
        '401':
          description: Unauthorized
```

## Request/Response Examples

### Create Context

**Request:**
```http
POST /api/v1/contexts
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Work",
  "color": "#3B82F6",
  "icon": "💼"
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "logto_user_abc123",
  "name": "Work",
  "color": "#3B82F6",
  "icon": "💼",
  "created_at": "2025-09-30T10:00:00Z",
  "updated_at": "2025-09-30T10:00:00Z"
}
```

### Create Flow with Due Date

**Request:**
```http
POST /api/v1/contexts/507f1f77bcf86cd799439011/flows
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "context_id": "507f1f77bcf86cd799439011",
  "title": "Review Q4 budget proposal",
  "description": "Focus on marketing and R&D allocations",
  "priority": "high",
  "due_date": "2025-10-15T17:00:00Z",
  "reminder_enabled": true
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "context_id": "507f1f77bcf86cd799439011",
  "user_id": "logto_user_abc123",
  "title": "Review Q4 budget proposal",
  "description": "Focus on marketing and R&D allocations",
  "priority": "high",
  "is_completed": false,
  "due_date": "2025-10-15T17:00:00Z",
  "reminder_enabled": true,
  "created_at": "2025-09-30T10:00:00Z",
  "updated_at": "2025-09-30T10:00:00Z",
  "completed_at": null
}
```

### Get Flows with Status

**Request:**
```http
GET /api/v1/flows/due?days=7&include_overdue=true
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "context_id": "507f1f77bcf86cd799439011",
    "user_id": "logto_user_abc123",
    "title": "Review Q4 budget proposal",
    "description": "Focus on marketing and R&D allocations",
    "priority": "high",
    "is_completed": false,
    "due_date": "2025-10-02T17:00:00Z",
    "reminder_enabled": true,
    "created_at": "2025-09-30T10:00:00Z",
    "updated_at": "2025-09-30T10:00:00Z",
    "completed_at": null,
    "status": "due_soon",
    "days_until_due": 2
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "context_id": "507f1f77bcf86cd799439011",
    "user_id": "logto_user_abc123",
    "title": "Submit expense report",
    "priority": "medium",
    "is_completed": false,
    "due_date": "2025-09-29T17:00:00Z",
    "reminder_enabled": true,
    "created_at": "2025-09-28T10:00:00Z",
    "updated_at": "2025-09-28T10:00:00Z",
    "completed_at": null,
    "status": "overdue",
    "days_until_due": -1
  }
]
```

### Update User Preferences

**Request:**
```http
PATCH /api/v1/preferences
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "notification_preferences": {
    "reminder_lead_time": 120
  },
  "ui_preferences": {
    "flow_list_view": "compact"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "user_id": "logto_user_abc123",
  "default_context_id": null,
  "notification_preferences": {
    "email_reminders": true,
    "browser_notifications": false,
    "reminder_lead_time": 120
  },
  "ui_preferences": {
    "flow_list_view": "compact",
    "context_sort_order": "recent"
  },
  "created_at": "2025-09-30T09:00:00Z",
  "updated_at": "2025-09-30T10:15:00Z"
}
```

## Error Responses

**401 Unauthorized:**
```json
{
  "detail": "Invalid or expired JWT token"
}
```

**404 Not Found:**
```json
{
  "detail": "Context with id 507f1f77bcf86cd799439011 not found"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "color"],
      "msg": "string does not match regex \"^#[0-9A-Fa-f]{6}$\"",
      "type": "value_error.str.regex"
    }
  ]
}
```

## API Design Decisions

**Design Rationale:**

1. **RESTful Resource Hierarchy:** Flows are nested under contexts (`/contexts/{id}/flows`) for creation, but also available at top level (`/flows`) for cross-context queries. This balance supports both context-centric and global views required by the UI.

2. **Computed Status Fields:** The `/flows/due` endpoint and `FlowWithStatus` schema include computed fields (`status`, `days_until_due`) calculated server-side. This keeps frontend logic simple and ensures consistent due date calculations.

3. **PATCH for Updates:** Using PATCH (partial updates) instead of PUT allows frontend to send only changed fields, reducing payload size and preventing accidental overwrites of unmodified properties.

4. **Auto-creation Pattern:** UserPreferences GET endpoint auto-creates with defaults if not found (idempotent). This eliminates the need for explicit initialization on signup.

5. **Query Parameters for Filtering:** List endpoints support query parameters (`completed`, `priority`, `days`) instead of separate endpoints, reducing API surface area while maintaining flexibility.

6. **Cascade Deletes:** Deleting a context automatically deletes associated flows (enforced server-side). This prevents orphaned flows and matches user expectations.

7. **Completion Toggle Endpoint:** Dedicated POST `/flows/{id}/complete` endpoint for toggling completion status provides cleaner optimistic updates than PATCH with full payload.

---
