import { describe, expect, it } from 'vitest';

import viteConfig from '../vite.config';

describe('Vite environment definitions', () => {
    it('never serializes the build runner environment', async () => {
        const previousAwsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const sentinel = 'must-not-reach-the-browser';

        try {
            process.env.AWS_ACCESS_KEY_ID = sentinel;

            if (typeof viteConfig !== 'function') throw new Error('Expected a Vite config factory');

            const config = await viteConfig({ command: 'build', mode: 'production' });
            const definitions = config.define ?? {};
            const processEnvDefinitions = Object.keys(definitions).filter(key =>
                key.startsWith('process.env')
            );

            expect(processEnvDefinitions).toEqual([
                'process.env.REACT_APP_KEY_DERIVATION_PROVIDER',
                'process.env.REACT_APP_SSS_SERVER_URL',
            ]);
            expect(JSON.stringify(definitions)).not.toContain(sentinel);
        } finally {
            if (previousAwsAccessKeyId === undefined) delete process.env.AWS_ACCESS_KEY_ID;
            else process.env.AWS_ACCESS_KEY_ID = previousAwsAccessKeyId;
        }
    });
});
