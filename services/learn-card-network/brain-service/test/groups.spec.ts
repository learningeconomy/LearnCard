import { beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createGroup } from '@accesslayer/group/create';
import { getGroupAuditEvents } from '@accesslayer/group/audit';
import {
    getChildGroups,
    getGroupById,
    getGroupMemberships,
    getGroupReferenceView,
    getGroupReferences,
    getGroupsOwnedByEcosystem,
} from '@accesslayer/group/read';
import { enforceGroupInvariants } from '@helpers/group.helpers';
import { createProfile } from '@accesslayer/profile/create';
import { APP_STORE_ADMIN_PROFILE_IDS } from 'src/constants/app-store';
import { Ecosystem, Group, GroupAuditEvent, Profile } from '@models';

import { getClient } from './helpers/getClient';

const OWNER_DID = 'did:key:z6MkGroupOwner';
const ADMIN_DID = 'did:key:z6MkGroupAdmin';
const WRONG_ADMIN_DID = 'did:key:z6MkWrongAdmin';
const MEMBER_DID = 'did:key:z6MkGroupMember';
const STRANGER_DID = 'did:key:z6MkGroupStranger';
const PLATFORM_ADMIN_DID = 'did:key:z6MkPlatformAdmin';

const ownerClient = getClient({ did: OWNER_DID, isChallengeValid: true });
const adminClient = getClient({ did: ADMIN_DID, isChallengeValid: true });
const wrongAdminClient = getClient({ did: WRONG_ADMIN_DID, isChallengeValid: true });
const memberClient = getClient({ did: MEMBER_DID, isChallengeValid: true });
const strangerClient = getClient({ did: STRANGER_DID, isChallengeValid: true });
const platformAdminClient = getClient({ did: PLATFORM_ADMIN_DID, isChallengeValid: true });
const noAuthClient = getClient();

const seedProfile = (profileId: string, did: string) =>
    createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);

// Managed Profiles store an underlying did:key, as createManagedProfile does.
const seedManagedProfile = (profileId: string) =>
    seedProfile(profileId, `did:key:z6MkManaged${profileId.replace(/[^a-zA-Z0-9]/g, '')}`);

