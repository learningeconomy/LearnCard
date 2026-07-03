import { describe, it, expect, beforeEach } from 'vitest';

import {
    TenantAuthPolicyValidator,
    type ExternalIdentity,
    type ExternalIdentityBinding,
} from '@learncard/types';

import {
    JitProvisioner,
    type BindingRepository,
    type ManagedIdentityMinter,
    type MembershipGranter,
} from '@provisioning';

class FakeBindings implements BindingRepository {
    rows: ExternalIdentityBinding[] = [];
    touched: string[] = [];

    async findBySubject(tenantId: string, issuer: string, subject: string) {
        return (
            this.rows.find(
                r => r.tenantId === tenantId && r.issuer === issuer && r.subject === subject
            ) ?? null
        );
    }

    async save(binding: ExternalIdentityBinding) {
        this.rows = this.rows.filter(
            r => !(r.issuer === binding.issuer && r.subject === binding.subject)
        );
        this.rows.push(binding);

        return binding;
    }

    async touchLastLogin(_t: string, _i: string, subject: string, _at: string) {
        this.touched.push(subject);
    }
}

class FakeMinter implements ManagedIdentityMinter {
    calls = 0;

    async mint({ ecosystemId }: { tenantId: string; ecosystemId: string }) {
        this.calls += 1;

        return {
            profileId: `profile-${this.calls}`,
            managedDid: `did:web:console.lef.org:e:${ecosystemId}:p:${this.calls}`,
        };
    }
}

class FakeMembership implements MembershipGranter {
    grants: Array<{ profileId: string; ecosystemId: string; role: string }> = [];

    async grant(params: { profileId: string; ecosystemId: string; role: string }) {
        this.grants.push(params);
    }
}

const identity = (overrides: Partial<ExternalIdentity> = {}): ExternalIdentity => ({
    issuer: 'https://idp.example',
    subject: 'sub-1',
    email: 'a@lef.org',
    ...overrides,
});

const policy = (overrides = {}) =>
    TenantAuthPolicyValidator.parse({
        tenantId: 'lef',
        rootEcosystemId: 'eco_root',
        allowJit: true,
        defaultRole: 'MEMBER',
        providers: [{ providerId: 'lef-oidc', kind: 'oidc', enabled: true }],
        ...overrides,
    });

describe('JitProvisioner', () => {
    let bindings: FakeBindings;
    let minter: FakeMinter;
    let membership: FakeMembership;
    let jit: JitProvisioner;

    beforeEach(() => {
        bindings = new FakeBindings();
        minter = new FakeMinter();
        membership = new FakeMembership();
        jit = new JitProvisioner({ bindings, minter, membership });
    });

    it('provisions a new subject and grants the default role at the root ecosystem', async () => {
        const result = await jit.resolveOrProvision(identity(), policy(), 'lef-oidc');

        expect(result.isNewlyProvisioned).toBe(true);
        expect(minter.calls).toBe(1);
        expect(result.binding.status).toBe('ACTIVE');
        expect(result.binding.provisioningSource).toBe('JIT');
        expect(membership.grants).toContainEqual({
            profileId: 'profile-1',
            ecosystemId: 'eco_root',
            role: 'MEMBER',
        });
        expect(result.grants).toEqual([{ ecosystemId: 'eco_root', role: 'MEMBER' }]);
    });

    it('returns an existing ACTIVE binding without re-minting', async () => {
        await jit.resolveOrProvision(identity(), policy(), 'lef-oidc');
        minter.calls = 0;

        const result = await jit.resolveOrProvision(identity(), policy(), 'lef-oidc');

        expect(result.isNewlyProvisioned).toBe(false);
        expect(minter.calls).toBe(0);
        expect(bindings.touched).toContain('sub-1');
    });

    it('refuses to provision an unknown subject when JIT is disabled', async () => {
        await expect(
            jit.resolveOrProvision(identity(), policy({ allowJit: false }), 'lef-oidc')
        ).rejects.toThrow(/JIT provisioning is disabled/);
    });

    it('rejects a revoked binding', async () => {
        await bindings.save({
            tenantId: 'lef',
            ecosystemId: 'eco_root',
            providerId: 'lef-oidc',
            issuer: 'https://idp.example',
            subject: 'sub-1',
            profileId: 'p',
            managedDid: 'did:web:x',
            provisioningSource: 'JIT',
            status: 'REVOKED',
            createdAt: new Date().toISOString(),
        });

        await expect(jit.resolveOrProvision(identity(), policy(), 'lef-oidc')).rejects.toThrow(
            /revoked/
        );
    });

    it('activates a pre-provisioned (IMPORT/PENDING) binding without re-minting', async () => {
        await bindings.save({
            tenantId: 'lef',
            ecosystemId: 'eco_root',
            providerId: 'lef-oidc',
            issuer: 'https://idp.example',
            subject: 'sub-1',
            profileId: 'preprovisioned',
            managedDid: 'did:web:imported',
            provisioningSource: 'IMPORT',
            status: 'PENDING',
            createdAt: '2020-01-01T00:00:00.000Z',
        });

        const result = await jit.resolveOrProvision(identity(), policy(), 'lef-oidc');

        expect(minter.calls).toBe(0);
        expect(result.binding.status).toBe('ACTIVE');
        expect(result.binding.provisioningSource).toBe('IMPORT');
        expect(result.binding.profileId).toBe('preprovisioned');
        expect(result.binding.createdAt).toBe('2020-01-01T00:00:00.000Z');
    });

    it('applies group mappings as additional ecosystem role grants', async () => {
        const mappedPolicy = policy({
            groupMappings: [{ idpGroup: 'admins', ecosystemId: 'eco_ca', role: 'ADMIN' }],
        });

        const result = await jit.resolveOrProvision(
            identity({ groups: ['admins'] }),
            mappedPolicy,
            'lef-oidc'
        );

        expect(membership.grants).toContainEqual({
            profileId: 'profile-1',
            ecosystemId: 'eco_ca',
            role: 'ADMIN',
        });
        expect(result.grants).toContainEqual({ ecosystemId: 'eco_ca', role: 'ADMIN' });
    });

    it('recompiles grants for a returning ACTIVE binding from current IdP group claims', async () => {
        const mappedPolicy = policy({
            groupMappings: [{ idpGroup: 'admins', ecosystemId: 'eco_ca', role: 'ADMIN' }],
        });

        await jit.resolveOrProvision(identity({ groups: ['admins'] }), mappedPolicy, 'lef-oidc');
        const second = await jit.resolveOrProvision(
            identity({ groups: ['admins'] }),
            mappedPolicy,
            'lef-oidc'
        );

        expect(second.isNewlyProvisioned).toBe(false);
        expect(second.grants).toContainEqual({ ecosystemId: 'eco_ca', role: 'ADMIN' });
    });
});
