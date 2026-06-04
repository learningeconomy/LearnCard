import './constants/sentry';
import './i18n'; // side-effect init — must run before render for synchronous EN resources
import { upgradeToNativeLocale } from './i18n';
import { setTenantDefaultLocaleCache } from './i18n/detectLocale';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { asyncWithLDProvider, basicLogger } from 'launchdarkly-react-client-sdk';
import { LAUNCH_DARKLY_CONFIG } from './constants/launchDarkly';
import { TenantConfigProvider } from 'learn-card-base';
import { bootstrapTenantConfig } from './config/bootstrapTenantConfig';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import App from './App';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import * as Sentry from '@sentry/browser';

(window as any).Buffer = Buffer;

(async () => {
    // Resolve and bootstrap TenantConfig before anything else.
    // This sets up Firebase, auth config, network store, Sentry, and Userflow.
    const tenantConfig = await bootstrapTenantConfig();

    // Seed the locale-detection cache so the sync chain in i18n init can fall
    // through to the tenant default when neither localStorage nor
    // navigator.language land on a supported locale. i18next already
    // initialized synchronously above (side-effect import) using just
    // localStorage + navigator; we add the tenant fallback + native-locale
    // upgrade here, after bootstrap.
    setTenantDefaultLocaleCache(tenantConfig?.i18n?.defaultLanguage);

    // Async upgrade: on iOS/Android, Capacitor `Device.getLanguageCode()` is
    // the most accurate signal. Run it now and switch i18next to that locale
    // if the user hasn't manually picked anything yet.
    void upgradeToNativeLocale();

    if (Capacitor.isNativePlatform()) {
        try {
            // notifyAppReady
            const capGoApp = await CapacitorUpdater.notifyAppReady();
            const capGoBundle = capGoApp.bundle;
            if (capGoBundle.version !== 'builtin' && capGoBundle?.version?.trim?.() !== '') {
                firstStartupStore.set.version(capGoBundle.version);
                Sentry.setTag('packageVersion', capGoBundle.version);
            }
        } catch {
            // non-blocking
        }
    }
    
    // Disable LaunchDarkly logging
    const ldOptions = {
        options: {
            logger: basicLogger({ level: 'none' }),
        },
    };

    // Splash screen is now hidden by AppRouter once auth state is settled
    // (capacitor.config.ts has launchAutoHide=false). This bridges the native
    // splash → final screen with no JS-side loader flashes for authenticated
    // users on cold start. A 10s fallback below ensures the splash is never
    // stuck if React fails to mount or auth init hangs unrecoverably.
    if (Capacitor.isNativePlatform()) {
        setTimeout(() => {
            SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
        }, 10_000);
    }

    const LDProvider = await asyncWithLDProvider({ ...LAUNCH_DARKLY_CONFIG, ...ldOptions });

    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(
            <TenantConfigProvider config={tenantConfig}>
                <I18nextProvider i18n={i18n}>
                    <LDProvider>
                        <App />
                    </LDProvider>
                </I18nextProvider>
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
