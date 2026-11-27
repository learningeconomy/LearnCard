import React, { createContext, useContext, useEffect, useState } from 'react';

import { getIonMode } from './ionMode';
import './app-shell.css';

/** Ionic's default split-pane breakpoint (`when="lg"`). */
export const SPLIT_PANE_QUERY = '(min-width: 992px)';

type AppSplitPaneContextValue = { isPaneVisible: boolean };

const AppSplitPaneContext = createContext<AppSplitPaneContextValue | null>(null);

/** Pane visibility of the nearest `AppSplitPane`, or `null` outside one. */
export const useAppSplitPane = (): AppSplitPaneContextValue | null =>
    useContext(AppSplitPaneContext);

const matchesQuery = (query: string): boolean =>
    typeof window !== 'undefined' && (window.matchMedia?.(query).matches ?? false);

export type AppSplitPaneProps = {
    /** Id of the main content element; it gets Ionic's `split-pane-main` class. */
    contentId: string;
    className?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonSplitPane`: docks the side menu next to `#main` from 992px up and
 * lets it become an overlay drawer below that. Keeps Ionic's host classes (`split-pane-{mode}`,
 * `split-pane-visible`) so the existing width/shadow rules in nav.scss keep matching.
 */
export const AppSplitPane: React.FC<AppSplitPaneProps> = ({ contentId, className, children }) => {
    const [isPaneVisible, setIsPaneVisible] = useState(() => matchesQuery(SPLIT_PANE_QUERY));
    const [mode] = useState(getIonMode);

    useEffect(() => {
        const mediaList = window.matchMedia?.(SPLIT_PANE_QUERY);
        if (!mediaList) return undefined;

        const onChange = (event: MediaQueryListEvent): void => setIsPaneVisible(event.matches);
        setIsPaneVisible(mediaList.matches);
        mediaList.addEventListener('change', onChange);
        return () => mediaList.removeEventListener('change', onChange);
    }, []);

    // Ionic tags the main node once it connects; it never untags it.
    useEffect(() => {
        const main = document.getElementById(contentId);
        main?.classList.add('split-pane-main');
        main?.classList.remove('split-pane-side');
    }, [contentId]);

    const classes = [
        'app-split-pane',
        mode,
        `split-pane-${mode}`,
        isPaneVisible ? 'split-pane-visible' : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <AppSplitPaneContext.Provider value={{ isPaneVisible }}>
            <div className={classes} data-app-split-pane="">
                {children}
            </div>
        </AppSplitPaneContext.Provider>
    );
};

export default AppSplitPane;
