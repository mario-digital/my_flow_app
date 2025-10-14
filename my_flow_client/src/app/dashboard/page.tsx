import type { JSX } from 'react';
import { redirect } from 'next/navigation';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage(): Promise<JSX.Element | never> {
  // Check authentication server-side before rendering
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    redirect('/login');
  }

  // User is authenticated, render the dashboard
  return <DashboardContent />;
}
