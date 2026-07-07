import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk';
import { LAUNCH_DARKLY_CONFIG } from './constants/launchDarkly';
import { resolveTenantConfig, TenantConfigProvider } from 'learn-card-base';

import App from './App';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import * as Sentry from '@sentry/browser';
import { getLogger } from 'learn-card-base';
const log = getLogger('index');

(window as any).Buffer = Buffer;

(async () => {
    // notifyAppReady
    const capGoApp = await CapacitorUpdater.notifyAppReady();
    const capGoBundle = capGoApp.bundle;
    if (capGoBundle.version !== 'builtin' && capGoBundle?.version?.trim?.() !== '') {
        firstStartupStore.set.version(capGoBundle.version);
        Sentry.setTag('packageVersion', capGoBundle.version);
    }

    // notifyAppReady
    CapacitorUpdater.notifyAppReady();

    // initialize & hide splash screen
    SplashScreen.hide();

    const tenantConfig = await resolveTenantConfig();

    const LDProvider = await asyncWithLDProvider(LAUNCH_DARKLY_CONFIG);
    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(
            <TenantConfigProvider config={tenantConfig}>
                <LDProvider>
                    <App />
                </LDProvider>
            </TenantConfigProvider>
        );
    }
    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://cra.link/PWA
    serviceWorkerRegistration.unregister();

    // If you want to start measuring performance in your app, pass a function
    // to log results (for example: reportWebVitals(console.log))
    // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
    reportWebVitals();
})();
