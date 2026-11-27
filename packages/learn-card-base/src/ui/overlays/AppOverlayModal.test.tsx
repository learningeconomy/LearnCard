import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppOverlayManager, resetManagedOverlaysForTests } from './AppOverlayManager';
import { AppOverlayModal } from './AppOverlayModal';
import { useAppOverlayModal } from './useAppOverlayModal';

let ionApp: HTMLElement;

beforeEach(() => {
    ionApp = Object.assign(document.createElement('div'), { className: 'app-root' });
    ionApp.innerHTML = '<div id="ion-view-container-root"></div>';
    document.body.appendChild(ionApp);
});

afterEach(() => {
    cleanup();
    resetManagedOverlaysForTests();
    ionApp.remove();
    document.body.className = '';
});

const host = () => document.querySelector<HTMLElement>('.app-modal');
const presented = async () => {
    await waitFor(() => expect(host()).toHaveClass('show-modal'));
    await waitFor(() => expect(host()).not.toHaveClass('app-overlay-hidden'));
    return host() as HTMLElement;
};

describe('AppOverlayModal', () => {
    it('renders a modal dialog in the app root with the cssClass, mode and show-modal classes', async () => {
        render(
            <AppOverlayModal isOpen mode="md" cssClass="center-modal user-options-modal">
                <div className="ion-page">
                    <button type="button">First</button>
                </div>
            </AppOverlayModal>
        );
        const el = await presented();
        expect(el.parentElement).toBe(ionApp);
        expect(el).toHaveClass('app-modal', 'center-modal', 'user-options-modal', 'md');
        expect(el).toHaveClass('modal-default');
        // Ionic components inside resolve their mode from the closest [mode] ancestor.
        expect(el).toHaveAttribute('mode', 'md');
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).not.toHaveAttribute('tabindex');
        expect(dialog.querySelector(':scope > .ion-page')).not.toBeNull();
        await waitFor(() => expect(document.activeElement).toBe(el));
        expect(document.getElementById('ion-view-container-root')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('dismisses on Escape with role backdrop unless backdropDismiss is false', async () => {
        const onDidDismiss = vi.fn();
        const { rerender } = render(
            <AppOverlayModal isOpen backdropDismiss={false} onDidDismiss={onDidDismiss}>
                <div className="ion-page" />
            </AppOverlayModal>
        );
        const el = await presented();
        fireEvent.keyDown(el, { key: 'Escape' });
        fireEvent.click(el.querySelector('.app-backdrop') as Element);
        await new Promise(r => setTimeout(r, 50));
        expect(onDidDismiss).not.toHaveBeenCalled();

        rerender(
            <AppOverlayModal isOpen onDidDismiss={onDidDismiss}>
                <div className="ion-page" />
            </AppOverlayModal>
        );
        fireEvent.keyDown(el, { key: 'Escape' });
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        expect(onDidDismiss.mock.calls[0][0].detail.role).toBe('backdrop');
        await waitFor(() => expect(host()).toBeNull());
    });

    it('renders a sheet with the drag handle, which cycles focus when handleBehavior is cycle', async () => {
        render(
            <AppOverlayModal
                isOpen
                breakpoints={[0, 0.8, 1]}
                initialBreakpoint={0.8}
                handleBehavior="cycle"
            >
                <div className="ion-page" />
            </AppOverlayModal>
        );
        const el = await presented();
        expect(el).toHaveClass('modal-sheet');
        const handle = screen.getByRole('button', {
            name: 'Activate to adjust the size of the dialog overlaying the screen',
        });
        expect(handle).toHaveAttribute('tabindex', '0');
        expect(el).toHaveAttribute('tabindex', '0');
        await waitFor(() => expect(document.activeElement).toBe(handle));
    });

    it('leaves focus on the host when a press on the content focuses it, so a drag can select text', async () => {
        render(
            <AppOverlayModal
                isOpen
                breakpoints={[0, 0.8, 1]}
                initialBreakpoint={0.8}
                handleBehavior="cycle"
            >
                <div className="ion-page">
                    <p>Search location</p>
                </div>
            </AppOverlayModal>
        );
        const el = await presented();
        const handle = screen.getByRole('button', {
            name: 'Activate to adjust the size of the dialog overlaying the screen',
        });
        await waitFor(() => expect(document.activeElement).toBe(handle));
        fireEvent.mouseDown(screen.getByText('Search location'));
        el.focus();
        expect(document.activeElement).toBe(el);
    });

    it('lets Tab leave from its last control, like ion-modal', async () => {
        render(
            <AppOverlayModal isOpen>
                <div className="ion-page">
                    <button type="button">Close</button>
                </div>
            </AppOverlayModal>
        );
        await presented();
        const close = screen.getByRole('button', { name: 'Close' });
        close.focus();
        const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        close.dispatchEvent(tab);
        expect(tab.defaultPrevented).toBe(false);
    });

    it('keeps ion-content inside it from claiming the main landmark', async () => {
        render(
            <AppOverlayModal isOpen>
                <div className="ion-page">
                    {React.createElement('ion-content', { role: 'main' })}
                </div>
            </AppOverlayModal>
        );
        await presented();
        await waitFor(() =>
            expect(document.querySelector('ion-content')).not.toHaveAttribute('role')
        );
    });
});

describe('useAppOverlayModal', () => {
    const Content: React.FC<{ label: string; onClose: () => void }> = ({ label, onClose }) => {
        const [mountId] = React.useState(() => Math.random());
        return (
            <button type="button" data-mount={mountId} onClick={onClose}>
                {label}
            </button>
        );
    };

    let api: ReturnType<typeof useAppOverlayModal>;
    const Caller: React.FC<{ label: string; onDidDismiss?: () => void }> = ({ label }) => {
        const props = React.useMemo(
            () => ({ label, onClose: () => api[1]({ ok: 1 }, 'confirm') }),
            [label]
        );
        api = useAppOverlayModal(Content, props);
        return null;
    };

    it('renders through AppOverlayManager in a .ion-page, updates props without remounting, and passes dismiss data', async () => {
        const onDidDismiss = vi.fn();
        const { rerender } = render(
            <>
                <Caller label="one" />
                <AppOverlayManager />
            </>
        );
        act(() => api[0]({ cssClass: 'generic-modal', onDidDismiss }));
        const el = await presented();
        expect(el).toHaveClass('generic-modal');
        const button = await screen.findByText('one');
        expect(button.closest('.ion-page')?.parentElement).toHaveClass('app-modal-wrapper');
        const mountId = button.dataset.mount;

        act(() => api[0]({ cssClass: 'second' }));
        expect(document.querySelectorAll('.app-modal')).toHaveLength(1);

        rerender(
            <>
                <Caller label="two" />
                <AppOverlayManager />
            </>
        );
        const updated = await screen.findByText('two');
        expect(updated.dataset.mount).toBe(mountId);

        fireEvent.click(updated);
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        expect(onDidDismiss.mock.calls[0][0].detail).toEqual({ data: { ok: 1 }, role: 'confirm' });
        await waitFor(() => expect(host()).toBeNull());
    });

    it('falls back to a detached root without a manager', async () => {
        render(<Caller label="alone" />);
        act(() => api[0]());
        await presented();
        expect(await screen.findByText('alone')).toBeInTheDocument();
        act(() => void api[1]());
        await waitFor(() => expect(host()).toBeNull());
    });

    it('keeps a modal re-presented inside onDidDismiss mounted after the previous cleanup', async () => {
        const onDidDismiss = vi.fn(() => {
            api[0]({ cssClass: 'second-modal' });
        });
        render(
            <>
                <Caller label="again" />
                <AppOverlayManager />
            </>
        );
        act(() => api[0]({ cssClass: 'first-modal', onDidDismiss }));
        await presented();
        expect(host()).toHaveClass('first-modal');

        fireEvent.click(await screen.findByText('again'));
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        await act(async () => {
            await new Promise(r => setTimeout(r, 0));
        });

        const el = await presented();
        expect(el).toHaveClass('second-modal');
        expect(el).not.toHaveClass('first-modal');
        expect(document.querySelectorAll('.app-modal')).toHaveLength(1);
        expect(await screen.findByText('again')).toBeInTheDocument();
    });
});
