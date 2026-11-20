/**
 * Lists the files a lazy chunk needs, so the app can warm the HTTP cache for it with plain
 * fetch() (see helpers/prefetchChunk.ts). It needs real file names because a speculative
 * import() is not safe: when it fails, Firefox and some Chromium versions remember the failed
 * module and a later import() of the same URL fails without a new request.
 */

/** The parts of a Rollup output chunk this reads. */
export type BundleChunk = {
    type: 'chunk' | 'asset';
    fileName: string;
    facadeModuleId?: string | null;
    imports?: string[];
    viteMetadata?: { importedCss: Set<string> };
};

export const CHUNK_PREFETCH_ELEMENT_ID = 'lc-chunk-prefetch';

/**
 * Modules the app warms with fetch() before their first import(). Keys are stable ids used by
 * helpers/prefetchChunk; values are paths relative to the learn-card-app root (same as Vite's
 * PREFETCH_CHUNKS list in vite.config.mts).
 *
 * Keep in sync with ROUTE_WARM_KEYS below and with ROUTE_PRELOAD in Routes.tsx.
 */
export const PREFETCH_CHUNKS = {
    'my-learncard': 'src/components/learncard/MyLearnCardModalContent.tsx',
    dashboard: 'src/pages/dashboard/DashboardPage.tsx',
    wallet: 'src/pages/wallet/WalletPage.tsx',
    skills: 'src/pages/skills/SkillsPage.tsx',
    'social-badges': 'src/pages/socialBadgesPage/SocialBadgesPage.tsx',
    achievements: 'src/pages/achievements/AchievementsPage.tsx',
    qualifications: 'src/pages/qualifications/QualificationsPage.tsx',
    'learning-history': 'src/pages/learninghistory/LearningHistoryPage.tsx',
    accomplishments: 'src/pages/accomplishments/AccomplishmentsPage.tsx',
    accommodations: 'src/pages/accommodations/AccommodationsPage.tsx',
    'work-history': 'src/pages/workhistory/WorkHistoryPage.tsx',
    families: 'src/pages/familyPage/FamilyPage.tsx',
    'school-connect': 'src/pages/schoolConnect/SchoolConnectPage.tsx',
    ids: 'src/pages/ids/IdsPage.tsx',
    memberships: 'src/pages/membership/MembershipPage.tsx',
    currencies: 'src/pages/currencies/CurrenciesPage.tsx',
    'ai-assistant': 'src/pages/my-assistant/MyAssistantPage.tsx',
    'ai-insights': 'src/pages/ai-insights/AiInsights.tsx',
    'ai-pathways': 'src/pages/ai-pathways/AiPathways.tsx',
    'ai-topics': 'src/components/ai-sessions/AiSessionTopicsContainer.tsx',
    'ai-sessions': 'src/components/ai-sessions/AiSessionsContainer.tsx',
    launchpad: 'src/pages/myApps/MyAppsLanding.tsx',
    'launchpad-browse': 'src/pages/launchPad/LaunchPad.tsx',
    contacts: 'src/pages/addressBook/AddressBook.tsx',
    notifications: 'src/pages/notificationsPage/NotificationsPage.tsx',
    boost: 'src/components/boost/boostCMS/BoostCMS.tsx',
    issue: 'src/pages/issue/IssueCredentialPage.tsx',
    'boost-a-friend': 'src/pages/boostAFriend/BoostAFriendPage.tsx',
    'privacy-and-data': 'src/pages/privacy-settings/PrivacySettingsPage.tsx',
    'resume-builder': 'src/pages/resume-builder/ResumeBuilderPage.tsx',
} as const;

export type PrefetchChunkKey = keyof typeof PREFETCH_CHUNKS;

/**
 * App paths whose idle prefetch and navigation wait share a PrefetchChunkKey.
 * Several paths can share one key when they load the same chunk (e.g. /wallet and /home).
 */
export const ROUTE_WARM_KEYS: Record<string, PrefetchChunkKey> = {
    '/dashboard': 'dashboard',
    '/passport': 'wallet',
    '/wallet': 'wallet',
    '/home': 'wallet',
    '/skills': 'skills',
    '/socialBadges': 'social-badges',
    '/achievements': 'achievements',
    '/qualifications': 'qualifications',
    '/learninghistory': 'learning-history',
    '/accomplishments': 'accomplishments',
    '/accommodations': 'accommodations',
    '/workhistory': 'work-history',
    '/families': 'families',
    '/school-connect': 'school-connect',
    '/ids': 'ids',
    '/memberships': 'memberships',
    '/currencies': 'currencies',
    '/ai/assistant': 'ai-assistant',
    '/ai/insights': 'ai-insights',
    '/ai/pathways': 'ai-pathways',
    '/ai/topics': 'ai-topics',
    '/ai/sessions': 'ai-sessions',
    '/launchpad': 'launchpad',
    '/launchpad/browse': 'launchpad-browse',
    '/contacts': 'contacts',
    '/notifications': 'notifications',
    '/boost': 'boost',
    '/issue': 'issue',
    '/boost-a-friend': 'boost-a-friend',
    '/privacy-and-data': 'privacy-and-data',
    '/resume-builder': 'resume-builder',
};

const staticClosure = (bundle: Record<string, BundleChunk>, start: string): Set<string> => {
    const seen = new Set<string>();
    const visit = (fileName: string) => {
        const chunk = bundle[fileName];
        if (seen.has(fileName) || chunk?.type !== 'chunk') return;
        seen.add(fileName);
        chunk.imports?.forEach(visit);
    };
    visit(start);
    return seen;
};

const cssOf = (bundle: Record<string, BundleChunk>, files: Set<string>): Set<string> =>
    new Set([...files].flatMap(file => [...(bundle[file]?.viteMetadata?.importedCss ?? [])]));

/**
 * Files (relative to the build root) that loading `moduleId` will request and the entry page
 * hasn't already loaded: its chunk, its static imports, and their CSS. Empty when no chunk has
 * that module as its facade.
 */
export const chunkPrefetchFiles = (
    bundle: Record<string, BundleChunk>,
    entryFileName: string,
    moduleId: string
): string[] => {
    const target = Object.values(bundle).find(
        chunk => chunk.type === 'chunk' && chunk.facadeModuleId === moduleId
    );
    if (!target) return [];
    const loaded = staticClosure(bundle, entryFileName);
    const needed = [...staticClosure(bundle, target.fileName)].filter(file => !loaded.has(file));
    const loadedCss = cssOf(bundle, loaded);
    const css = [...cssOf(bundle, new Set(needed))].filter(file => !loadedCss.has(file));
    return [...needed, ...css];
};
