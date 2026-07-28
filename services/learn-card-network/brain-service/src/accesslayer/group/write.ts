import { TRPCError } from '@trpc/server';
import { v4 as uuid } from 'uuid';

import { neogma } from '@instance';
import { Group, GroupInstance, Ecosystem, Profile } from '@models';
import { Group as GroupModelType, GroupReferenceMode } from '@learncard/types';
import { FlatGroupType } from 'types/group';

import { createGroupAuditEvent } from './audit';
import {
    assertArchivedGroupWriteAllowed,
    assertHasIdentityAvailability,
    assertParentOwnershipCompatibility,
    assertSlugUnique,
    authorizeGroupWrite,
    enforceGroupInvariants,
    getComputedMemberProfileIds,
    getGroupAuditSummary,
    parseComputedCriteria,
    requireEcosystem,
    requireGroup,
    requireManagedIdentityProfile,
    serializeComputedCriteria,
    validateMembershipMode,
} from '@helpers/group.helpers';

type GroupMutationOptions = {
    actorProfileId?: string;
};

type CreateGroupInput = Omit<
    GroupModelType,
    'id' | 'pathIds' | 'depth' | 'rootGroupId' | 'createdAt' | 'updatedAt'
> & { parentGroupId: string | null };

type UpdateGroupInput = {
    id: string;
    name?: string;
    slug?: string;
    description?: string;
    type?: GroupModelType['type'];
    status?: GroupModelType['status'];
};

const getBreakGlassFlag = (ecosystemStatus: string, actorProfileId?: string): boolean => {
    return ecosystemStatus === 'ARCHIVED' && Boolean(actorProfileId);
};

const updateGroupNode = async (groupId: string, patch: Record<string, unknown>): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })
         SET g += $patch`,
        { groupId, patch }
    );
};

const removeGroupProperties = async (groupId: string, properties: string[]): Promise<void> => {
    if (!properties.length) return;

    await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })
         ${properties.map(property => `REMOVE g.${property}`).join('\n         ')}`,
        { groupId }
    );
};

const getSubtree = async (groupId: string): Promise<FlatGroupType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (g:Group)
         WHERE g.id = $groupId OR $groupId IN g.pathIds
         RETURN g
         ORDER BY size(g.pathIds) ASC`,
        { groupId }
    );

    return result.records.map(record => record.get('g').properties as FlatGroupType);
};

const getMemberProfileIdsForGroup = async (groupId: string): Promise<string[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[:MEMBER_OF]->(:Group { id: $groupId })
         RETURN p.profileId AS profileId
         ORDER BY p.profileId ASC`,
        { groupId }
    );

    return result.records.map(record => String(record.get('profileId')));
};

const auditGroupMutation = async (
    actorProfileId: string | undefined,
    action: string,
    beforeGroup: FlatGroupType | undefined,
    afterGroup: FlatGroupType,
    extra?: { beforeSummary?: Record<string, unknown>; afterSummary?: Record<string, unknown> }
): Promise<void> => {
    if (!actorProfileId) return;

    await createGroupAuditEvent({
        actorProfileId,
        action,
        groupId: afterGroup.id,
        ecosystemId: afterGroup.ownerEcosystemId,
        beforeSummary:
            extra?.beforeSummary ?? (beforeGroup ? getGroupAuditSummary(beforeGroup) : undefined),
        afterSummary: extra?.afterSummary ?? getGroupAuditSummary(afterGroup),
    });
};

