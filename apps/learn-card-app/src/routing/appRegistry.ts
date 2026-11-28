import type { ComponentType } from 'react';

/**
 * The app component, registered by entry.client before hydration. Route modules run before
 * entry.client (React Router imports them first), so root.tsx must not import App itself: App's
 * imports would then run before the browser globals, native bridge hooks and Sentry set-up.
 */
let registeredApp: ComponentType | null = null;

export const registerApp = (app: ComponentType): void => {
    registeredApp = app;
};

export const getRegisteredApp = (): ComponentType => {
    if (!registeredApp) throw new Error('App rendered before entry.client registered it');
    return registeredApp;
};
