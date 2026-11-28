import { matchPath } from 'react-router';

import type { PageKey } from './pages';
import { ROUTE_TABLE } from './routeTable';

/**
 * Public pages that render as soon as the app starts, instead of behind the start-up loader that
 * waits for sign-in to settle (AppRouter). Their public content (a listing, a contract, a boost, a
 * profile) is the same for everyone and loads without a wallet. Whatever on them depends on who is
 * signed in (actions, the viewer's name or avatar) waits for useAuthSettled and shows a placeholder
 * until then, so nobody sees the signed-out flow, or a signed-in-only action, by mistake.
 *
 * Private views (share links, /share-boost, /verify/resume) must never be listed here:
 * routeData.test.ts enforces it.
 */
export const RENDERS_BEFORE_AUTH: ReadonlySet<PageKey> = new Set<PageKey>([
    'termsOfService',
    'privacyPolicy',
    'appListing',
    'consentFlowDoor',
    'claimBoost',
    'connect',
]);

const PATTERNS = ROUTE_TABLE.filter(entry => RENDERS_BEFORE_AUTH.has(entry.page)).map(
    entry => entry.path
);

export const rendersBeforeAuth = (pathname: string): boolean =>
    PATTERNS.some(pattern => matchPath(pattern, pathname) !== null);
