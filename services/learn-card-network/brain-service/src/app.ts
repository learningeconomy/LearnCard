import { t } from '@routes';
import { profilesRouter } from '@routes/profiles';
import { credentialsRouter } from '@routes/credentials';
import { utilitiesRouter } from '@routes/utilities';

export { createContext } from '@routes';

export const appRouter = t.router({
    profile: profilesRouter,
    credential: credentialsRouter,
    utilities: utilitiesRouter,
});
export type AppRouter = typeof appRouter;
