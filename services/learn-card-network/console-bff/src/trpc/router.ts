import { router, protectedProcedure } from './trpc';
import { installIntentsRouter } from './install-intents';
import { ecosystemRouter } from './ecosystem';
import { groupRouter } from './group';
import { catalogRouter } from './catalog';
import { skillFrameworksRouter } from './skill-frameworks';
import { infraRouter, registriesRouter } from './install-targets';
import { activityRouter, bindingsRouter, installTargetsRouter } from './bindings';

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
    bindings: bindingsRouter,
    installTargets: installTargetsRouter,
    activity: activityRouter,
});

export type ConsoleRouter = typeof consoleRouter;
