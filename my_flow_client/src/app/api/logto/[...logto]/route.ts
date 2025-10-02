import { handleSignIn } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';
import { type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  await handleSignIn(logtoConfig, searchParams);

  redirect('/');
}