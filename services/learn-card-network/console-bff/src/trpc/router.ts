import { router, protectedProcedure } from './trpc';
import { installIntentsRouter } from './install-intents';
import { ecosystemRouter } from './ecosystem';
import { groupRouter } from './group';
import { catalogRouter } from './catalog';

export const consoleRouter = router({
    session: router({
        get: protectedProcedure.query(({ ctx }) => ctx.session),
    }),
    installIntents: installIntentsRouter,
    ecosystem: ecosystemRouter,
    group: groupRouter,
    catalog: catalogRouter,
});

export type ConsoleRouter = typeof consoleRouter;
