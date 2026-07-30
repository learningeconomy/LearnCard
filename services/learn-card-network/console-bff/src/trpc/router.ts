import { router, protectedProcedure } from './trpc';
import { installIntentsRouter } from './install-intents';

export const consoleRouter = router({
    session: router({
        get: protectedProcedure.query(({ ctx }) => ctx.session),
    }),
    installIntents: installIntentsRouter,
});

export type ConsoleRouter = typeof consoleRouter;
