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
import { workflowsRouter, WorkflowsRouter } from '@routes/workflows';
import { contactMethodsRouter, ContactMethodsRouter } from '@routes/contact-methods';
import { inboxRouter, InboxRouter } from '@routes/inbox';
import { skillFrameworksRouter, SkillFrameworksRouter } from '@routes/skill-frameworks';
import { skillsRouter, SkillsRouter } from '@routes/skills';
import { integrationsRouter, IntegrationsRouter } from '@routes/integrations';
import { appStoreRouter, AppStoreRouter } from '@routes/app-store';
import { activityRouter, ActivityRouter } from '@routes/activity';
import { edlinkRouter, EdlinkRouter } from '@routes/edlink';

/** For end-to-end testing, only available in test environment */
import { testRouter, TestRouter } from '@routes/test';

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
    workflows: WorkflowsRouter;
    contactMethods: ContactMethodsRouter;
    inbox: InboxRouter;
    skillFrameworks: SkillFrameworksRouter;
    skills: SkillsRouter;
    integrations: IntegrationsRouter;
    appStore: AppStoreRouter;
    activity: ActivityRouter;
    edlink: EdlinkRouter;
    test?: TestRouter;
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
    workflows: workflowsRouter,
    contactMethods: contactMethodsRouter,
    inbox: inboxRouter,
    skillFrameworks: skillFrameworksRouter,
    skills: skillsRouter,
    integrations: integrationsRouter,
    appStore: appStoreRouter,
    activity: activityRouter,
    edlink: edlinkRouter,
    test: !!process.env.IS_E2E_TEST ? testRouter : undefined,
});

export type AppRouter = typeof appRouter;
