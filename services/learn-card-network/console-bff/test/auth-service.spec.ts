import { describe, it, expect } from 'vitest';

import {
    TenantAuthPolicyValidator,
    type ExternalIdentity,
    type ExternalIdentityBinding,
} from '@learncard/types';

import { ConsoleAuthService } from '../src/app';
import { ProviderRegistry, AuthCoordinatorProvider, type ConsoleAuthProvider } from '@providers';
import { InMemoryRedis, SessionStore, LoginStateStore } from '@session';
import {
    JitProvisioner,
    type BindingRepository,
    type ManagedIdentityMinter,
    type MembershipGranter,
} from '@provisioning';

const inMemoryJit = () => {
    const rows: ExternalIdentityBinding[] = [];
    const bindings: BindingRepository = {
        async findBySubject(t, i, s) {
            return rows.find(r => r.tenantId === t && r.issuer === i && r.subject === s) ?? null;
        },
        async save(b) {
            rows.push(b);
            return b;
        },
        async touchLastLogin() {},
    };
    const minter: ManagedIdentityMinter = {
        async mint() {
            return { profileId: 'profile-1', managedDid: 'did:web:console.lef.org:p:1' };
        },
    };
    return new JitProvisioner({ bindings, minter, membership: { async grant() {} } });
};

const buildPolicy = (overrides = {}) =>
    TenantAuthPolicyValidator.parse({
        tenantId: 'lef',
        rootEcosystemId: 'eco_root',
        allowJit: true,
        defaultRole: 'MEMBER',
        sessionTtlSeconds: 3600,
        providers: [{ providerId: 'lef-wallet', kind: 'auth-coordinator', enabled: true }],
        ...overrides,
    });

const buildService = (policy = buildPolicy(), assurance: 'standard' | 'mfa' = 'mfa') => {
    const rows: ExternalIdentityBinding[] = [];
    const bindings: BindingRepository = {
        async findBySubject(t, i, s) {
            return rows.find(r => r.tenantId === t && r.issuer === i && r.subject === s) ?? null;
        },
        async save(b) {
            rows.push(b);
            return b;
        },
        async touchLastLogin() {},
    };
    const minter: ManagedIdentityMinter = {
        async mint() {
            return { profileId: 'profile-1', managedDid: 'did:web:console.lef.org:p:1' };
        },
    };
    const membership: MembershipGranter = { async grant() {} };
    const jit = new JitProvisioner({ bindings, minter, membership });

    const registry = new ProviderRegistry().register(
        'auth-coordinator',
        config =>
            new AuthCoordinatorProvider({
                providerId: config.providerId,
                jit,
                resolvePolicy: async () => policy,
                verifyDidAuth: async vp => ({ did: `did:key:${vp}`, assuranceLevel: assurance }),
            })
    );

    const sessions = new SessionStore({ redis: new InMemoryRedis(), minTtlSeconds: 60 });

    return new ConsoleAuthService({ registry, sessions, resolvePolicy: async () => policy });
};

