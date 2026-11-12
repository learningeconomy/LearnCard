import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getClassLinkConfig,
    getClassLinkTenant,
    getTranscriptIssuerConfig,
} from '../src/helpers/classlink.config';
import {
    ClassLinkTenantsValidator,
    DEFAULT_CLASSLINK_TENANT,
    TranscriptIssuerValidator,
    TranscriptIssuersValidator,
} from '../src/types/classlink';

const { env } = vi.hoisted(() => ({
    env: {
        NODE_ENV: 'test' as string,
        CLASSLINK_CLIENT_ID: undefined as string | undefined,
        CLASSLINK_CLIENT_SECRET: undefined as string | undefined,
        CLASSLINK_DISCOVERY_URL:
            'https://launchpad.classlink.com/.well-known/openid-configuration' as
                string | undefined,
        CLASSLINK_REDIRECT_URIS: undefined as string | undefined,
        CLASSLINK_TENANTS: undefined as string | undefined,
        CLASSLINK_MAX_AUTH_AGE_SECONDS: 86_400,
        TRANSCRIPT_ISSUERS: undefined as string | undefined,
    },
}));

vi.mock('@environment', () => ({ environment: env }));

const validTenants = {
    'tenant-test': {
        displayName: 'Example District',
        state: 'XX',
        stateStudentIdField: 'studentId',
        allowedEmailDomains: ['example.edu'],
        transcriptEnabled: true,
    },
};

it('accepts source-only districts and rejects invalid or oversized patterns', () => {
    const district = {
        ...validTenants['tenant-test'],
        stateStudentIdField: undefined,
        stateStudentIdSource: { type: 'sourcedId' },
        stateStudentIdPattern: '[0-9]{10}',
    };
    expect(ClassLinkTenantsValidator.parse({ district }).district?.stateStudentIdField).toBe('');
    for (const pattern of ['[', 'x'.repeat(201)]) {
        expect(
            ClassLinkTenantsValidator.safeParse({
                district: { ...district, stateStudentIdPattern: pattern },
            }).success
        ).toBe(false);
    }
    expect(
        ClassLinkTenantsValidator.safeParse({
            district: { ...district, stateStudentIdSource: { type: 'sourcedId', field: 'extra' } },
        }).success
    ).toBe(false);
});

const exampleRecordsIssuer = {
    endpoint: 'https://records.example.org/transcript-requests',
    audience: 'records-service',
    did: 'did:web:records.example.org',
};

beforeEach(() => {
    Object.assign(env, {
        NODE_ENV: 'test',
        CLASSLINK_CLIENT_ID: 'client-id',
        CLASSLINK_CLIENT_SECRET: 'client-secret',
        CLASSLINK_DISCOVERY_URL: 'https://launchpad.classlink.com/.well-known/openid-configuration',
        CLASSLINK_REDIRECT_URIS: ' https://one.example/callback,https://two.example/callback ',
        CLASSLINK_TENANTS: JSON.stringify(validTenants),
        CLASSLINK_MAX_AUTH_AGE_SECONDS: 86_400,
        TRANSCRIPT_ISSUERS: undefined,
    });
});

afterEach(() => vi.restoreAllMocks());

