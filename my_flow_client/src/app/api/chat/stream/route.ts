import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getApiAccessToken } from '@/lib/api-client';
import type { Message } from '@/types/chat';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:8000';

interface StreamRequestBody {
  contextId?: string;
  messages?: Message[];
}

export async function POST(req: NextRequest): Promise<Response> {
  // Tokens stay server-side so browser bundles never hold bearer creds.
  // This BFF hop aligns with our security posture even if it adds an
  // extra network hop compared to direct client fetches.
  const token = await getApiAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await req.json()) as StreamRequestBody;
  const { contextId, messages = [] } = body;

  console.log('[BFF Stream] Request body:', {
    contextId,
    messageCount: messages.length,
  });
  console.log('[BFF Stream] Messages:', JSON.stringify(messages, null, 2));

  if (!contextId) {
    return NextResponse.json(
      { error: 'contextId is required' },
      { status: 400 }
    );
  }

  if (messages.length === 0) {
    console.error('[BFF Stream] ERROR: Received empty messages array');
    return NextResponse.json(
      { error: 'messages array is required and cannot be empty' },
      { status: 400 }
    );
  }

  const upstreamResponse = await fetch(
    `${API_BASE_URL}/api/v1/conversations/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        context_id: contextId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          // Backend expects datetime or null, not string
          // Send null to let backend use server timestamp
          timestamp: null,
        })),
      }),
    }
  );

  if (!upstreamResponse.body) {
    return NextResponse.json(
      { error: 'No response body from upstream chat service' },
      { status: 502 }
    );
  }

  const headers = new Headers(upstreamResponse.headers);
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');
  headers.set('Content-Type', 'text/event-stream');

  const { readable, writable } = new TransformStream<Uint8Array>();
  upstreamResponse.body.pipeTo(writable).catch((error) => {
    console.error('Failed to proxy chat stream:', error);
  });

  return new Response(readable, {
    status: upstreamResponse.status,
    headers,
  });
}
