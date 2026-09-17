import { describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_REQUIRED_SCOPES,
    didWebCheck,
    identityCheck,
    networkCheck,
    refreshEnabledCheck,
    signingAuthorityCheck,
    tokenScopesCheck,
    trustedRegistryCheck,
    webhookCheck,
    type DoctorCard,
    type DoctorContext,
} from './checks';

const services = {
    network: 'https://network.learncard.com/trpc',
    cloud: undefined,
    lcaAPI: undefined,
};

const createLearnCard = (overrides: Partial<DoctorCard['invoke']> = {}): DoctorCard => ({
    invoke: {
        getProfile: vi.fn().mockResolvedValue(undefined),
        getRegisteredSigningAuthorities: vi.fn().mockResolvedValue([]),
        getAuthGrants: vi.fn().mockResolvedValue([]),
        getCredentialRefreshHistory: vi.fn().mockResolvedValue({ records: [], hasMore: false }),
        issueCredential: vi.fn().mockResolvedValue({ proof: {} }),
        verifyCredential: vi.fn().mockResolvedValue({ checks: [], warnings: [], errors: [] }),
        ...overrides,
    },
    id: { did: vi.fn().mockReturnValue('did:key:z6Mkdefault') },
});

const createContext = (overrides: Partial<DoctorContext> = {}): DoctorContext => ({
    project: { env: {}, envPath: '/unused/.env', existing: '' },
    services,
    learnCard: createLearnCard(),
    fetch: vi.fn(),
    requiredScopes: DEFAULT_REQUIRED_SCOPES,
    ...overrides,
});

const okResponse = (body: unknown, status = 200) =>
    ({ ok: status < 300, status, json: async () => body }) as Awaited<ReturnType<typeof fetch>>;

describe('identityCheck', () => {
    it('passes when the network profile matches .env', async () => {
        const ctx = createContext({
            project: {
                env: { SECURE_SEED: 's', PROFILE_ID: 'alice' },
                envPath: '/x',
                existing: '',
            },
            learnCard: createLearnCard({
                getProfile: vi.fn().mockResolvedValue({ profileId: 'alice' }),
            }),
        });
        const result = await identityCheck.run(ctx);
        expect(result.status).toBe('pass');
    });

    it('fails when .env is missing an identity', async () => {
        const result = await identityCheck.run(createContext());
        expect(result.status).toBe('fail');
        expect(result.fix).toContain('init');
    });
});

describe('networkCheck', () => {
    it('passes when the health-check endpoint answers 2xx', async () => {
        const fetch = vi.fn().mockResolvedValue(okResponse('Healthy'));
        const result = await networkCheck.run(createContext({ fetch }));
        expect(result.status).toBe('pass');
        expect(fetch).toHaveBeenCalledWith(
            'https://network.learncard.com/health-check',
            expect.anything()
        );
    });

    it('fails when the network is unreachable', async () => {
        const fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
        const result = await networkCheck.run(createContext({ fetch }));
        expect(result.status).toBe('fail');
        expect(result.detail).toContain('ECONNREFUSED');
    });
});

describe('tokenScopesCheck', () => {
    it('passes when the active grant covers every required scope', async () => {
        const scope = DEFAULT_REQUIRED_SCOPES.join(' ');
        const ctx = createContext({
            project: {
                env: { API_TOKEN: 'secret', API_TOKEN_SCOPE: scope },
                envPath: '/x',
                existing: '',
            },
            learnCard: createLearnCard({
                getAuthGrants: vi.fn().mockResolvedValue([{ id: 'g1', status: 'active', scope }]),
            }),
        });
        const result = await tokenScopesCheck.run(ctx);
        expect(result.status).toBe('pass');
    });

    it('warns when no API_TOKEN is configured', async () => {
        const result = await tokenScopesCheck.run(createContext());
        expect(result.status).toBe('warn');
        expect(result.fix).toContain('token --scope');
    });

    it('fails when the matching grant has expired', async () => {
        const scope = DEFAULT_REQUIRED_SCOPES.join(' ');
        const ctx = createContext({
            project: {
                env: { API_TOKEN: 'secret', API_TOKEN_SCOPE: scope },
                envPath: '/x',
                existing: '',
            },
            learnCard: createLearnCard({
                getAuthGrants: vi.fn().mockResolvedValue([
                    {
                        id: 'g1',
                        status: 'active',
                        scope,
                        expiresAt: '2000-01-01T00:00:00.000Z',
                    },
                ]),
            }),
        });
        const result = await tokenScopesCheck.run(ctx);
        expect(result.status).toBe('fail');
        expect(result.detail).toContain('expired');
    });
});

