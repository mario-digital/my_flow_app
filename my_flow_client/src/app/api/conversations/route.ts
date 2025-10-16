import { NextRequest, NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api-client';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000';

/**
 * GET /api/conversations?context_id={id}
 *
 * BFF proxy endpoint for fetching conversation history by context.
 * JWT tokens stay server-side; browser never sees them.
 *
 * @param request - NextRequest with context_id query param
 * @returns NextResponse with conversation history or error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Get JWT token server-side
    const token = await getApiAccessToken();

    if (!token) {
      console.error('[BFF Conversations] No JWT token available');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get context_id from query params
    const searchParams = request.nextUrl.searchParams;
    const context_id = searchParams.get('context_id');

    if (!context_id) {
      console.error('[BFF Conversations] Missing context_id parameter');
      return NextResponse.json(
        { error: 'context_id query parameter required' },
        { status: 400 }
      );
    }

    // 3. Call FastAPI with JWT token
    const response = await fetch(
      `${API_BASE_URL}/api/v1/conversations?context_id=${context_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[BFF Conversations] FastAPI error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: response.status }
      );
    }

    // 4. Proxy response back to browser (without token)
    const data = (await response.json()) as unknown[];
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF Conversations] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
