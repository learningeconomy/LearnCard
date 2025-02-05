import { t } from '@routes';
import { boostsRouter } from '@routes/boosts';
import { claimHooksRouter } from '@routes/claim-hooks';
import { profilesRouter } from '@routes/profiles';
import { profileManagersRouter } from '@routes/profile-manager';
import { credentialsRouter } from '@routes/credentials';
import { presentationsRouter } from '@routes/presentations';
import { storageRouter } from '@routes/storage';
import { utilitiesRouter } from '@routes/utilities';
import { contractsRouter } from '@routes/contracts';
import { didMetadataRouter } from '@routes/did-metadata';

export { createContext } from '@routes';

export const appRouter = t.router({
    boost: boostsRouter,
    claimHook: claimHooksRouter,
    profile: profilesRouter,
    profileManager: profileManagersRouter,
    credential: credentialsRouter,
    presentation: presentationsRouter,
    storage: storageRouter,
    utilities: utilitiesRouter,
    contracts: contractsRouter,
    didMetadata: didMetadataRouter,
});

export type AppRouter = typeof appRouter;
