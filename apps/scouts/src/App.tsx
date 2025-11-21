import React from 'react';
import { IonReactRouter } from '@ionic/react-router';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { IonApp, setupIonicReact } from '@ionic/react';

import {
    SCOUTPASS_NETWORK_URL,
    networkStore,
    SCOUTPASS_API_ENDPOINT,
    useIsLoggedIn,
    SCOUTCLOUD_URL,
    lazyWithRetry,
} from 'learn-card-base';

import firstStartupStore, {
    useIntroSlidesCompleted,
} from 'learn-card-base/stores/firstStartupStore';
import IntroSlides from './components/intro-slides/IntroSlides';

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
import '@learncard/react/dist/main.css';
import './index.scss';

// base styles of swiper js
import 'swiper/swiper.min.css';
import '@ionic/react/css/ionic-swiper.css';
const FullApp = lazyWithRetry(() => import('./FullApp'));

setupIonicReact({ swipeBackEnabled: false });

networkStore.set.networkUrl(SCOUTPASS_NETWORK_URL);
networkStore.set.cloudUrl(SCOUTCLOUD_URL);
networkStore.set.apiEndpoint(SCOUTPASS_API_ENDPOINT);

const App: React.FC = () => {
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
