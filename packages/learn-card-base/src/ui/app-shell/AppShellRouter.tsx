import React, { useCallback, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';
import type { Location, NavigationType } from 'react-router';

type EntryInfo = {
    /** Pathname of the in-app entry that pushed this one (Ionic `pushedByRoute`). */
    pushedByRoute?: string;
    pushedBySearch?: string;
    /** Pathname the user arrived from (Ionic `lastPathname`). */
    lastPathname?: string;
};

type Tracker = {
    entries: Map<string, EntryInfo>;
    current?: Location;
};

/** One tracker per page: the app renders one router at a time. */
const tracker: Tracker = { entries: new Map() };

const keyOf = (location: Location): string => location.key ?? '';

/** Records one committed navigation, as IonReactRouter's history listener did. */
export const recordInAppNavigation = (location: Location, action: NavigationType): void => {
    const { entries } = tracker;
    const previous = tracker.current;
    if (!previous) {
        tracker.current = location;
        if (!entries.has(keyOf(location))) entries.set(keyOf(location), {});
        return;
    }
    if (keyOf(previous) === keyOf(location)) return;
    const previousInfo = entries.get(keyOf(previous)) ?? {};
    tracker.current = location;

    // Ionic ignored a navigation whose pathname equals the current URL (pathname + search),
    // e.g. the hamburger tab's push of the current pathname.
    if (previous.pathname + previous.search === location.pathname) {
        entries.set(keyOf(location), previousInfo);
        return;
    }

    if (action === 'PUSH') {
        entries.set(keyOf(location), {
            pushedByRoute: previous.pathname,
            pushedBySearch: previous.search,
            lastPathname: previous.pathname,
        });
    } else if (action === 'REPLACE') {
        const pushedByRoute =
            previousInfo.pushedByRoute !== location.pathname
                ? previousInfo.pushedByRoute
                : undefined;
        entries.set(keyOf(location), {
            pushedByRoute,
            pushedBySearch: pushedByRoute ? previousInfo.pushedBySearch : undefined,
            lastPathname: previous.pathname,
        });
    } else {
        const known = entries.get(keyOf(location)) ?? {};
        entries.set(keyOf(location), { ...known, lastPathname: previous.pathname });
    }
};

/** Test-only: forget every recorded entry (each test renders a fresh router). */
export const resetInAppHistory = (): void => {
    tracker.entries.clear();
    tracker.current = undefined;
};

export type AppShellRouterProps = {
    children?: React.ReactNode;
};

/**
 * Replacement for IonReactRouter's in-app history tracking, which back buttons rely on. Render it
 * inside the app's router (React Router framework mode in the app, a data router in Scouts).
 * Tracking records each committed location before children's effects run.
 */
export const AppShellRouter: React.FC<AppShellRouterProps> = ({ children }) => {
    const location = useLocation();
    const action = useNavigationType();
    useLayoutEffect(() => {
        recordInAppNavigation(location, action);
    }, [location, action]);
    return <>{children}</>;
};

/** Back action with IonReactRouter's `IonBackButton defaultHref` semantics (AppBackButton). */
export const useAppGoBack = (defaultHref: string): (() => void) => {
    const navigate = useNavigate();
    return useCallback(() => {
        const current = tracker.current;
        const info = (current && tracker.entries.get(keyOf(current))) ?? {};
        // Ionic `NavManager.goBack(defaultHref)` semantics: go back if the current entry was
        // pushed in-app by the previous one, return to the pusher if the user arrived some other
        // way, and otherwise replace the current entry with `defaultHref`.
        if (!info.pushedByRoute) {
            navigate(defaultHref, { replace: true });
        } else if (info.lastPathname === info.pushedByRoute) {
            navigate(-1);
        } else {
            navigate(info.pushedByRoute + (info.pushedBySearch ?? ''), { replace: true });
        }
    }, [navigate, defaultHref]);
};

export default AppShellRouter;