export const createGroup = async (
    input: CreateGroupInput,
    options: GroupMutationOptions = {}
): Promise<GroupInstance> => {
    validateMembershipMode(input);
    await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: input.ownerEcosystemId,
        action: 'group:create',
    });
    const parent = await assertParentOwnershipCompatibility(
        input.ownerEcosystemId,
        input.parentGroupId,
        undefined
    );
    await assertSlugUnique(input.parentGroupId, input.slug);

    if (input.identityProfileId) {
        await requireManagedIdentityProfile(input.identityProfileId);
        await assertHasIdentityAvailability('', input.identityProfileId);
    }

    const id = `grp_${uuid()}`;
    const now = new Date().toISOString();

    const flat: FlatGroupType = {
        ...input,
        id,
        parentGroupId: input.parentGroupId ?? undefined,
        pathIds: parent ? [...parent.pathIds, id] : [id],
        depth: parent ? parent.depth + 1 : 0,
        rootGroupId: parent ? parent.rootGroupId : id,
        computedCriteria: serializeComputedCriteria(input.computedCriteria),
        identityIssuanceEnabled:
            input.identityIssuanceEnabled ?? (input.identityProfileId ? true : undefined),
        createdAt: now,
        updatedAt: now,
    };

    const group = await Group.createOne(flat);

    if (parent) await group.relateTo({ alias: 'childOf', where: { id: parent.id } });

    const ownerEcosystem = await Ecosystem.findOne({ where: { id: input.ownerEcosystemId } });
    if (!ownerEcosystem) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });
    await ownerEcosystem.relateTo({ alias: 'owns', where: { id: group.id } });

    if (input.identityProfileId) {
        await group.relateTo({
            alias: 'hasIdentity',
            where: { profileId: input.identityProfileId },
        });
    }

    await enforceGroupInvariants(group.id);
    await auditGroupMutation(options.actorProfileId, 'group:create', undefined, flat);

    return group;
};

export const updateGroup = async (
    input: UpdateGroupInput,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(input.id);
    await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group:update',
    });

    if (input.slug && input.slug !== group.slug) {
        await assertSlugUnique(group.parentGroupId ?? null, input.slug, group.id);
    }

    const updatedAt = new Date().toISOString();
    const patch: Record<string, unknown> = { updatedAt };

    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.description !== undefined) patch.description = input.description;
    if (input.type !== undefined) patch.type = input.type;
    if (input.status !== undefined) patch.status = input.status;

    await updateGroupNode(group.id, patch);

    const updated = await requireGroup(group.id);
    await enforceGroupInvariants(updated.id);
    await auditGroupMutation(options.actorProfileId, 'group:update', group, updated);

    return updated;
};

export const archiveGroup = async (
    id: string,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    return updateGroup({ id, status: 'ARCHIVED' }, { actorProfileId: options.actorProfileId });
};

export const addGroupMember = async (
    groupId: string,
    profileId: string,
    provenance: 'MANUAL' | 'IMPORTED' | 'COMPUTED',
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    const ecosystem = await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group-membership:add',
    });
    assertArchivedGroupWriteAllowed(group, 'group-membership:add', {
        allowBreakGlass: getBreakGlassFlag(ecosystem.status, options.actorProfileId),
    });

    if (group.membershipMode === 'COMPUTED' && provenance !== 'COMPUTED') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Manual membership writes are not allowed on COMPUTED groups.',
        });
    }

    const profile = await Profile.findOne({ where: { profileId } });
    if (!profile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });

    const beforeMembers = await getMemberProfileIdsForGroup(group.id);
    const joinedAt = new Date().toISOString();

    await neogma.queryRunner.run(
        `MATCH (p:Profile { profileId: $profileId })
         MATCH (g:Group { id: $groupId })
         MERGE (p)-[r:MEMBER_OF]->(g)
         ON CREATE SET r.joinedAt = $joinedAt
         SET r.provenance = $provenance`,
        { groupId, profileId, provenance, joinedAt }
    );

    const afterGroup = await requireGroup(group.id);
    await enforceGroupInvariants(afterGroup.id);
    await auditGroupMutation(options.actorProfileId, 'group-member:add', group, afterGroup, {
        beforeSummary: { ...getGroupAuditSummary(group), memberProfileIds: beforeMembers },
        afterSummary: {
            ...getGroupAuditSummary(afterGroup),
            memberProfileIds: await getMemberProfileIdsForGroup(group.id),
            changedMemberProfileId: profileId,
            provenance,
        },
    });

    return afterGroup;
};

