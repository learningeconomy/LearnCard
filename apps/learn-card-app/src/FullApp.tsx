import React, { useRef, Suspense } from 'react';
import { createBrowserHistory } from 'history';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import useFeedbackWidget from './hooks/useFeedbackWidget';
import { IonApp } from '@ionic/react';
import { LoadingPageDumb } from './pages/loadingPage/LoadingPage';

import AppRouter from './AppRouter';
import {
    useInitLoading,
    sqliteInit,
    PushNotificationListener,
    QRCodeScannerOverlay,
    ModalsProvider,
    useSQLiteInitWeb,
    sqliteStore,
    ensureReactQueryTableExists,
} from 'learn-card-base';

import AppUrlListener from './components/app-url-listener/AppUrlListener';
import PresentVcModalListener from './components/modalListener/ModalListener';
import QRCodeScannerListener from './components/qrcode-scanner-listener/QRCodeScannerListener';
import NetworkListener from './components/network-listener/NetworkListener';
import { QRCodeScannerStore } from 'learn-card-base';
import { ToastProvider } from 'learn-card-base/hooks/useToast';

import ExternalAuthServiceProvider from './pages/sync-my-school/ExternalAuthServiceProvider';
import localforage from 'localforage';

const history = createBrowserHistory();

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

const persister = createAsyncStoragePersister({
    storage: {
        getItem: async key => {
            try {
                const db = sqliteStore.get.db();

                if (!db) return localforage.getItem(key);

                await ensureReactQueryTableExists(db);

                // Check if DB is already open before opening
                const isOpen = await db.isDBOpen();
                if (!isOpen.result) {
                    await db.open();
                }

                const result = await db.query(`SELECT cache FROM reactQuery WHERE id="${key}";`);

                // Only close if we opened it
                if (!isOpen.result) {
                    await db.close();
                }

                if (result.values?.length === 0) return;

                return result.values![0].cache;
            } catch (error) {
                console.error('Error getting from cache', { key, error });
                // Fallback to localforage on error
                return localforage.getItem(key);
            }
        },
        setItem: async (key, value) => {
            try {
                const db = sqliteStore.get.db();

                if (!db) return localforage.setItem(key, value);

                await ensureReactQueryTableExists(db);

                // Check if DB is already open before opening
                const isOpen = await db.isDBOpen();
                if (!isOpen.result) {
                    await db.open();
                }

                await db.executeSet([
                    {
                        statement:
                            'INSERT INTO reactQuery (id, cache) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET cache=excluded.cache;',
                        values: [key, value],
                    },
                ]);

                // Only close if we opened it
                if (!isOpen.result) {
                    await db.close();
                }
            } catch (error) {
                console.error('Error setting in cache', { key, value, error });
                // Fallback to localforage on error
                try {
                    return localforage.setItem(key, value);
                } catch (fallbackError) {
                    console.error('Fallback cache error', fallbackError);
                }
            }
        },
        removeItem: async key => {
            try {
                const db = sqliteStore.get.db();

                if (!db) {
                    await localforage.removeItem(key);
                    return;
                }

                await ensureReactQueryTableExists(db);

                // Check if DB is already open before opening
                const isOpen = await db.isDBOpen();
                if (!isOpen.result) {
                    await db.open();
                }

                await db.execute(`DELETE FROM reactQuery WHERE id="${key}";`);

                // Only close if we opened it
                if (!isOpen.result) {
                    await db.close();
                }
            } catch (error) {
                console.error('Error removing from cache', { key, error });
                // Fallback to localforage on error
                try {
                    await localforage.removeItem(key);
                } catch (fallbackError) {
                    console.error('Fallback cache removal error', fallbackError);
                }
            }
        },
    },
});

const FullApp: React.FC = () => {
    useSQLiteInitWeb(); // initializes SQLite on web
    sqliteInit(); // initializes SQLite on native
    const initLoading = useInitLoading();
    const showScannerOverlay = QRCodeScannerStore?.use?.showScanner();
    const buttonRef = useRef(null);
    const isSentryEnabled = SENTRY_ENV && SENTRY_ENV !== 'development';

    useFeedbackWidget({ buttonRef });

    return (
        <PersistQueryClientProvider
            client={client}
            persistOptions={{ persister, maxAge: CACHE_TTL }}
        >
            <div className="app-bar-top relative top-0 left-0 w-full z-[9999] bg-black" />
            {/* <ReactQueryDevtools /> */}
            <IonReactRouter history={history}>
                <Suspense fallback={<LoadingPageDumb />}>
                    <ExternalAuthServiceProvider>
                        <ToastProvider>
                            <ModalsProvider>
                                <IonApp>
                                    <div id="modal-mid-root"></div>
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
                                </IonApp>
                            </ModalsProvider>
                        </ToastProvider>
                    </ExternalAuthServiceProvider>
                </Suspense>
            </IonReactRouter>
        </PersistQueryClientProvider>
    );
};

export default FullApp;
