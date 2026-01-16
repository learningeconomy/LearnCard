import React, { useRef, Suspense } from 'react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { IonApp, setupIonicReact } from '@ionic/react';
import { LoadingPageDumb } from './pages/loadingPage/LoadingPage';

const AppRouter = lazyWithRetry(() => import('./AppRouter'));

import {
    useInitLoading,
    sqliteInit,
    QRCodeScannerOverlay,
    PushNotificationListener,
    SCOUTPASS_NETWORK_URL,
    networkStore,
    SCOUTPASS_API_ENDPOINT,
    useIsLoggedIn,
    SCOUTCLOUD_URL,
    sqliteStore,
    ensureReactQueryTableExists,
    ModalsProvider,
    useSQLiteInitWeb,
    lazyWithRetry,
    Toast,
} from 'learn-card-base';
import AppUrlListener from './components/app-url-listener/AppUrlListener';
import useFeedbackWidget from './hooks/useFeedbackWidget';
import PresentVcModalListener from './components/modalListener/ModalListener';
import QRCodeScannerListener from './components/qrcode-scanner-listener/QRCodeScannerListener';
import NetworkListener from './components/network-listener/NetworkListener';
import { QRCodeScannerStore } from 'learn-card-base';

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

const persister = createAsyncStoragePersister({
    storage: {
        getItem: async key => {
            const db = sqliteStore.get.db();

            if (!db) return;

            await ensureReactQueryTableExists(db);

            await db.open();

            const result = await db.query(`SELECT cache FROM reactQuery WHERE id="${key}";`);

            await db.close();

            if (result.values?.length === 0) return;

            return result.values![0].cache;
        },
        setItem: async (key, value) => {
            const db = sqliteStore.get.db();

            if (!db) return;

            await ensureReactQueryTableExists(db);

            await db.open();
            await db.executeSet([
                {
                    statement:
                        'INSERT INTO reactQuery (id, cache) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET cache=excluded.cache;',
                    values: [key, value],
                },
            ]);

            await db.close();
        },
        removeItem: async key => {
            const db = sqliteStore.get.db();

            if (!db) return;

            await ensureReactQueryTableExists(db);

            await db.open();

            await db.execute(`DELETE FROM reactQuery WHERE id="${key}";`);

            await db.close();
        },
    },
});

setupIonicReact({ swipeBackEnabled: false });

networkStore.set.networkUrl(SCOUTPASS_NETWORK_URL);
networkStore.set.cloudUrl(SCOUTCLOUD_URL);
networkStore.set.apiEndpoint(SCOUTPASS_API_ENDPOINT);

const FullApp: React.FC = () => {
    useSQLiteInitWeb(); // initializes SQLite on web
    sqliteInit(); // initializes SQLite on native
    const initLoading = useInitLoading();
    const showScannerOverlay = QRCodeScannerStore?.use?.showScanner();
    const buttonRef = useRef(null);
    const isSentryEnabled = SENTRY_ENV && SENTRY_ENV !== 'scouts-development';
    useFeedbackWidget({ buttonRef });

    return (
        <PersistQueryClientProvider
            client={client}
            persistOptions={{ persister, maxAge: CACHE_TTL }}
        >
            <div className="app-bar-top relative top-0 left-0 w-full z-[9999] bg-black" />
            <IonReactRouter>
                <Suspense fallback={<LoadingPageDumb />}>
                    <IonApp>
                        <ModalsProvider>
                            <div id="modal-mid-root"></div>
                            <Toast />
                            <NetworkListener />
                            <AppUrlListener />
                            <PushNotificationListener />
                            <PresentVcModalListener />
                            {/* <UserProfileSetupListener loading={initLoading} /> */}
                            <AppRouter initLoading={initLoading} />
                            <QRCodeScannerListener />
                            {showScannerOverlay && <QRCodeScannerOverlay />}
                            {isSentryEnabled && (
                                <button
                                    className="sentry-feedback-widget-btn z-[99999999999999]"
                                    ref={buttonRef}
                                >
                                    <p>Feedback</p>
                                </button>
                            )}
                        </ModalsProvider>
                    </IonApp>
                </Suspense>
            </IonReactRouter>
        </PersistQueryClientProvider>
    );
};

export default FullApp;
