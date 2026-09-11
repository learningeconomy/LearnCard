import React from 'react';
import { IonReactRouter } from '@ionic/react-router';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { IonApp, setupIonicReact } from '@ionic/react';

import { useIsLoggedIn, lazyWithRetry } from 'learn-card-base';

import firstStartupStore, {
    useIntroSlidesCompleted,
} from 'learn-card-base/stores/firstStartupStore';
import IntroSlides from './components/intro-slides/IntroSlides';
import { useEnforceVisibleLocale } from './i18n/useLanguageSelectorConfig';
import { useLocale } from './i18n';

import LoginLoadingPage from './pages/login/LoginPageLoader/LoginLoader';

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
import './index.scss';

// base styles of swiper js
import 'swiper/css';
import '@ionic/react/css/ionic-swiper.css';
const FullApp = lazyWithRetry(() => import('./FullApp'));

setupIonicReact({ swipeBackEnabled: false });

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
            <IonReactRouter>
                <IonApp>
                    <IntroSlides />
                </IonApp>
            </IonReactRouter>
        );
    } else {
        return <FullApp />;
    }
};

export default Sentry.withProfiler(App);
