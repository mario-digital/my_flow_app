/**
 * Logto authentication configuration for Next.js.
 *
 * This configuration object is used to initialize Logto authentication
 * throughout the application. It pulls credentials from environment variables
 * and sets up security options based on the runtime environment.
 *
 * @see {@link https://docs.logto.io/quick-starts/next-app/} Logto Next.js Documentation
 *
 * @example
 * ```typescript
 * import { logtoConfig } from '@/lib/logto';
 * import { getLogtoContext } from '@logto/next/server-actions';
 *
 * const { isAuthenticated } = await getLogtoContext(logtoConfig);
 * ```
 */

const resource = process.env['NEXT_PUBLIC_LOGTO_RESOURCE'];
const cookieSecret = process.env['LOGTO_COOKIE_SECRET']!;

export const logtoConfig = {
  /** Logto tenant endpoint URL (e.g., https://your-tenant.logto.app) */
  endpoint: process.env['NEXT_PUBLIC_LOGTO_ENDPOINT']!,

  /** Application ID from Logto Console */
  appId: process.env['NEXT_PUBLIC_LOGTO_APP_ID']!,

  /** Application secret from Logto Console (server-side only) */
  appSecret: process.env['LOGTO_APP_SECRET']!,

  /** Secret used for cookie encryption */
  cookieSecret,

  /** Secret used for additional encryption (same as cookieSecret) */
  encryptionKey: cookieSecret,

  /** Base URL of the application */
  baseUrl: process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000',

  /** Whether to use secure cookies (true in production) */
  cookieSecure: process.env.NODE_ENV === 'production',

  /** API resources that require access tokens */
  resources: resource ? [resource] : [],
};