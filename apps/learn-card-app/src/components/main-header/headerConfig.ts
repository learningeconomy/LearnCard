/**
 * Header behaviour config (LC-1921).
 *
 * The back button used to be opt-in per page (`showBackButton` defaulted to
 * false), which left it inconsistent: some deep pages showed it, some didn't.
 * Instead we default it ON for any non-top-level route, so navigating into a
 * feature always offers a way back. Top-level tab/root routes (the bottom nav
 * and side-menu roots) stay back-button-free. Pages can still override with an
 * explicit `showBackButton` prop.
 */
export const TOP_LEVEL_ROUTES: ReadonlyArray<string> = [
    '/dashboard',
    '/passport',
    '/wallet',
    '/home',
    '/launchpad',
    '/contacts',
];

/** A route is "top-level" only on an exact match — child routes (e.g. a
 * credential detail under /passport, or /launchpad/browse) are drill-ins and
 * should show a back button. */
export const isTopLevelRoute = (pathname: string): boolean => TOP_LEVEL_ROUTES.includes(pathname);

/**
 * Resolve whether MainHeader shows the back button. An explicit prop always
 * wins; otherwise default ON for non-top-level routes.
 */
export const resolveShowBackButton = (pathname: string, override?: boolean): boolean =>
    override ?? !isTopLevelRoute(pathname);
