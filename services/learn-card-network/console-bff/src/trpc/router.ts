import { router, protectedProcedure } from './trpc';

export const consoleRouter = router({
    session: router({
        get: protectedProcedure.query(({ ctx }) => ctx.session),
    }),
});

export type ConsoleRouter = typeof consoleRouter;
