import type { JSX } from 'react';
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage(): Promise<JSX.Element> {
  const claims = await requireAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">User ID:</p>
        <p className="font-mono">{claims?.sub}</p>
      </div>
      <div className="mt-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Email:</p>
        <p>{claims?.email || 'Not provided'}</p>
      </div>
    </div>
  );
}
