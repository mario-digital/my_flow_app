import type { JSX } from 'react';
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage(): Promise<JSX.Element> {
  const claims = await requireAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      <div className="mt-4 rounded-lg border border-card-border bg-card-bg p-4 shadow-sm">
        <p className="text-sm text-text-secondary">User ID:</p>
        <p className="font-mono text-text-primary">{claims?.sub}</p>
      </div>
      <div className="mt-4 rounded-lg border border-card-border bg-card-bg p-4 shadow-sm">
        <p className="text-sm text-text-secondary">Email:</p>
        <p className="text-text-primary">{claims?.email || 'Not provided'}</p>
      </div>
    </div>
  );
}
