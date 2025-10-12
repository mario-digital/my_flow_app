import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api-client';
import type { Context } from '@/types/context-summary';
import type {
  ContextSummary,
  ContextWithSummary,
} from '@/types/context-summary';

export async function GET(): Promise<NextResponse> {
  try {
    const token = await getApiAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's contexts (backend returns paginated response)
    const contextsRes = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL']}/api/v1/contexts`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!contextsRes.ok) {
      throw new Error('Failed to fetch contexts');
    }

    // Backend returns { items: Context[], total, limit, offset, has_more }
    const contextsData = (await contextsRes.json()) as {
      items: Context[];
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };

    const contexts = contextsData.items;

    // Fetch summary for each context in parallel
    const summariesPromises = contexts.map(async (context) => {
      const summaryRes = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL']}/api/v1/contexts/${context.id}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!summaryRes.ok) {
        // Return empty summary if fetch fails
        return {
          context_id: context.id,
          context_name: context.name,
          context_icon: context.icon,
          context_color: context.color,
          summary: {
            context_id: context.id,
            incomplete_flows_count: 0,
            completed_flows_count: 0,
            summary_text: 'No summary available',
            last_activity: null,
            top_priorities: [],
          },
        };
      }

      const summary = (await summaryRes.json()) as ContextSummary;

      return {
        context_id: context.id,
        context_name: context.name,
        context_icon: context.icon,
        context_color: context.color,
        summary,
      };
    });

    const contextSummaries: ContextWithSummary[] =
      await Promise.all(summariesPromises);

    return NextResponse.json(contextSummaries);
  } catch (error) {
    console.error('Error fetching context summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context summaries' },
      { status: 500 }
    );
  }
}
