import * as m from '../../paraglide/messages.js';

/**
 * Route → page title map for the condensed (scrolled) header (LC-1921).
 * Longest-prefix match so detail routes (e.g. /passport/:id) keep their
 * section title. Returns null for unmapped routes so callers fall back to
 * the brand logo.
 */
const PAGE_TITLES: ReadonlyArray<readonly [string, () => string]> = [
    ['/dashboard', () => m['mainHeader.pageTitles.dashboard']()],
    ['/passport', () => m['mainHeader.pageTitles.passport']()],
    ['/wallet', () => m['mainHeader.pageTitles.passport']()],
    ['/launchpad', () => m['mainHeader.pageTitles.apps']()],
    ['/contacts', () => m['mainHeader.pageTitles.contacts']()],
    ['/notifications', () => m['mainHeader.pageTitles.alerts']()],
    ['/privacy-and-data', () => m['mainHeader.pageTitles.settings']()],
];

export const getPageTitle = (pathname: string): string | null => {
    // Match on full path segments only: an exact match or a `prefix/...` child
    // route. A bare `startsWith` would let `/wallet-worker` match `/wallet`.
    const match = PAGE_TITLES.filter(
        ([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/')
    ).sort((a, b) => b[0].length - a[0].length)[0];
    return match ? match[1]() : null;
};
