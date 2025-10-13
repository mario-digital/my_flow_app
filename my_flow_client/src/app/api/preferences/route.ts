import { NextRequest, NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api-client';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000';

/**
 * GET /api/preferences
 *
 * BFF proxy endpoint for fetching user preferences.
 * Creates default preferences if none exist.
 *
 * @param _request - NextRequest (unused but required by Next.js)
 * @returns NextResponse with preferences or error
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[BFF /api/preferences GET] Fetching token...');
    const token = await getApiAccessToken();
    if (!token) {
      console.error('[BFF /api/preferences GET] No token available');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(
      '[BFF /api/preferences GET] Token obtained, calling backend...'
    );
    const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(
      '[BFF /api/preferences GET] Backend response status:',
      response.status
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF /api/preferences GET] Backend error:', errorText);
      throw new Error(
        `Failed to fetch preferences: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    console.log('[BFF /api/preferences GET] Success, data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF /api/preferences GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences
 *
 * BFF proxy endpoint for updating user preferences.
 *
 * @param request - NextRequest with preference updates in body
 * @returns NextResponse with updated preferences or error
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getApiAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const response = await fetch(`${API_BASE_URL}/api/v1/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { detail?: string };
      const errorMessage = errorData.detail ?? 'Failed to update preferences';
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as Record<string, unknown>;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(
      'Error updating preferences:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
