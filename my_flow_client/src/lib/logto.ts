const resource = process.env['NEXT_PUBLIC_LOGTO_RESOURCE'];
const cookieSecret = process.env['LOGTO_COOKIE_SECRET']!;

export const logtoConfig = {
  endpoint: process.env['NEXT_PUBLIC_LOGTO_ENDPOINT']!,
  appId: process.env['NEXT_PUBLIC_LOGTO_APP_ID']!,
  appSecret: process.env['LOGTO_APP_SECRET']!,
  cookieSecret,
  encryptionKey: cookieSecret,
  baseUrl: process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000',
  cookieSecure: process.env.NODE_ENV === 'production',
  resources: resource ? [resource] : [],
};