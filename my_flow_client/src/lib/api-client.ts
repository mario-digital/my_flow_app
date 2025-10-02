import { getAccessToken } from '@logto/next/server-actions';
import { logtoConfig } from './logto';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000';

export async function getApiAccessToken(): Promise<string | null> {
  'use server';
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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  'use server';
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
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}