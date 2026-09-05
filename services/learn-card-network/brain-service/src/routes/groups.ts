import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
    ArchiveGroupInputValidator,
    AttachGroupIdentityInputValidator,
    CreateGroupInputValidator,
    DetachGroupIdentityInputValidator,
    DisableGroupIdentityIssuanceInputValidator,
    GrantGroupReferenceInputValidator,
    GroupMemberMutationInputValidator,
    LCNOrganizationDetailsValidator,
    GroupReferenceViewValidator,
    GroupValidator,
    MaterializeComputedGroupMembershipInputValidator,
    MoveGroupInputValidator,
    RevokeGroupReferenceInputValidator,
    TransferGroupOwnershipInputValidator,
    UpdateGroupInputValidator,
} from '@learncard/types';

import { t, didAndChallengeRoute, profileRoute } from '@routes';
import {
    getGroupById,
    getGroupsOwnedByEcosystem,
    getChildGroups,
    getGroupReferenceView,
    getGroupMemberProfiles,
} from '@accesslayer/group/read';
import {
    addGroupMember,
    archiveGroup,
    attachIdentity,
    createGroup,
    detachIdentity,
    disableIdentityIssuance,
    grantGroupReference,
    materializeComputedGroupMembership,
    moveGroup,
    removeGroupMember,
    revokeGroupReference,
    transferGroupOwnership,
    updateGroup,
} from '@accesslayer/group/write';
import { authorizeGroupMemberRead } from '@helpers/group.helpers';

export const groupsRouter = t.router({
    getGroup: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/{id}',
                tags: ['Groups'],
                summary: 'Get a Group by ID',
                description: 'Retrieves a single Group aggregate by its ID.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(GroupValidator.optional())
        .query(async ({ input }) => {
            const group = await getGroupById(input.id);

            if (!group) throw new TRPCError({ code: 'NOT_FOUND' });

            return group;
        }),

    getGroupsOwnedByEcosystem: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/owned-by/{ecosystemId}',
                tags: ['Groups'],
                summary: 'List Groups owned by an Ecosystem',
                description: 'Lists all Groups whose owner Ecosystem is the given ID (D12 rule 1).',
            },
        })
        .input(z.object({ ecosystemId: z.string() }))
        .output(z.array(GroupValidator))
        .query(async ({ input }) => {
            return getGroupsOwnedByEcosystem(input.ecosystemId);
        }),

    getChildGroups: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/{id}/children',
                tags: ['Groups'],
                summary: 'List child Groups',
                description: 'Lists the direct child Groups of the given parent Group.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.array(GroupValidator))
        .query(async ({ input }) => {
            return getChildGroups(input.id);
        }),

    getGroupMembers: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/{id}/members',
                tags: ['Groups'],
                summary: 'List Group member Profiles',
                description:
                    'Lists Profiles with a MEMBER_OF edge into the Group, including display name and type.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(
            z.array(
                z.object({
                    profileId: z.string(),
                    displayName: z.string(),
                    type: z.string().optional(),
                    organization: LCNOrganizationDetailsValidator.optional(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const group = await getGroupById(input.id);

            if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });

            await authorizeGroupMemberRead({
                actorProfileId: ctx.user.profile.profileId,
                ownerEcosystemId: group.ownerEcosystemId,
            });

            return getGroupMemberProfiles(input.id);
        }),

    getGroupReferenceView: didAndChallengeRoute
        .input(z.object({ id: z.string(), consumerEcosystemId: z.string() }))
        .output(GroupReferenceViewValidator.optional())
        .query(async ({ input }) => {
            return (await getGroupReferenceView(input.id, input.consumerEcosystemId)) ?? undefined;
        }),

    createGroup: profileRoute
        .input(CreateGroupInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            const group = await createGroup(input, {
                actorProfileId: ctx.user.profile.profileId,
            });

            const created = await getGroupById(group.id);
            if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

            return created;
        }),

    updateGroup: profileRoute
        .input(UpdateGroupInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await updateGroup(input, { actorProfileId: ctx.user.profile.profileId });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    archiveGroup: profileRoute
        .input(ArchiveGroupInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await archiveGroup(input.id, { actorProfileId: ctx.user.profile.profileId });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    addGroupMember: profileRoute
        .input(GroupMemberMutationInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            await addGroupMember(input.id, input.profileId, 'MANUAL', {
                actorProfileId: ctx.user.profile.profileId,
            });

            return { success: true };
        }),

    removeGroupMember: profileRoute
        .input(GroupMemberMutationInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            await removeGroupMember(input.id, input.profileId, {
                actorProfileId: ctx.user.profile.profileId,
            });

            return { success: true };
        }),

    materializeComputedMembership: profileRoute
        .input(MaterializeComputedGroupMembershipInputValidator)
        .output(z.object({ success: z.boolean(), memberProfileIds: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const result = await materializeComputedGroupMembership(input.id, {
                actorProfileId: ctx.user.profile.profileId,
            });

            return { success: true, memberProfileIds: result.memberProfileIds };
        }),

    moveGroup: profileRoute
        .input(MoveGroupInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await moveGroup(input.id, input.parentGroupId, {
                actorProfileId: ctx.user.profile.profileId,
            });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    attachIdentity: profileRoute
        .input(AttachGroupIdentityInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await attachIdentity(input.id, input.identityProfileId, {
                actorProfileId: ctx.user.profile.profileId,
            });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    disableIdentityIssuance: profileRoute
        .input(DisableGroupIdentityIssuanceInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await disableIdentityIssuance(input.id, {
                actorProfileId: ctx.user.profile.profileId,
            });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    detachIdentity: profileRoute
        .input(DetachGroupIdentityInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await detachIdentity(input.id, { actorProfileId: ctx.user.profile.profileId });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    transferGroupOwnership: profileRoute
        .input(TransferGroupOwnershipInputValidator)
        .output(GroupValidator)
        .mutation(async ({ ctx, input }) => {
            await transferGroupOwnership(input.id, input.targetEcosystemId, {
                actorProfileId: ctx.user.profile.profileId,
            });
            const updated = await getGroupById(input.id);
            if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

            return updated;
        }),

    grantGroupReference: profileRoute
        .input(GrantGroupReferenceInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            await grantGroupReference(
                input.id,
                input.consumerEcosystemId,
                input.mode,
                input.expiresAt,
                {
                    actorProfileId: ctx.user.profile.profileId,
                }
            );

            return { success: true };
        }),

    revokeGroupReference: profileRoute
        .input(RevokeGroupReferenceInputValidator)
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            await revokeGroupReference(input.id, input.consumerEcosystemId, {
                actorProfileId: ctx.user.profile.profileId,
            });

            return { success: true };
        }),
});

export type GroupsRouter = typeof groupsRouter;
