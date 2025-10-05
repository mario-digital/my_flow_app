import { redirect } from 'next/navigation';
import { handleSignIn, getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from '@/lib/logto';

type CallbackPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps): Promise<React.ReactElement | never> {
  const params = await searchParams;

  // Server action to process the callback
  async function processCallback(formData: FormData): Promise<never> {
    'use server';

    const urlParams = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      urlParams.append(key, value.toString());
    }

    await handleSignIn(logtoConfig, urlParams);
    redirect('/dashboard');
  }

  // Check if already authenticated
  const { isAuthenticated } = await getLogtoContext(logtoConfig);
  if (isAuthenticated) {
    redirect('/dashboard');
  }

  // Auto-submit form to process OAuth callback
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Completing sign in...
        </h2>
        <form action={processCallback} id="callback-form">
          {Object.entries(params).map(([key, value]) => (
            <input
              key={key}
              type="hidden"
              name={key}
              value={Array.isArray(value) ? value[0] : value || ''}
            />
          ))}
        </form>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById('callback-form').submit();`,
          }}
        />
      </div>
    </div>
  );
}
