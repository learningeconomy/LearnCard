// First: replace Capacitor's payload-logging bridge hooks before any plugin call.
import './nativeBridgeLogging';
import './constants/sentry';
import { LocaleProvider, resolveInitialLocale } from './i18n';
import { loadLocaleMessages } from './i18n/localeMessages';
import { setTenantDefaultLocaleCache, setTenantSupportedLanguagesCache } from './i18n/detectLocale';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { LDProvider } from 'launchdarkly-react-client-sdk';
import { TenantConfigProvider, renderConfigurationError } from 'learn-card-base';
import { registerExternalUrlOpener } from 'learn-card-base/helpers/externalUrlOpener';
// Registers the Firebase provider initializer before bootstrapTenantConfig() runs it.
import './auth/firebaseProviderInit';
import { bootstrapTenantConfig } from './config/bootstrapTenantConfig';
import { applyNativeViewportRestrictions } from './helpers/applyNativeViewportRestrictions';
import { getLaunchDarklyProviderProps } from './constants/runtimeLaunchDarkly';
import App from './App';
import { markStartupPhase } from './helpers/startupDiagnostics';
import { prewarmDidKit } from 'learn-card-base/helpers/didkitPrewarm';
import { startNativeSQLiteInit } from 'learn-card-base/hooks/useSQLiteStorage';
import { loadDeferredFontStylesheets } from './deferredFontStylesheets';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import { installInsetSimulator } from 'learn-card-base/dev/simulateInsets';
import * as Sentry from '@sentry/browser';

const browserGlobals = window as Window & { Buffer: typeof Buffer };
browserGlobals.Buffer = Buffer;

applyNativeViewportRestrictions(Capacitor.isNativePlatform());

// Dev-only: simulate device safe-area insets via ?insets so band bugs are
// visible on desktop. Must run before React renders (sets CSS vars on <html>).
installInsetSimulator();

markStartupPhase('entry');

// Warm DIDKit's WASM while tenant config and flags load; the wallet build awaits the same init.
prewarmDidKit();

// Open native SQLite now, not after the lazy app shell's first commit: the cached-key read that
// gates auth:coordinator_ready waits for it. No-op on web; sqliteInit() joins or retries it.
startNativeSQLiteInit();

(async () => {
    // Native analytics can collect independently of React. On web this call
    // would itself initialize analytics through getAnalytics().
    if (Capacitor.isNativePlatform()) {
        await FirebaseAnalytics.setEnabled({ enabled: false }).catch(() => undefined);
    }
    // Route external links through Capacitor's in-app browser when running natively.
    registerExternalUrlOpener();

    // Resolve and bootstrap TenantConfig before anything else.
    // This sets up Firebase, auth config, network store, Sentry, and Userflow.
    const tenantConfig = await bootstrapTenantConfig();
    markStartupPhase('tenant');

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

    markStartupPhase('updater');

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

    // LaunchDarkly does not gate the first render (see getLaunchDarklyProviderProps).
    // The mark keeps startup timings on the same phase names.
    markStartupPhase('flags');

    // Production builds split non-base locales out of the startup bundle: load the one the first
    // render uses (no-op for the base locale and in dev). On failure, render with base strings.
    await loadLocaleMessages(resolveInitialLocale()).catch(() => undefined);

    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        markStartupPhase('react');
        root.render(
            <TenantConfigProvider config={tenantConfig}>
                <LocaleProvider>
                    <LDProvider {...getLaunchDarklyProviderProps()}>
                        <App />
                    </LDProvider>
                </LocaleProvider>
            </TenantConfigProvider>
        );
    }

    // Fonts the first screen does not use load after the first render is queued, off the critical path.
    loadDeferredFontStylesheets();

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://cra.link/PWA
    serviceWorkerRegistration.unregister();

    // If you want to start measuring performance in your app, pass a function
    // to log results (for example: reportWebVitals(console.log))
    // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
    reportWebVitals();
})().catch(error => {
    renderConfigurationError(error);
    SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => undefined);
});
