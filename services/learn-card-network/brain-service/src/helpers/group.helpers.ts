import { TRPCError } from '@trpc/server';

import { neogma } from '@instance';
import { Ecosystem, Group, Profile } from '@models';
import { getEcosystemMembershipRole } from '@accesslayer/ecosystem/membership';
import { isAppStoreAdmin } from 'src/constants/app-store';
import { FlatGroupType } from 'types/group';
import { FlatEcosystemType } from 'types/ecosystem';

export type GroupWriteAction =
    | 'group:create'
    | 'group:update'
    | 'group:archive'
    | 'group:move'
    | 'group:transfer'
    | 'group-reference:grant'
    | 'group-reference:revoke'
    | 'group-membership:add'
    | 'group-membership:remove'
    | 'group-membership:materialize'
    | 'identity:attach'
    | 'identity:disable'
    | 'identity:detach';

const BREAK_GLASS_ACTIONS = new Set<GroupWriteAction>([
    'identity:disable',
    'identity:detach',
    'group:transfer',
]);

export const getStoredGroupById = async (id: string): Promise<FlatGroupType | null> => {
    const group = await Group.findOne({ where: { id }, plain: true });

    return (group as FlatGroupType | null) ?? null;
};

export const getStoredEcosystemById = async (id: string): Promise<FlatEcosystemType | null> => {
    const ecosystem = await Ecosystem.findOne({ where: { id }, plain: true });

    return (ecosystem as FlatEcosystemType | null) ?? null;
};

export const requireGroup = async (id: string): Promise<FlatGroupType> => {
    const group = await getStoredGroupById(id);

    if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
    }

    return group;
};

export const requireEcosystem = async (id: string): Promise<FlatEcosystemType> => {
    const ecosystem = await getStoredEcosystemById(id);

    if (!ecosystem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });
    }

    return ecosystem;
};

export const serializeComputedCriteria = (computedCriteria: unknown): string | undefined => {
    if (computedCriteria === undefined) return undefined;

    return JSON.stringify(computedCriteria);
};

export const parseComputedCriteria = (computedCriteria?: string): unknown => {
    if (!computedCriteria) return undefined;

    return JSON.parse(computedCriteria);
};

export const validateMembershipMode = (input: {
    membershipMode: 'EXPLICIT' | 'COMPUTED';
    computedCriteria?: unknown;
}): void => {
    if (input.membershipMode === 'COMPUTED' && input.computedCriteria === undefined) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'COMPUTED groups require computedCriteria.',
        });
    }

    if (input.membershipMode === 'EXPLICIT' && input.computedCriteria !== undefined) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'EXPLICIT groups must not carry computedCriteria.',
        });
    }
};

export const getGroupAuditSummary = (group: FlatGroupType): Record<string, unknown> => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    type: group.type,
    description: group.description,
    status: group.status,
    parentGroupId: group.parentGroupId ?? null,
    pathIds: group.pathIds,
    depth: group.depth,
    rootGroupId: group.rootGroupId,
    ownerEcosystemId: group.ownerEcosystemId,
    identityProfileId: group.identityProfileId,
    identityIssuanceEnabled: group.identityIssuanceEnabled ?? Boolean(group.identityProfileId),
    membershipMode: group.membershipMode,
});

export const assertSlugUnique = async (
    parentGroupId: string | null,
    slug: string,
    excludeGroupId?: string
): Promise<void> => {
    const result = await neogma.queryRunner.run(
        `MATCH (g:Group { slug: $slug })
         WHERE coalesce(g.parentGroupId, '__ROOT__') = coalesce($parentGroupId, '__ROOT__')
           AND ($excludeGroupId IS NULL OR g.id <> $excludeGroupId)
         RETURN g.id AS id
         LIMIT 1`,
        { slug, parentGroupId, excludeGroupId: excludeGroupId ?? null }
    );

    const conflicting = result.records[0]?.get('id');

    if (conflicting) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A sibling Group with this slug already exists.',
        });
    }
};

export const authorizeGroupWrite = async (input: {
    actorProfileId?: string;
    ownerEcosystemId: string;
    action: GroupWriteAction;
}): Promise<FlatEcosystemType> => {
    const ecosystem = await requireEcosystem(input.ownerEcosystemId);

    if (!input.actorProfileId) return ecosystem;

    if (ecosystem.status === 'ARCHIVED') {
        if (!isAppStoreAdmin(input.actorProfileId) || !BREAK_GLASS_ACTIONS.has(input.action)) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message:
                    'Owning Ecosystem is archived; only audited break-glass actions are allowed.',
            });
        }

        return ecosystem;
    }

    const callerRole =
        ecosystem.ownerProfileId === input.actorProfileId
            ? 'OWNER'
            : await getEcosystemMembershipRole(input.actorProfileId, ecosystem.id);

    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Only an owning Ecosystem owner or admin may mutate this Group.',
        });
    }

    return ecosystem;
};

