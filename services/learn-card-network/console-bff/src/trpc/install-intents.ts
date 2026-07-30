import { DidAuthBearerFactory } from '../brain/did-auth';
import { z } from 'zod';
import { router, protectedProcedure } from './trpc';
import { authorizedCall } from '../brain';
import { TRPCError } from '@trpc/server';

export const installIntentsRouter = router({
    planInstallIntent: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => ctx.transport.trpcMutation(bearer, 'installIntent.planInstallIntent', input)
        );
    }),
    approveInstallIntent: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer =>
                ctx.transport.trpcMutation(bearer, 'installIntent.approveInstallIntent', input)
        );
    }),
    rejectInstallIntent: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => ctx.transport.trpcMutation(bearer, 'installIntent.rejectInstallIntent', input)
        );
    }),
    applyInstallIntent: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => ctx.transport.trpcMutation(bearer, 'installIntent.applyInstallIntent', input)
        );
    }),
    revokeInstallIntent: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => ctx.transport.trpcMutation(bearer, 'installIntent.revokeInstallIntent', input)
        );
    }),
    getInstallIntent: protectedProcedure.input(z.any()).query(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => ctx.transport.trpcQuery(bearer, 'installIntent.getInstallIntent', input)
        );
    }),
    listInstallIntents: protectedProcedure.input(z.any()).query(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer => ctx.transport.trpcQuery(bearer, 'installIntent.listInstallIntents', input)
        );
    }),
    getInstallIntentAuditEvents: protectedProcedure.input(z.any()).query(async ({ ctx, input }) => {
        const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
        if (!keyRef) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No managed key' });
        return authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer =>
                ctx.transport.trpcQuery(bearer, 'installIntent.getInstallIntentAuditEvents', input)
        );
    }),
});
