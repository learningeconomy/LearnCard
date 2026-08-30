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

describe('ModalsProvider', () => {
    beforeEach(() => {
        cleanupCallback.mockReset().mockReturnValue(false);
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
