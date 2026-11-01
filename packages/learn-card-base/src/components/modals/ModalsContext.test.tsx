// @vitest-environment jsdom

import React, { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ModalTypes } from './types/Modals';
import { ModalsProvider, useModalsContext } from './ModalsContext';
import { useModal } from './useModal';

const cleanupCallback = vi.fn<() => boolean>();

const ModalHarness: React.FC = () => {
    const { modals } = useModalsContext();
    const { newModal, replaceModal, closeModal, forceCloseModal } = useModal();
    const currentModal = modals.at(-1);

    return (
        <>
            <button
                type="button"
                onClick={() =>
                    newModal(<div>Initial modal</div>, undefined, {
                        desktop: ModalTypes.Right,
                        mobile: ModalTypes.Right,
                    })
                }
            >
                Open
            </button>
            <button
                type="button"
                onClick={() =>
                    replaceModal(
                        <div>Replacement modal</div>,
                        { hideButton: true },
                        { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                    )
                }
            >
                Replace
            </button>
            <button
                type="button"
                onClick={() =>
                    newModal(<div>Cleanup modal</div>, {
                        onClose: cleanupCallback,
                    })
                }
            >
                Open Cleanup
            </button>
            <button type="button" onClick={closeModal}>
                Close Programmatically
            </button>
            <button type="button" onClick={forceCloseModal}>
                Force Close
            </button>
            <output data-testid="modal-count">{modals.length}</output>
            <output data-testid="open-modal-count">
                {modals.filter(modal => modal.open).length}
            </output>
            <output data-testid="modal-type">{currentModal?.type.desktop ?? ''}</output>
            <output data-testid="modal-id">{currentModal?.id ?? ''}</output>
        </>
    );
};

const ownedModal = <div>Owned feedback modal</div>;
const unrelatedModal = <div>Unrelated modal</div>;

const TargetedCloseHarness: React.FC = () => {
    const { modals } = useModalsContext();
    const { newModal, closeModalById } = useModal();
    const ownedId = React.useRef<number | undefined>(undefined);

    return (
        <>
            <button type="button" onClick={() => (ownedId.current = newModal(ownedModal))}>
                Open owned
            </button>
            <button type="button" onClick={() => newModal(unrelatedModal)}>
                Open unrelated
            </button>
            <button
                type="button"
                onClick={() => {
                    if (ownedId.current !== undefined) closeModalById(ownedId.current);
                }}
            >
                Close owned
            </button>
            <output data-testid="owned-open">
                {String(modals.find(modal => modal.id === ownedId.current)?.open)}
            </output>
            <output data-testid="unrelated-open">
                {String(modals.find(modal => modal.component === unrelatedModal)?.open)}
            </output>
        </>
    );
};

const CloseAllButton: React.FC = () => {
    const { closeAllModals } = useModal();
    return <button onClick={closeAllModals}>Close All</button>;
};

const CloseDuringLifecycle: React.FC<{ phase: 'mount' | 'unmount' }> = ({ phase }) => {
    const { closeAllModals } = useModal();
    React.useEffect(() => {
        if (phase === 'mount') closeAllModals();
        return () => {
            if (phase === 'unmount') closeAllModals();
        };
    }, [phase, closeAllModals]);
    return null;
};

describe('ModalsProvider', () => {
    beforeEach(() => {
        cleanupCallback.mockReset().mockReturnValue(false);
    });

    it('closes a specified modal without closing an unrelated modal above it', () => {
        render(
            <ModalsProvider>
                <TargetedCloseHarness />
            </ModalsProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open owned' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open unrelated' }));
        fireEvent.click(screen.getByRole('button', { name: 'Close owned' }));

        expect(screen.getByTestId('owned-open').textContent).toBe('false');
        expect(screen.getByTestId('unrelated-open').textContent).toBe('true');
    });

    it('replaces the current modal component and type without changing the stack', () => {
        render(
            <ModalsProvider>
                <ModalHarness />
            </ModalsProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open' }));

        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(screen.getByTestId('modal-type').textContent).toBe(ModalTypes.Right);
        expect(screen.getByTestId('modal-id').textContent).toBe('0');

        fireEvent.click(screen.getByRole('button', { name: 'Replace' }));

        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(screen.getByTestId('modal-type').textContent).toBe(ModalTypes.FullScreen);
        expect(screen.getByTestId('modal-id').textContent).toBe('0');
    });

    it('preserves closeModal callback cleanup even when the callback returns false', () => {
        render(
            <ModalsProvider>
                <ModalHarness />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open Cleanup' }));

        fireEvent.click(screen.getByRole('button', { name: 'Close Programmatically' }));

        expect(cleanupCallback).toHaveBeenCalledOnce();
        expect(screen.getByTestId('open-modal-count').textContent).toBe('0');
    });

    it('force closes administratively without invoking callback cleanup', () => {
        render(
            <ModalsProvider>
                <ModalHarness />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open Cleanup' }));

        fireEvent.click(screen.getByRole('button', { name: 'Force Close' }));

        expect(cleanupCallback).not.toHaveBeenCalled();
        expect(screen.getByTestId('open-modal-count').textContent).toBe('0');
    });

    it.each(['Close Programmatically', 'Force Close', 'Close All'])(
        'cancels only its own pending removal on unmount after %s',
        async closeAction => {
            vi.useFakeTimers();
            try {
                const unrelated = vi.fn();
                setTimeout(unrelated, 500);
                const view = render(
                    <ModalsProvider>
                        <ModalHarness />
                        <CloseAllButton />
                    </ModalsProvider>
                );
                fireEvent.click(screen.getByRole('button', { name: 'Open' }));
                fireEvent.click(screen.getByRole('button', { name: closeAction }));
                expect(vi.getTimerCount()).toBe(2);

                view.unmount();
                // A removal callback must not reach React after jsdom/provider teardown.
                expect(vi.getTimerCount()).toBe(1);
                await act(async () => {
                    await vi.advanceTimersByTimeAsync(500);
                });
                expect(unrelated).toHaveBeenCalledOnce();
            } finally {
                vi.clearAllTimers();
                vi.useRealTimers();
            }
        }
    );

    it('does not create a late removal when a child closes during unmount cleanup', () => {
        vi.useFakeTimers();
        try {
            const view = render(
                <ModalsProvider>
                    <CloseDuringLifecycle phase="unmount" />
                </ModalsProvider>
            );
            view.unmount();
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    });

    it('allows child effect closes after StrictMode lifetime replay', () => {
        vi.useFakeTimers();
        try {
            const view = render(
                <React.StrictMode>
                    <ModalsProvider>
                        <CloseDuringLifecycle phase="mount" />
                    </ModalsProvider>
                </React.StrictMode>
            );
            expect(vi.getTimerCount()).toBe(1);
            view.unmount();
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    });

    it('cancels every pending removal when several modals close before unmount', () => {
        vi.useFakeTimers();
        try {
            const view = render(
                <React.StrictMode>
                    <ModalsProvider>
                        <ModalHarness />
                    </ModalsProvider>
                </React.StrictMode>
            );
            for (let i = 0; i < 2; i++) {
                fireEvent.click(screen.getByRole('button', { name: 'Open' }));
                fireEvent.click(screen.getByRole('button', { name: 'Force Close' }));
            }
            expect(vi.getTimerCount()).toBeGreaterThanOrEqual(2);
            view.unmount();
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    });

    it('does not replace a closing modal or leak it past scheduled removal', async () => {
        vi.useFakeTimers();
        try {
            render(
                <ModalsProvider>
                    <ModalHarness />
                </ModalsProvider>
            );
            fireEvent.click(screen.getByRole('button', { name: 'Open' }));
            fireEvent.click(screen.getByRole('button', { name: 'Close Programmatically' }));
            fireEvent.click(screen.getByRole('button', { name: 'Replace' }));

            await act(async () => {
                await vi.advanceTimersByTimeAsync(300);
            });

            expect(screen.getByTestId('modal-count').textContent).toBe('0');
            expect(screen.getByTestId('open-modal-count').textContent).toBe('0');
        } finally {
            vi.useRealTimers();
        }
    });
});
