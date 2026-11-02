import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getClassLinkConfig, getTranscriptIssuerConfig } from '../src/helpers/classlink.config';
import { ClassLinkTenantsValidator } from '../src/types/classlink';

const { env } = vi.hoisted(() => ({
    env: {
        CLASSLINK_CLIENT_ID: undefined as string | undefined,
        CLASSLINK_CLIENT_SECRET: undefined as string | undefined,
        CLASSLINK_DISCOVERY_URL:
            'https://launchpad.classlink.com/.well-known/openid-configuration' as
                string | undefined,
        CLASSLINK_REDIRECT_URIS: undefined as string | undefined,
        CLASSLINK_TENANTS: undefined as string | undefined,
        CLASSLINK_MAX_AUTH_AGE_SECONDS: 86_400,
        TRANSCRIPT_ISSUER_ENDPOINT: undefined as string | undefined,
        TRANSCRIPT_ISSUER_AUDIENCE: undefined as string | undefined,
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

beforeEach(() => {
    Object.assign(env, {
        CLASSLINK_CLIENT_ID: 'client-id',
        CLASSLINK_CLIENT_SECRET: 'client-secret',
        CLASSLINK_DISCOVERY_URL: 'https://launchpad.classlink.com/.well-known/openid-configuration',
        CLASSLINK_REDIRECT_URIS: ' https://one.example/callback,https://two.example/callback ',
        CLASSLINK_TENANTS: JSON.stringify(validTenants),
        CLASSLINK_MAX_AUTH_AGE_SECONDS: 86_400,
        TRANSCRIPT_ISSUER_ENDPOINT: undefined,
        TRANSCRIPT_ISSUER_AUDIENCE: undefined,
    });
});

describe('ClassLink configuration', () => {
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

    it('returns null when required ClassLink configuration is unset', () => {
        env.CLASSLINK_CLIENT_ID = undefined;
        expect(getClassLinkConfig()).toBeNull();
    });

    it('returns transcript issuer configuration only when both values are set', () => {
        expect(getTranscriptIssuerConfig()).toBeNull();
        env.TRANSCRIPT_ISSUER_ENDPOINT = 'https://issuer.example/issue';
        env.TRANSCRIPT_ISSUER_AUDIENCE = 'transcript-service';
        expect(getTranscriptIssuerConfig()).toEqual({
            endpoint: 'https://issuer.example/issue',
            audience: 'transcript-service',
        });
    });
});