export const assertArchivedGroupWriteAllowed = (
    group: FlatGroupType,
    action: GroupWriteAction,
    options?: { allowBreakGlass?: boolean }
): void => {
    if (
        group.status === 'ARCHIVED' &&
        !options?.allowBreakGlass &&
        (action === 'group-membership:add' ||
            action === 'group-membership:remove' ||
            action === 'group-membership:materialize' ||
            action === 'identity:attach' ||
            action === 'identity:disable' ||
            action === 'identity:detach')
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Archived groups reject membership and identity writes.',
        });
    }
};

export const assertParentOwnershipCompatibility = async (
    ownerEcosystemId: string,
    parentGroupId: string | null,
    movingGroupId?: string
): Promise<FlatGroupType | null> => {
    if (!parentGroupId) return null;

    const parent = await requireGroup(parentGroupId);

    if (parent.ownerEcosystemId !== ownerEcosystemId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Parent Group must belong to the same owning Ecosystem.',
        });
    }

    if (movingGroupId && parent.pathIds.includes(movingGroupId)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot move a Group beneath its own descendant.',
        });
    }

    return parent;
};

export const requireManagedIdentityProfile = async (profileId: string): Promise<void> => {
    const profile = await Profile.findOne({ where: { profileId }, plain: true });

    if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Identity Profile not found' });
    }

    const did = String(profile.did ?? '');

    if (!did.includes(':users:')) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only managed user Profiles may be attached as Group identities.',
        });
    }
};

export const assertHasIdentityAvailability = async (
    groupId: string,
    identityProfileId: string
): Promise<void> => {
    const groupsWithIdentity = await Group.findMany({ where: { identityProfileId } });

    const conflict = groupsWithIdentity.find(group => group.id !== groupId);

    if (conflict) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Managed identity Profile is already attached to another Group.',
        });
    }
};

export const getComputedMemberProfileIds = (computedCriteria: unknown): string[] => {
    if (
        typeof computedCriteria === 'object' &&
        computedCriteria !== null &&
        'profileIds' in computedCriteria &&
        Array.isArray(computedCriteria.profileIds) &&
        computedCriteria.profileIds.every(profileId => typeof profileId === 'string')
    ) {
        return Array.from(new Set(computedCriteria.profileIds));
    }

    throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'COMPUTED group materialization currently requires computedCriteria.profileIds[]',
    });
};

export const assertSingleOwnershipInvariant = async (
    groupId: string,
    ownerEcosystemId: string
): Promise<void> => {
    const result = await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })
         OPTIONAL MATCH (e:Ecosystem)-[r:OWNS]->(g)
         RETURN count(r) AS ownershipCount, collect(e.id) AS ownerIds`,
        { groupId }
    );

    const ownershipCount = Number(result.records[0]?.get('ownershipCount') ?? 0);
    const ownerIds = ((result.records[0]?.get('ownerIds') as string[] | undefined) ?? []).filter(
        Boolean
    );

    if (ownershipCount !== 1 || ownerIds[0] !== ownerEcosystemId) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Group ownership invariant violated.',
        });
    }
};

export const assertHasIdentityInvariant = async (groupId: string): Promise<void> => {
    const result = await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })
         OPTIONAL MATCH (g)-[r:HAS_IDENTITY]->(p:Profile)
         OPTIONAL MATCH (other:Group)-[otherR:HAS_IDENTITY]->(p)
         RETURN count(DISTINCT r) AS outgoingCount,
                count(DISTINCT otherR) AS incomingCount`,
        { groupId }
    );

    const outgoingCount = Number(result.records[0]?.get('outgoingCount') ?? 0);
    const incomingCount = Number(result.records[0]?.get('incomingCount') ?? 0);

    if (outgoingCount > 1 || incomingCount > 1) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Group identity invariant violated.',
        });
    }
};

export const assertGroupTreeInvariant = async (groupId: string): Promise<void> => {
    const group = await requireGroup(groupId);
    const relationships = await neogma.queryRunner.run(
        `MATCH (g:Group { id: $groupId })
         OPTIONAL MATCH (g)-[r:CHILD_OF]->(parent:Group)
         RETURN count(r) AS parentCount, parent.id AS parentId, parent.ownerEcosystemId AS parentOwnerId`,
        { groupId }
    );

    const parentCount = Number(relationships.records[0]?.get('parentCount') ?? 0);
    const parentId =
        (relationships.records[0]?.get('parentId') as string | null | undefined) ?? null;
    const parentOwnerId =
        (relationships.records[0]?.get('parentOwnerId') as string | null | undefined) ?? null;

    if (parentCount > 1) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Group parent invariant violated.',
        });
    }

    if ((group.parentGroupId ?? null) !== parentId) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Group parent cache invariant violated.',
        });
    }

    if (group.pathIds.at(-1) !== group.id || group.depth !== group.pathIds.length - 1) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Group path cache invariant violated.',
        });
    }

    if (group.rootGroupId !== group.pathIds[0]) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Group root cache invariant violated.',
        });
    }

    if (parentId && parentOwnerId !== group.ownerEcosystemId) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Mixed-owner Group trees are invalid.',
        });
    }
};

export const enforceGroupInvariants = async (groupId: string): Promise<void> => {
    const group = await requireGroup(groupId);

    await assertSingleOwnershipInvariant(group.id, group.ownerEcosystemId);
    await assertHasIdentityInvariant(group.id);
    await assertGroupTreeInvariant(group.id);
};
