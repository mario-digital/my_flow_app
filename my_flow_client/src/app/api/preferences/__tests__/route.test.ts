/**
 * Unit tests for preferences API route (BFF proxy).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  getApiAccessToken: vi.fn(),
}));

import { getApiAccessToken } from '@/lib/api-client';

// Mock fetch globally
global.fetch = vi.fn();

describe('Preferences API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['NEXT_PUBLIC_API_URL'] = 'http://localhost:8000';
  });

  describe('GET /api/preferences', () => {
    it('returns preferences when authenticated', async () => {
      vi.mocked(getApiAccessToken).mockResolvedValue('test-token');
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '1',
          user_id: 'test-user',
          onboarding_completed: false,
        }),
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/preferences');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        id: '1',
        user_id: 'test-user',
        onboarding_completed: false,
      });
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(getApiAccessToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/preferences');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns 500 on backend error', async () => {
      vi.mocked(getApiAccessToken).mockResolvedValue('test-token');
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/preferences');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to fetch preferences' });
    });
  });

  describe('PUT /api/preferences', () => {
    it('updates preferences when authenticated', async () => {
      vi.mocked(getApiAccessToken).mockResolvedValue('test-token');
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '1',
          user_id: 'test-user',
          onboarding_completed: true,
        }),
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ onboarding_completed: true }),
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        id: '1',
        user_id: 'test-user',
        onboarding_completed: true,
      });
    });

    it('returns 401 when not authenticated', async () => {
      vi.mocked(getApiAccessToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ theme: 'dark' }),
      });
      const response = await PUT(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('returns 500 on backend error', async () => {
      vi.mocked(getApiAccessToken).mockResolvedValue('test-token');
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid update' }),
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ invalid: 'data' }),
      });
      const response = await PUT(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to update preferences' });
    });
  });
});
