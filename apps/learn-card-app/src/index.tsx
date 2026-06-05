import './constants/sentry';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { LDProvider, basicLogger } from 'launchdarkly-react-client-sdk';
import { LAUNCH_DARKLY_CONFIG } from './constants/launchDarkly';
import { TenantConfigProvider } from 'learn-card-base';
import { bootstrapTenantConfigSync } from './config/bootstrapTenantConfig';
import App from './App';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import * as Sentry from '@sentry/browser';

(window as any).Buffer = Buffer;

const notifyCapGoAppReady = (): void => {
    CapacitorUpdater.notifyAppReady()
        .then(capGoApp => {
            const capGoBundle = capGoApp.bundle;
            if (capGoBundle.version !== 'builtin' && capGoBundle?.version?.trim?.() !== '') {
                firstStartupStore.set.version(capGoBundle.version);
                Sentry.setTag('packageVersion', capGoBundle.version);
            }
        })
        .catch(() => undefined);
};

(() => {
    // Resolve TenantConfig synchronously (cache/default) so React mounts
    // immediately; the authoritative config is fetched and reconciled in the
    // background. Sets up Firebase, auth config, network store, Sentry, Userflow.
    const tenantConfig = bootstrapTenantConfigSync();

    // AppRouter hides the native splash once auth state settles
    // (capacitor.config.ts has launchAutoHide=false). This outer fallback only
    // fires if React fails to mount or auth init hangs unrecoverably.
    if (Capacitor.isNativePlatform()) {
        notifyCapGoAppReady();
        setTimeout(() => {
            SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
        }, 6_000);
    }

    // Synchronous <LDProvider> (not awaited asyncWithLDProvider) keeps the LD
    // network round-trip off the render-blocking path: the app mounts
    // immediately and useFlags() returns defaults until LD streams real flags.
    const ldConfig = {
        ...LAUNCH_DARKLY_CONFIG,
        options: { logger: basicLogger({ level: 'none' }) },
    };

    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(
            <TenantConfigProvider config={tenantConfig}>
                <LDProvider {...ldConfig}>
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
