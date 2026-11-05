// Offline browser fixture: serves the real built shell only. Playwright mocks every API.
import { handleAdminWeb } from '../src/admin/web';
process.env.EMBEDDINGS_ADMIN_ENABLED = 'true';
Bun.serve({
    hostname: '127.0.0.1',
    port: 4349,
    fetch: async req =>
        (await handleAdminWeb(req)) ??
        new Response('Fixture API requires browser interception', { status: 404 }),
});
