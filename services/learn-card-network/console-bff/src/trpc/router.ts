import { router, protectedProcedure } from './trpc';
import { installIntentsRouter } from './install-intents';
import { ecosystemRouter } from './ecosystem';
import { groupRouter } from './group';
import { catalogRouter } from './catalog';
import { skillFrameworksRouter } from './skill-frameworks';
import { infraRouter, registriesRouter } from './install-targets';

export const consoleRouter = router({
    session: router({
        get: protectedProcedure.query(({ ctx }) => ctx.session),
    }),
    installIntents: installIntentsRouter,
    ecosystem: ecosystemRouter,
    group: groupRouter,
    catalog: catalogRouter,
    skillFrameworks: skillFrameworksRouter,
    infra: infraRouter,
    registries: registriesRouter,
});

export type ConsoleRouter = typeof consoleRouter;