export const removeGroupMember = async (
    groupId: string,
    profileId: string,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    const ecosystem = await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group-membership:remove',
    });
    assertArchivedGroupWriteAllowed(group, 'group-membership:remove', {
        allowBreakGlass: getBreakGlassFlag(ecosystem.status, options.actorProfileId),
    });

    if (group.membershipMode === 'COMPUTED') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Manual membership writes are not allowed on COMPUTED groups.',
        });
    }

    const beforeMembers = await getMemberProfileIdsForGroup(group.id);

    await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $profileId })-[r:MEMBER_OF]->(:Group { id: $groupId })
         DELETE r`,
        { groupId, profileId }
    );

    const afterGroup = await requireGroup(group.id);
    await enforceGroupInvariants(afterGroup.id);
    await auditGroupMutation(options.actorProfileId, 'group-member:remove', group, afterGroup, {
        beforeSummary: { ...getGroupAuditSummary(group), memberProfileIds: beforeMembers },
        afterSummary: {
            ...getGroupAuditSummary(afterGroup),
            memberProfileIds: await getMemberProfileIdsForGroup(group.id),
            changedMemberProfileId: profileId,
        },
    });

    return afterGroup;
};

export const materializeComputedGroupMembership = async (
    groupId: string,
    options: GroupMutationOptions
): Promise<{ group: FlatGroupType; memberProfileIds: string[] }> => {
    const group = await requireGroup(groupId);
    const ecosystem = await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group-membership:materialize',
    });
    assertArchivedGroupWriteAllowed(group, 'group-membership:materialize', {
        allowBreakGlass: getBreakGlassFlag(ecosystem.status, options.actorProfileId),
    });

    if (group.membershipMode !== 'COMPUTED') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only COMPUTED groups can materialize membership.',
        });
    }

    const computedCriteria = parseComputedCriteria(group.computedCriteria);
    const memberProfileIds = getComputedMemberProfileIds(computedCriteria);
    const beforeMembers = await getMemberProfileIdsForGroup(group.id);
    const joinedAt = new Date().toISOString();

    await neogma.queryRunner.run(
        `MATCH (:Profile)-[r:MEMBER_OF]->(:Group { id: $groupId })
         DELETE r`,
        { groupId }
    );

    if (memberProfileIds.length) {
        await neogma.queryRunner.run(
            `UNWIND $memberProfileIds AS profileId
             MATCH (p:Profile { profileId: profileId })
             MATCH (g:Group { id: $groupId })
             MERGE (p)-[r:MEMBER_OF]->(g)
             SET r.provenance = 'COMPUTED', r.joinedAt = $joinedAt`,
            { groupId, memberProfileIds, joinedAt }
        );
    }

    const afterGroup = await requireGroup(group.id);
    await enforceGroupInvariants(afterGroup.id);
    await auditGroupMutation(
        options.actorProfileId,
        'group-member:materialize',
        group,
        afterGroup,
        {
            beforeSummary: { ...getGroupAuditSummary(group), memberProfileIds: beforeMembers },
            afterSummary: {
                ...getGroupAuditSummary(afterGroup),
                memberProfileIds: await getMemberProfileIdsForGroup(group.id),
            },
        }
    );

    return { group: afterGroup, memberProfileIds: await getMemberProfileIdsForGroup(group.id) };
};

export const moveGroup = async (
    groupId: string,
    parentGroupId: string | null,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group:move',
    });
    const parent = await assertParentOwnershipCompatibility(
        group.ownerEcosystemId,
        parentGroupId,
        group.id
    );
    await assertSlugUnique(parentGroupId, group.slug, group.id);

    const subtree = await getSubtree(group.id);
    const newRootPath = parent ? [...parent.pathIds, group.id] : [group.id];

    await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })-[r:CHILD_OF]->(:Group)
         DELETE r`,
        { groupId: group.id }
    );

    if (parent) {
        await neogma.queryRunner.run(
            `MATCH (g:Group { id: $groupId })
             MATCH (parent:Group { id: $parentGroupId })
             MERGE (g)-[:CHILD_OF]->(parent)`,
            { groupId: group.id, parentGroupId: parent.id }
        );
    }

    for (const node of subtree) {
        const suffix = node.pathIds.slice(group.pathIds.length);
        const pathIds = [...newRootPath, ...suffix];

        await updateGroupNode(node.id, {
            parentGroupId:
                node.id === group.id ? parentGroupId ?? null : node.parentGroupId ?? undefined,
            pathIds,
            depth: pathIds.length - 1,
            rootGroupId: newRootPath[0],
            updatedAt: new Date().toISOString(),
        });
    }

    if (parentGroupId === null) {
        await removeGroupProperties(group.id, ['parentGroupId']);
    }

    const moved = await requireGroup(group.id);
    await enforceGroupInvariants(moved.id);
    await auditGroupMutation(options.actorProfileId, 'group:move', group, moved);

    return moved;
};

