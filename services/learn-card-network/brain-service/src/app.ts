import { t } from '@routes';
import { boostsRouter } from '@routes/boosts';
import { profilesRouter } from '@routes/profiles';
import { credentialsRouter } from '@routes/credentials';
import { presentationsRouter } from '@routes/presentations';
import { storageRouter } from '@routes/storage';
import { utilitiesRouter } from '@routes/utilities';
import { contractsRouter } from '@routes/contracts';

export { createContext } from '@routes';

export const appRouter = t.router({
    boost: boostsRouter,
    profile: profilesRouter,
    credential: credentialsRouter,
    presentation: presentationsRouter,
    storage: storageRouter,
    utilities: utilitiesRouter,
    contracts: contractsRouter,
});

export type AppRouter = typeof appRouter;
