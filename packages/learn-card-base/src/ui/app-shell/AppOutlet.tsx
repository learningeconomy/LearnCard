import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import './app-shell.css';

type AppOutletContextValue = {
    /** The real history pathname (read above the Routes `Switch`, which may pin a background location). */
    pathname: string;
};

const AppOutletContext = createContext<AppOutletContextValue | null>(null);

export type AppOutletProps = {
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonRouterOutlet`. With `<RoutesOutlet/>` as its only child Ionic kept
 * a single view and never stacked or animated pages, so this is just the same absolutely
 * positioned box (`ion-router-outlet` host styles) that `.ion-page` children fill, plus the
 * context `useViewWillEnter` listens to.
 */
export const AppOutlet: React.FC<AppOutletProps> = ({ children }) => {
    const { pathname } = useLocation();

    return (
        <AppOutletContext.Provider value={{ pathname }}>
            <div className="app-router-outlet" data-app-outlet="">
                {children}
            </div>
        </AppOutletContext.Provider>
    );
};

/**
 * Replacement for `useIonViewWillEnter` in this app's outlet setup.
 *
 * Ionic fired it for components under the outlet once the page mounted and again on every
 * pathname change while the page stayed mounted (including a modal route pushed over a
 * background page); search-only changes did not fire it. Outside the outlet it never fired.
 * `useIonViewWillLeave` never fired here, so it has no counterpart.
 */
export const useViewWillEnter = (callback: () => void): void => {
    const outlet = useContext(AppOutletContext);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;
    const pathname = outlet?.pathname;
    const inOutlet = outlet !== null;

    useEffect(() => {
        if (inOutlet) callbackRef.current();
    }, [inOutlet, pathname]);
};

export default AppOutlet;
