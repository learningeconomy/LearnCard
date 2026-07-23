import './constants/sentry';
import { LocaleProvider } from './i18n';
import { setTenantDefaultLocaleCache, setTenantSupportedLanguagesCache } from './i18n/detectLocale';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { asyncWithLDProvider, basicLogger } from 'launchdarkly-react-client-sdk';
import { TenantConfigProvider } from 'learn-card-base';
import { bootstrapTenantConfig } from './config/bootstrapTenantConfig';
import { getLaunchDarklyConfig } from './constants/runtimeLaunchDarkly';
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

    // Seed the locale-detection cache so the LocaleProvider's sync initializer
    // can fall through to the tenant default when no localStorage entry exists
    // and `navigator.language` isn't a supported locale. Must run BEFORE the
    // React tree mounts (resolveInitialLocale runs in useState init).
    setTenantDefaultLocaleCache(tenantConfig?.i18n?.defaultLanguage);
    setTenantSupportedLanguagesCache(tenantConfig?.i18n?.supportedLanguages);

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

    // Disable LaunchDarkly logging. In local development, bootstrap draft assistant
    // flags on so the page and debug tooling are available before LD has remote values.
    const ldOptions = {
        options: {
            logger: basicLogger({ level: 'none' }),
            ...(import.meta.env.DEV
                ? {
                      bootstrap: {
                          enableLearnCardAssistant: true,
                          enableLearnCardAssistantDebug: true,
                      },
                  }
                : {}),
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

    const LDProvider = await asyncWithLDProvider({
        ...getLaunchDarklyConfig(),
        ...ldOptions,
    });

    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(
            <TenantConfigProvider config={tenantConfig}>
                <LocaleProvider>
                    <LDProvider>
                        <App />
                    </LDProvider>
                </LocaleProvider>
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
