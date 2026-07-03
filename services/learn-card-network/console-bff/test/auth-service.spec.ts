import { describe, it, expect } from 'vitest';

import { TenantAuthPolicyValidator, type ExternalIdentityBinding } from '@learncard/types';

import { ConsoleAuthService } from '../src/app';
import { ProviderRegistry, AuthCoordinatorProvider } from '@providers';
import { InMemoryRedis, SessionStore } from '@session';
import {
    JitProvisioner,
    type BindingRepository,
    type ManagedIdentityMinter,
    type MembershipGranter,
} from '@provisioning';

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
});
