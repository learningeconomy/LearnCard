import React, { useCallback } from 'react';
import { Router, useHistory } from 'react-router-dom';
import type { History, Location } from 'history';

type EntryInfo = {
    /** Pathname of the in-app entry that pushed this one (Ionic `pushedByRoute`). */
    pushedByRoute?: string;
    pushedBySearch?: string;
    /** Pathname the user arrived from (Ionic `lastPathname`). */
    lastPathname?: string;
};

type InAppHistory = {
    /**
     * Ionic `NavManager.goBack(defaultHref)` semantics: go back if the current entry was pushed
     * in-app by the previous one, return to the pusher if the user arrived some other way, and
     * otherwise replace the current entry with `defaultHref`.
     */
    goBack: (defaultHref: string) => void;
};

const keyOf = (location: Location): string => location.key ?? '';

const trackers = new WeakMap<History, InAppHistory>();

const createInAppHistory = (history: History): InAppHistory => {
    const entries = new Map<string, EntryInfo>();
    let current = history.location;
    entries.set(keyOf(current), {});

    history.listen((location, action) => {
        const previous = current;
        const previousInfo = entries.get(keyOf(previous)) ?? {};
        current = location;

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
    });

    return {
        goBack: defaultHref => {
            const info = entries.get(keyOf(current)) ?? {};
            if (!info.pushedByRoute) {
                history.replace(defaultHref);
            } else if (info.lastPathname === info.pushedByRoute) {
                history.goBack();
            } else {
                history.replace(info.pushedByRoute + (info.pushedBySearch ?? ''));
            }
        },
    };
};

/** Starts (once per history object) the in-app history tracking `useAppGoBack` relies on. */
export const getInAppHistory = (history: History): InAppHistory => {
    let tracker = trackers.get(history);
    if (!tracker) {
        tracker = createInAppHistory(history);
        trackers.set(history, tracker);
    }
    return tracker;
};

export type AppShellRouterProps = {
    history: History;
    children?: React.ReactNode;
};

/**
 * Replacement for `IonReactRouter history={history}`: the plain React Router 5 `<Router>`, plus
 * the in-app history tracking IonReactRouter did for back buttons. Tracking starts on first
 * render, as IonReactRouter's did in its constructor.
 */
export const AppShellRouter: React.FC<AppShellRouterProps> = ({ history, children }) => {
    getInAppHistory(history);
    return <Router history={history}>{children}</Router>;
};

/** Back action with `IonBackButton defaultHref` semantics, for app-owned back buttons. */
export const useAppGoBack = (defaultHref: string): (() => void) => {
    const history = useHistory();
    return useCallback(() => getInAppHistory(history).goBack(defaultHref), [history, defaultHref]);
};

export default AppShellRouter;
