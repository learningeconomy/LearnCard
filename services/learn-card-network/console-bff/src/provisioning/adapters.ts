import { randomUUID } from 'crypto';

import type { EcosystemRole, ProvisionableRole } from '@learncard/types';

import type { KeyManagementService } from '@kms';
import { didWebFromDomain, type MutableManagedKeyDirectory } from '@did';

import type { ManagedIdentityMinter, MembershipGranter, MintedIdentity } from './types';

export interface ProfileCreator {
    createManagedProfile(params: {
        did: string;
        profileId: string;
        displayName?: string;
    }): Promise<void>;
}

export interface MembershipWriter {
    grantMembership(params: {
        ecosystemId: string;
        profileId: string;
        role: EcosystemRole | ProvisionableRole;
    }): Promise<void>;
}

export type KmsManagedIdentityMinterDeps = {
    kms: KeyManagementService;
    directory: MutableManagedKeyDirectory;
    profiles: ProfileCreator;
    consoleDomain: string;
};

export class KmsManagedIdentityMinter implements ManagedIdentityMinter {
    constructor(private readonly deps: KmsManagedIdentityMinterDeps) {}

    async mint({ tenantId }: { tenantId: string; ecosystemId: string }): Promise<MintedIdentity> {
        const profileId = `eos-${tenantId}-${randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const managedDid = didWebFromDomain(this.deps.consoleDomain, profileId);

        const keyRef = await this.deps.kms.generateSigningKey({
            tenantId,
            alias: `p:${profileId}`,
        });

        await this.deps.directory.put(managedDid, keyRef);
        await this.deps.profiles.createManagedProfile({ did: managedDid, profileId });

        return { profileId, managedDid };
    }

    async rotate(managedDid: string): Promise<void> {
        const current = await this.deps.directory.getKeyRef(managedDid);

        if (!current) throw new Error(`No managed key registered for ${managedDid}`);

        const rotated = await this.deps.kms.rotateKey(current);

        await this.deps.directory.put(managedDid, rotated);
    }
}

export class BrainServiceMembershipGranter implements MembershipGranter {
    constructor(private readonly writer: MembershipWriter) {}

    async grant(params: {
        profileId: string;
        ecosystemId: string;
        role: EcosystemRole | ProvisionableRole;
    }): Promise<void> {
        await this.writer.grantMembership(params);
    }
}
