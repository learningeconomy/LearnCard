import type { EcosystemRole, ExternalIdentityBinding, ProvisionableRole } from '@learncard/types';

export type MintedIdentity = {
    profileId: string;
    managedDid: string;
};

export interface ManagedIdentityMinter {
    mint(params: { tenantId: string; ecosystemId: string }): Promise<MintedIdentity>;
}

export interface MembershipGranter {
    grant(params: {
        profileId: string;
        ecosystemId: string;
        role: EcosystemRole | ProvisionableRole;
    }): Promise<void>;
}

export interface BindingRepository {
    findBySubject(
        tenantId: string,
        issuer: string,
        subject: string
    ): Promise<ExternalIdentityBinding | null>;
    save(binding: ExternalIdentityBinding): Promise<ExternalIdentityBinding>;
    touchLastLogin(tenantId: string, issuer: string, subject: string, at: string): Promise<void>;
}
