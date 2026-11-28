import { describe, expect, it } from 'bun:test';

import { DEV_SERVER_READY_PATH, DEV_SERVER_WARMUP_URLS } from './warm-dev-server';

describe('warmDevServer', () => {
    it('warms the client entry and sign-in document and exposes a ready path', () => {
        expect(DEV_SERVER_READY_PATH).toBe('/__lc-dev-ready');
        expect(DEV_SERVER_WARMUP_URLS).toContain('/src/entry.client.tsx');
        expect(DEV_SERVER_WARMUP_URLS).toContain('/src/pages/developer/DeveloperSignInPage.tsx');
    });
});