/** ADR-001 rule: the ecosystem's ProfileManager administers it and manages the Profile. */
const manageFor = async (profileId: string, ecosystemId: string): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId}), (e:Ecosystem {id: $ecosystemId})
         MERGE (m:ProfileManager {id: 'manager-' + $ecosystemId})
         ON CREATE SET m.created = $now
         MERGE (m)-[:ADMINISTRATES]->(e)
         MERGE (m)-[:MANAGES]->(p)`,
        { profileId, ecosystemId, now: new Date().toISOString() }
    );
};

const createOwnerEcosystem = async (ownerProfileId = 'owner') =>
    createEcosystem({
        name: 'California DOE',
        slug: 'california-doe',
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId,
        settings: {},
        status: 'ACTIVE',
    });

const createOtherEcosystem = async (ownerProfileId = 'wrong-admin') =>
    createEcosystem({
        name: 'Federal DOE',
        slug: 'federal-doe',
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId,
        settings: {},
        status: 'ACTIVE',
    });

describe('Groups', () => {
    beforeEach(async () => {
        APP_STORE_ADMIN_PROFILE_IDS.splice(0, APP_STORE_ADMIN_PROFILE_IDS.length);
        await GroupAuditEvent.delete({ detach: true, where: {} });
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
        await neogma.queryRunner.run('MATCH (m:ProfileManager) DETACH DELETE m');
    });

    it('creates, reads, and exposes groups through the read routes', async () => {
        const ecosystem = await createOwnerEcosystem();
        const root = await createGroup({
            name: 'California Districts',
            slug: 'ca-districts',
            type: 'geographic',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        await createGroup({
            name: 'LAUSD',
            slug: 'lausd',
            type: 'administrative',
            description: undefined,
            parentGroupId: root.id,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        const read = await getGroupById(root.id);
        const owned = await getGroupsOwnedByEcosystem(ecosystem.id);
        const children = await getChildGroups(root.id);

        expect(read?.pathIds).toEqual([root.id]);
        expect(owned).toHaveLength(2);
        expect(children.map(child => child.slug)).toEqual(['lausd']);
        await expect(noAuthClient.group.getGroup({ id: root.id })).rejects.toThrow();
        expect((await ownerClient.group.getGroup({ id: root.id }))?.id).toBe(root.id);
    });

    it('reuses ecosystem-role authorization only, rejecting non-admins, wrong-ecosystem admins, and group members', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const admin = await seedProfile('admin', ADMIN_DID);
        const wrongAdmin = await seedProfile('wrong-admin', WRONG_ADMIN_DID);
        const member = await seedProfile('member', MEMBER_DID);
        await seedProfile('stranger', STRANGER_DID);

        const ownerEcosystem = await createOwnerEcosystem(owner.profileId);
        const otherEcosystem = await createOtherEcosystem(wrongAdmin.profileId);
        await grantEcosystemMembership({
            profileId: admin.profileId,
            ecosystemId: ownerEcosystem.id,
            role: 'ADMIN',
        });
        await grantEcosystemMembership({
            profileId: wrongAdmin.profileId,
            ecosystemId: otherEcosystem.id,
            role: 'ADMIN',
        });

        const group = await ownerClient.group.createGroup({
            name: 'California Districts',
            slug: 'ca-districts',
            type: 'geographic',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ownerEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        await ownerClient.group.addGroupMember({ id: group.id, profileId: member.profileId });

        await expect(
            strangerClient.group.updateGroup({ id: group.id, name: 'Nope' })
        ).rejects.toThrow();
        await expect(
            wrongAdminClient.group.updateGroup({ id: group.id, name: 'Still nope' })
        ).rejects.toThrow();
        await expect(
            memberClient.group.updateGroup({ id: group.id, name: 'Membership is not auth' })
        ).rejects.toThrow();

        const updated = await adminClient.group.updateGroup({
            id: group.id,
            name: 'Updated by admin',
        });
        expect(updated.name).toBe('Updated by admin');
    });

    it('writes membership provenance, rejects manual writes on COMPUTED groups, and materializes computed membership', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const memberA = await seedProfile('member-a', 'did:key:z6MkMemberA');
        const memberB = await seedProfile('member-b', 'did:key:z6MkMemberB');
        const ecosystem = await createOwnerEcosystem(owner.profileId);

        const explicit = await ownerClient.group.createGroup({
            name: 'Explicit Group',
            slug: 'explicit-group',
            type: 'custom',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        await ownerClient.group.addGroupMember({ id: explicit.id, profileId: memberA.profileId });
        const memberships = await getGroupMemberships(explicit.id);
        expect(memberships).toHaveLength(1);
        expect(memberships[0]?.profileId).toBe(memberA.profileId);
        expect(memberships[0]?.provenance).toBe('MANUAL');

        await ownerClient.group.removeGroupMember({
            id: explicit.id,
            profileId: memberA.profileId,
        });
        expect(await getGroupMemberships(explicit.id)).toEqual([]);

        const computed = await ownerClient.group.createGroup({
            name: 'Computed Group',
            slug: 'computed-group',
            type: 'cohort',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'COMPUTED',
            computedCriteria: { profileIds: [memberA.profileId, memberB.profileId] },
            status: 'ACTIVE',
        });

        await expect(
            ownerClient.group.addGroupMember({ id: computed.id, profileId: memberA.profileId })
        ).rejects.toThrow();
        const materialized = await ownerClient.group.materializeComputedMembership({
            id: computed.id,
        });
        expect(materialized.memberProfileIds.sort()).toEqual([
            memberA.profileId,
            memberB.profileId,
        ]);

        const computedMemberships = await getGroupMemberships(computed.id);
        expect(computedMemberships.map(edge => edge.provenance)).toEqual(['COMPUTED', 'COMPUTED']);
    });

    it('moves group subtrees, recomputes caches, and rejects cycles and cross-ecosystem parents', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const otherOwner = await seedProfile('wrong-admin', WRONG_ADMIN_DID);
        const ownerEcosystem = await createOwnerEcosystem(owner.profileId);
        const otherEcosystem = await createOtherEcosystem(otherOwner.profileId);

        const root = await ownerClient.group.createGroup({
            name: 'Root',
            slug: 'root',
            type: 'geographic',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ownerEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const branch = await ownerClient.group.createGroup({
            name: 'Branch',
            slug: 'branch',
            type: 'administrative',
            description: undefined,
            parentGroupId: root.id,
            ownerEcosystemId: ownerEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const leaf = await ownerClient.group.createGroup({
            name: 'Leaf',
            slug: 'leaf',
            type: 'custom',
            description: undefined,
            parentGroupId: branch.id,
            ownerEcosystemId: ownerEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const newRoot = await ownerClient.group.createGroup({
            name: 'New Root',
            slug: 'new-root',
            type: 'geographic',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ownerEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const foreignParent = await createGroup({
            name: 'Foreign Parent',
            slug: 'foreign-parent',
            type: 'custom',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: otherEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        const moved = await ownerClient.group.moveGroup({
            id: branch.id,
            parentGroupId: newRoot.id,
        });
        const movedLeaf = await getGroupById(leaf.id);

        expect(moved.parentGroupId).toBe(newRoot.id);
        expect(moved.pathIds).toEqual([newRoot.id, branch.id]);
        expect(moved.rootGroupId).toBe(newRoot.id);
        expect(movedLeaf?.pathIds).toEqual([newRoot.id, branch.id, leaf.id]);
        expect(movedLeaf?.depth).toBe(2);

        await expect(
            ownerClient.group.moveGroup({ id: newRoot.id, parentGroupId: leaf.id })
        ).rejects.toThrow();
        await expect(
            ownerClient.group.moveGroup({ id: branch.id, parentGroupId: foreignParent.id })
        ).rejects.toThrow();
    });

    it('accepts only identities managed by the owning ecosystem, never by DID shape', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const otherOwner = await seedProfile('wrong-admin', WRONG_ADMIN_DID);
        const ecosystem = await createOwnerEcosystem(owner.profileId);
        const otherEcosystem = await createOtherEcosystem(otherOwner.profileId);
        await seedProfile('legacy-shape', 'did:web:localhost%3A3000:users:legacy-shape');
        const foreign = await seedManagedProfile('foreign-managed');
        await manageFor(foreign.profileId, otherEcosystem.id);
        const groupInput = (identityProfileId: string, slug: string) => ({
            name: 'Issuer',
            slug,
            type: 'administrative' as const,
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId,
            identityIssuanceEnabled: true,
            membershipMode: 'EXPLICIT' as const,
            computedCriteria: undefined,
            status: 'ACTIVE' as const,
        });

        for (const [profileId, slug] of [
            ['legacy-shape', 'legacy'],
            [foreign.profileId, 'foreign'],
        ] as const) {
            await expect(
                ownerClient.group.createGroup(groupInput(profileId, slug))
            ).rejects.toThrow(/managed by the owning ecosystem/);
        }

        const local = await seedManagedProfile('local-managed');
        await manageFor(local.profileId, ecosystem.id);
        const group = await ownerClient.group.createGroup(groupInput(local.profileId, 'local'));
        expect(group.identityProfileId).toBe(local.profileId);
    });

    it('enforces identity attach 1:1, disable, detach, and transfer sequencing', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const newOwner = await seedProfile('new-owner', 'did:key:z6MkNewOwner');
        const managedA = await seedManagedProfile('managed-a');
        await seedManagedProfile('managed-b');
        const ecosystem = await createOwnerEcosystem(owner.profileId);
        const targetEcosystem = await createOtherEcosystem(newOwner.profileId);
        await manageFor('managed-a', ecosystem.id);
        await manageFor('managed-b', ecosystem.id);

        const group = await ownerClient.group.createGroup({
            name: 'Issuer Group',
            slug: 'issuer-group',
            type: 'administrative',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const otherGroup = await ownerClient.group.createGroup({
            name: 'Other Group',
            slug: 'other-group',
            type: 'custom',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        const attached = await ownerClient.group.attachIdentity({
            id: group.id,
            identityProfileId: managedA.profileId,
        });
        expect(attached.identityProfileId).toBe(managedA.profileId);
        expect(attached.identityIssuanceEnabled).toBe(true);

        await expect(
            ownerClient.group.attachIdentity({
                id: otherGroup.id,
                identityProfileId: managedA.profileId,
            })
        ).rejects.toThrow();
        await expect(
            ownerClient.group.transferGroupOwnership({
                id: group.id,
                targetEcosystemId: targetEcosystem.id,
            })
        ).rejects.toThrow();
        await expect(ownerClient.group.detachIdentity({ id: group.id })).rejects.toThrow();

        const disabled = await ownerClient.group.disableIdentityIssuance({ id: group.id });
        expect(disabled.identityIssuanceEnabled).toBe(false);
        const detached = await ownerClient.group.detachIdentity({ id: group.id });
        expect(detached.identityProfileId).toBeUndefined();

        const transferred = await ownerClient.group.transferGroupOwnership({
            id: group.id,
            targetEcosystemId: targetEcosystem.id,
        });
        expect(transferred.ownerEcosystemId).toBe(targetEcosystem.id);
    });

    it('allows only audited break-glass identity cleanup and transfer when the owner ecosystem is archived', async () => {
        APP_STORE_ADMIN_PROFILE_IDS.push('platform-admin');
        const archivedOwner = await seedProfile('owner', OWNER_DID);
        const platformAdmin = await seedProfile('platform-admin', PLATFORM_ADMIN_DID);
        const managed = await seedManagedProfile('managed-a');
        const targetOwner = await seedProfile('target-owner', 'did:key:z6MkTargetOwner');
        const archivedEcosystem = await createEcosystem({
            name: 'Archived Owner',
            slug: 'archived-owner',
            description: undefined,
            parentEcosystemId: null,
            ownerProfileId: archivedOwner.profileId,
            settings: {},
            status: 'ARCHIVED',
        });
        const targetEcosystem = await createOtherEcosystem(targetOwner.profileId);
        await manageFor(managed.profileId, archivedEcosystem.id);
        const group = await createGroup({
            name: 'Transfer Me',
            slug: 'transfer-me',
            type: 'administrative',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: archivedEcosystem.id,
            identityProfileId: managed.profileId,
            identityIssuanceEnabled: true,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        await expect(
            platformAdminClient.group.updateGroup({ id: group.id, name: 'Nope' })
        ).rejects.toThrow();
        await expect(
            platformAdminClient.group.addGroupMember({
                id: group.id,
                profileId: platformAdmin.profileId,
            })
        ).rejects.toThrow();

        const disabled = await platformAdminClient.group.disableIdentityIssuance({ id: group.id });
        expect(disabled.identityIssuanceEnabled).toBe(false);
        const detached = await platformAdminClient.group.detachIdentity({ id: group.id });
        expect(detached.identityProfileId).toBeUndefined();
        const transferred = await platformAdminClient.group.transferGroupOwnership({
            id: group.id,
            targetEcosystemId: targetEcosystem.id,
        });
        expect(transferred.ownerEcosystemId).toBe(targetEcosystem.id);
    });

    it('grants and revokes cross-ecosystem references without leaking transitive profile payload', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        await seedProfile('consumer', STRANGER_DID);
        const member = await seedProfile('member-a', 'did:key:z6MkMemberA');
        const ownerEcosystem = await createOwnerEcosystem(owner.profileId);
        const consumerEcosystem = await createOtherEcosystem('consumer');
        const group = await ownerClient.group.createGroup({
            name: 'Shareable Group',
            slug: 'shareable-group',
            type: 'cohort',
            description: 'Shared group',
            parentGroupId: null,
            ownerEcosystemId: ownerEcosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        await ownerClient.group.addGroupMember({ id: group.id, profileId: member.profileId });

        await ownerClient.group.grantGroupReference({
            id: group.id,
            consumerEcosystemId: consumerEcosystem.id,
            mode: 'SUMMARY',
            expiresAt: null,
        });

        const summaryView = await getGroupReferenceView(group.id, consumerEcosystem.id);
        expect(summaryView).toEqual({
            group: {
                id: group.id,
                name: 'Shareable Group',
                slug: 'shareable-group',
                type: 'cohort',
                description: 'Shared group',
                status: 'ACTIVE',
                ownerEcosystemId: ownerEcosystem.id,
            },
        });

        await ownerClient.group.grantGroupReference({
            id: group.id,
            consumerEcosystemId: consumerEcosystem.id,
            mode: 'ROSTER',
            expiresAt: null,
        });
        const rosterView = await getGroupReferenceView(group.id, consumerEcosystem.id);
        expect(rosterView?.memberProfileIds).toEqual([member.profileId]);
        expect(Object.keys(rosterView?.group ?? {}).sort()).toEqual([
            'description',
            'id',
            'name',
            'ownerEcosystemId',
            'slug',
            'status',
            'type',
        ]);

        const references = await getGroupReferences(group.id);
        expect(references).toHaveLength(1);
        expect(references[0]?.mode).toBe('ROSTER');

        await ownerClient.group.revokeGroupReference({
            id: group.id,
            consumerEcosystemId: consumerEcosystem.id,
        });
        expect(await getGroupReferenceView(group.id, consumerEcosystem.id)).toBeNull();
    });

    it('rejects slug collisions, singular ownership violations, and archived-group membership or identity writes', async () => {
        const owner = await seedProfile('owner', OWNER_DID);
        const member = await seedProfile('member-a', 'did:key:z6MkMemberA');
        const managed = await seedManagedProfile('managed-a');
        const otherOwner = await seedProfile('other-owner', 'did:key:z6MkOtherOwner');
        const ecosystem = await createOwnerEcosystem(owner.profileId);
        const otherEcosystem = await createOtherEcosystem(otherOwner.profileId);
        await manageFor(managed.profileId, ecosystem.id);
        const root = await ownerClient.group.createGroup({
            name: 'Root',
            slug: 'root',
            type: 'geographic',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const a = await ownerClient.group.createGroup({
            name: 'A',
            slug: 'duplicate',
            type: 'custom',
            description: undefined,
            parentGroupId: root.id,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const b = await ownerClient.group.createGroup({
            name: 'B',
            slug: 'unique',
            type: 'custom',
            description: undefined,
            parentGroupId: root.id,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        await expect(
            ownerClient.group.updateGroup({ id: b.id, slug: 'duplicate' })
        ).rejects.toThrow();

        const archived = await ownerClient.group.archiveGroup({ id: a.id });
        expect(archived.status).toBe('ARCHIVED');
        await expect(
            ownerClient.group.addGroupMember({ id: a.id, profileId: member.profileId })
        ).rejects.toThrow();
        await expect(
            ownerClient.group.attachIdentity({ id: a.id, identityProfileId: managed.profileId })
        ).rejects.toThrow();

        await neogma.queryRunner.run(
            `MATCH (e:Ecosystem { id: $ecosystemId })
             MATCH (g:Group { id: $groupId })
             CREATE (e)-[:OWNS]->(g)`,
            { ecosystemId: otherEcosystem.id, groupId: b.id }
        );
        await expect(enforceGroupInvariants(b.id)).rejects.toThrow();
    });

    it('emits audit events for every group write action', async () => {
        APP_STORE_ADMIN_PROFILE_IDS.push('platform-admin');
        const owner = await seedProfile('owner', OWNER_DID);
        const platformAdmin = await seedProfile('platform-admin', PLATFORM_ADMIN_DID);
        const member = await seedProfile('member-a', 'did:key:z6MkMemberA');
        const managed = await seedManagedProfile('managed-a');
        const targetOwner = await seedProfile('target-owner', 'did:key:z6MkTargetOwner');
        const ecosystem = await createOwnerEcosystem(owner.profileId);
        const consumerEcosystem = await createOtherEcosystem('consumer');
        const transferTarget = await createOtherEcosystem(targetOwner.profileId);
        await manageFor(managed.profileId, ecosystem.id);

        const group = await ownerClient.group.createGroup({
            name: 'Audited',
            slug: 'audited',
            type: 'custom',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const moveParent = await ownerClient.group.createGroup({
            name: 'Move Parent',
            slug: 'move-parent',
            type: 'custom',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });
        const movableGroup = await ownerClient.group.createGroup({
            name: 'Movable',
            slug: 'movable',
            type: 'custom',
            description: undefined,
            parentGroupId: null,
            ownerEcosystemId: ecosystem.id,
            identityProfileId: undefined,
            identityIssuanceEnabled: undefined,
            membershipMode: 'EXPLICIT',
            computedCriteria: undefined,
            status: 'ACTIVE',
        });

        await ownerClient.group.updateGroup({ id: group.id, name: 'Audited 2' });
        await ownerClient.group.addGroupMember({ id: group.id, profileId: member.profileId });
        await ownerClient.group.removeGroupMember({ id: group.id, profileId: member.profileId });
        await ownerClient.group.moveGroup({ id: movableGroup.id, parentGroupId: moveParent.id });
        await ownerClient.group.attachIdentity({
            id: group.id,
            identityProfileId: managed.profileId,
        });
        await ownerClient.group.disableIdentityIssuance({ id: group.id });
        await ownerClient.group.detachIdentity({ id: group.id });
        await ownerClient.group.grantGroupReference({
            id: group.id,
            consumerEcosystemId: consumerEcosystem.id,
            mode: 'SUMMARY',
            expiresAt: null,
        });
        await ownerClient.group.revokeGroupReference({
            id: group.id,
            consumerEcosystemId: consumerEcosystem.id,
        });
        await ownerClient.group.transferGroupOwnership({
            id: group.id,
            targetEcosystemId: transferTarget.id,
        });

        const auditActions = [
            ...(await getGroupAuditEvents(group.id)).map(event => event.action),
            ...(await getGroupAuditEvents(movableGroup.id)).map(event => event.action),
        ];
        expect(auditActions).toEqual([
            'group:create',
            'group:update',
            'group-member:add',
            'group-member:remove',
            'identity:attach',
            'identity:disable',
            'identity:detach',
            'group-reference:grant',
            'group-reference:revoke',
            'group:transfer',
            'group:create',
            'group:move',
        ]);
        expect((await getGroupAuditEvents(moveParent.id)).map(event => event.action)).toEqual([
            'group:create',
        ]);

        expect(platformAdmin.profileId).toBe('platform-admin');
    });
});
