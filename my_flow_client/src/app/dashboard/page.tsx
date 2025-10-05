import type { JSX } from 'react';
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage(): Promise<JSX.Element> {
  const claims = await requireAuth();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        Dashboard
      </h1>
      <div className="mt-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)]">
        <p className="text-sm text-[var(--color-text-secondary)]">User ID:</p>
        <p className="font-mono text-[var(--color-text-primary)]">
          {claims?.sub}
        </p>
      </div>
      <div className="mt-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)]">
        <p className="text-sm text-[var(--color-text-secondary)]">Email:</p>
        <p className="text-[var(--color-text-primary)]">
          {claims?.email || 'Not provided'}
        </p>
      </div>
    </div>
  );
}
