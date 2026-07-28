import type {
    EcosystemRoleGrant,
    ExternalIdentity,
    ExternalIdentityBinding,
    TenantAuthPolicy,
} from '@learncard/types';

import type { IdentityResolution } from '@providers';

import type { BindingRepository, ManagedIdentityMinter, MembershipGranter } from './types';

export type JitProvisionerDeps = {
    minter: ManagedIdentityMinter;
    membership: MembershipGranter;
    bindings: BindingRepository;
};

// The subject's entitlements are recompiled from the IdP assertion at every login (ADR §3.9):
// the tenant default role at the root Ecosystem, plus any Ecosystem roles their current IdP
// group claims map to. This is the single source of truth for both the graph grants and the
// session's effectiveAccess, so the two can never diverge.
function computeGrants(policy: TenantAuthPolicy, identity: ExternalIdentity): EcosystemRoleGrant[] {
    const groups = new Set(identity.groups ?? []);

    const mapped = policy.groupMappings
        .filter(mapping => groups.has(mapping.idpGroup))
        .map(mapping => ({ ecosystemId: mapping.ecosystemId, role: mapping.role }));

    return [{ ecosystemId: policy.rootEcosystemId, role: policy.defaultRole }, ...mapped];
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

        const grants = computeGrants(policy, identity);

        if (existing?.status === 'ACTIVE') {
            await this.deps.bindings.touchLastLogin(
                policy.tenantId,
                identity.issuer,
                identity.subject,
                new Date().toISOString()
            );

            return { binding: existing, isNewlyProvisioned: false, grants };
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

        for (const grant of grants) {
            await this.deps.membership.grant({ profileId: minted.profileId, ...grant });
        }

        const binding = await this.persistBinding(existing, minted, identity, policy, providerId);

        return { binding, isNewlyProvisioned: true, grants };
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
