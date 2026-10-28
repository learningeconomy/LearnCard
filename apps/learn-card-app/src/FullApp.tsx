import React, { Suspense, useEffect } from 'react';
import { InAppMessagesAnalyticsHost } from './analytics/InAppMessagesAnalyticsHost';
import { SharedI18nProvider } from './i18n/SharedI18nProvider';
import { createBrowserHistory } from 'history';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { connectivityStore, networkStore } from 'learn-card-base';
import {
    isLikelyTransportError,
    observeConnectionQuality,
    CONNECTIVITY_PROBE_PATH,
} from 'learn-card-base';
import { IonApp } from '@ionic/react';
import { LoadingPageDumb } from './pages/loadingPage/LoadingPage';

import AppRouter from './AppRouter';
import NativeDigitalCredentialsListener from './native-digital-credentials/NativeDigitalCredentialsListener';
import {
    sqliteInit,
    PushNotificationListener,
    QRCodeScannerOverlay,
    ModalsProvider,
    useSQLiteInitWeb,
    ConnectionPromptCoordinator,
} from 'learn-card-base';
import * as m from './paraglide/messages.js';
import AppUrlListener from './components/app-url-listener/AppUrlListener';
import PresentVcModalListener from './components/modalListener/ModalListener';
import QRCodeScannerListener from './components/qrcode-scanner-listener/QRCodeScannerListener';
import NetworkListener from './components/network-listener/NetworkListener';
import {
    getAppConnectivityMonitor,
    requestConnectivityCheck,
} from './components/network-listener/connectivity';
import CredentialSyncListener from './components/credential-sync-listener/CredentialSyncListener';
import CredentialRefreshListener from './components/credential-refresh-listener/CredentialRefreshListener';
import NotificationToastListener from './components/notification-toast-listener/NotificationToastListener';
import PathwayProgressReactorMount from './pages/pathways/events/PathwayProgressReactorMount';
import { installPathwaysDevGlobals } from './pages/pathways/dev/pathwaysDevGlobals';
import { QRCodeScannerStore } from 'learn-card-base';
import Toast from 'learn-card-base/components/toast/Toast';
import ModalAccessibilityManager from 'learn-card-base/components/modals/ModalAccessibilityManager';
import { getConnectionPromptCopy } from './helpers/connectionPromptCopy';

// Install `window.__pathwaysDev` at the app-root level rather than
// waiting for the /pathways shell to mount. The dev-panel inspector
// expects these globals to be available on any route (including the
// `/claim/...` landing surface, the app-store, credential detail,
// etc.) so developers can run `__pathwaysDev.inspectPathway()` /
// `listDispatches()` to debug pathway-progress dispatches without
// first having to navigate to /pathways.
//
// The installer is idempotent + guarded by `import.meta.env.DEV`,
// so this is a no-op in production builds. See
// `src/pages/pathways/dev/pathwaysDevGlobals.ts`.
installPathwaysDevGlobals();

import { AnalyticsContextProvider } from '@analytics';
import SdkActivityIndicator from './components/sdk-activity/SdkActivityIndicator';
import ExternalAuthServiceProvider from './pages/sync-my-school/ExternalAuthServiceProvider';
import AuthCoordinatorProvider from './providers/AuthCoordinatorProvider';
import { FeedbackProvider } from './feedback/reporting';
import { useInitializeTheme } from './theme/hooks/useTheme';
import type { LearnCardAppEnvironment } from './config/buildEnvironment';
import { persister } from './helpers/queryPersistence';

declare const __APP_BUILD_ENV__: LearnCardAppEnvironment;

const DevDebugPanel =
    __APP_BUILD_ENV__.DEV || __APP_BUILD_ENV__.VITE_ENABLE_AUTH_DEBUG_WIDGET
        ? React.lazy(() => import('./components/debug/DevDebugPanel'))
        : null;

const history = createBrowserHistory();

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

