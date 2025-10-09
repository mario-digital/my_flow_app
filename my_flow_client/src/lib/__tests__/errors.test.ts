import { describe, it, expect } from 'vitest';
import { AppError, transformError } from '../errors';

describe('AppError', () => {
  it('creates error with message only', () => {
    const error = new AppError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.userMessage).toBeUndefined();
  });

  it('creates error with status code', () => {
    const error = new AppError('Test error', 404);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.userMessage).toBeUndefined();
  });

  it('creates error with user message', () => {
    const error = new AppError('Test error', 500, 'Something went wrong');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.userMessage).toBe('Something went wrong');
  });
});

describe('transformError', () => {
  describe('when error is already an AppError', () => {
    it('returns the same AppError instance', () => {
      const appError = new AppError('Test error', 404, 'Not found');
      const result = transformError(appError);

      expect(result).toBe(appError);
      expect(result.message).toBe('Test error');
      expect(result.statusCode).toBe(404);
      expect(result.userMessage).toBe('Not found');
    });
  });

  describe('when error is a network error', () => {
    it('handles "Failed to fetch" errors', () => {
      const fetchError = new Error('Failed to fetch');
      const result = transformError(fetchError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Failed to fetch');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'Network error. Please check your connection and try again.'
      );
    });

    it('handles "NetworkError" errors', () => {
      const networkError = new Error(
        'NetworkError when attempting to fetch resource'
      );
      const result = transformError(networkError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe(
        'NetworkError when attempting to fetch resource'
      );
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'Network error. Please check your connection and try again.'
      );
    });
  });

  describe('when error is an API error with status code', () => {
    it('handles 400 Bad Request', () => {
      const apiError = new Error('API request failed: 400 Bad Request');
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('API request failed: 400 Bad Request');
      expect(result.statusCode).toBe(400);
      expect(result.userMessage).toBe(
        'Invalid request. Please check your input and try again.'
      );
    });

    it('handles 401 Unauthorized', () => {
      const apiError = new Error('API request failed: 401 Unauthorized');
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(401);
      expect(result.userMessage).toBe(
        'Authentication required. Please sign in and try again.'
      );
    });

    it('handles 403 Forbidden', () => {
      const apiError = new Error('API request failed: 403 Forbidden');
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(403);
      expect(result.userMessage).toBe(
        'You do not have permission to perform this action.'
      );
    });

    it('handles 404 Not Found', () => {
      const apiError = new Error('API request failed: 404 Not Found');
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(404);
      expect(result.userMessage).toBe('The requested resource was not found.');
    });

    it('handles 429 Too Many Requests', () => {
      const apiError = new Error('API request failed: 429 Too Many Requests');
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(429);
      expect(result.userMessage).toBe(
        'Too many requests. Please wait a moment and try again.'
      );
    });

    it('handles 500 Internal Server Error', () => {
      const apiError = new Error(
        'API request failed: 500 Internal Server Error'
      );
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(500);
      expect(result.userMessage).toBe('Server error. Please try again later.');
    });

    it('handles 503 Service Unavailable', () => {
      const apiError = new Error('API request failed: 503 Service Unavailable');
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(503);
      expect(result.userMessage).toBe(
        'Service temporarily unavailable. Please try again later.'
      );
    });

    it('handles unknown status codes', () => {
      const apiError = new Error("API request failed: 418 I'm a teapot");
      const result = transformError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.statusCode).toBe(418);
      expect(result.userMessage).toBe('An error occurred. Please try again.');
    });
  });

  describe('when error is a generic Error', () => {
    it('transforms to AppError with generic user message', () => {
      const genericError = new Error('Something unexpected happened');
      const result = transformError(genericError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Something unexpected happened');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  describe('when error is a string', () => {
    it('transforms string to AppError', () => {
      const result = transformError('String error message');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('String error message');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });

  describe('when error is unknown type', () => {
    it('handles null', () => {
      const result = transformError(null);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });

    it('handles undefined', () => {
      const result = transformError(undefined);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });

    it('handles objects', () => {
      const result = transformError({ foo: 'bar' });

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });

    it('handles numbers', () => {
      const result = transformError(42);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown error');
      expect(result.statusCode).toBeUndefined();
      expect(result.userMessage).toBe(
        'An unexpected error occurred. Please try again.'
      );
    });
  });
});
