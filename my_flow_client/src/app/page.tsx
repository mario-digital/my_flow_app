import { redirect } from 'next/navigation';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';

export default async function Home(): Promise<never> {
  // Check if user is already authenticated
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    // Already signed in → go to dashboard
    redirect('/dashboard');
  }

  // Not signed in → go to login (which will auto-redirect to Logto)
  redirect('/login');
}
