import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { getClient } from './helpers/getClient';
import { Ecosystem, Group, Profile } from '@models';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createProfile } from '@accesslayer/profile/create';
import {
    getEcosystemMembershipRole,
    grantEcosystemMembership,
} from '@accesslayer/ecosystem/membership';

const OWNER_DID = 'did:key:z6MkMembershipOwner';
const STRANGER_DID = 'did:key:z6MkMembershipStranger';

const SERVICE_DID = 'did:web:console.lef.org:service:provisioner';
const UNAUTHORIZED_SERVICE_DID = 'did:key:z6MkNotAllowedService';

const ownerClient = getClient({ did: OWNER_DID, isChallengeValid: true });
const strangerClient = getClient({ did: STRANGER_DID, isChallengeValid: true });
const serviceClient = getClient({ did: SERVICE_DID, isChallengeValid: true });
const unauthorizedServiceClient = getClient({
    did: UNAUTHORIZED_SERVICE_DID,
    isChallengeValid: true,
});

const seedProfile = (profileId: string, did: string) =>
    createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);

const seedRootEcosystem = (ownerProfileId: string) =>
    createEcosystem({
        name: 'LEF Root',
        slug: 'lef',
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId,
        settings: {},
        status: 'ACTIVE',
    });

describe('Ecosystem membership', () => {
    beforeEach(async () => {
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    it('lets the owner grant a MEMBER_OF role to a target profile', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const target = await seedProfile('member', 'did:key:z6MkTargetMember');
        const ecosystem = await seedRootEcosystem(owner.profileId);

        const result = await ownerClient.ecosystem.grantMembership({
            id: ecosystem.id,
            profileId: target.profileId,
            role: 'MEMBER',
        });

        expect(result).toEqual({ granted: true, role: 'MEMBER' });
        expect(await getEcosystemMembershipRole(target.profileId, ecosystem.id)).toBe('MEMBER');
    });

    it('is idempotent and updates the role in place without duplicating edges', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const target = await seedProfile('member', 'did:key:z6MkTargetMember');
        const ecosystem = await seedRootEcosystem(owner.profileId);

        await ownerClient.ecosystem.grantMembership({
            id: ecosystem.id,
            profileId: target.profileId,
            role: 'MEMBER',
        });
        await ownerClient.ecosystem.grantMembership({
            id: ecosystem.id,
            profileId: target.profileId,
            role: 'VIEWER',
        });

        expect(await getEcosystemMembershipRole(target.profileId, ecosystem.id)).toBe('VIEWER');
    });

    it('lets an ADMIN member (non-owner) grant membership', async () => {
        const owner = await seedProfile('owner', 'did:key:z6MkTheOwner');
        const admin = await seedProfile('admin', OWNER_DID);
        const target = await seedProfile('member', 'did:key:z6MkTargetMember');
        const ecosystem = await seedRootEcosystem(owner.profileId);

        await grantEcosystemMembership({
            profileId: admin.profileId,
            ecosystemId: ecosystem.id,
            role: 'ADMIN',
        });

        const result = await ownerClient.ecosystem.grantMembership({
            id: ecosystem.id,
            profileId: target.profileId,
            role: 'MEMBER',
        });

        expect(result.granted).toBe(true);
    });

    it('rejects a caller who is neither owner nor admin', async () => {
        const owner = await seedProfile('owner', 'did:key:z6MkTheOwner');
        await seedProfile('stranger', STRANGER_DID);
        const target = await seedProfile('member', 'did:key:z6MkTargetMember');
        const ecosystem = await seedRootEcosystem(owner.profileId);

        await expect(
            strangerClient.ecosystem.grantMembership({
                id: ecosystem.id,
                profileId: target.profileId,
                role: 'MEMBER',
            })
        ).rejects.toThrow();
    });

    it('throws NOT_FOUND for an unknown ecosystem', async () => {
        await seedProfile('owner', OWNER_DID);

        await expect(
            ownerClient.ecosystem.grantMembership({
                id: 'eco_missing',
                profileId: 'member',
                role: 'MEMBER',
            })
        ).rejects.toThrow();
    });

    it('throws NOT_FOUND for an unknown target profile', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const ecosystem = await seedRootEcosystem(owner.profileId);

        await expect(
            ownerClient.ecosystem.grantMembership({
                id: ecosystem.id,
                profileId: 'ghost',
                role: 'MEMBER',
            })
        ).rejects.toThrow();
    });

    it('does not accept OWNER as a grantable role', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const target = await seedProfile('member', 'did:key:z6MkTargetMember');
        const ecosystem = await seedRootEcosystem(owner.profileId);

        await expect(
            ownerClient.ecosystem.grantMembership({
                id: ecosystem.id,
                profileId: target.profileId,
                role: 'OWNER' as never,
            })
        ).rejects.toThrow();
    });

    describe('service-provisioned membership (service DID)', () => {
        beforeAll(() => {
            process.env.AUTHORIZED_SERVICE_DIDS = SERVICE_DID;
        });

        afterAll(() => {
            delete process.env.AUTHORIZED_SERVICE_DIDS;
        });

        it('lets an allowlisted service DID grant a non-admin role without owner/admin authority', async () => {
            const owner = await seedProfile('owner', 'did:key:z6MkTheOwner');
            const target = await seedProfile('member', 'did:key:z6MkTargetMember');
            const ecosystem = await seedRootEcosystem(owner.profileId);

            const result = await serviceClient.ecosystem.grantProvisionedMembership({
                id: ecosystem.id,
                profileId: target.profileId,
                role: 'MEMBER',
            });

            expect(result).toEqual({ granted: true, role: 'MEMBER' });
            expect(await getEcosystemMembershipRole(target.profileId, ecosystem.id)).toBe('MEMBER');
        });

        it('rejects a service DID that is not on the allowlist', async () => {
            const owner = await seedProfile('owner', 'did:key:z6MkTheOwner');
            const target = await seedProfile('member', 'did:key:z6MkTargetMember');
            const ecosystem = await seedRootEcosystem(owner.profileId);

            await expect(
                unauthorizedServiceClient.ecosystem.grantProvisionedMembership({
                    id: ecosystem.id,
                    profileId: target.profileId,
                    role: 'MEMBER',
                })
            ).rejects.toThrow();
        });

        it('refuses ADMIN via the service-provisioned route', async () => {
            const owner = await seedProfile('owner', 'did:key:z6MkTheOwner');
            const target = await seedProfile('member', 'did:key:z6MkTargetMember');
            const ecosystem = await seedRootEcosystem(owner.profileId);

            await expect(
                serviceClient.ecosystem.grantProvisionedMembership({
                    id: ecosystem.id,
                    profileId: target.profileId,
                    role: 'ADMIN' as never,
                })
            ).rejects.toThrow();
        });

        it('throws NOT_FOUND for an unknown target profile', async () => {
            const owner = await seedProfile('owner', 'did:key:z6MkTheOwner');
            const ecosystem = await seedRootEcosystem(owner.profileId);

            await expect(
                serviceClient.ecosystem.grantProvisionedMembership({
                    id: ecosystem.id,
                    profileId: 'ghost',
                    role: 'MEMBER',
                })
            ).rejects.toThrow();
        });
    });
});
