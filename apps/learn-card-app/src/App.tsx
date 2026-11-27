import React, { useRef, lazy } from 'react';

import { createBrowserHistory } from 'history';
import { AppShellRouter } from 'learn-card-base/ui/app-shell/AppShellRouter';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { AppRoot } from 'learn-card-base/ui/app-shell/AppRoot';
import { initAppPlatform } from 'learn-card-base/ui/app-shell/appPlatform';
// Eager: registers the app-overlay Escape / back-button listeners (FullApp is lazy).
import 'learn-card-base/ui/overlays/overlayStack';
import LoginLoadingPage from './pages/login/LoginPageLoader/LoginLoader';

import { lazyWithRetry, useIsLoggedIn } from 'learn-card-base';
import { useEnforceVisibleLocale } from './i18n/useLanguageSelectorConfig';
import firstStartupStore, {
    useIntroSlidesCompleted,
} from 'learn-card-base/stores/firstStartupStore';
import { Capacitor } from '@capacitor/core';
/* Global CSS LearnCard kept from Ionic (vendored verbatim into learn-card-base/ui/global) */
import 'learn-card-base/ui/global/core.css';
import 'learn-card-base/ui/global/normalize.css';
import 'learn-card-base/ui/global/structure.css';
import 'learn-card-base/ui/global/typography.css';
import 'learn-card-base/ui/global/padding.css';
import 'learn-card-base/ui/global/float-elements.css';
import 'learn-card-base/ui/global/text-alignment.css';
import 'learn-card-base/ui/global/text-transformation.css';
import 'learn-card-base/ui/global/flex-utils.css';
import 'learn-card-base/ui/global/display.css';

/* Theme variables */
import './theme/variables.css';
import './theme/floating-tab-bar.css';

// importing styles
import '@learncard/react/main.css';
import './tailwind.css';
import './index.scss';

// base styles of swiper js
import 'swiper/css';
import 'learn-card-base/swiper/swiper-defaults.css';
const history = createBrowserHistory();

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

initAppPlatform();

// Dynamically import the component
const LazyFullApp = lazyWithRetry(() => import('./FullApp'));
// Native first launch only (signed out, slides not yet seen); keeps Swiper out of every other start.
const IntroSlides = lazyWithRetry(() => import('./components/intro-slides/IntroSlides'));

const App: React.FC = () => {
    useIntroSlidesCompleted();
    // Falls the active locale back to a visible language if the
    // hideLanguageSelector flag hides the one the user is currently viewing.
    useEnforceVisibleLocale();
    const introSlidesCompleted = firstStartupStore.get.introSlidesCompleted();
    const isLoggedIn = useIsLoggedIn();
    const isNativePlatform = Capacitor?.isNativePlatform() ?? false;
    // If the user has not completed the intro sliders then show them
    // If they have, then show the app as usual
    if (
        !introSlidesCompleted &&
        !isLoggedIn &&
        isNativePlatform &&
        !/^\/s(?:\/|$)/.test(window.location.pathname)
    ) {
        return (
            <AppShellRouter history={history}>
                <AppRoot>
                    <React.Suspense fallback={null}>
                        <IntroSlides />
                    </React.Suspense>
                </AppRoot>
            </AppShellRouter>
        );
    } else {
        // Paint the same loader AppRouter shows during auth init while FullApp's chunks download,
        // instead of an empty page until they arrive.
        return (
            <React.Suspense
                fallback={
                    <AppRoot>
                        <LoginLoadingPage />
                    </AppRoot>
                }
            >
                <LazyFullApp />
            </React.Suspense>
        );
    }
};

export default Sentry.withProfiler(App);
