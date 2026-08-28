import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { InstallTarget } from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall, type BrainServiceTransport } from '../brain';
import type { KeyManagementService, ManagedKeyRef } from '@kms';
import { router, protectedProcedure, type ConsoleContext } from './trpc';

type AuthedContext = Omit<ConsoleContext, 'session'> & {
    session: NonNullable<ConsoleContext['session']>;
};

const makeBrainCaller = (
    kms: KeyManagementService,
    transport: BrainServiceTransport,
    did: string,
    keyRef: ManagedKeyRef
) => {
    const bearerFactory = new DidAuthBearerFactory(kms);

    return <T>(path: string, input: unknown) =>
        authorizedCall(bearerFactory, transport, did, keyRef, bearer =>
            transport.trpcQuery<T>(bearer, path, input)
        );
};

const listInstallTargets = async (
    ctx: AuthedContext,
    path: string,
    ecosystemId: string
): Promise<InstallTarget[]> => {
    const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
    if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });

    const query = makeBrainCaller(ctx.kms, ctx.transport, ctx.session.managedDid, keyRef);

    const targets = await query<InstallTarget[]>(path, { ecosystemId });

    // Stubbed transports return {} for every query — normalize to a safe shape.
    return Array.isArray(targets) ? targets : [];
};

const EcosystemInput = z.object({ ecosystemId: z.string().min(1) });

export const infraRouter = router({
    listDeployments: protectedProcedure
        .input(EcosystemInput)
        .query(({ ctx, input }) =>
            listInstallTargets(ctx, 'installIntent.listWorkloadDeployments', input.ecosystemId)
        ),
});

export const registriesRouter = router({
    listSubscriptions: protectedProcedure
        .input(EcosystemInput)
        .query(({ ctx, input }) =>
            listInstallTargets(ctx, 'installIntent.listRegistrySubscriptions', input.ecosystemId)
        ),
});
