import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
    getCredentialRefreshRuntimeEnvironment,
    parseBrainServiceEnvironment,
} from './environment';

const REQUIRED_ENVIRONMENT = {
    SEED: 'a'.repeat(64),
    NEO4J_URI: 'bolt://localhost:7687',
    NEO4J_USERNAME: 'neo4j',
    NEO4J_PASSWORD: 'test-password',
};

describe('credential refresh configuration', () => {
    it('parses typed defaults and explicit runtime values at call time', () => {
        const previousEnabled = process.env.CREDENTIAL_REFRESH_ENABLED;
        const previousSecret = process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;
        const previousWindow = process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

        try {
            delete process.env.CREDENTIAL_REFRESH_ENABLED;
            delete process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;
            delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

            expect(getCredentialRefreshRuntimeEnvironment()).toMatchObject({
                CREDENTIAL_REFRESH_ENABLED: false,
                CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: 24,
            });

            process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
            process.env.CREDENTIAL_REFRESH_DIGEST_SECRET = 'refresh-secret';
            process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = '12.5';

            expect(getCredentialRefreshRuntimeEnvironment()).toMatchObject({
                CREDENTIAL_REFRESH_ENABLED: true,
                CREDENTIAL_REFRESH_DIGEST_SECRET: 'refresh-secret',
                CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: 12.5,
            });
        } finally {
            if (previousEnabled === undefined) delete process.env.CREDENTIAL_REFRESH_ENABLED;
            else process.env.CREDENTIAL_REFRESH_ENABLED = previousEnabled;

            if (previousSecret === undefined) delete process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;
            else process.env.CREDENTIAL_REFRESH_DIGEST_SECRET = previousSecret;

            if (previousWindow === undefined) {
                delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;
            } else {
                process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = previousWindow;
            }
        }
    });

    it.each(['development', 'production'] as const)(
        'rejects an enabled %s deployment without a dedicated digest secret',
        nodeEnvironment => {
            expect(() =>
                parseBrainServiceEnvironment({
                    ...REQUIRED_ENVIRONMENT,
                    NODE_ENV: nodeEnvironment,
                    DOMAIN_NAME: 'network.example.com',
                    CREDENTIAL_REFRESH_ENABLED: 'true',
                })
            ).toThrow(/CREDENTIAL_REFRESH_DIGEST_SECRET/);
        }
    );

    it.each(['0', '-1', 'not-a-number'])(
        'rejects invalid notification window %s',
        invalidWindow => {
            expect(() =>
                parseBrainServiceEnvironment({
                    ...REQUIRED_ENVIRONMENT,
                    NODE_ENV: 'test',
                    CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS: invalidWindow,
                })
            ).toThrow(/CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS/);
        }
    );

    it.each(['serverless.yml', 'serverless-local.yml'])(
        'passes all refresh settings into functions in %s',
        manifestName => {
            const manifestPath = fileURLToPath(new URL(`../../${manifestName}`, import.meta.url));
            const manifest = parse(readFileSync(manifestPath, 'utf8'));

            expect(manifest.provider.environment).toMatchObject({
                CREDENTIAL_REFRESH_ENABLED: '${env:CREDENTIAL_REFRESH_ENABLED, "false"}',
                CREDENTIAL_REFRESH_DIGEST_SECRET: '${env:CREDENTIAL_REFRESH_DIGEST_SECRET, ""}',
                CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS:
                    '${env:CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS, "24"}',
            });
        }
    );
});
