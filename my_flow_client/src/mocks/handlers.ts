import { http, HttpResponse, delay, type HttpHandler } from 'msw';
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
export const handlers: HttpHandler[] = [
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
    if (!/^#[0-9A-F]{6}$/i.test(body.color)) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.createError },
        { status: 400 }
      );
    }

    // Create new context
    const newContext: Context = {
      id: `507f${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
      user_id: 'test-user-123',
      name: body.name,
      color: body.color,
      icon: body.icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockContexts.push(newContext);
    return HttpResponse.json(newContext);
  }),

  // PUT /api/v1/contexts/:id - Update context
  http.put('*/api/v1/contexts/:id', async ({ params, request }) => {
    await delay(100);

    const index = mockContexts.findIndex((c) => c.id === params['id']);
    if (index === -1) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.updateError },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      color?: string;
      icon?: string;
    };

    // Validation: name length (if provided)
    if (body.name && body.name.length > 50) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.updateError },
        { status: 400 }
      );
    }

    // Validation: color format (if provided)
    if (body.color && !/^#[0-9A-F]{6}$/i.test(body.color)) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.updateError },
        { status: 400 }
      );
    }

    // Update context
    const existing = mockContexts[index];
    if (!existing) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.updateError },
        { status: 404 }
      );
    }

    mockContexts[index] = {
      id: existing.id,
      user_id: existing.user_id,
      created_at: existing.created_at,
      name: body.name ?? existing.name,
      color: body.color ?? existing.color,
      icon: body.icon ?? existing.icon,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(mockContexts[index]);
  }),

  // DELETE /api/v1/contexts/:id - Delete context
  http.delete('*/api/v1/contexts/:id', async ({ params }) => {
    await delay(100);
    const index = mockContexts.findIndex((c) => c.id === params['id']);
    if (index === -1) {
      return HttpResponse.json(
        { detail: CONTEXT_MESSAGES.deleteError },
        { status: 404 }
      );
    }

    mockContexts.splice(index, 1);
    return HttpResponse.json({ detail: CONTEXT_MESSAGES.deleteSuccess });
  }),
];

/**
 * Resets mock contexts to initial state between tests.
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
