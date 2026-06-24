/**
 * Route → page title map for the condensed (scrolled) header (LC-1921).
 * Longest-prefix match so detail routes (e.g. /passport/:id) keep their
 * section title. Returns null for unmapped routes so callers fall back to
 * the brand logo.
 */
const PAGE_TITLES: ReadonlyArray<readonly [string, string]> = [
    ['/dashboard', 'Dashboard'],
    ['/passport', 'Passport'],
    ['/wallet', 'Passport'],
    ['/launchpad', 'Apps'],
    ['/contacts', 'Contacts'],
    ['/notifications', 'Alerts'],
    ['/privacy-and-data', 'Settings'],
];

export const getPageTitle = (pathname: string): string | null => {
    const match = PAGE_TITLES.filter(([prefix]) => pathname.startsWith(prefix)).sort(
        (a, b) => b[0].length - a[0].length
    )[0];
    return match ? match[1] : null;
};