// Drive React Query's online state from our connectivity model (fed by
// Capacitor Network on native) instead of the default `navigator.onLine`, which
// is unreliable in the Android webview. This makes every query refetch on
// reconnect and mutations resume — so data that went stale offline (feature
// flags, notifications, etc.) reloads automatically when connectivity returns.
onlineManager.setEventListener(setOnline => {
    setOnline(connectivityStore.get.status() !== 'offline');

    const unsubscribe = connectivityStore.store.subscribe(({ status }) => {
        setOnline(status !== 'offline');
    });

    return unsubscribe;
});

// --- Advisory transport-error evidence (LC-2182) -------------------------
//
// React Query cache errors that pass a deliberately NARROW transport
// classification (see `isLikelyTransportError` — browser fetch failures only;
// NEVER 401/403/4xx/5xx, cancellations, or arbitrary application errors) feed
// instability evidence into the quality policy and trigger a rate-limited,
// coalesced reachability probe. `queryCache.subscribe` is additive — existing
// cache callbacks are preserved. A successful probe says nothing about
// brain-service health; classification stays conservative on purpose.
const TRANSPORT_SAMPLE_MIN_INTERVAL_MS = 2_000; // dedupe React Query retry bursts
const TRANSPORT_PROBE_MIN_INTERVAL_MS = 10_000; // rate-limit the reachability probe
let lastTransportSampleAt = 0;
let lastTransportProbeAt = 0;

// TanStack Query v5: `client.queryCache` was removed — `getQueryCache()` is
// the accessor, and its typed `subscribe` keeps existing cache callbacks
// intact (purely additive).
client.getQueryCache().subscribe(event => {
    if (event.type !== 'updated' || event.action.type !== 'error') return;
    if (!isLikelyTransportError(event.action.error)) return;

    const monitor = getAppConnectivityMonitor();
    if (!monitor.getState().foreground || (typeof document !== 'undefined' && document.hidden)) {
        return;
    }
    const now = Date.now();
    if (now - lastTransportSampleAt >= TRANSPORT_SAMPLE_MIN_INTERVAL_MS) {
        lastTransportSampleAt = now;
        monitor.reportSample({ at: now, ok: false });
    }

    // No probes from the background, and never more than one per interval.
    if (now - lastTransportProbeAt < TRANSPORT_PROBE_MIN_INTERVAL_MS) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    lastTransportProbeAt = now;
    void requestConnectivityCheck().catch(() => undefined);
});

/**
 * Passive quality evidence from REAL requests: Resource Timing for the
 * configured first-party API origins (brain service + LearnCloud). Adds no
 * traffic, patches nothing; unsupported engines get a safe no-op. Native
 * webview support must be manually verified on device.
 */
const firstPartyApiOrigins = (): string[] => {
    const origins = new Set<string>();
    for (const url of [
        networkStore.get.networkUrl(),
        networkStore.get.networkApiUrl(),
        networkStore.get.cloudUrl(),
        networkStore.get.xapiUrl(),
    ]) {
        try {
            origins.add(new URL(url).origin);
        } catch {
            // Skip malformed entries; store values are tenant-config driven.
        }
    }
    return [...origins];
};

const ThemeInitializer: React.FC = () => {
    useInitializeTheme();

    return null;
};

