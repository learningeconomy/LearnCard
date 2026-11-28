import React, { useEffect } from 'react';
import { Links, Meta, Scripts, isRouteErrorResponse, useRouteError } from 'react-router';

import poppins400 from './assets/fonts/self-hosted/poppins-latin-400-normal.woff2?url';
import poppins500 from './assets/fonts/self-hosted/poppins-latin-500-normal.woff2?url';
import poppins700 from './assets/fonts/self-hosted/poppins-latin-700-normal.woff2?url';
import { CHUNK_PREFETCH_ELEMENT_ID, devChunkPrefetchList } from './buildPlugins/chunkPrefetchList';
import { environment } from './config/environment';
import { ACCESSIBILITY_WIDGET_SCRIPT } from './document/accessibilityWidgetScript';
import { getRegisteredApp } from './routing/appRegistry';

// The first screen (login) renders Poppins 400/500/700 latin; fetch them with the CSS.
const FIRST_SCREEN_FONTS = [poppins400, poppins500, poppins700];

/**
 * The HTML document for every page: the SPA fallback (index.html), each prerendered path, and
 * the dev server. Everything here also runs in Node at build time, so it must not touch app code.
 */
export function Layout({ children }: { children: React.ReactNode }) {
    const branding = __LC_DOCUMENT_BRANDING__;
    return (
        // The app shell (learn-card-base appPlatform) adds platform classes to <html> before
        // hydrateRoot runs, so the className can't match the static HTML.
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <base href="/" />
                <title>{branding.title}</title>
                <meta name="color-scheme" content="light dark" />
                <meta
                    name="viewport"
                    content="viewport-fit=cover, width=device-width, initial-scale=1.0"
                />
                <meta name="format-detection" content="telephone=no" />
                <meta name="msapplication-tap-highlight" content="no" />
                {FIRST_SCREEN_FONTS.map(href => (
                    <link
                        key={href}
                        rel="preload"
                        as="font"
                        type="font/woff2"
                        crossOrigin=""
                        href={href}
                    />
                ))}
                <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
                <link rel="shortcut icon" type="image/png" href="/assets/icon/favicon.png" />
                <link rel="apple-touch-icon" href="/assets/icon/apple-touch-icon.png" />
                {/* add to homescreen for ios */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content={branding.appleTitle} />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />
                {environment.DEV && (
                    // Production builds get the real chunk list from finalizeStaticBuild.
                    <script
                        type="application/json"
                        id={CHUNK_PREFETCH_ELEMENT_ID}
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify(devChunkPrefetchList('/')),
                        }}
                    />
                )}
                <Meta />
                <Links />
                <script dangerouslySetInnerHTML={{ __html: ACCESSIBILITY_WIDGET_SCRIPT }} />
            </head>
            <body>
                <div id="root">{children}</div>
                <div id="modal-mid-root" />
                <Scripts />
            </body>
        </html>
    );
}

// A client loader makes every static HTML file render HydrateFallback instead of the app, so
// prerendering never runs app code. entry.client finishes start-up before hydrating.
export const clientLoader = async () => null;
clientLoader.hydrate = true as const;

export const shouldRevalidate = () => false;

/** Static start-up shell, baked into every HTML file until the app hydrates. */
export function HydrateFallback() {
    return (
        <div className="lc-startup-shell" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading</span>
        </div>
    );
}

/**
 * The app, for every path. It renders here rather than in a child route so navigating never
 * remounts it; App.tsx routes with its own <Routes>.
 */
export default function Root() {
    const App = getRegisteredApp();
    return <App />;
}

/** Last-resort boundary: App has its own error boundaries, so this only sees shell failures. */
export function ErrorBoundary() {
    const error = useRouteError();
    useEffect(() => {
        if (isRouteErrorResponse(error)) return;
        void import('@sentry/react').then(Sentry => Sentry.captureException(error));
    }, [error]);
    return (
        <main role="alert" style={{ padding: 24, fontFamily: 'Poppins, sans-serif' }}>
            <h1>Something went wrong</h1>
            <p>Reload the page to try again.</p>
        </main>
    );
}
