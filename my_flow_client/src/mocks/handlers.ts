import { http, HttpResponse, delay, type HttpHandler } from 'msw';
import { CONTEXT_MESSAGES } from '@/lib/messages/contexts';
import { FLOW_MESSAGES } from '@/lib/messages/flows';
import type { components } from '@/types/api';

type Context = components['schemas']['ContextInDB'];
type Flow = components['schemas']['FlowInDB'];
type FlowCreate = components['schemas']['FlowCreate'];
type FlowUpdate = components['schemas']['FlowUpdate'];

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

// Mock flow data for testing
let mockFlows: Flow[] = [
  {
    id: 'flow-001',
    context_id: '507f1f77bcf86cd799439011', // Work context
    user_id: 'test-user-123',
    title: 'Complete project documentation',
    description: 'Write comprehensive API docs',
    priority: 'high',
    is_completed: false,
    due_date: '2025-10-15T17:00:00Z',
    reminder_enabled: true,
    created_at: '2025-10-05T10:00:00Z',
    updated_at: '2025-10-05T10:00:00Z',
    completed_at: null,
  },
  {
    id: 'flow-002',
    context_id: '507f1f77bcf86cd799439011', // Work context
    user_id: 'test-user-123',
    title: 'Fix critical bugs',
    description: 'Address P0 issues reported by QA',
    priority: 'high',
    is_completed: true,
    due_date: '2025-10-10T12:00:00Z',
    reminder_enabled: true,
    created_at: '2025-10-04T09:00:00Z',
    updated_at: '2025-10-09T15:30:00Z',
    completed_at: '2025-10-09T15:30:00Z',
  },
  {
    id: 'flow-003',
    context_id: '507f1f77bcf86cd799439022', // Personal context
    user_id: 'test-user-123',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    priority: 'medium',
    is_completed: false,
    due_date: '2025-10-12T18:00:00Z',
    reminder_enabled: true,
    created_at: '2025-10-06T11:00:00Z',
    updated_at: '2025-10-06T11:00:00Z',
    completed_at: null,
  },
  {
    id: 'flow-004',
    context_id: '507f1f77bcf86cd799439033', // Fitness context
    user_id: 'test-user-123',
    title: '30-minute cardio',
    description: null,
    priority: 'low',
    is_completed: false,
    due_date: null,
    reminder_enabled: false,
    created_at: '2025-10-07T12:00:00Z',
    updated_at: '2025-10-07T12:00:00Z',
    completed_at: null,
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

  // GET /api/v1/contexts/:contextId/flows - List flows for a context
  http.get('*/api/v1/contexts/:contextId/flows', async ({ params }) => {
    await delay(100);
    const contextFlows = mockFlows.filter(
      (flow) => flow.context_id === params['contextId']
    );
    // Return paginated response format matching OpenAPI spec
    return HttpResponse.json({
      items: contextFlows,
      total: contextFlows.length,
      limit: 50,
      offset: 0,
      has_more: false,
    });
  }),

  // GET /api/v1/flows/:id - Get single flow
  http.get('*/api/v1/flows/:id', async ({ params }) => {
    await delay(50);
    const flow = mockFlows.find((f) => f.id === params['id']);
    if (!flow) {
      return new HttpResponse(null, {
        status: 404,
        statusText: 'Not Found',
      });
    }
    return HttpResponse.json(flow);
  }),

  // POST /api/v1/flows - Create flow
  http.post('*/api/v1/flows', async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as FlowCreate;

    // Validation: title length
    if (!body.title || body.title.length < 1 || body.title.length > 200) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.createError },
        { status: 400 }
      );
    }

    // Create new flow
    const newFlow: Flow = {
      id: `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: 'test-user-123',
      context_id: body.context_id,
      title: body.title,
      description: body.description ?? null,
      priority: body.priority,
      is_completed: false,
      due_date: body.due_date ?? null,
      reminder_enabled: body.reminder_enabled,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };

    mockFlows.push(newFlow);
    return HttpResponse.json(newFlow, { status: 201 });
  }),

  // PUT /api/v1/flows/:id - Update flow
  http.put('*/api/v1/flows/:id', async ({ params, request }) => {
    await delay(100);

    const index = mockFlows.findIndex((f) => f.id === params['id']);
    if (index === -1) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.updateError },
        { status: 404 }
      );
    }

    const body = (await request.json()) as FlowUpdate;

    // Validation: title length (if provided)
    if (body.title && (body.title.length < 1 || body.title.length > 200)) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.updateError },
        { status: 400 }
      );
    }

    // Update flow
    const existing = mockFlows[index];
    if (!existing) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.updateError },
        { status: 404 }
      );
    }

    mockFlows[index] = {
      id: existing.id,
      context_id: existing.context_id,
      user_id: existing.user_id,
      created_at: existing.created_at,
      completed_at: existing.completed_at,
      is_completed: existing.is_completed,
      title: body.title ?? existing.title,
      description:
        body.description !== undefined
          ? body.description
          : existing.description,
      priority: body.priority ?? existing.priority,
      due_date: body.due_date !== undefined ? body.due_date : existing.due_date,
      reminder_enabled: body.reminder_enabled ?? existing.reminder_enabled,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(mockFlows[index]);
  }),

  // DELETE /api/v1/flows/:id - Delete flow
  http.delete('*/api/v1/flows/:id', async ({ params }) => {
    await delay(100);
    const index = mockFlows.findIndex((f) => f.id === params['id']);
    if (index === -1) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.deleteError },
        { status: 404 }
      );
    }

    mockFlows.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // PATCH /api/v1/flows/:id/complete - Toggle completion
  http.patch('*/api/v1/flows/:id/complete', async ({ params }) => {
    await delay(100);
    const index = mockFlows.findIndex((f) => f.id === params['id']);
    if (index === -1) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.completeError },
        { status: 404 }
      );
    }

    const flow = mockFlows[index];
    if (!flow) {
      return HttpResponse.json(
        { detail: FLOW_MESSAGES.completeError },
        { status: 404 }
      );
    }

    // Toggle completion
    mockFlows[index] = {
      ...flow,
      is_completed: !flow.is_completed,
      completed_at: !flow.is_completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(mockFlows[index]);
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

/**
 * Resets mock flows to initial state between tests.
 */
export function resetMockFlows(): void {
  mockFlows = [
    {
      id: 'flow-001',
      context_id: '507f1f77bcf86cd799439011', // Work context
      user_id: 'test-user-123',
      title: 'Complete project documentation',
      description: 'Write comprehensive API docs',
      priority: 'high',
      is_completed: false,
      due_date: '2025-10-15T17:00:00Z',
      reminder_enabled: true,
      created_at: '2025-10-05T10:00:00Z',
      updated_at: '2025-10-05T10:00:00Z',
      completed_at: null,
    },
    {
      id: 'flow-002',
      context_id: '507f1f77bcf86cd799439011', // Work context
      user_id: 'test-user-123',
      title: 'Fix critical bugs',
      description: 'Address P0 issues reported by QA',
      priority: 'high',
      is_completed: true,
      due_date: '2025-10-10T12:00:00Z',
      reminder_enabled: true,
      created_at: '2025-10-04T09:00:00Z',
      updated_at: '2025-10-09T15:30:00Z',
      completed_at: '2025-10-09T15:30:00Z',
    },
    {
      id: 'flow-003',
      context_id: '507f1f77bcf86cd799439022', // Personal context
      user_id: 'test-user-123',
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
      priority: 'medium',
      is_completed: false,
      due_date: '2025-10-12T18:00:00Z',
      reminder_enabled: true,
      created_at: '2025-10-06T11:00:00Z',
      updated_at: '2025-10-06T11:00:00Z',
      completed_at: null,
    },
    {
      id: 'flow-004',
      context_id: '507f1f77bcf86cd799439033', // Fitness context
      user_id: 'test-user-123',
      title: '30-minute cardio',
      description: null,
      priority: 'low',
      is_completed: false,
      due_date: null,
      reminder_enabled: false,
      created_at: '2025-10-07T12:00:00Z',
      updated_at: '2025-10-07T12:00:00Z',
      completed_at: null,
    },
  ];
}
