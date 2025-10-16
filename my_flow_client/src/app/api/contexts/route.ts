import { NextRequest, NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api-client';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000';

/**
 * GET /api/contexts
 *
 * BFF proxy endpoint for fetching all contexts for the authenticated user.
 * JWT tokens stay server-side; browser never sees them.
 *
 * @returns NextResponse with contexts list or error
 */
export async function GET(): Promise<NextResponse> {
  try {
    const token = await getApiAccessToken();

    if (!token) {
      console.error('[BFF Contexts] No JWT token available');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call FastAPI with JWT token
    const response = await fetch(`${API_BASE_URL}/api/v1/contexts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        `[BFF Contexts] FastAPI error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: 'Failed to fetch contexts' },
        { status: response.status }
      );
    }

    // Backend returns paginated response: { items: Context[], total, limit, offset, has_more }
    const data = (await response.json()) as { items: unknown[] };
    return NextResponse.json(data.items);
  } catch (error) {
    console.error('[BFF Contexts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contexts
 *
 * BFF proxy endpoint for creating a new context.
 * JWT tokens stay server-side; browser never sees them.
 *
 * @param request - NextRequest with context data in body
 * @returns NextResponse with created context or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getApiAccessToken();

    if (!token) {
      console.error('[BFF Contexts] No JWT token available');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get context data from request body
    const body = (await request.json()) as {
      name: string;
      icon: string;
      color: string;
    };

    // Call FastAPI with JWT token
    const response = await fetch(`${API_BASE_URL}/api/v1/contexts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[BFF Contexts] FastAPI error: ${response.status} ${response.statusText}`,
        errorText
      );
      return NextResponse.json(
        { error: 'Failed to create context' },
        { status: response.status }
      );
    }

    const context = (await response.json()) as unknown;
    return NextResponse.json(context);
  } catch (error) {
    console.error('[BFF Contexts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