describe('ConsoleAuthService', () => {
    it('runs login -> callback -> session -> logout end to end', async () => {
        const service = buildService();

        const { redirectUrl } = await service.beginLogin({
            tenantId: 'lef',
            providerId: 'lef-wallet',
            redirectUri: 'https://console.lef.org/callback',
            state: 'xyz',
        });
        expect(redirectUrl).toContain('provider=lef-wallet');
        expect(redirectUrl).toContain('state=xyz');

        const session = await service.completeLogin({
            tenantId: 'lef',
            providerId: 'lef-wallet',
            params: { vp: 'z123' },
        });

        expect(session.profileId).toBe('profile-1');
        expect(session.managedDid).toBe('did:web:console.lef.org:p:1');
        expect(session.effectiveAccess.ecosystemRoles).toContainEqual({
            ecosystemId: 'eco_root',
            role: 'MEMBER',
        });

        expect((await service.getSession(session.sessionId))?.sessionId).toBe(session.sessionId);

        await service.logout(session.sessionId);
        expect(await service.getSession(session.sessionId)).toBeNull();
    });

    it('rejects login when the tenant requires MFA and the provider only asserts standard', async () => {
        const service = buildService(buildPolicy({ minAssuranceLevel: 'mfa' }), 'standard');

        await expect(
            service.completeLogin({
                tenantId: 'lef',
                providerId: 'lef-wallet',
                params: { vp: 'z1' },
            })
        ).rejects.toThrow(/MFA assurance/);
    });

    it('compiles session effectiveAccess from group-mapped roles, not just the default (B2)', async () => {
        const policy = buildPolicy({
            defaultRole: 'VIEWER',
            groupMappings: [{ idpGroup: 'admins', ecosystemId: 'eco_ca', role: 'ADMIN' }],
            providers: [{ providerId: 'lef-oidc', kind: 'oidc', enabled: true }],
        });
        const jit = inMemoryJit();

        const oidcProvider: ConsoleAuthProvider = {
            id: 'lef-oidc',
            kind: 'oidc',
            async beginLogin() {
                return { redirectUrl: 'https://idp/authorize' };
            },
            async handleCallback(): Promise<ExternalIdentity> {
                return {
                    issuer: 'https://idp',
                    subject: 'sub-9',
                    groups: ['admins'],
                    assuranceLevel: 'mfa',
                };
            },
            resolveBinding: (identity, ctx) =>
                jit.resolveOrProvision(identity, policy, ctx.providerId),
            async logout() {},
        };

        const service = new ConsoleAuthService({
            registry: new ProviderRegistry().register('oidc', () => oidcProvider),
            sessions: new SessionStore({ redis: new InMemoryRedis(), minTtlSeconds: 60 }),
            resolvePolicy: async () => policy,
        });

        const session = await service.completeLogin({
            tenantId: 'lef',
            providerId: 'lef-oidc',
            params: {},
        });

        expect(session.effectiveAccess.ecosystemRoles).toContainEqual({
            ecosystemId: 'eco_ca',
            role: 'ADMIN',
        });
        expect(session.effectiveAccess.ecosystemRoles).toContainEqual({
            ecosystemId: 'eco_root',
            role: 'VIEWER',
        });
    });

    it('rejects completeLogin with a missing or unknown login state when a state store is configured (S2)', async () => {
        const policy = buildPolicy();
        const service = new ConsoleAuthService({
            registry: new ProviderRegistry().register(
                'auth-coordinator',
                config =>
                    new AuthCoordinatorProvider({
                        providerId: config.providerId,
                        jit: inMemoryJit(),
                        resolvePolicy: async () => policy,
                        verifyDidAuth: async vp => ({
                            did: `did:key:${vp}`,
                            assuranceLevel: 'mfa',
                        }),
                    })
            ),
            sessions: new SessionStore({ redis: new InMemoryRedis(), minTtlSeconds: 60 }),
            resolvePolicy: async () => policy,
            stateStore: new LoginStateStore(new InMemoryRedis()),
        });

        await expect(
            service.completeLogin({
                tenantId: 'lef',
                providerId: 'lef-wallet',
                params: { vp: 'z1' },
            })
        ).rejects.toThrow(/login state/);

        await expect(
            service.completeLogin({
                tenantId: 'lef',
                providerId: 'lef-wallet',
                params: { vp: 'z1', state: 'forged' },
            })
        ).rejects.toThrow(/login state/);
    });

    it('accepts completeLogin with a state issued by beginLogin (S2)', async () => {
        const policy = buildPolicy();
        const redis = new InMemoryRedis();
        const service = new ConsoleAuthService({
            registry: new ProviderRegistry().register(
                'auth-coordinator',
                config =>
                    new AuthCoordinatorProvider({
                        providerId: config.providerId,
                        jit: inMemoryJit(),
                        resolvePolicy: async () => policy,
                        verifyDidAuth: async vp => ({
                            did: `did:key:${vp}`,
                            assuranceLevel: 'mfa',
                        }),
                    })
            ),
            sessions: new SessionStore({ redis: new InMemoryRedis(), minTtlSeconds: 60 }),
            resolvePolicy: async () => policy,
            stateStore: new LoginStateStore(redis),
        });

        const { redirectUrl } = await service.beginLogin({
            tenantId: 'lef',
            providerId: 'lef-wallet',
            redirectUri: 'https://console.lef.org/callback',
        });
        const state = new URL(redirectUrl).searchParams.get('state')!;

        const session = await service.completeLogin({
            tenantId: 'lef',
            providerId: 'lef-wallet',
            params: { vp: 'z1', state },
        });

        expect(session.profileId).toBe('profile-1');

        await expect(
            service.completeLogin({
                tenantId: 'lef',
                providerId: 'lef-wallet',
                params: { vp: 'z1', state },
            })
        ).rejects.toThrow(/login state/);
    });
});
