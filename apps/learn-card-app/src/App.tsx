import React, { useRef, lazy } from 'react';

import { createBrowserHistory } from 'history';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import IntroSlides from './components/intro-slides/IntroSlides';
import { IonApp, setupIonicReact } from '@ionic/react';

import {
    LEARNCARD_NETWORK_URL,
    networkStore,
    LCA_API_ENDPOINT,
    LEARNCLOUD_URL,
} from 'learn-card-base';
import firstStartupStore, {
    useIntroSlidesCompleted,
} from 'learn-card-base/stores/firstStartupStore';
import { Capacitor } from '@capacitor/core';

import { useIsLoggedIn } from 'learn-card-base';
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
import { lazyWithRetry } from 'learn-card-base';

const history = createBrowserHistory();

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

setupIonicReact({ swipeBackEnabled: false });

const currentNetworkUrl = networkStore.get.networkUrl();
const currentCloudUrl = networkStore.get.cloudUrl();
const currentApiEndpoint = networkStore.get.apiEndpoint();

if (!currentNetworkUrl) networkStore.set.networkUrl(LEARNCARD_NETWORK_URL);
if (!currentCloudUrl) networkStore.set.cloudUrl(LEARNCLOUD_URL);
if (!currentApiEndpoint) networkStore.set.apiEndpoint(LCA_API_ENDPOINT);

// Dynamically import the component
const LazyFullApp = lazyWithRetry(() => import('./FullApp'));

const App: React.FC = () => {
    useIntroSlidesCompleted();
    const introSlidesCompleted = firstStartupStore.get.introSlidesCompleted();
    const isLoggedIn = useIsLoggedIn();
    const isNativePlatform = Capacitor?.isNativePlatform() ?? false;
    // If the user has not completed the intro sliders then show them
    // If they have, then show the app as usual
    if (!introSlidesCompleted && !isLoggedIn && isNativePlatform) {
        return (
            <IonReactRouter history={history}>
                <IonApp>
                    <IntroSlides />
                </IonApp>
            </IonReactRouter>
        );
    } else {
        return <LazyFullApp />;
    }
};

export default Sentry.withProfiler(App);
