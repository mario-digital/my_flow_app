import { redirect } from 'next/navigation';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';

export default async function CallbackPage(): Promise<never> {
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  redirect('/login');
}
