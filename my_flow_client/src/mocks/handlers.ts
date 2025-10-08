import { http, HttpResponse, delay } from 'msw';
import { CONTEXT_MESSAGES } from '@/lib/messages/contexts';
import type { components } from '@/types/api';

type Context = components['schemas']['ContextInDB'];

// Mock context data for testing
let mockContexts: Context[] = [
  {
    id: '507f1f77bcf86cd799439011',
    user_id: 'test-user-123',
    name: 'Work',
    color: '#3B82F6',
    icon: '💼',
    created_at: '2025-10-05T10:00:00Z',
    updated_at: '2025-10-05T10:00:00Z',
  },
  {
    id: '507f1f77bcf86cd799439022',
    user_id: 'test-user-123',
    name: 'Personal',
    color: '#10B981',
    icon: '🏠',
    created_at: '2025-10-06T11:00:00Z',
    updated_at: '2025-10-06T11:00:00Z',
  },
  {
    id: '507f1f77bcf86cd799439033',
    user_id: 'test-user-123',
    name: 'Fitness',
    color: '#EF4444',
    icon: '💪',
    created_at: '2025-10-07T12:00:00Z',
    updated_at: '2025-10-07T12:00:00Z',
  },
];

/**
 * MSW request handlers for context API endpoints.
 *
 * These handlers mock backend behavior for testing:
 * - Realistic network latency (50-200ms)
 * - Proper HTTP status codes
 * - Validation error responses
 * - In-memory state management
 */
export const handlers = [
  // GET /api/v1/contexts - List all contexts
  http.get('*/api/v1/contexts', async () => {
    await delay(100); // Simulate network latency
    return HttpResponse.json(mockContexts);
  }),

  // GET /api/v1/contexts/:id - Get single context
  http.get('*/api/v1/contexts/:id', async ({ params }) => {
    await delay(50);
    const context = mockContexts.find((ctx) => ctx.id === params['id']);
    if (!context) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Not Found',
      });
    }
    return HttpResponse.json(context);
  }),

  // POST /api/v1/contexts - Create context
  http.post('*/api/v1/contexts', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as {
      name: string;
      color: string;
      icon: string;
    };

    // Validation: name length
    if (!body.name || body.name.length > 50) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.createError },
        { status: 400 }
      );
    }

    // Validation: color format
    if (!body.color || !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return HttpResponse.json(
        { detail: 'Invalid color format. Use #RRGGBB hex format.' },
        { status: 400 }
      );
    }

    // Validation: icon exists
    if (!body.icon) {
      return HttpResponse.json({ detail: 'Icon is required' }, { status: 400 });
    }

    const created: Context = {
      ...body,
      id: crypto.randomUUID(),
      user_id: 'test-user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockContexts.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // PUT /api/v1/contexts/:id - Update context
  http.put('*/api/v1/contexts/:id', async ({ request, params }) => {
    await delay(150);
    const existingIndex = mockContexts.findIndex(
      (ctx) => ctx.id === params['id']
    );
    if (existingIndex === -1) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.updateError },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      name?: string | null;
      color?: string | null;
      icon?: string | null;
    };

    // Validation: color format if provided
    if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return HttpResponse.json(
        { detail: 'Invalid color format. Use #RRGGBB hex format.' },
        { status: 400 }
      );
    }

    // Apply updates only if provided (partial update)
    const existing = mockContexts[existingIndex];
    if (!existing) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.updateError },
        { status: 404 }
      );
    }

    if (body.name != null) {
      existing.name = body.name;
    }
    if (body.color != null) {
      existing.color = body.color;
    }
    if (body.icon != null) {
      existing.icon = body.icon;
    }
    existing.updated_at = new Date().toISOString();
    return HttpResponse.json(mockContexts[existingIndex]);
  }),

  // DELETE /api/v1/contexts/:id - Delete context
  http.delete('*/api/v1/contexts/:id', async ({ params }) => {
    await delay(120);
    const index = mockContexts.findIndex((ctx) => ctx.id === params['id']);
    if (index === -1) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.deleteError },
        { status: 404 }
      );
    }
    mockContexts.splice(index, 1);
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];

/**
 * Reset mock contexts to initial state.
 * Useful for test isolation between test cases.
 */
export function resetMockContexts(): void {
  mockContexts = [
    {
      id: '507f1f77bcf86cd799439011',
      user_id: 'test-user-123',
      name: 'Work',
      color: '#3B82F6',
      icon: '💼',
      created_at: '2025-10-05T10:00:00Z',
      updated_at: '2025-10-05T10:00:00Z',
    },
    {
      id: '507f1f77bcf86cd799439022',
      user_id: 'test-user-123',
      name: 'Personal',
      color: '#10B981',
      icon: '🏠',
      created_at: '2025-10-06T11:00:00Z',
      updated_at: '2025-10-06T11:00:00Z',
    },
    {
      id: '507f1f77bcf86cd799439033',
      user_id: 'test-user-123',
      name: 'Fitness',
      color: '#EF4444',
      icon: '💪',
      created_at: '2025-10-07T12:00:00Z',
      updated_at: '2025-10-07T12:00:00Z',
    },
  ];
}

/**
 * Get current mock contexts (for test assertions).
 */
export function getMockContexts(): Context[] {
  return [...mockContexts];
}
