import { t } from '@routes';
import { boostsRouter, BoostsRouter } from '@routes/boosts';
import { claimHooksRouter, ClaimHooksRouter } from '@routes/claim-hooks';
import { profilesRouter, ProfilesRouter } from '@routes/profiles';
import { profileManagersRouter, ProfileManagersRouter } from '@routes/profile-manager';
import { credentialsRouter, CredentialsRouter } from '@routes/credentials';
import { presentationsRouter, PresentationsRouter } from '@routes/presentations';
import { storageRouter, StorageRouter } from '@routes/storage';
import { utilitiesRouter, UtilitiesRouter } from '@routes/utilities';
import { contractsRouter, ContractsRouter } from '@routes/contracts';
import { didMetadataRouter, DidMetadataRouter } from '@routes/did-metadata';
import { authGrantsRouter, AuthGrantsRouter } from '@routes/auth-grants';

export { createContext } from '@routes';

export const appRouter = t.router<{
    boost: BoostsRouter;
    claimHook: ClaimHooksRouter;
    profile: ProfilesRouter;
    profileManager: ProfileManagersRouter;
    credential: CredentialsRouter;
    presentation: PresentationsRouter;
    storage: StorageRouter;
    utilities: UtilitiesRouter;
    contracts: ContractsRouter;
    didMetadata: DidMetadataRouter;
    authGrants: AuthGrantsRouter;
}>({
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
    authGrants: authGrantsRouter,
});

export type AppRouter = typeof appRouter;
