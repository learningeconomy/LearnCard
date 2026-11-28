import { describe, expect, it } from 'bun:test';

import {
    DEV_SERVER_READY_PATH,
    DEV_SERVER_WARMUP_URLS,
    importSpecsInModule,
    shouldFollowHttpWarmupImports,
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

describe('shouldFollowHttpWarmupImports', () => {
    it('follows the sign-in document and app/virtual modules, not workspace @fs packages', () => {
        expect(shouldFollowHttpWarmupImports('/developer/sign-in')).toBe(true);
        expect(shouldFollowHttpWarmupImports('/src/App.tsx')).toBe(true);
        expect(shouldFollowHttpWarmupImports('/src/pages/developer/DeveloperSignInPage.tsx')).toBe(
            true
        );
        expect(shouldFollowHttpWarmupImports('/src/FullApp.tsx')).toBe(false);
        expect(shouldFollowHttpWarmupImports('/src/Routes.tsx')).toBe(false);
        expect(
            shouldFollowHttpWarmupImports('/@id/__x00__virtual:react-router/browser-manifest')
        ).toBe(true);
        expect(shouldFollowHttpWarmupImports('/@react-router/critical.css')).toBe(true);
        expect(
            shouldFollowHttpWarmupImports('/@fs/repo/packages/plugins/openid4vc/src/vci/types.ts')
        ).toBe(false);
    });
});
