import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type {
    PaginatedSkillFrameworksType,
    PaginatedSkillTree,
    SkillFrameworkType,
} from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall, type BrainServiceTransport } from '../brain';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import { router, protectedProcedure } from './trpc';

export type SkillFrameworkDetail = {
    framework: SkillFrameworkType;
    skills: PaginatedSkillTree;
    boostCount: number;
};

/** A framework plus its competency count, so the catalog list never fetches skill trees. */
export type SkillFrameworkSummary = SkillFrameworkType & { skillCount: number };

const emptySkillTree: PaginatedSkillTree = { hasMore: false, cursor: null, records: [] };

type BrainQuery = <T>(path: string, input: unknown) => Promise<T>;

const makeBrainCaller = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
): BrainQuery => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return <T>(path: string, input: unknown) =>
        authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
            transport.trpcQuery<T>(bearer, path, input)
        );
};

const withSkillCount = async (
    query: BrainQuery,
    framework: SkillFrameworkType
): Promise<SkillFrameworkSummary> => {
    const result = await query<{ count: number }>('skills.countSkills', {
        frameworkId: framework.id,
    }).catch(() => ({ count: 0 }));

    return { ...framework, skillCount: typeof result?.count === 'number' ? result.count : 0 };
};

export const skillFrameworksRouter = router({
    list: protectedProcedure
        .input(z.object({ limit: z.number().min(1).max(200).optional() }).optional())
        .query(async ({ ctx, input }): Promise<SkillFrameworkSummary[]> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const result = await query<PaginatedSkillFrameworksType>(
                'skillFrameworks.getAllAvailableFrameworks',
                { limit: input?.limit ?? 100 }
            );

            // Stubbed transports return {} for every query — normalize to a safe shape.
            if (!result || !Array.isArray(result.records)) return [];

            return Promise.all(result.records.map(framework => withSkillCount(query, framework)));
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ ctx, input }): Promise<SkillFrameworkDetail> => {
            const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
            if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

            const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

            const [detail, boosts] = await Promise.all([
                query<{ framework: SkillFrameworkType; skills: PaginatedSkillTree }>(
                    'skillFrameworks.getById',
                    { id: input.id }
                ),
                query<{ count: number }>('skillFrameworks.countBoostsThatUseFramework', {
                    id: input.id,
                }).catch(() => ({ count: 0 })),
            ]);

            if (!detail?.framework?.id) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Skill framework not found' });
            }

            return {
                framework: detail.framework,
                skills: Array.isArray(detail.skills?.records) ? detail.skills : emptySkillTree,
                boostCount: typeof boosts?.count === 'number' ? boosts.count : 0,
            };
        }),
});
