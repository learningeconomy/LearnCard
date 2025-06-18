import { t } from '@routes';
import { boostsRouter, type BoostsRouter } from '@routes/boosts';
import { claimHooksRouter, type ClaimHooksRouter } from '@routes/claim-hooks';
import { profilesRouter, type ProfilesRouter } from '@routes/profiles';
import { profileManagersRouter, type ProfileManagersRouter } from '@routes/profile-manager';
import { credentialsRouter, type CredentialsRouter } from '@routes/credentials';
import { presentationsRouter, type PresentationsRouter } from '@routes/presentations';
import { storageRouter, type StorageRouter } from '@routes/storage';
import { utilitiesRouter, type UtilitiesRouter } from '@routes/utilities';
import { contractsRouter, type ContractsRouter } from '@routes/contracts';
import { didMetadataRouter, type DidMetadataRouter } from '@routes/did-metadata';
import { authGrantsRouter, type AuthGrantsRouter } from '@routes/auth-grants';

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
