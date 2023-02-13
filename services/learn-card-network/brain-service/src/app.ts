import { t } from '@routes';
import { profilesRouter } from '@routes/profiles';
import { credentialsRouter } from '@routes/credentials';
import { presentationsRouter } from '@routes/presentations';
import { storageRouter } from '@routes/storage';
import { utilitiesRouter } from '@routes/utilities';

export { createContext } from '@routes';

export const appRouter = t.router({
    profile: profilesRouter,
    credential: credentialsRouter,
    presentation: presentationsRouter,
    storage: storageRouter,
    utilities: utilitiesRouter,
});
export type AppRouter = typeof appRouter;
