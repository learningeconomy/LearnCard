import { randomUUID } from 'crypto';

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Group, GroupType } from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall } from '../brain';
import { didWebFromDomain } from '@did';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import type { BrainServiceTransport } from '../brain';
import { router, protectedProcedure } from './trpc';

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

const GROUP_TYPES = [
    'geographic',
    'administrative',
    'programmatic',
    'functional',
    'cohort',
    'custom',
] as const;

export type GroupMemberProfile = {
    profileId: string;
    displayName: string;
    type?: string;
};

export type GroupDetail = {
    group: Group;
    children: Group[];
    members: GroupMemberProfile[];
};

export type OrgProfileType = 'institution' | 'employer';

export type CreatedOrgProfile = {
    profileId: string;
    managedDid: string;
    displayName: string;
    type: OrgProfileType;
};

const brainCallers = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
) => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return {
        query: <T>(path: string, input: unknown) =>
            authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
                transport.trpcQuery<T>(bearer, path, input)
            ),
        mutate: <T>(path: string, input: unknown) =>
            authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
                transport.trpcMutation<T>(bearer, path, input)
            ),
    };
};

const requireKeyRef = async (
    keyRefFor: (did: string) => Promise<ManagedKeyRef | null>,
    did: string
): Promise<ManagedKeyRef> => {
    const keyRef = await keyRefFor(did);
    if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

    return keyRef;
};

const orgProfileId = (name: string): string => {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24)
        .replace(/-+$/g, '');
    const suffix = randomUUID().replace(/-/g, '').slice(0, 6);

    return `${base || 'org'}-${suffix}`;
};

export const groupRouter = router({
    listByEcosystem: protectedProcedure
        .input(z.object({ ecosystemId: z.string() }))
        .query(async ({ ctx, input }): Promise<Group[]> => {
            const keyRef = await requireKeyRef(ctx.keyRefFor, ctx.session.managedDid);
            const { query } = brainCallers(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const groups = await query<Group[]>('group.getGroupsOwnedByEcosystem', {
                ecosystemId: input.ecosystemId,
            }).catch(() => [] as Group[]);

            return Array.isArray(groups) ? groups : [];
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }): Promise<GroupDetail> => {
            const keyRef = await requireKeyRef(ctx.keyRefFor, ctx.session.managedDid);
            const { query } = brainCallers(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const group = await query<Group>('group.getGroup', { id: input.id });

            const [children, members] = await Promise.all([
                query<Group[]>('group.getChildGroups', { id: input.id }).catch(() => [] as Group[]),
                query<GroupMemberProfile[]>('group.getGroupMembers', { id: input.id }).catch(
                    () => [] as GroupMemberProfile[]
                ),
            ]);

            return {
                group,
                children: Array.isArray(children) ? children : [],
                members: Array.isArray(members) ? members : [],
            };
        }),

    create: protectedProcedure
        .input(
            z.object({
                ownerEcosystemId: z.string().min(1),
                name: z.string().min(1).max(120),
                slug: z.string().regex(SLUG_REGEX, 'Invalid slug'),
                type: z.enum(GROUP_TYPES),
                description: z.string().max(500).optional(),
                parentGroupId: z.string().nullable().default(null),
            })
        )
        .mutation(async ({ ctx, input }): Promise<Group> => {
            const keyRef = await requireKeyRef(ctx.keyRefFor, ctx.session.managedDid);
            const { mutate } = brainCallers(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            return mutate<Group>('group.createGroup', {
                name: input.name,
                slug: input.slug,
                type: input.type as GroupType,
                description: input.description,
                parentGroupId: input.parentGroupId,
                ownerEcosystemId: input.ownerEcosystemId,
                membershipMode: 'EXPLICIT',
                status: 'ACTIVE',
            });
        }),

    addMember: protectedProcedure
        .input(z.object({ id: z.string(), profileId: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const keyRef = await requireKeyRef(ctx.keyRefFor, ctx.session.managedDid);
            const { mutate } = brainCallers(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            return mutate<{ success: boolean }>('group.addGroupMember', input);
        }),

    removeMember: protectedProcedure
        .input(z.object({ id: z.string(), profileId: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const keyRef = await requireKeyRef(ctx.keyRefFor, ctx.session.managedDid);
            const { mutate } = brainCallers(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            return mutate<{ success: boolean }>('group.removeGroupMember', input);
        }),

    createOrgProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(120),
                type: z.enum(['institution', 'employer']),
                groupId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }): Promise<CreatedOrgProfile> => {
            const profileId = orgProfileId(input.name);
            const managedDid = didWebFromDomain(ctx.consoleDomain, profileId);

            const orgKeyRef = await ctx.kms.generateSigningKey({
                tenantId: ctx.session.tenantId,
                alias: `p:${profileId}`,
            });

            await ctx.directory.put(managedDid, orgKeyRef);

            const bearerFactory = new DidAuthBearerFactory(ctx.kms);

            await authorizedCall(bearerFactory, ctx.transport, managedDid, orgKeyRef, bearer =>
                ctx.transport.createProfile(bearer, {
                    profileId,
                    displayName: input.name,
                    type: input.type,
                })
            );

            if (input.groupId) {
                const operatorKeyRef = await requireKeyRef(ctx.keyRefFor, ctx.session.managedDid);
                const { mutate } = brainCallers(
                    ctx.kms,
                    ctx.transport,
                    ctx.session.managedDid,
                    operatorKeyRef
                );

                await mutate<{ success: boolean }>('group.addGroupMember', {
                    id: input.groupId,
                    profileId,
                });
            }

            return { profileId, managedDid, displayName: input.name, type: input.type };
        }),
});
