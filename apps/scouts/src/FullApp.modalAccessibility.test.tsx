// @vitest-environment jsdom

import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { Modals } from 'learn-card-base/components/modals/Modals';
import { ModalsProvider } from 'learn-card-base/components/modals/ModalsContext';
import { ModalTypes } from 'learn-card-base/components/modals/types/Modals';
import { useModal } from 'learn-card-base/components/modals/useModal';

const state = vi.hoisted(() => ({
    openPrompt: null as null | (() => void),
    openStacked: null as null | (() => void),
    closeAll: null as null | (() => void),
    skip: vi.fn<() => boolean | void | Promise<boolean | void>>(),
    closeStacked: vi.fn<() => boolean | void | Promise<boolean | void>>(),
}));

// AppModal's error boundary imports this one environment flag from the root barrel.
// Keep direct modal imports isolated from the rest of the application barrel in this test.
vi.mock('learn-card-base', () => ({ isLocalhost: false }));

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

const TestConnectionPromptCoordinator: React.FC<unknown> = props => {
    const { newModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    React.useLayoutEffect(() => {
        state.openPrompt = () =>
            newModal(
                <div>
                    <h2>Connect with Alice?</h2>
                    <button type="button">Connect</button>
                    <button type="button">Skip for Now</button>
                </div>,
                { hideButton: false, onClose: state.skip }
            );
        state.openStacked = () =>
            newModal(
                <div>
                    <h2>Stacked dialog</h2>
                    <button type="button">Stack action</button>
                </div>,
                { hideButton: false, onClose: state.closeStacked }
            );
        state.closeAll = closeAllModals;

        return () => {
            state.openPrompt = null;
            state.openStacked = null;
            state.closeAll = null;
        };
    }, [closeAllModals, newModal]);

    return <div data-testid="connection-prompt-coordinator" data-props-present={Boolean(props)} />;
};

const TestAppRouter: React.FC = () => (
    <>
        <main id="app-router">
            <button type="button" onClick={() => state.openPrompt?.()}>
                Open connection prompt
            </button>
            <button type="button">Background action</button>
        </main>
        <Modals />
    </>
);

vi.doMock('learn-card-base', () => ({
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
    lazyWithRetry: () => TestAppRouter,
    ModalsProvider,
    ConnectionPromptCoordinator: TestConnectionPromptCoordinator,
    Toast: () => null,
    PushNotificationListener: () => null,
    QRCodeScannerOverlay: () => null,
    InAppMessageHost: () => null,
}));

let FullApp: React.FC;

class NoopMutationObserver implements MutationObserver {
    constructor(_callback: MutationCallback) {}

    disconnect = (): void => {};
    observe = (): void => {};
    takeRecords = (): MutationRecord[] => [];
}

const deferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
};

const openPrompt = async (): Promise<{ trigger: HTMLButtonElement; dialog: HTMLElement }> => {
    const trigger = screen.getByRole('button', {
        name: 'Open connection prompt',
    }) as HTMLButtonElement;
    trigger.focus();

    await act(async () => {
        fireEvent.click(trigger);
        await Promise.resolve();
    });

    const dialog = document.querySelector<HTMLElement>('#center-modal.open');
    expect(dialog).not.toBeNull();

    return { trigger, dialog: dialog! };
};

const pressEscape = async (): Promise<void> => {
    await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
        await Promise.resolve();
    });
};

const getAccessibleName = (element: HTMLElement): string | null => {
    const labelledBy = element.getAttribute('aria-labelledby');

    return (
        element.getAttribute('aria-label') ??
        (labelledBy ? document.getElementById(labelledBy)?.textContent ?? null : null)
    );
};

describe('ScoutPass shared modal accessibility integration', () => {
    beforeAll(async () => {
        ({ default: FullApp } = await import('./FullApp'));
    });

    beforeEach(() => {
        vi.useFakeTimers();
        const portal = document.createElement('div');
        portal.id = 'modal-mid-root';
        document.body.appendChild(portal);
        vi.stubGlobal('MutationObserver', NoopMutationObserver);
        vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
            {} as DOMRect,
        ] as unknown as DOMRectList);
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
            window.setTimeout(() => callback(performance.now()), 0)
        );
        state.skip.mockReset().mockResolvedValue(true);
        state.closeStacked.mockReset().mockResolvedValue(true);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.getElementById('modal-mid-root')?.remove();
    });

    it('names the dialog, moves focus inside, traps Tab, and isolates the background', async () => {
        render(<FullApp />);
        const { dialog } = await openPrompt();

        expect(dialog.getAttribute('role')).toBe('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(getAccessibleName(dialog)).toBe('Connect with Alice?');
        expect(dialog.contains(document.activeElement)).toBe(true);
        expect(document.getElementById('app-router')?.hasAttribute('inert')).toBe(true);
        expect(document.getElementById('app-router')?.getAttribute('aria-hidden')).toBe('true');

        const first = dialog.querySelector<HTMLButtonElement>('.center-modal-x')!;
        const last = screen.getByRole('button', { name: 'Skip for Now' });
        last.focus();
        fireEvent.keyDown(document, { key: 'Tab' });
        expect(document.activeElement).toBe(first);

        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        expect(document.activeElement).toBe(last);
    });

    it('awaits Escape Skip, keeps rejection visible, then closes and restores focus on retry', async () => {
        const firstRequest = deferred<boolean>();
        const secondRequest = deferred<boolean>();
        state.skip
            .mockReturnValueOnce(firstRequest.promise)
            .mockReturnValueOnce(secondRequest.promise);
        render(<FullApp />);
        const { trigger, dialog } = await openPrompt();

        await pressEscape();
        await pressEscape();
        expect(state.skip).toHaveBeenCalledOnce();
        expect(dialog.classList.contains('open')).toBe(true);

        await act(async () => {
            firstRequest.reject(new Error('skip failed'));
            await firstRequest.promise.catch(() => undefined);
        });
        expect(dialog.classList.contains('open')).toBe(true);

        await pressEscape();
        expect(state.skip).toHaveBeenCalledTimes(2);
        expect(dialog.classList.contains('open')).toBe(true);

        await act(async () => {
            secondRequest.resolve(true);
            await secondRequest.promise;
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(document.querySelector('#center-modal')).toBeNull();
        expect(document.getElementById('app-router')?.hasAttribute('inert')).toBe(false);
        expect(document.getElementById('app-router')?.hasAttribute('aria-hidden')).toBe(false);
        expect(document.activeElement).toBe(trigger);
    });

    it('keeps Escape on the top modal and allows administrative close without Skip', async () => {
        render(<FullApp />);
        await openPrompt();
        await act(async () => {
            state.openStacked?.();
            await Promise.resolve();
        });

        const topDialog = Array.from(
            document.querySelectorAll<HTMLElement>('#center-modal.open')
        ).at(-1)!;
        expect(getAccessibleName(topDialog)).toBe('Stacked dialog');
        await pressEscape();

        expect(state.closeStacked).toHaveBeenCalledOnce();
        expect(state.skip).not.toHaveBeenCalled();
        expect(screen.getByText('Connect with Alice?')).toBeTruthy();

        await act(async () => {
            state.closeAll?.();
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(state.skip).not.toHaveBeenCalled();
        expect(document.querySelector('#center-modal')).toBeNull();
        expect(document.getElementById('app-router')?.hasAttribute('inert')).toBe(false);
    });
});
