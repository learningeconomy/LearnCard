import React from 'react';
import { createBrowserHistory } from 'history';
import { AppShellRouter } from 'learn-card-base/ui/app-shell/AppShellRouter';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { AppRoot } from 'learn-card-base/ui/app-shell/AppRoot';
import { initAppPlatform } from 'learn-card-base/ui/app-shell/appPlatform';

import { useIsLoggedIn, lazyWithRetry } from 'learn-card-base';

import firstStartupStore, {
    useIntroSlidesCompleted,
} from 'learn-card-base/stores/firstStartupStore';
import IntroSlides from './components/intro-slides/IntroSlides';
import { useEnforceVisibleLocale } from './i18n/useLanguageSelectorConfig';
import { useLocale } from './i18n';

import LoginLoadingPage from './pages/login/LoginPageLoader/LoginLoader';

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
const FullApp = lazyWithRetry(() => import('./FullApp'));
const history = createBrowserHistory();

initAppPlatform();

const App: React.FC = () => {
    // Subscribe at the application boundary so catalog-backed data getters
    // rerender even when their leaf component does not consume locale context.
    useLocale();

    // Keep the active locale within the LaunchDarkly-allowed set (falls a hidden
    // locale back to a visible one). Must run unconditionally, above the
    // intro-slides early return, since hooks can't sit behind a conditional.
    useEnforceVisibleLocale();
    useIntroSlidesCompleted();
    const introSlidesCompleted = firstStartupStore.get.introSlidesCompleted();
    const isLoggedIn = useIsLoggedIn();
    const isNativePlatform = Capacitor?.isNativePlatform() ?? false;
    // If the user has not completed the intro sliders then show them
    // If they have, then show the app as usual
    if (!introSlidesCompleted && !isLoggedIn && isNativePlatform) {
        return (
            <AppShellRouter history={history}>
                <AppRoot>
                    <IntroSlides />
                </AppRoot>
            </AppShellRouter>
        );
    } else {
        return <FullApp />;
    }
};

export default Sentry.withProfiler(App);
