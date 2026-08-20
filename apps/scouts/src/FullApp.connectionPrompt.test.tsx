// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const { coordinatorProps } = vi.hoisted(() => ({ coordinatorProps: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({ QueryClient: class QueryClient {} }));
vi.mock('@tanstack/react-query-persist-client', () => ({
    PersistQueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@tanstack/query-async-storage-persister', () => ({
    createAsyncStoragePersister: vi.fn(() => ({})),
}));
vi.mock('@ionic/react', () => ({
    IonApp: ({ children }: { children: React.ReactNode }) => children,
    setupIonicReact: vi.fn(),
}));
vi.mock('@ionic/react-router', () => ({
    IonReactRouter: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('learn-card-base', () => ({
    SCOUTPASS_API_ENDPOINT: '',
    SCOUTPASS_NETWORK_URL: '',
    SCOUTCLOUD_URL: '',
    networkStore: {
        set: { networkUrl: vi.fn(), cloudUrl: vi.fn(), apiEndpoint: vi.fn() },
    },
    sqliteInit: vi.fn(),
    useSQLiteInitWeb: vi.fn(),
    sqliteStore: { get: { db: () => null } },
    ensureReactQueryTableExists: vi.fn(),
    QRCodeScannerStore: { use: { showScanner: () => false } },
    lazyWithRetry: () => () => null,
    ModalsProvider: ({ children }: { children: React.ReactNode }) => children,
    ConnectionPromptCoordinator: (props: unknown) => {
        coordinatorProps(props);

        return <div data-testid="connection-prompt-coordinator" />;
    },
    Toast: () => null,
    PushNotificationListener: () => null,
    QRCodeScannerOverlay: () => null,
    InAppMessageHost: () => null,
}));

vi.mock('./pages/loadingPage/LoadingPage', () => ({ LoadingPageDumb: () => null }));
vi.mock('./providers/AuthCoordinatorProvider', () => ({
    AuthCoordinatorProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./i18n/SharedI18nProvider', () => ({
    SharedI18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./i18n/useSyncLocaleToProfile', () => ({ LocaleProfileSync: () => null }));
vi.mock('./components/debug/AuthKeyDebugWidget', () => ({ default: () => null }));
vi.mock('./components/app-url-listener/AppUrlListener', () => ({ default: () => null }));
vi.mock('./components/modalListener/ModalListener', () => ({ default: () => null }));
vi.mock('./components/qrcode-scanner-listener/QRCodeScannerListener', () => ({
    default: () => null,
}));
vi.mock('./components/network-listener/NetworkListener', () => ({ default: () => null }));
vi.mock('./components/user-profile/UserProfileSetupListener', () => ({ default: () => null }));
vi.mock('./paraglide/messages.js', () => ({
    'connectionPrompts.title': () => 'Connect with {name}?',
    'connectionPrompts.description': () => 'Description',
    'connectionPrompts.connect': () => 'Connect',
    'connectionPrompts.skipForNow': () => 'Skip for Now',
    'connectionPrompts.connecting': () => 'Connecting...',
    'connectionPrompts.skipping': () => 'Skipping...',
    'connectionPrompts.error': () => 'Error',
}));

import FullApp from './FullApp';

it('mounts one localized connection prompt coordinator in the ScoutPass shell', () => {
    render(<FullApp />);

    expect(screen.getAllByTestId('connection-prompt-coordinator')).toHaveLength(1);
    expect(coordinatorProps).toHaveBeenCalledOnce();
    const [{ copy }] = coordinatorProps.mock.calls[0] as [
        { copy: { title: (name: string) => string } }
    ];
    expect(copy.title('Alice')).toBe('Connect with Alice?');
});
