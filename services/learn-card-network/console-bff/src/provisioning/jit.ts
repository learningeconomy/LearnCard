import type {
    EcosystemRole,
    ExternalIdentity,
    ExternalIdentityBinding,
    ProvisionableRole,
    TenantAuthPolicy,
} from '@learncard/types';

import type { IdentityResolution } from '@providers';

import type { BindingRepository, ManagedIdentityMinter, MembershipGranter } from './types';

export type JitProvisionerDeps = {
    minter: ManagedIdentityMinter;
    membership: MembershipGranter;
    bindings: BindingRepository;
};

function mappedRoles(
    policy: TenantAuthPolicy,
    identity: ExternalIdentity
): Array<{ ecosystemId: string; role: EcosystemRole }> {
    const groups = new Set(identity.groups ?? []);

    return policy.groupMappings.filter(mapping => groups.has(mapping.idpGroup));
}

export class JitProvisioner {
    constructor(private readonly deps: JitProvisionerDeps) {}

    async resolveOrProvision(
        identity: ExternalIdentity,
        policy: TenantAuthPolicy,
        providerId: string
    ): Promise<IdentityResolution> {
        const existing = await this.deps.bindings.findBySubject(
            policy.tenantId,
            identity.issuer,
            identity.subject
        );

        if (existing?.status === 'REVOKED') {
            throw new Error(`Identity binding for subject "${identity.subject}" is revoked`);
        }

        if (existing?.status === 'ACTIVE') {
            await this.deps.bindings.touchLastLogin(
                policy.tenantId,
                identity.issuer,
                identity.subject,
                new Date().toISOString()
            );

            return { binding: existing, isNewlyProvisioned: false };
        }

        if (!existing && !policy.allowJit) {
            throw new Error(`JIT provisioning is disabled for tenant "${policy.tenantId}"`);
        }

        const minted = existing
            ? { profileId: existing.profileId, managedDid: existing.managedDid }
            : await this.deps.minter.mint({
                  tenantId: policy.tenantId,
                  ecosystemId: policy.rootEcosystemId,
              });

        await this.grantMemberships(minted.profileId, policy, identity);

        const binding = await this.persistBinding(existing, minted, identity, policy, providerId);

        return { binding, isNewlyProvisioned: true };
    }

    private async grantMemberships(
        profileId: string,
        policy: TenantAuthPolicy,
        identity: ExternalIdentity
    ): Promise<void> {
        const defaultRole: ProvisionableRole = policy.defaultRole;

        await this.deps.membership.grant({
            profileId,
            ecosystemId: policy.rootEcosystemId,
            role: defaultRole,
        });

        for (const mapping of mappedRoles(policy, identity)) {
            await this.deps.membership.grant({
                profileId,
                ecosystemId: mapping.ecosystemId,
                role: mapping.role,
            });
        }
    }

    private async persistBinding(
        existing: ExternalIdentityBinding | null,
        minted: { profileId: string; managedDid: string },
        identity: ExternalIdentity,
        policy: TenantAuthPolicy,
        providerId: string
    ): Promise<ExternalIdentityBinding> {
        const now = new Date().toISOString();

        const binding: ExternalIdentityBinding = {
            tenantId: policy.tenantId,
            ecosystemId: policy.rootEcosystemId,
            providerId,
            issuer: identity.issuer,
            subject: identity.subject,
            email: identity.email,
            employeeId: identity.employeeId,
            profileId: minted.profileId,
            managedDid: minted.managedDid,
            provisioningSource: existing ? existing.provisioningSource : 'JIT',
            status: 'ACTIVE',
            createdAt: existing?.createdAt ?? now,
            lastLoginAt: now,
        };

        return this.deps.bindings.save(binding);
    }
}
