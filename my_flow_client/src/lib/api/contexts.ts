import { apiRequest } from '@/lib/api-client';
import { AppError } from '@/lib/errors';
import type { components } from '@/types/api';

// Type aliases from generated OpenAPI typings per coding standards Section 1
type Context = components['schemas']['ContextInDB'];
type ContextCreate = components['schemas']['ContextCreate'];
type ContextUpdate = components['schemas']['ContextUpdate'];

/**
 * Fetches all contexts for the authenticated user.
 *
 * Returns a list of all contexts owned by the user. The backend enforces
 * authorization using the JWT token passed via server action.
 *
 * The backend returns a paginated response, but we extract just the items array.
 *
 * @returns Promise resolving to array of Context objects
 * @throws {AppError} When request fails or user is unauthorized
 *
 * @example
 * ```typescript
 * const contexts = await fetchContexts();
 * console.log(`Found ${contexts.length} contexts`);
 * ```
 */
export async function fetchContexts(): Promise<Context[]> {
  const response = await apiRequest<{
    items: Context[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  }>('/api/v1/contexts');

  return response.items;
}

/**
 * Fetches a single context by ID.
 *
 * Returns null if the context doesn't exist (404), allowing consuming code
 * to treat missing contexts as empty state rather than an error condition.
 * All other errors are re-thrown.
 *
 * @param id - Context ID to fetch
 * @returns Promise resolving to Context object or null if not found
 * @throws {AppError} When request fails (except 404)
 *
 * @example
 * ```typescript
 * const context = await fetchContextById('507f1f77bcf86cd799439011');
 * if (!context) {
 *   // Handle missing context (redirect or show message)
 *   return;
 * }
 * ```
 */
export async function fetchContextById(id: string): Promise<Context | null> {
  try {
    return await apiRequest<Context>(`/api/v1/contexts/${id}`);
  } catch (error) {
    // Treat 404 as null (missing context is empty state, not error)
    if (error instanceof AppError && error.statusCode === 404) {
      return null;
    }
    // Re-throw all other errors (401, 403, 500, etc.)
    throw error;
  }
}

/**
 * Creates a new context for the authenticated user.
 *
 * The backend automatically assigns the context to the authenticated user
 * based on the JWT token. Color must be hex format (#RRGGBB) and icon
 * should be a single emoji character.
 *
 * @param data - Context creation data
 * @returns Promise resolving to the created Context with server-assigned ID
 * @throws {AppError} When validation fails or request fails
 *
 * @example
 * ```typescript
 * const newContext = await createContext({
 *   name: 'Work',
 *   color: '#3B82F6',
 *   icon: '💼'
 * });
 * console.log(`Created context: ${newContext.id}`);
 * ```
 */
export async function createContext(data: ContextCreate): Promise<Context> {
  return apiRequest<Context>('/api/v1/contexts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Updates an existing context by ID.
 *
 * All fields in ContextUpdate are optional. Only provided fields will be
 * updated. Requires ownership of the context (enforced by backend).
 *
 * @param id - Context ID to update
 * @param data - Partial context data to update
 * @returns Promise resolving to the updated Context
 * @throws {AppError} When context not found, unauthorized, or validation fails
 *
 * @example
 * ```typescript
 * const updated = await updateContext('507f1f77bcf86cd799439011', {
 *   name: 'Work (Updated)',
 *   color: '#3B82F6'
 * });
 * console.log(`Updated context: ${updated.name}`);
 * ```
 */
export async function updateContext(
  id: string,
  data: ContextUpdate
): Promise<Context> {
  return apiRequest<Context>(`/api/v1/contexts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Deletes a context by ID.
 *
 * Deletes the context and all associated flows (cascade delete enforced by backend).
 * Requires ownership of the context. Returns void on success.
 *
 * @param id - Context ID to delete
 * @returns Promise resolving to void on successful deletion
 * @throws {AppError} When context not found, unauthorized, or deletion fails
 *
 * @example
 * ```typescript
 * await deleteContext('507f1f77bcf86cd799439011');
 * console.log('Context deleted successfully');
 * ```
 */
export async function deleteContext(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/contexts/${id}`, {
    method: 'DELETE',
  });
}
