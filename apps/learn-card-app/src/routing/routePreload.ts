import { PAGES, type PageKey } from './pages';

/** Paths gated behind the AI feature flag — only prefetch when enabled. */
const AI_GATED_PATHS = new Set([
    '/ai/assistant',
    '/ai/insights',
    '/ai/pathways',
    '/ai/topics',
    '/ai/sessions',
]);

type RouteManifest = {
    routes: Record<string, { path?: string; module: string; clientLoaderModule?: string }>;
};

/**
 * Loads the React Router route modules for a path (src/routes/pages/*), which the router otherwise
 * fetches when navigation starts, one round trip before the clientLoader can run. Importing the
 * manifest's URLs gives the router the same module instances when it asks for them.
 */
const warmRouteModules = (path: string): void => {
    const { __reactRouterManifest: manifest } = window as Window & {
        __reactRouterManifest?: RouteManifest;
    };
    if (!manifest) return;
    for (const route of Object.values(manifest.routes)) {
        if (route.path !== path) continue;
        for (const url of [route.clientLoaderModule, route.module]) {
            if (url) void import(/* @vite-ignore */ url).catch(() => undefined);
        }
    }
};

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
    Object.entries(WARM_ROUTES).map(([path, page]) => [
        path,
        () => {
            warmRouteModules(path);
            return PAGES[page].preload();
        },
    ])
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
