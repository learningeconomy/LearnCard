import { PAGES, type PageKey } from './pages';

/** Paths gated behind the AI feature flag — only prefetch when enabled. */
const AI_GATED_PATHS = new Set([
    '/ai/assistant',
    '/ai/insights',
    '/ai/pathways',
    '/ai/topics',
    '/ai/sessions',
]);

/** Routes reachable from the wallet, side menu and mobile nav, warmed ahead of navigation. */
const WARM_ROUTES: Record<string, PageKey> = {
    '/dashboard': 'dashboard',
    // Wallet (Passport) — same chunk for all three aliases.
    '/passport': 'wallet',
    '/wallet': 'wallet',
    '/home': 'wallet',
    // Wallet category routes (also rendered as squares on /wallet).
    '/skills': 'skills',
    '/socialBadges': 'socialBadges',
    '/achievements': 'achievements',
    '/qualifications': 'qualifications',
    '/learninghistory': 'learningHistory',
    '/accomplishments': 'accomplishments',
    '/accommodations': 'accommodations',
    '/workhistory': 'workHistory',
    '/families': 'families',
    '/school-connect': 'schoolConnect',
    '/ids': 'ids',
    '/memberships': 'memberships',
    '/currencies': 'currencies',
    // AI routes — gated by the AI feature flag in prefetchRoutes.
    '/ai/assistant': 'myAssistant',
    '/ai/insights': 'aiInsights',
    '/ai/pathways': 'aiPathways',
    '/ai/topics': 'aiTopics',
    '/ai/sessions': 'aiSessions',
    // Side menu root links.
    '/launchpad': 'myApps',
    '/launchpad/browse': 'launchPad',
    '/contacts': 'addressBook',
    '/notifications': 'notifications',
    // Mobile navbar / wallet header.
    '/boost': 'boostCms',
    '/issue': 'issueCredential',
    '/boost-a-friend': 'boostAFriend',
    // Other commonly side-menu-linked routes.
    '/privacy-and-data': 'privacySettings',
    '/resume-builder': 'resumeBuilder',
};

/**
 * Path-keyed chunk preloads for routes reachable from the wallet, side menu and mobile nav.
 * Navigation itself no longer needs them (each route's clientLoader awaits its page's chunk);
 * callers use them to warm a destination early.
 */
export const ROUTE_PRELOAD: Record<string, () => Promise<void>> = Object.fromEntries(
    Object.entries(WARM_ROUTES).map(([path, page]) => [path, PAGES[page].preload])
);

interface PrefetchOptions {
    /** When false, AI routes are skipped — the user can't access them anyway. */
    aiEnabled?: boolean;
}

/**
 * Idle-prefetch routes in ROUTE_PRELOAD so first-time navigation from anywhere
 * (wallet squares, side menu, mobile nav, deep links) lands on a warm chunk
 * cache. AI routes are skipped when the caller indicates the user doesn't have AI access.
 */
export const prefetchRoutes = ({ aiEnabled = true }: PrefetchOptions = {}): void => {
    // Safari before 17.4 has no requestIdleCallback.
    const schedule = (cb: () => void) =>
        'requestIdleCallback' in window
            ? window.requestIdleCallback(cb, { timeout: 2000 })
            : setTimeout(cb, 200);

    schedule(() => {
        Object.entries(ROUTE_PRELOAD).forEach(([path, fn]) => {
            if (!aiEnabled && AI_GATED_PATHS.has(path)) return;
            void fn();
        });
    });
};
