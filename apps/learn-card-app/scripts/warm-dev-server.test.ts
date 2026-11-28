import { describe, expect, it } from 'bun:test';

import {
    DEV_SERVER_READY_PATH,
    DEV_SERVER_WARMUP_URLS,
    importSpecsInModule,
} from './warm-dev-server';

describe('warmDevServer', () => {
    it('warms the client entry and sign-in document and exposes a ready path', () => {
        expect(DEV_SERVER_READY_PATH).toBe('/__lc-dev-ready');
        expect(DEV_SERVER_WARMUP_URLS).toContain('/src/entry.client.tsx');
        expect(DEV_SERVER_WARMUP_URLS).toContain('/src/FullApp.tsx');
        expect(DEV_SERVER_WARMUP_URLS).toContain('/src/pages/developer/DeveloperSignInPage.tsx');
    });
});

describe('importSpecsInModule', () => {
    it('collects static, dynamic, and re-export specifiers from Vite output', () => {
        const source = `
            import "/@id/virtual:react-router/inject-hmr-runtime";
            import * as route0 from "/src/root.tsx";
            export { App } from "/src/App.tsx";
            import("/src/entry.client.tsx");
            import { x } from "/@fs/repo/packages/plugins/openid4vc/src/vci/types.ts";
        `;
        expect(importSpecsInModule(source, 'http://127.0.0.1:3018/src/app.js')).toEqual([
            'http://127.0.0.1:3018/@id/virtual:react-router/inject-hmr-runtime',
            'http://127.0.0.1:3018/src/root.tsx',
            'http://127.0.0.1:3018/src/App.tsx',
            'http://127.0.0.1:3018/src/entry.client.tsx',
            'http://127.0.0.1:3018/@fs/repo/packages/plugins/openid4vc/src/vci/types.ts',
        ]);
    });
});
