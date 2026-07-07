import { initTRPC, TRPCError } from '@trpc/server';
import type { DashboardSession } from '@learncard/types';

export type ConsoleContext = {
    session: DashboardSession | null;
};

const t = initTRPC.context<ConsoleContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { session: ctx.session } });
});