describe('signingAuthorityCheck', () => {
    it('passes when a primary https signer test-signs and verifies', async () => {
        const ctx = createContext({
            learnCard: createLearnCard({
                getRegisteredSigningAuthorities: vi.fn().mockResolvedValue([
                    {
                        signingAuthority: { endpoint: 'https://sign.example/api' },
                        relationship: {
                            name: 'default-issuer',
                            did: 'did:key:sa',
                            isPrimary: true,
                        },
                    },
                ]),
            }),
        });
        const result = await signingAuthorityCheck.run(ctx);
        expect(result.status).toBe('pass');
    });

    it('fails when there is no primary signing authority', async () => {
        const result = await signingAuthorityCheck.run(createContext());
        expect(result.status).toBe('fail');
        expect(result.fix).toContain('setup-signing');
    });
});

describe('didWebCheck', () => {
    it('passes when did.json resolves with a verification method', async () => {
        const did = 'did:web:network.learncard.com:users:alice';
        const ctx = createContext({
            project: { env: { PROFILE_ID: 'alice' }, envPath: '/x', existing: '' },
            fetch: vi
                .fn()
                .mockResolvedValue(okResponse({ verificationMethod: [{ id: `${did}#owner` }] })),
            learnCard: createLearnCard({
                getRegisteredSigningAuthorities: vi.fn().mockResolvedValue([
                    {
                        signingAuthority: { endpoint: 'https://sign.example/api' },
                        relationship: { name: 'x', did, isPrimary: true },
                    },
                ]),
            }),
        });
        ctx.learnCard.id.did = vi.fn().mockReturnValue(did);
        const result = await didWebCheck.run(ctx);
        expect(result.status).toBe('pass');
    });

    it('warns when the profile has no did:web yet', async () => {
        const ctx = createContext();
        ctx.learnCard.id.did = vi.fn().mockImplementation(() => {
            throw new Error('Unspported Did Method');
        });
        const result = await didWebCheck.run(ctx);
        expect(result.status).toBe('warn');
        expect(result.detail).toContain('did:key');
    });
});

describe('webhookCheck', () => {
    it('skips when no webhook URL is configured', async () => {
        const result = await webhookCheck.run(createContext());
        expect(result.status).toBe('skip');
    });

    it('passes when the webhook accepts the doctor ping', async () => {
        const fetch = vi.fn().mockResolvedValue(okResponse(undefined));
        const result = await webhookCheck.run(
            createContext({ fetch, webhookUrl: 'https://hooks.example/doctor' })
        );
        expect(result.status).toBe('pass');
        const [, init] = fetch.mock.calls[0] as [string, RequestInit];
        expect(init.method).toBe('POST');
        expect((init.headers as Record<string, string>)['X-LearnCard-Doctor']).toBe('1');
    });

    it('fails on a network error reaching the webhook', async () => {
        const fetch = vi.fn().mockRejectedValue(new Error('timeout'));
        const result = await webhookCheck.run(
            createContext({ fetch, webhookUrl: 'https://hooks.example/doctor' })
        );
        expect(result.status).toBe('fail');
    });
});

describe('refreshEnabledCheck', () => {
    it('passes when the unknown refreshId 404s without the disabled message', async () => {
        const ctx = createContext({
            learnCard: createLearnCard({
                getCredentialRefreshHistory: vi
                    .fn()
                    .mockRejectedValue(new Error('Credential refresh not found')),
            }),
        });
        const result = await refreshEnabledCheck.run(ctx);
        expect(result.status).toBe('pass');
    });

    it('fails when the network reports the feature is not available', async () => {
        const ctx = createContext({
            learnCard: createLearnCard({
                getCredentialRefreshHistory: vi
                    .fn()
                    .mockRejectedValue(new Error('Credential refresh is not available')),
            }),
        });
        const result = await refreshEnabledCheck.run(ctx);
        expect(result.status).toBe('fail');
        expect(result.fix).toContain('staging');
    });

    it('warns instead of passing when the probe fails for an unrelated reason', async () => {
        const ctx = createContext({
            learnCard: createLearnCard({
                getCredentialRefreshHistory: vi.fn().mockRejectedValue(new Error('fetch failed')),
            }),
        });
        const result = await refreshEnabledCheck.run(ctx);
        expect(result.status).toBe('warn');
        expect(result.detail).toContain('fetch failed');
    });
});

describe('trustedRegistryCheck', () => {
    it('is always a manual skip', async () => {
        const result = await trustedRegistryCheck.run(createContext());
        expect(result.status).toBe('skip');
    });

    it('mentions phone and state_student_id addressing in the detail', async () => {
        const result = await trustedRegistryCheck.run(createContext());
        expect(result.detail).toContain('phone');
        expect(result.detail).toContain('state_student_id');
    });
});