export const attachIdentity = async (
    groupId: string,
    identityProfileId: string,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    const ecosystem = await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'identity:attach',
    });
    assertArchivedGroupWriteAllowed(group, 'identity:attach', {
        allowBreakGlass: getBreakGlassFlag(ecosystem.status, options.actorProfileId),
    });

    await requireManagedIdentityProfile(identityProfileId);
    await assertHasIdentityAvailability(group.id, identityProfileId);

    if (group.identityProfileId && group.identityProfileId !== identityProfileId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Group already has an attached identity Profile.',
        });
    }

    await updateGroupNode(group.id, {
        identityProfileId,
        identityIssuanceEnabled: true,
        updatedAt: new Date().toISOString(),
    });
    await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })
         MATCH (p:Profile { profileId: $identityProfileId })
         MERGE (g)-[:HAS_IDENTITY]->(p)`,
        { groupId, identityProfileId }
    );

    const updated = await requireGroup(group.id);
    await enforceGroupInvariants(updated.id);
    await auditGroupMutation(options.actorProfileId, 'identity:attach', group, updated);

    return updated;
};

export const disableIdentityIssuance = async (
    groupId: string,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    const ecosystem = await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'identity:disable',
    });
    assertArchivedGroupWriteAllowed(group, 'identity:disable', {
        allowBreakGlass: getBreakGlassFlag(ecosystem.status, options.actorProfileId),
    });

    if (!group.identityProfileId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Group has no attached identity to disable.',
        });
    }

    await updateGroupNode(group.id, {
        identityIssuanceEnabled: false,
        updatedAt: new Date().toISOString(),
    });

    const updated = await requireGroup(group.id);
    await enforceGroupInvariants(updated.id);
    await auditGroupMutation(options.actorProfileId, 'identity:disable', group, updated);

    return updated;
};

export const detachIdentity = async (
    groupId: string,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    const ecosystem = await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'identity:detach',
    });
    assertArchivedGroupWriteAllowed(group, 'identity:detach', {
        allowBreakGlass: getBreakGlassFlag(ecosystem.status, options.actorProfileId),
    });

    if (!group.identityProfileId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Group has no attached identity to detach.',
        });
    }

    if ((group.identityIssuanceEnabled ?? true) !== false) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Disable identity issuance before detaching the managed issuer.',
        });
    }

    await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })-[r:HAS_IDENTITY]->(:Profile)
         DELETE r`,
        { groupId }
    );
    await updateGroupNode(group.id, {
        identityIssuanceEnabled: false,
        updatedAt: new Date().toISOString(),
    });
    await removeGroupProperties(group.id, ['identityProfileId']);

    const updated = await requireGroup(group.id);
    await enforceGroupInvariants(updated.id);
    await auditGroupMutation(options.actorProfileId, 'identity:detach', group, updated);

    return updated;
};

