import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type {
    Binding,
    BindingEndpoint,
    ConsentDecisionRecord,
    InstallTarget,
} from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall, type BrainServiceTransport } from '../brain';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import { router, protectedProcedure, type ConsoleContext } from './trpc';

type AuthedContext = Omit<ConsoleContext, 'session'> & {
    session: NonNullable<ConsoleContext['session']>;
};

// Brain BindingRecord = shared Binding + persistence fields (brain types/binding.ts).
export type BindingRecord = Binding & {
    revision: number;
    createdAt: string;
    updatedAt: string;
};

// Mirrors brain listInstallTargets output: any install target plus catalog enrichment.
export type EcosystemInstallTarget = InstallTarget & {
    listingId?: string;
    displayName?: string;
    tagline?: string;
};

// Mirrors brain InstallIntentAuditEventValidator (types/install-intent-audit.ts).
export type EcosystemAuditEvent = {
    id: string;
    action: string;
    actorProfileId?: string;
    actorDid?: string;
    intentId?: string;
    bindingId?: string;
    ecosystemId: string;
    authorityChangesSummary?: string;
    timestamp: string;
    beforeSummary?: Record<string, unknown>;
    afterSummary?: Record<string, unknown>;
};

const makeCallers = async (ctx: AuthedContext) => {
    const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
    if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

    const call = <T>(
        invoke: (
            transport: BrainServiceTransport,
            bearer: string,
            kms: KeyManagementService,
            keyRef: ManagedKeyRef
        ) => Promise<T>
    ) =>
        authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => invoke(ctx.transport, bearer, ctx.kms, keyRef)
        );

    return {
        query: <T>(path: string, input: unknown) =>
            call<T>((transport, bearer) => transport.trpcQuery<T>(bearer, path, input)),
        mutate: <T>(path: string, input: unknown) =>
            call<T>((transport, bearer) => transport.trpcMutation<T>(bearer, path, input)),
    };
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const EcosystemInput = z.object({ ecosystemId: z.string().min(1) });

const EndpointInput = z.object({
    resourceType: z.enum([
        'INTEGRATION_INSTALL',
        'APP_AVAILABILITY',
        'WALLET_ENABLEMENT',
        'WORKLOAD_DEPLOYMENT',
        'REGISTRY_SUBSCRIPTION',
        'ECOSYSTEM',
    ]),
    resourceId: z.string().min(1),
    ecosystemId: z.string().min(1),
}) satisfies z.ZodType<BindingEndpoint>;

export const bindingsRouter = router({
    list: protectedProcedure.input(EcosystemInput).query(async ({ ctx, input }) => {
        const { query } = await makeCallers(ctx);

        return asArray<BindingRecord>(await query('installIntent.listBindings', input));
    }),

    get: protectedProcedure
        .input(z.object({ bindingId: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const { query } = await makeCallers(ctx);

            return query<BindingRecord>('installIntent.getBinding', input);
        }),

    propose: protectedProcedure
        .input(
            z.object({
                ecosystemId: z.string().min(1),
                capability: z.string().min(1),
                provider: EndpointInput,
                consumer: EndpointInput,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { mutate } = await makeCallers(ctx);

            return mutate<BindingRecord>('installIntent.proposeBinding', input);
        }),

    approve: protectedProcedure
        .input(
            z.object({
                bindingId: z.string().min(1),
                expectedRevision: z.number().int().nonnegative(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { mutate } = await makeCallers(ctx);

            return mutate<BindingRecord>('installIntent.approveBinding', input);
        }),

    revoke: protectedProcedure
        .input(
            z.object({
                bindingId: z.string().min(1),
                expectedRevision: z.number().int().nonnegative(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { mutate } = await makeCallers(ctx);

            return mutate<BindingRecord>('installIntent.revokeBinding', input);
        }),

    consentRecords: protectedProcedure
        .input(z.object({ bindingId: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            const { query } = await makeCallers(ctx);

            return asArray<ConsentDecisionRecord>(
                await query('installIntent.getBindingConsentDecisionRecords', input)
            );
        }),
});

export const installTargetsRouter = router({
    list: protectedProcedure.input(EcosystemInput).query(async ({ ctx, input }) => {
        const { query } = await makeCallers(ctx);

        return asArray<EcosystemInstallTarget>(
            await query('installIntent.listInstallTargets', input)
        );
    }),
});

export const activityRouter = router({
    list: protectedProcedure
        .input(EcosystemInput.extend({ limit: z.number().int().positive().max(200).optional() }))
        .query(async ({ ctx, input }) => {
            const { query } = await makeCallers(ctx);

            return asArray<EcosystemAuditEvent>(
                await query('installIntent.listEcosystemAuditEvents', input)
            );
        }),
});
