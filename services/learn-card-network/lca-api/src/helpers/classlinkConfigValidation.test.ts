import { describe, expect, it } from 'vitest';
import {
    collectClassLinkConfigProblems,
    parseTranscriptIssuers,
} from './classlinkConfigValidation';

const key = Buffer.alloc(32, 7).toString('base64');
const tenant = {
    displayName: 'Example School',
    state: 'XX',
    allowedEmailDomains: [],
    transcriptEnabled: true,
};
const issuer = {
    endpoint: 'https://records.example.org/requests',
    audience: 'example-records',
    did: 'did:web:records.example.org',
    profileId: 'example-records',
};
const validEnv = (): Record<string, string | undefined> => ({
    NODE_ENV: 'production',
    CLASSLINK_TENANTS: JSON.stringify({ example: tenant }),
    TRANSCRIPT_ISSUERS: JSON.stringify({ default: issuer }),
    CLASSLINK_CLIENT_ID: 'test-client',
    CLASSLINK_CLIENT_SECRET: 'test-secret',
    CLASSLINK_REDIRECT_URIS: 'https://app.example.org/callback',
    CLASSLINK_PII_KEY: key,
    CLASSLINK_IDENTITY_KEY: key,
});

describe('offline ClassLink configuration diagnostics', () => {
    it('accepts a complete configuration', () => {
        expect(collectClassLinkConfigProblems(validEnv())).toEqual([]);
    });

    it.each([undefined, '', '  '])('opts out when tenants are unset (%s)', value => {
        expect(
            collectClassLinkConfigProblems({
                CLASSLINK_TENANTS: value,
                TRANSCRIPT_ISSUERS: 'invalid',
            })
        ).toEqual([]);
    });

    it.each(['{bad json', 'null', '[]', '{"example":{}}'])('rejects invalid tenants: %s', value => {
        expect(collectClassLinkConfigProblems({ ...validEnv(), CLASSLINK_TENANTS: value })).toEqual(
            [expect.stringContaining('CLASSLINK_TENANTS must be valid JSON')]
        );
    });

    it.each(['{bad json', 'null', '[]', '{"default":{}}'])('rejects invalid issuers: %s', value => {
        expect(
            collectClassLinkConfigProblems({ ...validEnv(), TRANSCRIPT_ISSUERS: value })
        ).toEqual([expect.stringContaining('TRANSCRIPT_ISSUERS must match')]);
    });

    it.each(['endpoint', 'audience', 'did'])('requires the existing issuer field %s', field => {
        const entry: Record<string, string> = { ...issuer };
        delete entry[field];
        expect(
            collectClassLinkConfigProblems({
                ...validEnv(),
                TRANSCRIPT_ISSUERS: JSON.stringify({ default: entry }),
            })
        ).toEqual([expect.stringContaining('TRANSCRIPT_ISSUERS must match')]);
    });

    it.each([undefined, 'unknown'])(
        'rejects a missing referenced issuer, including implicit default (%s)',
        transcriptIssuer => {
            expect(
                collectClassLinkConfigProblems({
                    ...validEnv(),
                    CLASSLINK_TENANTS: JSON.stringify({ example: { ...tenant, transcriptIssuer } }),
                    TRANSCRIPT_ISSUERS: '{}',
                })
            ).toEqual([expect.stringContaining('unknown transcript issuer key')]);
        }
    );

    it('checks explicit references even when transcripts are disabled', () => {
        expect(
            collectClassLinkConfigProblems({
                ...validEnv(),
                CLASSLINK_TENANTS: JSON.stringify({
                    example: { ...tenant, transcriptEnabled: false, transcriptIssuer: 'missing' },
                }),
            })
        ).toEqual([expect.stringContaining('unknown transcript issuer key')]);
    });

    it('requires profileId only for issuers used by enabled transcript tenants', () => {
        const env: Record<string, string | undefined> = {
            ...validEnv(),
            TRANSCRIPT_ISSUERS: JSON.stringify({ default: { ...issuer, profileId: undefined } }),
        };
        expect(collectClassLinkConfigProblems(env)).toEqual([
            expect.stringContaining('both did and profileId'),
        ]);
        env.CLASSLINK_TENANTS = JSON.stringify({
            example: { ...tenant, transcriptEnabled: false },
        });
        expect(collectClassLinkConfigProblems(env)).toEqual([]);
        env.TRANSCRIPT_ISSUERS = '';
        expect(collectClassLinkConfigProblems(env)).toEqual([]);
    });

    it.each([
        ['http://records.example.org/requests', 'test', false],
        ['http://localhost:4000/requests', 'test', true],
        ['http://127.0.0.1:4000/requests', 'test', true],
        ['http://[::1]:4000/requests', 'test', true],
        ['http://localhost:4000/requests', 'production', false],
        ['https://records.example.org/requests', 'production', true],
        ['ftp://records.example.org/requests', 'test', false],
        ['not-a-url', 'test', false],
    ])('shares the runtime endpoint policy for %s in %s', (endpoint, nodeEnv, allowed) => {
        const value = JSON.stringify({ default: { ...issuer, endpoint } });
        const problems = collectClassLinkConfigProblems({
            ...validEnv(),
            NODE_ENV: nodeEnv,
            TRANSCRIPT_ISSUERS: value,
        });
        expect(problems.length === 0).toBe(allowed);
        if (allowed)
            expect(parseTranscriptIssuers(value, nodeEnv).default?.endpoint).toBe(endpoint);
        else expect(() => parseTranscriptIssuers(value, nodeEnv)).toThrow();
    });

    it.each([
        'CLASSLINK_CLIENT_ID',
        'CLASSLINK_CLIENT_SECRET',
        'CLASSLINK_REDIRECT_URIS',
        'CLASSLINK_PII_KEY',
    ])('requires %s', name => {
        expect(collectClassLinkConfigProblems({ ...validEnv(), [name]: '' })).toEqual([
            expect.stringContaining(name),
        ]);
    });

    it('rejects a redirect list containing only separators', () => {
        expect(
            collectClassLinkConfigProblems({ ...validEnv(), CLASSLINK_REDIRECT_URIS: ' , , ' })
        ).toEqual([expect.stringContaining('CLASSLINK_REDIRECT_URIS')]);
    });

    it.each(['CLASSLINK_PII_KEY', 'CLASSLINK_IDENTITY_KEY', 'CLASSLINK_PII_KEY_PREVIOUS'])(
        'uses the existing canonical 32-byte check for %s',
        name => {
            for (const value of [
                'invalid',
                Buffer.alloc(31).toString('base64'),
                key.replace(/=$/, ''),
                `${key}!`,
            ]) {
                expect(collectClassLinkConfigProblems({ ...validEnv(), [name]: value })).toEqual([
                    expect.stringContaining(`${name} must be canonical base64`),
                ]);
            }
        }
    );

    it('permits the existing identity fallback only before PII rotation', () => {
        const env = { ...validEnv(), CLASSLINK_IDENTITY_KEY: undefined };
        expect(collectClassLinkConfigProblems(env)).toEqual([]);
        expect(collectClassLinkConfigProblems({ ...env, CLASSLINK_PII_KEY_PREVIOUS: key })).toEqual(
            [expect.stringContaining('CLASSLINK_IDENTITY_KEY is required during PII key rotation')]
        );
        expect(
            collectClassLinkConfigProblems({ ...validEnv(), CLASSLINK_PII_KEY_PREVIOUS: key })
        ).toEqual([]);
    });

    it('collects independent problems without leaking values or map keys', () => {
        const secret = 'sensitive-value-do-not-print';
        const problems = collectClassLinkConfigProblems({
            ...validEnv(),
            CLASSLINK_TENANTS: JSON.stringify({
                [secret]: { ...tenant, transcriptIssuer: secret },
            }),
            CLASSLINK_CLIENT_SECRET: '',
            CLASSLINK_PII_KEY: secret,
        });
        expect(problems).toHaveLength(3);
        expect(problems.join('\n')).not.toContain(secret);
    });
});
