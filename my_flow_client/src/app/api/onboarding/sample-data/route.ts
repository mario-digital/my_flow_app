import { NextResponse } from 'next/server';
import { getApiAccessToken } from '@/lib/api-client';

const SAMPLE_CONTEXTS = [
  { name: 'Work', icon: '💼', color: '#3b82f6' },
  { name: 'Personal', icon: '🏠', color: '#10b981' },
  { name: 'Rest', icon: '😴', color: '#8b5cf6' },
  { name: 'Social', icon: '🎉', color: '#f59e0b' },
];

const SAMPLE_FLOWS: Record<
  string,
  Array<{
    title: string;
    status: string;
    priority: string;
  }>
> = {
  Work: [
    {
      title: 'Review Q4 planning document',
      status: 'incomplete',
      priority: 'high',
    },
    {
      title: 'Send follow-up email to client',
      status: 'incomplete',
      priority: 'medium',
    },
    {
      title: 'Update team on project status',
      status: 'completed',
      priority: 'low',
    },
    {
      title: 'Prepare for Monday standup',
      status: 'incomplete',
      priority: 'medium',
    },
  ],
  Personal: [
    {
      title: 'Call dentist for appointment',
      status: 'incomplete',
      priority: 'high',
    },
    {
      title: 'Buy groceries for the week',
      status: 'incomplete',
      priority: 'medium',
    },
    { title: 'Pay utility bills', status: 'completed', priority: 'high' },
  ],
  Rest: [
    {
      title: 'Finish reading current book chapter',
      status: 'incomplete',
      priority: 'low',
    },
    {
      title: 'Plan weekend hiking trip',
      status: 'incomplete',
      priority: 'medium',
    },
    { title: 'Try new meditation app', status: 'incomplete', priority: 'low' },
  ],
  Social: [
    {
      title: "RSVP to Sarah's birthday party",
      status: 'incomplete',
      priority: 'high',
    },
    {
      title: 'Schedule catch-up call with old friend',
      status: 'incomplete',
      priority: 'medium',
    },
    {
      title: 'Reply to group chat messages',
      status: 'completed',
      priority: 'low',
    },
  ],
};

export async function POST(): Promise<NextResponse> {
  try {
    const token = await getApiAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create each context
    for (const contextData of SAMPLE_CONTEXTS) {
      // Create context
      const contextRes = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL']}/api/v1/contexts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contextData),
        }
      );

      if (!contextRes.ok) {
        throw new Error(`Failed to create context: ${contextData.name}`);
      }

      const context = (await contextRes.json()) as { id: string; name: string };

      // Create flows for this context
      const flows = SAMPLE_FLOWS[contextData.name] || [];
      for (const flowData of flows) {
        await fetch(`${process.env['NEXT_PUBLIC_API_URL']}/api/v1/flows`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...flowData,
            context_id: context.id,
          }),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(
      'Error creating sample data:',
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      { error: 'Failed to create sample data' },
      { status: 500 }
    );
  }
}
