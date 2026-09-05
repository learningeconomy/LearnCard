import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Ecosystem, EcosystemRole, LCNOrganizationDetails } from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall, type BrainServiceTransport } from '../brain';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import { router, protectedProcedure } from './trpc';

/**
 * One entry per ecosystem the session has an explicit role grant on.
 * `ecosystem` is null when the granted ecosystem cannot be resolved from
 * brain-service (e.g. Tier-1 dev where brain-service is stubbed).
 */
export type EcosystemAccessEntry = {
    ecosystemId: string;
    role: EcosystemRole;
    ecosystem: Ecosystem | null;
    children: Ecosystem[];
};

/** Mirrors brain-service ecosystem.listMembers; its output validator is the source of truth. */
export type EcosystemMember = {
    profileId: string;
    displayName: string;
    role: EcosystemRole;
    type?: string;
    organization?: LCNOrganizationDetails;
    profileRole: string | null;
    email: string | null;
};

export type EcosystemDetail = {
    ecosystemId: string;
    role: EcosystemRole | null;
    ecosystem: Ecosystem | null;
    children: Ecosystem[];
    members: EcosystemMember[];
};

const getEffectiveEcosystemRole = (
    ecosystem: Ecosystem | null,
    profileId: string,
    edgeRole: EcosystemRole | null
): EcosystemRole | null => {
    // ADR-001 D7: OWNER is implied by ownerProfileId, not stored as a MEMBER_OF edge
    return ecosystem?.ownerProfileId === profileId ? 'OWNER' : edgeRole;
};

type BrainCaller = <T>(path: string, input: unknown) => Promise<T>;

const makeBrainCaller = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
): BrainCaller => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return <T>(path: string, input: unknown) =>
        authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
            transport.trpcQuery<T>(bearer, path, input)
        );
};

const makeBrainMutator = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
): BrainCaller => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return <T>(path: string, input: unknown) =>
        authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
            transport.trpcMutation<T>(bearer, path, input)
        );
};

export const ecosystemRouter = router({
    list: protectedProcedure.query(async ({ ctx }): Promise<EcosystemAccessEntry[]> => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

        const bearerFactory = new DidAuthBearerFactory(ctx.kms);

        // Dedupe grants by ecosystemId; the first grant wins (root grant is listed first).
        const grants = new Map<string, EcosystemRole>();
        for (const grant of ctx.session.effectiveAccess.ecosystemRoles) {
            if (!grants.has(grant.ecosystemId)) grants.set(grant.ecosystemId, grant.role);
        }

        return Promise.all(
            [...grants.entries()].map(
                async ([ecosystemId, role]): Promise<EcosystemAccessEntry> => {
                    const [ecosystem, children] = await Promise.all([
                        authorizedCall(
                            bearerFactory,
                            ctx.transport,
                            ctx.session.managedDid,
                            keyRef,
                            bearer =>
                                ctx.transport.trpcQuery<Ecosystem | null>(
                                    bearer,
                                    'ecosystem.getEcosystem',
                                    { id: ecosystemId }
                                )
                        ).catch(() => null),
                        authorizedCall(
                            bearerFactory,
                            ctx.transport,
                            ctx.session.managedDid,
                            keyRef,
                            bearer =>
                                ctx.transport.trpcQuery<Ecosystem[]>(
                                    bearer,
                                    'ecosystem.getChildEcosystems',
                                    { id: ecosystemId }
                                )
                        ).catch(() => [] as Ecosystem[]),
                    ]);

                    // Stubbed transports return {} for every query — normalize to safe shapes.
                    const resolvedEcosystem = ecosystem && ecosystem.id ? ecosystem : null;
                    const resolvedChildren = Array.isArray(children) ? children : [];

                    return {
                        ecosystemId,
                        role:
                            getEffectiveEcosystemRole(
                                resolvedEcosystem,
                                ctx.session.profileId,
                                role
                            ) ?? role,
                        ecosystem: resolvedEcosystem,
                        children: resolvedChildren,
                    };
                }
            )
        );
    }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }): Promise<EcosystemDetail> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const [ecosystem, children, members] = await Promise.all([
                query<Ecosystem | null>('ecosystem.getEcosystem', { id: input.id }).catch(
                    () => null
                ),
                query<Ecosystem[]>('ecosystem.getChildEcosystems', { id: input.id }).catch(
                    () => [] as Ecosystem[]
                ),
                query<EcosystemMember[]>('ecosystem.listMembers', { id: input.id }).catch(
                    () => [] as EcosystemMember[]
                ),
            ]);

            const grant = ctx.session.effectiveAccess.ecosystemRoles.find(
                candidate => candidate.ecosystemId === input.id
            );

            return {
                ecosystemId: input.id,
                role: getEffectiveEcosystemRole(
                    ecosystem && ecosystem.id ? ecosystem : null,
                    ctx.session.profileId,
                    grant?.role ?? null
                ),
                ecosystem: ecosystem && ecosystem.id ? ecosystem : null,
                children: Array.isArray(children) ? children : [],
                members: Array.isArray(members) ? members : [],
            };
        }),

    create: protectedProcedure
        .input(
            z.object({
                parentEcosystemId: z.string().min(1),
                name: z.string().min(1).max(120),
                slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/, 'Invalid slug'),
                description: z.string().max(500).optional(),
            })
        )
        .mutation(async ({ ctx, input }): Promise<Ecosystem> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const mutate = makeBrainMutator(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            return mutate<Ecosystem>('ecosystem.createEcosystem', input);
        }),

    grantMembership: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                profileId: z.string().min(1),
                role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const mutate = makeBrainMutator(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            return mutate<{ granted: boolean; role: EcosystemRole }>(
                'ecosystem.grantMembership',
                input
            );
        }),

    revokeMembership: protectedProcedure
        .input(z.object({ id: z.string(), profileId: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const mutate = makeBrainMutator(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            return mutate<{ revoked: boolean }>('ecosystem.revokeMembership', input);
        }),
});