const FullApp: React.FC = () => {
    useSQLiteInitWeb(); // initializes SQLite on web
    sqliteInit(); // initializes SQLite on native
    const showScannerOverlay = QRCodeScannerStore.useTracked.showScanner();
    const scannerMode = QRCodeScannerStore.useTracked.mode();
    const isRecipientScanner = scannerMode === 'recipient';

    // Passive first-party latency evidence for the advisory slow/unstable
    // warning. The reachability probe itself is excluded (it is monitored
    // directly); only completed, non-HTTP-error, foreground entries count.
    // Foreground transitions are pushed to the observer so requests that
    // STARTED before the current foreground stretch (i.e. spanning a
    // background period) are excluded instead of faking slow samples.
    useEffect(() => {
        // Tenant bootstrap finishes before mount. Runtime dev endpoint switches
        // require a reload to refresh these advisory observation origins.
        const origins = firstPartyApiOrigins();
        if (origins.length === 0) return;

        const monitor = getAppConnectivityMonitor();
        const observer = observeConnectionQuality({
            origins,
            excludePathnames: [CONNECTIVITY_PROBE_PATH],
            isForeground: () =>
                monitor.getState().foreground &&
                (typeof document === 'undefined' || !document.hidden),
            onForegroundChange: listener => {
                let foreground = monitor.getState().foreground;
                return monitor.subscribe(snapshot => {
                    if (snapshot.foreground === foreground) return;
                    foreground = snapshot.foreground;
                    listener(foreground);
                });
            },
            onSample: sample => {
                getAppConnectivityMonitor().reportSample(sample);
            },
        });

        return () => observer?.disconnect();
    }, []);

    return (
        <PersistQueryClientProvider
            client={client}
            persistOptions={{ persister, maxAge: CACHE_TTL }}
        >
            <AnalyticsContextProvider>
                <div className="app-bar-top relative top-0 left-0 w-full z-[9999] bg-black" />
                {/* <ReactQueryDevtools /> */}
                <IonReactRouter history={history}>
                    <Suspense fallback={<LoadingPageDumb />}>
                        <AuthCoordinatorProvider>
                            <ThemeInitializer />
                            <ExternalAuthServiceProvider>
                                <ModalsProvider>
                                    <IonApp>
                                        <div id="modal-mid-root"></div>
                                        <ModalAccessibilityManager />
                                        <Toast />
                                        <SdkActivityIndicator />
                                        <NetworkListener />
                                        <AppUrlListener />
                                        <PushNotificationListener />
                                        <PresentVcModalListener />
                                        <CredentialSyncListener />
                                        <NativeDigitalCredentialsListener />
                                        {/* Foreground refresh of stale refreshable
                                            credentials; gated by the LaunchDarkly
                                            credentialRefreshForegroundEnabled flag. */}
                                        <CredentialRefreshListener />
                                        <NotificationToastListener />
                                        <ConnectionPromptCoordinator
                                            copy={getConnectionPromptCopy()}
                                        />
                                        {/* Subscribes the pathway-progress reactor to
                                            the wallet event bus. Placed alongside the
                                            other app-level listeners so every claim
                                            and session-end event — wherever it's
                                            published — flows through one reactor. */}
                                        <PathwayProgressReactorMount />
                                        <FeedbackProvider>
                                            <AppRouter />
                                        </FeedbackProvider>
                                        <SharedI18nProvider>
                                            <InAppMessagesAnalyticsHost />
                                        </SharedI18nProvider>
                                        <QRCodeScannerListener />

                                        {showScannerOverlay && (
                                            <QRCodeScannerOverlay
                                                title={
                                                    isRecipientScanner
                                                        ? m['scanner.profileTitle']()
                                                        : m['scanner.title']()
                                                }
                                                description={
                                                    isRecipientScanner
                                                        ? m['scanner.profileDescription']()
                                                        : m['scanner.description']()
                                                }
                                                frameLabel={m['scanner.frameLabel']()}
                                                searchingLabel={m['scanner.lookingForQr']()}
                                                helperLabel={
                                                    isRecipientScanner
                                                        ? m['scanner.recipientAutoAdd']()
                                                        : undefined
                                                }
                                                closeLabel={m['scanner.closeAria']()}
                                            />
                                        )}

                                        {DevDebugPanel && (
                                            <Suspense fallback={null}>
                                                <DevDebugPanel />
                                            </Suspense>
                                        )}
                                    </IonApp>
                                </ModalsProvider>
                            </ExternalAuthServiceProvider>
                        </AuthCoordinatorProvider>
                    </Suspense>
                </IonReactRouter>
            </AnalyticsContextProvider>
        </PersistQueryClientProvider>
    );
};

export default FullApp;
