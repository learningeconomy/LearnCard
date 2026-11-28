import { matchPath } from 'react-router';

import type { PageKey } from './pages';
import { ROUTE_TABLE } from './routeTable';

/**
 * Public pages that render as soon as the app starts, instead of behind the start-up loader that
 * waits for sign-in to settle (AppRouter). Their content is the same for everyone; whatever on them
 * depends on who is signed in waits for useAuthSettled itself.
 *
 * Pages that branch on sign-in state when they first render (login, consent flow, claim, connect)
 * stay behind the loader: rendering them early would start the signed-out flow for a signed-in user.
 */
const RENDERS_BEFORE_AUTH: ReadonlySet<PageKey> = new Set<PageKey>([
    'termsOfService',
    'privacyPolicy',
    'appListing',
]);

const PATTERNS = ROUTE_TABLE.filter(entry => RENDERS_BEFORE_AUTH.has(entry.page)).map(
    entry => entry.path
);

export const rendersBeforeAuth = (pathname: string): boolean =>
    PATTERNS.some(pattern => matchPath(pattern, pathname) !== null);
