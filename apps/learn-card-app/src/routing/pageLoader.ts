import type { ClientLoaderFunctionArgs } from 'react-router';

import type { LazyPage } from './lazyPage';

/** How long a navigation waits for a page's code before rendering it anyway (it then suspends). */
const NAVIGATION_CODE_WAIT_MS = 4000;

let appStarted = false;

/**
 * root.tsx calls this once the app has rendered. Until then, clientLoaders start their work without
 * awaiting it, so the first render never waits on a page chunk (the page suspends instead, as before).
 */
export const markAppStarted = (): void => {
    appStarted = true;
};

/** Starts a route's data in the query cache. It must not throw or be awaited by the loader. */
export type RouteDataPrefetch = (args: ClientLoaderFunctionArgs) => void;

/**
 * A route's clientLoader. On navigation, React Router keeps the current page up until it resolves,
 * so the next page commits without a Suspense fallback; its data, when the route has a prefetch,
 * starts at the same moment as its code instead of after the page first renders.
 */
export const pageClientLoader =
    (page: LazyPage, prefetchData?: RouteDataPrefetch) =>
    async (args: ClientLoaderFunctionArgs): Promise<null> => {
        try {
            prefetchData?.(args);
        } catch {
            // A failed prefetch leaves the page to fetch its own data.
        }
        const code = page.preload();
        if (appStarted) {
            await Promise.race([
                code,
                new Promise<void>(resolve => setTimeout(resolve, NAVIGATION_CODE_WAIT_MS)),
            ]);
        }
        return null;
    };
