import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiAccessToken, apiRequest } from '../api-client';
import * as logtoServerActions from '@logto/next/server-actions';

vi.mock('@logto/next/server-actions');
global.fetch = vi.fn();

describe('getApiAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable for tests
    process.env['NEXT_PUBLIC_LOGTO_RESOURCE'] = 'https://api.myflow.example.com';
  });

  it('should return null when NEXT_PUBLIC_LOGTO_RESOURCE is not configured', async () => {
    delete process.env['NEXT_PUBLIC_LOGTO_RESOURCE'];

    const token = await getApiAccessToken();
    expect(token).toBeNull();
  });

  it('should return access token when successful', async () => {
    vi.mocked(logtoServerActions.getAccessToken).mockResolvedValue('mock-token');

    const token = await getApiAccessToken();
    expect(token).toBe('mock-token');
    expect(logtoServerActions.getAccessToken).toHaveBeenCalledWith(
      expect.anything(),
      'https://api.myflow.example.com'
    );
  });

  it('should return null when getAccessToken throws error', async () => {
    vi.mocked(logtoServerActions.getAccessToken).mockRejectedValue(
      new Error('Token fetch failed')
    );

    const token = await getApiAccessToken();
    expect(token).toBeNull();
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['NEXT_PUBLIC_LOGTO_RESOURCE'] = 'https://api.myflow.example.com';
    process.env['NEXT_PUBLIC_API_URL'] = 'http://localhost:8000';
  });

  it('should include Authorization header when token exists', async () => {
    vi.mocked(logtoServerActions.getAccessToken).mockResolvedValue('mock-token');
    const mockResponse: Response = {
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response;
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await apiRequest('/test');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        }) as Record<string, string>,
      }) as RequestInit
    );
  });

  it('should not include Authorization header when token is null', async () => {
    vi.mocked(logtoServerActions.getAccessToken).mockRejectedValue(
      new Error('No token')
    );
    const mockResponse: Response = {
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response;
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await apiRequest('/test');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/test',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'Authorization': expect.anything() as string,
        }) as Record<string, string>,
      }) as RequestInit
    );
  });

  it('should throw error when fetch fails', async () => {
    vi.mocked(logtoServerActions.getAccessToken).mockResolvedValue('mock-token');
    const mockResponse: Response = {
      ok: false,
      statusText: 'Not Found',
    } as Response;
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await expect(apiRequest('/test')).rejects.toThrow('API request failed: Not Found');
  });

  it('should return parsed JSON response', async () => {
    vi.mocked(logtoServerActions.getAccessToken).mockResolvedValue('mock-token');
    const mockData = { id: 1, name: 'Test' };
    const mockResponse: Response = {
      ok: true,
      json: async () => mockData,
    } as Response;
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const result = await apiRequest('/test');
    expect(result).toEqual(mockData);
  });
});
