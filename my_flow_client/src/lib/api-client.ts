'use server';

import { getAccessToken } from '@logto/next/server-actions';
import { logtoConfig } from './logto';
import { AppError } from './errors';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000';

/**
 * Retrieves an API access token for the configured Logto resource.
 *
 * This server action fetches a valid access token from Logto for making
 * authenticated API requests. The token is scoped to the resource specified
 * in the `NEXT_PUBLIC_LOGTO_RESOURCE` environment variable.
 *
 * @returns {Promise<string | null>} The access token, or null if unavailable
 *
 * @example
 * ```typescript
 * const token = await getApiAccessToken();
 * if (token) {
 *   // Use token for API request
 * }
 * ```
 */
export async function getApiAccessToken(): Promise<string | null> {
  try {
    const resource = process.env['NEXT_PUBLIC_LOGTO_RESOURCE'];
    if (!resource) {
      console.error('NEXT_PUBLIC_LOGTO_RESOURCE is not configured');
      return null;
    }

    const accessToken = await getAccessToken(logtoConfig, resource);
    return accessToken;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Makes an authenticated API request to the backend.
 *
 * This server action is a centralized wrapper for all backend API calls.
 * It automatically:
 * - Retrieves the access token from Logto
 * - Adds the Authorization header with the Bearer token
 * - Sets Content-Type to application/json
 * - Handles errors and throws descriptive error messages
 *
 * @template T - The expected response type
 * @param {string} endpoint - The API endpoint path (e.g., `/api/flows`)
 * @param {RequestInit} [options={}] - Fetch options (method, body, headers, etc.)
 * @returns {Promise<T>} The parsed JSON response
 * @throws {Error} If the API request fails or returns a non-ok status
 *
 * @example
 * ```typescript
 * import type { ProtectedResponse } from '@/types/api';
 *
 * // GET request
 * const data = await apiRequest<ProtectedResponse>('/protected');
 *
 * // POST request
 * const result = await apiRequest<Flow>('/flows', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'New Flow' }),
 * });
 * ```
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getApiAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage: string | undefined;
    try {
      const data = (await response.json()) as { detail?: unknown } | undefined;
      if (data && typeof data === 'object' && 'detail' in data) {
        const detail = (data as { detail?: unknown }).detail;
        if (typeof detail === 'string' && detail.trim().length > 0) {
          errorMessage = detail;
        }
      }
    } catch {
      // ignore JSON parsing errors – fall back to status text
    }

    const statusCode = response.status;
    const statusText = response.statusText || 'Unknown Error';
    const developerMessage = `API request failed: ${statusCode} ${statusText}`;

    throw new AppError(developerMessage, statusCode, errorMessage);
  }

  // Some endpoints (e.g., DELETE returning 204) may not include a JSON body.
  // Attempt to parse JSON but fall back to undefined for empty responses.
  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}
