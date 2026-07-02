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
import { federationRouter, FederationRouter } from '@routes/federation';
import { ecosystemsRouter, EcosystemsRouter } from '@routes/ecosystems';
import { groupsRouter, GroupsRouter } from '@routes/groups';

/** For end-to-end testing, only available in test environment */
import { testRouter, TestRouter } from '@routes/test';

/** Perf bench routes — only mounted when ENABLE_BENCH_ROUTES is set */
import { benchRouter, BenchRouter } from '@routes/bench';

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
    federation: FederationRouter;
    ecosystem: EcosystemsRouter;
    group: GroupsRouter;
    test?: TestRouter;
    bench?: BenchRouter;
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
    federation: federationRouter,
    ecosystem: ecosystemsRouter,
    group: groupsRouter,
    test: process.env.IS_E2E_TEST ? testRouter : undefined,
    bench: process.env.ENABLE_BENCH_ROUTES ? benchRouter : undefined,
});

export type AppRouter = typeof appRouter;
