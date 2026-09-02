// @vitest-environment jsdom

import React from 'react';
import { readFileSync } from 'fs';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

const { coordinatorProps } = vi.hoisted(() => ({ coordinatorProps: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({
    QueryClient: class QueryClient {},
    onlineManager: { setEventListener: vi.fn() },
}));

vi.mock('@tanstack/react-query-persist-client', () => ({
    PersistQueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@tanstack/query-async-storage-persister', () => ({
    createAsyncStoragePersister: vi.fn(() => ({})),
}));

vi.mock('@ionic/react', () => ({
    IonApp: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@ionic/react-router', () => ({
    IonReactRouter: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('learn-card-base/components/modals/ModalAccessibilityManager', () => ({
    default: () => <div data-testid="modal-accessibility-manager" />,
}));

vi.mock('history', () => ({ createBrowserHistory: vi.fn(() => ({})) }));

vi.mock('learn-card-base', () => ({
    connectivityStore: {
        get: { status: () => 'online' },
        store: { subscribe: vi.fn(() => vi.fn()) },
    },
    sqliteInit: vi.fn(),
    useSQLiteInitWeb: vi.fn(),
    sqliteStore: { get: { db: () => null } },
    ensureReactQueryTableExists: vi.fn(),
    getLogger: () => ({ error: vi.fn() }),
    QRCodeScannerStore: {
        useTracked: {
            showScanner: () => false,
            mode: () => 'default',
        },
    },
    ModalsProvider: ({ children }: { children: React.ReactNode }) => children,
    ConnectionPromptCoordinator: (props: unknown) => {
        coordinatorProps(props);

        return <div data-testid="connection-prompt-coordinator" />;
    },
    PushNotificationListener: () => null,
    QRCodeScannerOverlay: () => null,
    InAppMessageHost: () => null,
}));

vi.mock('learn-card-base/components/toast/Toast', () => ({ default: () => null }));
vi.mock('./AppRouter', () => ({ default: () => null }));
vi.mock('./pages/loadingPage/LoadingPage', () => ({ LoadingPageDumb: () => null }));
vi.mock('./components/app-url-listener/AppUrlListener', () => ({ default: () => null }));
vi.mock('./components/modalListener/ModalListener', () => ({ default: () => null }));
vi.mock('./components/qrcode-scanner-listener/QRCodeScannerListener', () => ({
    default: () => null,
}));
vi.mock('./components/network-listener/NetworkListener', () => ({ default: () => null }));
vi.mock('./components/credential-sync-listener/CredentialSyncListener', () => ({
    default: () => null,
}));
vi.mock('./components/notification-toast-listener/NotificationToastListener', () => ({
    default: () => null,
}));
vi.mock('./pages/pathways/events/PathwayProgressReactorMount', () => ({ default: () => null }));
vi.mock('./pages/pathways/dev/pathwaysDevGlobals', () => ({
    installPathwaysDevGlobals: vi.fn(),
}));
vi.mock('@analytics', () => ({
    AnalyticsContextProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./components/sdk-activity/SdkActivityIndicator', () => ({ default: () => null }));
vi.mock('./pages/sync-my-school/ExternalAuthServiceProvider', () => ({
    default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./components/debug/DevDebugPanel', () => ({ default: () => null }));
vi.mock('./providers/AuthCoordinatorProvider', () => ({
    default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./feedback/reporting', () => ({
    FeedbackProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('./theme/hooks/useTheme', () => ({ useInitializeTheme: vi.fn() }));
vi.mock('./paraglide/messages.js', () => ({
    'connectionPrompts.title': ({ name }: { name: string }) => `Connect with ${name}?`,
    'connectionPrompts.description': () => 'Description',
    'connectionPrompts.connect': () => 'Connect',
    'connectionPrompts.skipForNow': () => 'Skip for Now',
    'connectionPrompts.connecting': () => 'Connecting...',
    'connectionPrompts.skipping': () => 'Skipping...',
    'connectionPrompts.error': () => 'Error',
    'connectionPrompts.connected': () => 'Connected',
    'connectionPrompts.skipped': () => 'Skipped',
    'connectionPrompts.claimedType': () => 'Credential claimed',
}));

import FullApp from './FullApp';

it('mounts one localized connection prompt coordinator in the app shell', () => {
    render(<FullApp />);

    expect(screen.getAllByTestId('connection-prompt-coordinator')).toHaveLength(1);
    expect(coordinatorProps).toHaveBeenCalledOnce();
    const [{ copy }] = coordinatorProps.mock.calls[0] as [
        { copy: { title: (name: string) => string } }
    ];
    expect(copy.title('Alice')).toBe('Connect with Alice?');
});

it('mounts exactly one shared modal accessibility manager in the app shell', () => {
    const fullAppSource = readFileSync(`${process.cwd()}/src/FullApp.tsx`, 'utf8');
    const appRouterSource = readFileSync(`${process.cwd()}/src/AppRouter.tsx`, 'utf8');

    expect([
        ...fullAppSource.matchAll(/<ModalAccessibilityManager\s*\/>/g),
        ...appRouterSource.matchAll(/<ModalAccessibilityManager\s*\/>/g),
    ]).toHaveLength(1);
    render(<FullApp />);
    expect(screen.getAllByTestId('modal-accessibility-manager')).toHaveLength(1);
});