export const transferGroupOwnership = async (
    groupId: string,
    targetEcosystemId: string,
    options: GroupMutationOptions
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group:transfer',
    });

    if (group.identityProfileId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Disable issuance and detach the managed identity before transferring ownership.',
        });
    }

    const targetEcosystem = await requireEcosystem(targetEcosystemId);
    if (group.parentGroupId) {
        const parent = await requireGroup(group.parentGroupId);
        if (parent.ownerEcosystemId !== targetEcosystem.id) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'A transferred Group must remain under a parent with the same owner.',
            });
        }
    }

    const subtree = await getSubtree(group.id);

    for (const node of subtree) {
        await neogma.queryRunner.run(
            `MATCH (oldOwner:Ecosystem)-[r:OWNS]->(g:Group { id: $groupId })
             DELETE r`,
            { groupId: node.id }
        );
        await neogma.queryRunner.run(
            `MATCH (newOwner:Ecosystem { id: $targetEcosystemId })
             MATCH (g:Group { id: $groupId })
             MERGE (newOwner)-[:OWNS]->(g)`,
            { targetEcosystemId, groupId: node.id }
        );
        await updateGroupNode(node.id, {
            ownerEcosystemId: targetEcosystem.id,
            updatedAt: new Date().toISOString(),
        });
    }

    const updated = await requireGroup(group.id);
    await enforceGroupInvariants(updated.id);
    await auditGroupMutation(options.actorProfileId, 'group:transfer', group, updated);

    return updated;
};

export const grantGroupReference = async (
    groupId: string,
    consumerEcosystemId: string,
    mode: GroupReferenceMode,
    expiresAt: string | null | undefined,
    options: Required<Pick<GroupMutationOptions, 'actorProfileId'>>
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group-reference:grant',
    });
    await requireEcosystem(consumerEcosystemId);

    const grantedAt = new Date().toISOString();
    await neogma.queryRunner.run(
        `MATCH (e:Ecosystem { id: $consumerEcosystemId })
         MATCH (g:Group { id: $groupId })
         MERGE (e)-[r:REFERENCES]->(g)
         SET r.mode = $mode,
             r.grantedAt = $grantedAt,
             r.grantedByProfileId = $grantedByProfileId,
             r.expiresAt = $expiresAt`,
        {
            consumerEcosystemId,
            groupId,
            mode,
            grantedAt,
            grantedByProfileId: options.actorProfileId,
            expiresAt: expiresAt ?? null,
        }
    );

    const updated = await requireGroup(group.id);
    await auditGroupMutation(options.actorProfileId, 'group-reference:grant', group, updated, {
        afterSummary: {
            ...getGroupAuditSummary(updated),
            reference: { consumerEcosystemId, mode, expiresAt: expiresAt ?? null },
        },
    });

    return updated;
};

export const revokeGroupReference = async (
    groupId: string,
    consumerEcosystemId: string,
    options: Required<Pick<GroupMutationOptions, 'actorProfileId'>>
): Promise<FlatGroupType> => {
    const group = await requireGroup(groupId);
    await authorizeGroupWrite({
        actorProfileId: options.actorProfileId,
        ownerEcosystemId: group.ownerEcosystemId,
        action: 'group-reference:revoke',
    });

    await neogma.queryRunner.run(
        `MATCH (:Ecosystem { id: $consumerEcosystemId })-[r:REFERENCES]->(:Group { id: $groupId })
         DELETE r`,
        { consumerEcosystemId, groupId }
    );

    const updated = await requireGroup(group.id);
    await auditGroupMutation(options.actorProfileId, 'group-reference:revoke', group, updated, {
        afterSummary: {
            ...getGroupAuditSummary(updated),
            revokedConsumerEcosystemId: consumerEcosystemId,
        },
    });

    return updated;
};