describe('ClassLink configuration', () => {
    it('validates the optional district transcript issuer key', () => {
        const tenant = validTenants['tenant-test'];
        const tenants = { 'tenant-test': { ...tenant, transcriptIssuer: 'example-records' } };
        expect(ClassLinkTenantsValidator.parse(tenants)).toEqual(tenants);
        for (const transcriptIssuer of [
            '',
            'UPPER',
            'has space',
            '-leading-dash',
            'a'.repeat(65),
        ]) {
            expect(
                ClassLinkTenantsValidator.safeParse({
                    'tenant-test': { ...tenant, transcriptIssuer },
                }).success
            ).toBe(false);
        }
    });

    it('parses valid tenant configuration and redirect URIs', () => {
        expect(ClassLinkTenantsValidator.parse(validTenants)).toEqual(validTenants);
        expect(getClassLinkConfig()).toMatchObject({
            clientId: 'client-id',
            discoveryUrl: 'https://launchpad.classlink.com/.well-known/openid-configuration',
            redirectUris: ['https://one.example/callback', 'https://two.example/callback'],
            tenants: validTenants,
        });
    });

    it('rejects lowercase and three-letter state codes', () => {
        expect(() =>
            ClassLinkTenantsValidator.parse({
                ...validTenants,
                'tenant-lower': { ...validTenants['tenant-test'], state: 'xx' },
            })
        ).toThrow();
        expect(() =>
            ClassLinkTenantsValidator.parse({
                ...validTenants,
                'tenant-long': { ...validTenants['tenant-test'], state: 'XXX' },
            })
        ).toThrow();
    });

    it('works without CLASSLINK_TENANTS and treats every district with safe defaults', () => {
        env.CLASSLINK_TENANTS = undefined;
        const config = getClassLinkConfig();
        expect(config).toMatchObject({ clientId: 'client-id', tenants: {} });
        expect(getClassLinkTenant(config!, 'any-district')).toEqual(DEFAULT_CLASSLINK_TENANT);
        expect(DEFAULT_CLASSLINK_TENANT).toMatchObject({
            allowedEmailDomains: [],
            transcriptEnabled: false,
        });
    });

    it('applies overrides only for listed districts, ignoring prototype keys', () => {
        const config = getClassLinkConfig()!;
        expect(getClassLinkTenant(config, 'tenant-test')).toEqual(validTenants['tenant-test']);
        for (const id of ['other', 'toString', '__proto__'])
            expect(getClassLinkTenant(config, id)).toEqual(DEFAULT_CLASSLINK_TENANT);
    });

    it('disables ClassLink when CLASSLINK_TENANTS is present but invalid', () => {
        env.CLASSLINK_TENANTS = '{not json';
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(getClassLinkConfig()).toBeNull();
        expect(getClassLinkConfig()).toBeNull();
        // Logged once per process, not on every call (preferences and sign-in call this often).
        expect(
            warn.mock.calls.filter(([message]) => String(message).includes('CLASSLINK_TENANTS'))
        ).toHaveLength(1);
    });

    it('returns null when required ClassLink configuration is unset', () => {
        env.CLASSLINK_CLIENT_ID = undefined;
        expect(getClassLinkConfig()).toBeNull();
    });

    it.each([undefined, '{invalid registry'])(
        'disables transcripts without disabling sign-in for an unknown issuer (%s)',
        registry => {
            env.TRANSCRIPT_ISSUERS = registry;
            env.CLASSLINK_TENANTS = JSON.stringify({
                'tenant-test': {
                    ...validTenants['tenant-test'],
                    transcriptIssuer: 'missing-issuer',
                },
            });
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            expect(getClassLinkConfig()).toMatchObject({
                clientId: 'client-id',
                tenants: { 'tenant-test': { transcriptEnabled: false } },
            });
            const count = warn.mock.calls.length;
            getClassLinkConfig();
            expect(warn).toHaveBeenCalledTimes(count);
            expect(getTranscriptIssuerConfig({ transcriptIssuer: 'missing-issuer' })).toBeNull();
        }
    );

    it('allows a district that references a registered transcript issuer key', () => {
        env.TRANSCRIPT_ISSUERS = JSON.stringify({ 'example-records': exampleRecordsIssuer });
        env.CLASSLINK_TENANTS = JSON.stringify({
            'tenant-test': { ...validTenants['tenant-test'], transcriptIssuer: 'example-records' },
        });
        expect(getClassLinkConfig()).toMatchObject({ clientId: 'client-id' });
    });

    describe('transcript issuer registry', () => {
        it('returns null for both the default and a keyed issuer when nothing is configured', () => {
            expect(getTranscriptIssuerConfig()).toBeNull();
            expect(getTranscriptIssuerConfig({ transcriptIssuer: 'example-records' })).toBeNull();
        });

        it('registers explicit TRANSCRIPT_ISSUERS entries by key', () => {
            env.TRANSCRIPT_ISSUERS = JSON.stringify({ 'example-records': exampleRecordsIssuer });
            expect(getTranscriptIssuerConfig({ transcriptIssuer: 'example-records' })).toEqual({
                key: 'example-records',
                ...exampleRecordsIssuer,
            });
            expect(getTranscriptIssuerConfig()).toBeNull();
        });

        it('resolves the explicit "default" entry when no issuer key is selected', () => {
            env.TRANSCRIPT_ISSUERS = JSON.stringify({
                default: {
                    endpoint: 'https://explicit.example/issue',
                    audience: 'explicit-service',
                    did: 'did:web:explicit.example',
                },
            });
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            expect(getTranscriptIssuerConfig()).toEqual({
                key: 'default',
                endpoint: 'https://explicit.example/issue',
                audience: 'explicit-service',
                did: 'did:web:explicit.example',
            });
            getTranscriptIssuerConfig();
            expect(warn).not.toHaveBeenCalled();
        });

        it('returns no default on invalid registry JSON', () => {
            env.TRANSCRIPT_ISSUERS = '{not json';
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            expect(getTranscriptIssuerConfig()).toBeNull();
        });

        it('ignores TRANSCRIPT_ISSUERS when an endpoint is http and not localhost in production', () => {
            env.NODE_ENV = 'production';
            env.TRANSCRIPT_ISSUERS = JSON.stringify({
                'example-records': {
                    ...exampleRecordsIssuer,
                    endpoint: 'http://records.example.org/transcript-requests',
                },
            });
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            expect(getTranscriptIssuerConfig({ transcriptIssuer: 'example-records' })).toBeNull();
        });

        it('allows an http localhost endpoint outside production', () => {
            env.TRANSCRIPT_ISSUERS = JSON.stringify({
                local: {
                    endpoint: 'http://localhost:4000/transcript-requests',
                    audience: 'local-service',
                    did: 'did:web:localhost',
                },
            });
            expect(getTranscriptIssuerConfig({ transcriptIssuer: 'local' })).toEqual({
                key: 'local',
                endpoint: 'http://localhost:4000/transcript-requests',
                audience: 'local-service',
                did: 'did:web:localhost',
            });
        });

        it('rejects an http localhost endpoint in production', () => {
            env.NODE_ENV = 'production';
            env.TRANSCRIPT_ISSUERS = JSON.stringify({
                local: {
                    endpoint: 'http://localhost:4000/transcript-requests',
                    audience: 'local-service',
                    did: 'did:web:localhost',
                },
            });
            vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            expect(getTranscriptIssuerConfig({ transcriptIssuer: 'local' })).toBeNull();
        });

        it('district with no issuer and no default reports unavailable', () => {
            expect(getTranscriptIssuerConfig({})).toBeNull();
        });
    });

    describe('TranscriptIssuerValidator', () => {
        it('accepts a valid issuer', () => {
            expect(TranscriptIssuerValidator.parse(exampleRecordsIssuer)).toEqual(
                exampleRecordsIssuer
            );
        });

        it('accepts the optional LearnCard Network sender profile ID', () => {
            expect(
                TranscriptIssuerValidator.parse({
                    ...exampleRecordsIssuer,
                    profileId: ' example-records ',
                })
            ).toEqual({ ...exampleRecordsIssuer, profileId: 'example-records' });
            expect(
                TranscriptIssuerValidator.safeParse({ ...exampleRecordsIssuer, profileId: '' })
                    .success
            ).toBe(false);
        });

        it('rejects a non-URL endpoint', () => {
            expect(
                TranscriptIssuerValidator.safeParse({
                    ...exampleRecordsIssuer,
                    endpoint: 'not-a-url',
                }).success
            ).toBe(false);
        });

        it('rejects a malformed DID', () => {
            expect(
                TranscriptIssuerValidator.safeParse({ ...exampleRecordsIssuer, did: 'not-a-did' })
                    .success
            ).toBe(false);
        });

        it('rejects unknown fields', () => {
            expect(
                TranscriptIssuerValidator.safeParse({ ...exampleRecordsIssuer, extra: 'nope' })
                    .success
            ).toBe(false);
        });
    });

    describe('TranscriptIssuersValidator', () => {
        it('accepts a map of valid keys to valid issuers', () => {
            const value = { 'example-records': exampleRecordsIssuer };
            expect(TranscriptIssuersValidator.parse(value)).toEqual(value);
        });

        it('rejects an invalid issuer key', () => {
            for (const key of ['', 'UPPER', 'has space', '-leading-dash']) {
                expect(
                    TranscriptIssuersValidator.safeParse({ [key]: exampleRecordsIssuer }).success
                ).toBe(false);
            }
        });
    });
});
