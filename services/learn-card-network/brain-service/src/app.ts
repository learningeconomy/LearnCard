import { t } from '@routes';
import { boostsRouter } from '@routes/boosts';
import { profilesRouter } from '@routes/profiles';
import { profileManagersRouter } from '@routes/profile-manager';
import { credentialsRouter } from '@routes/credentials';
import { presentationsRouter } from '@routes/presentations';
import { storageRouter } from '@routes/storage';
import { utilitiesRouter } from '@routes/utilities';
import { contractsRouter } from '@routes/contracts';

export { createContext } from '@routes';

export const boostRouter = t.router({ boost: boostsRouter });
export const profileRouter = t.router({ profile: profilesRouter });
export const profileManagerRouter = t.router({ profileManager: profileManagersRouter });
export const credentialRouter = t.router({ credential: credentialsRouter });
export const presentationRouter = t.router({ presentation: presentationsRouter });
export const storagRouter = t.router({ storage: storageRouter });
export const utilityRouter = t.router({ utilities: utilitiesRouter });
export const contractRouter = t.router({ contracts: contractsRouter });

export const appRouter = t.mergeRouters(
    boostRouter,
    profileRouter,
    profileManagerRouter,
    credentialRouter,
    presentationRouter,
    storagRouter,
    utilityRouter,
    contractRouter
);

export type AppRouter = typeof appRouter;
