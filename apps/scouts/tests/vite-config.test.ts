import { beforeAll, describe, expect, it } from 'vitest';

describe('Vite environment definitions', () => {
    const sentinel = 'must-not-reach-the-browser';
    let definitions: Record<string, unknown>;

    // Cold Vite/plugin imports can exceed the default 5s test timeout on busy CI runners.
    // Give only setup more time; keep the security assertions at the normal test timeout.
    beforeAll(async () => {
        const previousAwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const previousWeb3AuthClientId = process.env.VITE_WEB3AUTH_CLIENT_ID;

        try {
            process.env.AWS_ACCESS_KEY_ID = sentinel;
            process.env.VITE_WEB3AUTH_CLIENT_ID ??= 'test-client-id';
            // Load after seeding required build environment; static import parses it before setup.
            const { default: viteConfig } = await import('../vite.config');

            if (typeof viteConfig !== 'function') throw new Error('Expected a Vite config factory');

            const config = await viteConfig({ command: 'build', mode: 'production' });
            definitions = config.define ?? {};
        } finally {
            if (previousAwsAccessKeyId === undefined) delete process.env.AWS_ACCESS_KEY_ID;
            else process.env.AWS_ACCESS_KEY_ID = previousAwsAccessKeyId;

            if (previousWeb3AuthClientId === undefined) delete process.env.VITE_WEB3AUTH_CLIENT_ID;
            else process.env.VITE_WEB3AUTH_CLIENT_ID = previousWeb3AuthClientId;
        }
    }, 30_000);

    it('never serializes the build runner environment', () => {
        const processEnvDefinitions = Object.keys(definitions).filter(key =>
            key.startsWith('process.env')
        );

        expect(processEnvDefinitions).toEqual([]);
        expect(JSON.stringify(definitions)).not.toContain(sentinel);
    });
});
