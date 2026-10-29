import React, { Suspense } from 'react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { IonApp, setupIonicReact } from '@ionic/react';
import { LoadingPageDumb } from './pages/loadingPage/LoadingPage';

const AppRouter = lazyWithRetry(() => import('./AppRouter'));

import {
    sqliteInit,
    QRCodeScannerOverlay,
    PushNotificationListener,
    useIsLoggedIn,
    ModalsProvider,
    useSQLiteInitWeb,
    lazyWithRetry,
    Toast,
    InAppMessageHost,
} from 'learn-card-base';
import { AuthCoordinatorProvider } from './providers/AuthCoordinatorProvider';
import { SharedI18nProvider } from './i18n/SharedI18nProvider';
import { LocaleProfileSync } from './i18n/useSyncLocaleToProfile';
import AuthKeyDebugWidget from './components/debug/AuthKeyDebugWidget';
import AppUrlListener from './components/app-url-listener/AppUrlListener';
import PresentVcModalListener from './components/modalListener/ModalListener';
import QRCodeScannerListener from './components/qrcode-scanner-listener/QRCodeScannerListener';
import NetworkListener from './components/network-listener/NetworkListener';
import UserProfileSetupListener from './components/user-profile/UserProfileSetupListener';
import { QRCodeScannerStore } from 'learn-card-base';
import * as m from './paraglide/messages.js';
import { queryCacheStorage } from './helpers/queryPersistence';

const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 1 Week

const client = new QueryClient({ defaultOptions: { queries: { gcTime: CACHE_TTL } } });

const persister = createAsyncStoragePersister({
    storage: queryCacheStorage,
});

setupIonicReact({ swipeBackEnabled: false });

const FullApp: React.FC = () => {
    useSQLiteInitWeb(); // initializes SQLite on web
    sqliteInit(); // initializes SQLite on native
    const showScannerOverlay = QRCodeScannerStore?.use?.showScanner();

    return (
        <PersistQueryClientProvider
            client={client}
            persistOptions={{ persister, maxAge: CACHE_TTL }}
        >
            <div className="app-bar-top relative top-0 left-0 w-full z-[9999] bg-black" />
            <IonReactRouter>
                <Suspense fallback={<LoadingPageDumb />}>
                    <IonApp>
                        <SharedI18nProvider>
                            <AuthCoordinatorProvider>
                                <LocaleProfileSync />
                                <ModalsProvider>
                                    <div id="modal-mid-root"></div>
                                    <Toast />
                                    <NetworkListener />
                                    <AppUrlListener />
                                    <PushNotificationListener />
                                    <PresentVcModalListener />
                                    <UserProfileSetupListener />
                                    <AppRouter />
                                    <InAppMessageHost />
                                    <QRCodeScannerListener />
                                    {showScannerOverlay && (
                                        <QRCodeScannerOverlay
                                            title={m['scanner.title']()}
                                            description={m['scanner.description']()}
                                            frameLabel={m['scanner.frameLabel']()}
                                            searchingLabel={m['scanner.lookingForQr']()}
                                            closeLabel={m['scanner.closeAria']()}
                                        />
                                    )}
                                    <AuthKeyDebugWidget />
                                </ModalsProvider>
                            </AuthCoordinatorProvider>
                        </SharedI18nProvider>
                    </IonApp>
                </Suspense>
            </IonReactRouter>
        </PersistQueryClientProvider>
    );
};

export default FullApp;
