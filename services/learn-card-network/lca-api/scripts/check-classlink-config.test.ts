import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const run = (env: Record<string, string>) =>
    spawnSync('bun', ['--no-env-file', 'scripts/check-classlink-config.ts'], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH, ...env },
        encoding: 'utf8',
    });

describe('config:check CLI', () => {
    it('exits successfully when ClassLink is not configured, without service credentials', () => {
        const result = run({});
        expect(result.status).toBe(0);
        expect(result.stdout.trim()).toBe('ClassLink not configured');
        expect(result.stderr).toBe('');
    });

    it('reports problems without printing values and exits one', () => {
        const result = run({ CLASSLINK_TENANTS: 'secret-invalid-json' });
        expect(result.status).toBe(1);
        expect(result.stderr).toContain('CLASSLINK_TENANTS must be valid JSON');
        expect(result.stderr).not.toContain('secret-invalid-json');
        expect(result.stdout).toBe('');
    });

    it('checks an enabled transcript fixture without contacting services', () => {
        const result = run({
            CLASSLINK_TENANTS: JSON.stringify({
                example: {
                    displayName: 'Example School',
                    state: 'XX',
                    allowedEmailDomains: [],
                    transcriptEnabled: true,
                },
            }),
            TRANSCRIPT_ISSUERS: JSON.stringify({
                default: {
                    endpoint: 'https://records.example.org/requests',
                    audience: 'records',
                    did: 'did:web:records.example.org',
                    profileId: 'records',
                },
            }),
            CLASSLINK_CLIENT_ID: 'test-client',
            CLASSLINK_CLIENT_SECRET: 'test-secret',
            CLASSLINK_REDIRECT_URIS: 'https://app.example.org/callback',
            CLASSLINK_PII_KEY: Buffer.alloc(32, 7).toString('base64'),
            CLASSLINK_IDENTITY_KEY: Buffer.alloc(32, 7).toString('base64'),
        });
        expect(result.status).toBe(0);
        expect(result.stdout.trim()).toBe('ClassLink configuration is valid');
        expect(result.stderr).toBe('');
    });
});
