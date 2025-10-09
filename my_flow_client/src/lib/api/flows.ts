import { apiRequest } from '@/lib/api-client';
import { AppError } from '@/lib/errors';
import type { components } from '@/types/api';

// Type aliases from generated OpenAPI typings per coding standards Section 1
type Flow = components['schemas']['FlowInDB'];
type FlowCreate = components['schemas']['FlowCreate'];
type FlowUpdate = components['schemas']['FlowUpdate'];
type PaginatedFlowResponse =
  components['schemas']['PaginatedResponse_FlowInDB_'];

/**
 * Fetches all flows for a specific context.
 *
 * Returns a paginated list of flows belonging to the specified context.
 * The backend enforces authorization using the JWT token passed via server action.
 * Only flows owned by the authenticated user are returned.
 *
 * @param contextId - Context ID to fetch flows for
 * @returns Promise resolving to array of Flow objects (extracted from paginated response)
 * @throws {AppError} When request fails or user is unauthorized
 *
 * @example
 * ```typescript
 * const flows = await fetchFlowsByContext('507f1f77bcf86cd799439022');
 * console.log(`Found ${flows.length} flows`);
 * ```
 */
export async function fetchFlowsByContext(contextId: string): Promise<Flow[]> {
  const response = await apiRequest<PaginatedFlowResponse>(
    `/api/v1/contexts/${contextId}/flows`
  );
  return response.items;
}

/**
 * Fetches a single flow by ID.
 *
 * Returns null if the flow doesn't exist (404), allowing consuming code
 * to treat missing flows as empty state rather than an error condition.
 * All other errors are re-thrown.
 *
 * @param id - Flow ID to fetch
 * @returns Promise resolving to Flow object or null if not found
 * @throws {AppError} When request fails (except 404)
 *
 * @example
 * ```typescript
 * const flow = await fetchFlowById('507f1f77bcf86cd799439011');
 * if (!flow) {
 *   // Handle missing flow (redirect or show message)
 *   return;
 * }
 * ```
 */
export async function fetchFlowById(id: string): Promise<Flow | null> {
  try {
    return await apiRequest<Flow>(`/api/v1/flows/${id}`);
  } catch (error) {
    // Treat 404 as null (missing flow is empty state, not error)
    if (error instanceof AppError && error.statusCode === 404) {
      return null;
    }
    // Re-throw all other errors (401, 403, 500, etc.)
    throw error;
  }
}

/**
 * Creates a new flow in a context.
 *
 * The backend automatically assigns the flow to the authenticated user
 * based on the JWT token. Requires ownership of the parent context.
 *
 * @param data - Flow creation data
 * @returns Promise resolving to the created Flow with server-assigned ID
 * @throws {AppError} When validation fails, context not found, or request fails
 *
 * @example
 * ```typescript
 * const newFlow = await createFlow({
 *   context_id: '507f1f77bcf86cd799439022',
 *   title: 'Complete project documentation',
 *   description: 'Write comprehensive API docs',
 *   priority: 'high',
 *   due_date: '2025-10-15T17:00:00Z',
 *   reminder_enabled: true
 * });
 * console.log(`Created flow: ${newFlow.id}`);
 * ```
 */
export async function createFlow(data: FlowCreate): Promise<Flow> {
  return apiRequest<Flow>('/api/v1/flows', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Updates an existing flow by ID.
 *
 * All fields in FlowUpdate are optional. Only provided fields will be
 * updated. Requires ownership of the flow (enforced by backend).
 *
 * @param id - Flow ID to update
 * @param data - Partial flow data to update
 * @returns Promise resolving to the updated Flow
 * @throws {AppError} When flow not found, unauthorized, or validation fails
 *
 * @example
 * ```typescript
 * const updated = await updateFlow('507f1f77bcf86cd799439011', {
 *   title: 'Updated task title',
 *   priority: 'high'
 * });
 * console.log(`Updated flow: ${updated.title}`);
 * ```
 */
export async function updateFlow(id: string, data: FlowUpdate): Promise<Flow> {
  return apiRequest<Flow>(`/api/v1/flows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deletes a flow by ID.
 *
 * Permanently removes the flow from the database. Requires ownership of
 * the flow. Returns void on success.
 *
 * @param id - Flow ID to delete
 * @returns Promise resolving to void on successful deletion
 * @throws {AppError} When flow not found, unauthorized, or deletion fails
 *
 * @example
 * ```typescript
 * await deleteFlow('507f1f77bcf86cd799439011');
 * console.log('Flow deleted successfully');
 * ```
 */
export async function deleteFlow(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/flows/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toggles the completion status of a flow.
 *
 * Marks an incomplete flow as complete or vice versa. The backend handles
 * the toggle logic and sets/clears the completed_at timestamp accordingly.
 * Requires ownership of the flow.
 *
 * @param id - Flow ID to toggle completion status
 * @returns Promise resolving to the updated Flow with toggled completion status
 * @throws {AppError} When flow not found, unauthorized, or update fails
 *
 * @example
 * ```typescript
 * const updated = await completeFlow('507f1f77bcf86cd799439011');
 * console.log(`Flow completion status: ${updated.is_completed}`);
 * ```
 */
export async function completeFlow(id: string): Promise<Flow> {
  return apiRequest<Flow>(`/api/v1/flows/${id}/complete`, {
    method: 'PATCH',
  });
}
