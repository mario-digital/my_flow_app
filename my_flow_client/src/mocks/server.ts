import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for Node.js test environment.
 *
 * This server intercepts network requests during tests and responds with
 * mock data defined in handlers.ts. It runs in Node.js (not browser) and
 * is used by Vitest tests.
 *
 * Usage in tests:
 * ```typescript
 * import { server } from '@/mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */
export const server = setupServer(...handlers);
