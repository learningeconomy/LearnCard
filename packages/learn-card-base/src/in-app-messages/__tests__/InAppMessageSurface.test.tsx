// @vitest-environment jsdom
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inAppMessageValidator } from '@learncard/types';
import { ModalsProvider, useModalsContext } from '../../components/modals/ModalsContext';
import { useModal } from '../../components/modals/useModal';
import { InAppMessageSurface } from '../InAppMessageSurface';

afterEach(cleanup);
const onShown = vi.fn();
const onClose = vi.fn();

const Harness: React.FC<{ required?: boolean }> = ({ required = false }) => {
    const { modals } = useModalsContext();
    const { newModal, requestCloseModal, closeAllModals, forceCloseModal } = useModal();
    const [visible, setVisible] = useState(true);
    const [title, setTitle] = useState('First title');
    const message = inAppMessageValidator.parse({
        id: 'owned',
        title,
        presentation: 'story',
        dismissible: !required,
        steps: [{ title }],
        actions: [{ label: 'Continue', action: { type: 'dismiss' } }],
    });
    return (
        <>
            <button onClick={closeAllModals}>Close all</button>
            <button onClick={forceCloseModal}>Force close</button>
            <button onClick={() => setTitle('Translated title')}>Translate</button>
            <button onClick={() => newModal(<h2>Other modal</h2>)}>Open other</button>
            <button onClick={() => setVisible(false)}>Hide host</button>
            <button onClick={() => void requestCloseModal()}>Request close</button>
            {visible && (
                <InAppMessageSurface message={message} onShown={onShown} onClose={onClose}>
                    <h2>{title}</h2>
                </InAppMessageSurface>
            )}
            {modals
                .filter(modal => modal.open)
                .map(modal => (
                    <section key={modal.id} data-testid="surface">
                        {modal.component}
                    </section>
                ))}
        </>
    );
};

describe('token-owned presentation surface', () => {
    it('updates live content without reopening and cleans up only its own modal', async () => {
        onShown.mockClear();
        render(
            <ModalsProvider>
                <Harness />
            </ModalsProvider>
        );
        await screen.findByText('First title');
        expect(onShown).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByText('Translate'));
        expect(screen.getByText('Translated title')).toBeTruthy();
        expect(onShown).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByText('Open other'));
        expect(screen.getAllByTestId('surface')).toHaveLength(2);
        fireEvent.click(screen.getByText('Hide host'));
        await waitFor(() => expect(screen.queryByText('Translated title')).toBeNull());
        expect(screen.getByText('Other modal')).toBeTruthy();
    });
    it.each(['Close all', 'Force close'])(
        'notifies the host once when its dismissible surface is removed: %s',
        async control => {
            onClose.mockClear();
            render(
                <ModalsProvider>
                    <Harness />
                </ModalsProvider>
            );
            await screen.findByText('First title');
            fireEvent.click(screen.getByText(control));
            await waitFor(() => expect(onClose).toHaveBeenCalledExactlyOnceWith('expired'));
        }
    );
    it('restores a required surface after a bulk close without remounting its content', async () => {
        onClose.mockClear();
        onShown.mockClear();
        render(
            <ModalsProvider>
                <Harness required />
            </ModalsProvider>
        );
        const content = await screen.findByText('First title');
        fireEvent.click(screen.getByText('Close all'));
        await waitFor(() => expect(screen.queryByText('First title')).toBeNull());
        await waitFor(() => expect(screen.getByText('First title')).toBe(content));
        expect(onShown).toHaveBeenCalledOnce();
        expect(onClose).not.toHaveBeenCalled();
    });
    it('vetoes passive close for required messages', async () => {
        onClose.mockClear();
        render(
            <ModalsProvider>
                <Harness required />
            </ModalsProvider>
        );
        await screen.findByText('First title');
        fireEvent.click(screen.getByText('Request close'));
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByText('First title')).toBeTruthy();
    });
});
