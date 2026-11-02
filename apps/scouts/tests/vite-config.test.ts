import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';

describe('Vite environment definitions', () => {
    it('resolves repository package value imports from the workspace root', async () => {
        const previousClientId = process.env.VITE_WEB3AUTH_CLIENT_ID;
        let server: Awaited<ReturnType<(typeof import('vite'))['createServer']>> | undefined;
        try {
            process.env.VITE_WEB3AUTH_CLIENT_ID ??= 'test-client-id';
            const { default: viteConfig } = await import('../vite.config');
            const { createServer } = await import('vite');
            if (typeof viteConfig !== 'function') throw new Error('Expected a Vite config factory');
            const config = await viteConfig({ command: 'build', mode: 'production' });
            server = await createServer({
                ...config,
                configFile: false,
                root: fileURLToPath(new URL('../', import.meta.url)),
                server: { middlewareMode: true },
                optimizeDeps: { noDiscovery: true, include: [] },
            });
            const resolved = await server.pluginContainer.resolveId(
                'packages/plugins/lca-api-plugin/src/types',
                fileURLToPath(new URL('../src/pages/troop/TroopChildrenBox.tsx', import.meta.url))
            );
            expect(resolved?.id).toBe(
                fileURLToPath(
                    new URL(
                        '../../../packages/plugins/lca-api-plugin/src/types.ts',
                        import.meta.url
                    )
                )
            );
        } finally {
            await server?.close();
            if (previousClientId === undefined) delete process.env.VITE_WEB3AUTH_CLIENT_ID;
            else process.env.VITE_WEB3AUTH_CLIENT_ID = previousClientId;
        }
    }, 30_000);

    // The first case cold-imports Vite and its plugin graph; match the other case's CI budget.
    it('bakes the staging tenant domain into production-mode staging/native builds', async () => {
        const previousClientId = process.env.VITE_WEB3AUTH_CLIENT_ID;
        const previousNodeEnv = process.env.VITE_NODE_ENV;
        try {
            process.env.VITE_WEB3AUTH_CLIENT_ID ??= 'test-client-id';
            process.env.VITE_NODE_ENV = 'staging-scoutpass';
            const { default: viteConfig } = await import('../vite.config');
            if (typeof viteConfig !== 'function') throw new Error('Expected a Vite config factory');
            const config = await viteConfig({ command: 'build', mode: 'production' });
            const overrides = JSON.parse(String(config.define?.__SCOUTS_TENANT_OVERRIDES__));
            expect(overrides.domain).toBe('staging.pass.scout.org');
            expect(overrides.stage).toBe('staging');
        } finally {
            if (previousClientId === undefined) delete process.env.VITE_WEB3AUTH_CLIENT_ID;
            else process.env.VITE_WEB3AUTH_CLIENT_ID = previousClientId;
            if (previousNodeEnv === undefined) delete process.env.VITE_NODE_ENV;
            else process.env.VITE_NODE_ENV = previousNodeEnv;
        }
    }, 30_000);

    it('never serializes the build runner environment', async () => {
        const previousAwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const previousWeb3AuthClientId = process.env.VITE_WEB3AUTH_CLIENT_ID;
        const sentinel = 'must-not-reach-the-browser';

        try {
            process.env.AWS_ACCESS_KEY_ID = sentinel;
            process.env.VITE_WEB3AUTH_CLIENT_ID ??= 'test-client-id';
            // Load after seeding required build environment; static import parses it before setup.
            const { default: viteConfig } = await import('../vite.config');

            if (typeof viteConfig !== 'function') throw new Error('Expected a Vite config factory');

            const config = await viteConfig({ command: 'build', mode: 'production' });
            const definitions = config.define ?? {};
            const processEnvDefinitions = Object.keys(definitions).filter(key =>
                key.startsWith('process.env')
            );

            expect(processEnvDefinitions).toEqual([]);
            expect(JSON.stringify(definitions)).not.toContain(sentinel);
            expect(config.plugins).toEqual(
                expect.arrayContaining([expect.objectContaining({ name: 'scouts-news-endpoint' })])
            );
        } finally {
            if (previousAwsAccessKeyId === undefined) delete process.env.AWS_ACCESS_KEY_ID;
            else process.env.AWS_ACCESS_KEY_ID = previousAwsAccessKeyId;

            if (previousWeb3AuthClientId === undefined) delete process.env.VITE_WEB3AUTH_CLIENT_ID;
            else process.env.VITE_WEB3AUTH_CLIENT_ID = previousWeb3AuthClientId;
        }
    }, 30_000);
});
