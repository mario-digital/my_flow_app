/**
 * Custom error class for application errors with user-friendly messages.
 *
 * This class extends the native Error class to provide:
 * - HTTP status codes for API errors
 * - User-friendly messages suitable for displaying in toasts
 * - Developer-friendly messages for debugging
 */
export class AppError extends Error {
  statusCode?: number;
  userMessage?: string;

  constructor(message: string, statusCode?: number, userMessage?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }
}

/**
 * Transforms any error into an AppError with user-friendly messages.
 *
 * This function is used throughout the application to convert errors
 * from various sources (fetch, network, API) into consistent AppError
 * instances with appropriate user messages.
 *
 * @param error - The error to transform (can be Error, string, or unknown)
 * @returns AppError instance with user-friendly message
 *
 * @example
 * ```typescript
 * try {
 *   await apiRequest('/api/contexts');
 * } catch (error) {
 *   const appError = transformError(error);
 *   toast.error(appError.userMessage);
 * }
 * ```
 */
export function transformError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Handle fetch/network errors
  if (error instanceof Error) {
    // Network errors
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    ) {
      return new AppError(
        error.message,
        undefined,
        'Network error. Please check your connection and try again.'
      );
    }

    // API errors with status codes
    const statusMatch = error.message.match(/API request failed: (\d+)/);
    if (statusMatch && statusMatch[1]) {
      const statusCode = parseInt(statusMatch[1], 10);
      return new AppError(
        error.message,
        statusCode,
        getStatusMessage(statusCode)
      );
    }

    // Generic error
    return new AppError(
      error.message,
      undefined,
      'An unexpected error occurred. Please try again.'
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppError(
      error,
      undefined,
      'An unexpected error occurred. Please try again.'
    );
  }

  // Unknown error type
  return new AppError(
    'Unknown error',
    undefined,
    'An unexpected error occurred. Please try again.'
  );
}

/**
 * Maps HTTP status codes to user-friendly messages.
 *
 * @param statusCode - HTTP status code
 * @returns User-friendly error message
 */
function getStatusMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please sign in and try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}
