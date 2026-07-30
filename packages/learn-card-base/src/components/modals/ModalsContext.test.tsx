// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ModalTypes } from './types/Modals';
import { ModalsProvider, useModalsContext } from './ModalsContext';
import { useModal } from './useModal';

const ModalHarness: React.FC = () => {
    const { modals } = useModalsContext();
    const { newModal, replaceModal } = useModal();
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
            <output data-testid="modal-count">{modals.length}</output>
            <output data-testid="modal-type">{currentModal?.type.desktop ?? ''}</output>
            <output data-testid="modal-id">{currentModal?.id ?? ''}</output>
        </>
    );
};

describe('ModalsProvider', () => {
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
});
