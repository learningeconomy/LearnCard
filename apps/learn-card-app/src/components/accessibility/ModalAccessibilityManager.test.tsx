import React, { act, useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Modals } from 'learn-card-base/components/modals/Modals';
import { ModalsProvider, useModalsContext } from 'learn-card-base/components/modals/ModalsContext';
import { useModal } from 'learn-card-base/components/modals/useModal';

import ModalAccessibilityManager from './ModalAccessibilityManager';

vi.mock('learn-card-base', async () => {
    const context = await import('learn-card-base/components/modals/ModalsContext');

    return {
        useModalActionsContext: context.useModalActionsContext,
        useModalsContext: context.useModalsContext,
    };
});

const state = vi.hoisted(() => ({
    onUserClose: vi.fn<() => boolean | void | Promise<boolean | void>>(),
}));

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

const ModalHarness: React.FC = () => {
    const { modals } = useModalsContext();
    const { newModal, replaceModal, forceCloseModalById, closeAllModals } = useModal();
    const ownedModalIdRef = useRef<number | null>(null);
    const openModals = modals.filter(modal => modal.open);

    return (
        <main id="app-router">
            <button
                type="button"
                onClick={() => {
                    ownedModalIdRef.current = newModal(<h2>Owned prompt</h2>, {
                        hideButton: false,
                        onClose: state.onUserClose,
                    });
                }}
            >
                Open Owned
            </button>
            <button type="button" onClick={() => newModal(<h2>Replacement modal</h2>)}>
                Open Replacement
            </button>
            <button type="button" onClick={() => replaceModal(<h2>Replacement modal</h2>)}>
                Replace Owned
            </button>
            <button
                type="button"
                onClick={() => {
                    if (ownedModalIdRef.current !== null) {
                        forceCloseModalById(ownedModalIdRef.current);
                    }
                }}
            >
                Force Close Owned
            </button>
            <button type="button" onClick={closeAllModals}>
                Close All
            </button>
            <output data-testid="open-modal-ids">
                {openModals.map(modal => modal.id).join(',')}
            </output>
            <output data-testid="modal-count">{modals.length}</output>
        </main>
    );
};

const renderModalHarness = () => {
    const portal = document.createElement('div');
    portal.id = 'modal-mid-root';
    document.body.appendChild(portal);

    return render(
        <ModalsProvider>
            <ModalAccessibilityManager />
            <ModalHarness />
            <Modals />
        </ModalsProvider>
    );
};

const clickHarnessButton = async (name: string): Promise<void> => {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name, hidden: true }));
        await Promise.resolve();
    });
};

const pressEscape = async (): Promise<void> => {
    await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
        await Promise.resolve();
    });
};

const advanceCloseAnimation = async (): Promise<void> => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
    });
};

describe('ModalAccessibilityManager Escape lifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('MutationObserver', NoopMutationObserver);
        state.onUserClose.mockReset().mockResolvedValue(true);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        document.getElementById('modal-mid-root')?.remove();
    });

    it('keeps the owned modal open while its deferred user close settles', async () => {
        const request = deferred<boolean>();
        state.onUserClose.mockReturnValue(request.promise);
        renderModalHarness();
        await clickHarnessButton('Open Owned');

        await pressEscape();

        expect(state.onUserClose).toHaveBeenCalledOnce();
        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('0');
        expect(screen.getByRole('heading', { name: 'Owned prompt' })).toBeVisible();

        await act(async () => {
            request.resolve(true);
            await request.promise;
        });

        expect(screen.getByTestId('open-modal-ids')).toBeEmptyDOMElement();
        await advanceCloseAnimation();
        expect(screen.getByTestId('modal-count')).toHaveTextContent('0');
    });

    it('keeps the modal open and invokes a deferred false veto only once', async () => {
        const request = deferred<boolean>();
        state.onUserClose.mockReturnValue(request.promise);
        renderModalHarness();
        await clickHarnessButton('Open Owned');

        await pressEscape();
        await pressEscape();
        await act(async () => {
            request.resolve(false);
            await request.promise;
        });

        expect(state.onUserClose).toHaveBeenCalledOnce();
        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('0');
        expect(screen.getByRole('heading', { name: 'Owned prompt' })).toBeVisible();
    });

    it('keeps the modal open when user close rejects', async () => {
        const request = deferred<boolean>();
        state.onUserClose.mockReturnValue(request.promise);
        renderModalHarness();
        await clickHarnessButton('Open Owned');

        await pressEscape();
        await act(async () => {
            request.reject(new Error('skip failed'));
            await request.promise.catch(() => undefined);
        });

        expect(state.onUserClose).toHaveBeenCalledOnce();
        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('0');
        expect(screen.getByRole('heading', { name: 'Owned prompt' })).toBeVisible();
    });

    it('closes only the owned modal after a successful async settlement', async () => {
        const request = deferred<boolean>();
        state.onUserClose.mockReturnValue(request.promise);
        renderModalHarness();
        await clickHarnessButton('Open Owned');
        await pressEscape();

        await clickHarnessButton('Open Replacement');
        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('0,1');

        await act(async () => {
            request.resolve(true);
            await request.promise;
        });

        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('1');
        expect(screen.getByRole('heading', { name: 'Replacement modal' })).toBeVisible();
        await advanceCloseAnimation();
        expect(screen.getByTestId('modal-count')).toHaveTextContent('1');
    });

    it('force closes for viewer teardown and closeAllModals without a user mutation', async () => {
        renderModalHarness();
        await clickHarnessButton('Open Owned');
        await clickHarnessButton('Force Close Owned');

        expect(state.onUserClose).not.toHaveBeenCalled();
        await advanceCloseAnimation();

        await clickHarnessButton('Open Owned');
        await clickHarnessButton('Close All');

        expect(state.onUserClose).not.toHaveBeenCalled();
        await advanceCloseAnimation();
        expect(screen.getByTestId('modal-count')).toHaveTextContent('0');
    });

    it('does not close a replacement when stale async user close settles', async () => {
        const request = deferred<boolean>();
        state.onUserClose.mockReturnValue(request.promise);
        renderModalHarness();
        await clickHarnessButton('Open Owned');
        await pressEscape();

        await clickHarnessButton('Force Close Owned');
        await clickHarnessButton('Open Replacement');

        await act(async () => {
            request.resolve(true);
            await request.promise;
        });
        await advanceCloseAnimation();

        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('1');
        expect(screen.getByRole('heading', { name: 'Replacement modal' })).toBeVisible();
    });

    it('does not close content that replaces the pending modal instance', async () => {
        const request = deferred<boolean>();
        state.onUserClose.mockReturnValue(request.promise);
        renderModalHarness();
        await clickHarnessButton('Open Owned');
        await pressEscape();

        await clickHarnessButton('Replace Owned');
        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('0');
        expect(screen.getByRole('heading', { name: 'Replacement modal' })).toBeVisible();

        await act(async () => {
            request.resolve(true);
            await request.promise;
        });
        await advanceCloseAnimation();

        expect(screen.getByTestId('open-modal-ids')).toHaveTextContent('0');
        expect(screen.getByTestId('modal-count')).toHaveTextContent('1');
        expect(screen.getByRole('heading', { name: 'Replacement modal' })).toBeVisible();
    });
});
