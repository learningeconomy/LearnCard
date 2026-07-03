import { describe, it, expect, beforeEach } from 'vitest';

import { TenantAuthPolicyValidator, type ExternalIdentityBinding } from '@learncard/types';

import { AuthCoordinatorProvider, AUTH_COORDINATOR_ISSUER, type CallbackContext } from '@providers';
import {
    JitProvisioner,
    type BindingRepository,
    type ManagedIdentityMinter,
    type MembershipGranter,
} from '@provisioning';

const policy = TenantAuthPolicyValidator.parse({
    tenantId: 'lef',
    rootEcosystemId: 'eco_root',
    allowJit: true,
    defaultRole: 'MEMBER',
    providers: [{ providerId: 'lef-wallet', kind: 'auth-coordinator', enabled: true }],
});

const makeJit = () => {
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

    return new JitProvisioner({ bindings, minter, membership });
};

describe('AuthCoordinatorProvider', () => {
    let provider: AuthCoordinatorProvider;

    beforeEach(() => {
        provider = new AuthCoordinatorProvider({
            providerId: 'lef-wallet',
            jit: makeJit(),
            resolvePolicy: async () => policy,
            verifyDidAuth: async vp => ({ did: `did:key:${vp}`, assuranceLevel: 'mfa' }),
        });
    });

    it('exposes its configured id and auth-coordinator kind', () => {
        expect(provider.id).toBe('lef-wallet');
        expect(provider.kind).toBe('auth-coordinator');
    });

    it('verifies the DID-Auth presentation into an ExternalIdentity', async () => {
        const ctx: CallbackContext = {
            tenantId: 'lef',
            providerId: 'lef-wallet',
            params: { vp: 'z123' },
        };

        const identity = await provider.handleCallback(ctx);

        expect(identity.issuer).toBe(AUTH_COORDINATOR_ISSUER);
        expect(identity.subject).toBe('did:key:z123');
        expect(identity.assuranceLevel).toBe('mfa');
    });

    it('throws when the callback lacks a presentation', async () => {
        await expect(
            provider.handleCallback({ tenantId: 'lef', providerId: 'lef-wallet', params: {} })
        ).rejects.toThrow(/Missing DID-Auth/);
    });

    it('resolves a binding by provisioning through the JIT primitive', async () => {
        const ctx: CallbackContext = {
            tenantId: 'lef',
            providerId: 'lef-wallet',
            params: { vp: 'z123' },
        };

        const identity = await provider.handleCallback(ctx);
        const resolution = await provider.resolveBinding(identity, ctx);

        expect(resolution.isNewlyProvisioned).toBe(true);
        expect(resolution.binding.managedDid).toBe('did:web:console.lef.org:p:1');
        expect(resolution.binding.status).toBe('ACTIVE');
    });
});
