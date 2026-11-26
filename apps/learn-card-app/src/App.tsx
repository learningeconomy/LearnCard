import React, { useRef, lazy } from 'react';

import { createBrowserHistory } from 'history';
import { AppShellRouter } from './components/app-shell/AppShellRouter';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { IonApp, setupIonicReact } from '@ionic/react';
// Eager: registers the app-overlay Escape / back-button listeners before Ionic's (FullApp is lazy).
import './components/overlays/overlayStack';
import LoginLoadingPage from './pages/login/LoginPageLoader/LoginLoader';

import { lazyWithRetry, useIsLoggedIn } from 'learn-card-base';
import { useEnforceVisibleLocale } from './i18n/useLanguageSelectorConfig';
import firstStartupStore, {
    useIntroSlidesCompleted,
} from 'learn-card-base/stores/firstStartupStore';
import { Capacitor } from '@capacitor/core';
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './theme/floating-tab-bar.css';

// importing styles
import '@learncard/react/main.css';
import './tailwind.css';
import './index.scss';

// base styles of swiper js
import 'swiper/css';
import '@ionic/react/css/ionic-swiper.css';
const history = createBrowserHistory();

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

setupIonicReact({ swipeBackEnabled: false });

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
                <IonApp>
                    <React.Suspense fallback={null}>
                        <IntroSlides />
                    </React.Suspense>
                </IonApp>
            </AppShellRouter>
        );
    } else {
        // Paint the same loader AppRouter shows during auth init while FullApp's chunks download,
        // instead of an empty page until they arrive.
        return (
            <React.Suspense
                fallback={
                    <IonApp>
                        <LoginLoadingPage />
                    </IonApp>
                }
            >
                <LazyFullApp />
            </React.Suspense>
        );
    }
};

export default Sentry.withProfiler(App);
