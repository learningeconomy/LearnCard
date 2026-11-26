import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppPopover } from './AppPopover';
import { AppToast } from './AppToast';
import type { OverlayDismissEvent } from './overlayStack';

let ionApp: HTMLElement;

beforeEach(() => {
    ionApp = document.createElement('ion-app');
    ionApp.innerHTML = '<div id="ion-view-container-root"></div>';
    document.body.appendChild(ionApp);
});

afterEach(() => {
    cleanup();
    ionApp.remove();
    document.body.className = '';
    document.documentElement.removeAttribute('mode');
});

const root = () => document.getElementById('ion-view-container-root') as HTMLElement;
const host = () => document.querySelector<HTMLElement>('.app-popover');

const Harness: React.FC<{
    onWillDismiss?: (e: OverlayDismissEvent) => void;
    onDidDismiss?: (e: OverlayDismissEvent) => void;
    backdropDismiss?: boolean;
    dismissOnSelect?: boolean;
}> = ({ onWillDismiss, onDidDismiss, backdropDismiss, dismissOnSelect }) => {
    const [open, setOpen] = useState(false);
    const [event, setEvent] = useState<Event | undefined>();
    return (
        <>
            <button
                type="button"
                onClick={e => {
                    setEvent(e.nativeEvent);
                    setOpen(true);
                }}
            >
                Open
            </button>
            <button type="button" onClick={() => setOpen(false)}>
                Close
            </button>
            <AppPopover
                isOpen={open}
                event={event}
                reference="event"
                side="bottom"
                alignment="end"
                backdropDismiss={backdropDismiss}
                dismissOnSelect={dismissOnSelect}
                className="share-menu"
                style={{ '--width': '304px' } as React.CSSProperties}
                onWillDismiss={onWillDismiss}
                onDidDismiss={e => {
                    setOpen(false);
                    onDidDismiss?.(e);
                }}
            >
                <button type="button">First</button>
                <button type="button">Second</button>
            </AppPopover>
        </>
    );
};

const openPopover = async () => {
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    fireEvent.click(opener);
    await waitFor(() => expect(document.activeElement).toBe(host()));
    return opener;
};

describe('AppPopover', () => {
    it('mounts its content in ion-app only while open, hiding the page from assistive tech', async () => {
        render(<Harness />);
        expect(host()).toBeNull();
        expect(screen.queryByText('First')).toBeNull();

        await openPopover();
        const el = host() as HTMLElement;
        expect(el.parentElement).toBe(ionApp);
        expect(el.className).toBe(
            'app-popover md app-popover-desktop app-popover-side-bottom share-menu'
        );
        expect(el).toHaveAttribute('aria-modal', 'true');
        expect(el).toHaveAttribute('tabindex', '-1');
        expect(el.style.getPropertyValue('--width')).toBe('304px');
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(root()).toHaveAttribute('aria-hidden', 'true');
        expect(document.body).toHaveClass('backdrop-no-scroll');
    });

    it('dismisses on Escape with the backdrop role and restores focus to the opener', async () => {
        const onWillDismiss = vi.fn();
        const onDidDismiss = vi.fn();
        render(<Harness onWillDismiss={onWillDismiss} onDidDismiss={onDidDismiss} />);
        const opener = await openPopover();

        fireEvent.keyDown(host() as HTMLElement, { key: 'Escape' });

        await waitFor(() => expect(host()).toBeNull());
        expect(onWillDismiss.mock.calls[0][0].detail).toEqual({
            data: undefined,
            role: 'backdrop',
        });
        expect(onDidDismiss.mock.calls[0][0].detail).toEqual({ data: undefined, role: 'backdrop' });
        expect(root()).not.toHaveAttribute('aria-hidden');
        expect(document.body).not.toHaveClass('backdrop-no-scroll');
        await waitFor(() => expect(document.activeElement).toBe(opener));
    });

    it('keeps Escape from reaching document listeners registered after it (Ionic overlays underneath)', async () => {
        const ionicListener = vi.fn();
        document.addEventListener('keydown', ionicListener);
        render(<Harness />);
        await openPopover();

        fireEvent.keyDown(host() as HTMLElement, { key: 'Escape' });
        await waitFor(() => expect(host()).toBeNull());
        expect(ionicListener).not.toHaveBeenCalled();

        fireEvent.keyDown(document.body, { key: 'Escape' });
        expect(ionicListener).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', ionicListener);
    });

    it('dismisses on a backdrop click unless backdropDismiss is false', async () => {
        const onDidDismiss = vi.fn();
        const { unmount } = render(<Harness backdropDismiss={false} onDidDismiss={onDidDismiss} />);
        await openPopover();
        fireEvent.click(host()?.querySelector('.app-backdrop') as Element);
        fireEvent.keyDown(host() as HTMLElement, { key: 'Escape' });
        await new Promise(r => setTimeout(r, 50));
        expect(host()).not.toBeNull();
        expect(host()?.querySelector('.app-backdrop')).toHaveClass('app-backdrop-no-tappable');
        unmount();
        expect(root()).not.toHaveAttribute('aria-hidden');

        render(<Harness onDidDismiss={onDidDismiss} />);
        await openPopover();
        fireEvent.click(host()?.querySelector('.app-backdrop') as Element);
        await waitFor(() => expect(host()).toBeNull());
        expect(onDidDismiss.mock.calls[0][0].detail.role).toBe('backdrop');
    });

    it('closes when isOpen turns false, and on a content click with dismissOnSelect', async () => {
        const onDidDismiss = vi.fn();
        const { unmount } = render(<Harness onDidDismiss={onDidDismiss} />);
        await openPopover();
        // The backdrop covers the page in a browser; here the Close button is reachable directly.
        act(() => screen.getByRole('button', { name: 'Close' }).click());
        await waitFor(() => expect(host()).toBeNull());
        expect(onDidDismiss.mock.calls[0][0].detail.role).toBeUndefined();
        unmount();

        render(<Harness dismissOnSelect />);
        await openPopover();
        fireEvent.click(screen.getByText('Second'));
        await waitFor(() => expect(host()).toBeNull());
    });

    it('traps focus: focus leaving the popover moves to its first focusable', async () => {
        render(<Harness />);
        const opener = await openPopover();
        act(() => opener.focus());
        expect(document.activeElement).toBe(screen.getByText('First'));
    });

    it('wraps Tab from its last focusable back to the first (nothing follows the portal)', async () => {
        render(<Harness />);
        await openPopover();
        const second = screen.getByText('Second');
        act(() => second.focus());
        const tab = fireEvent.keyDown(second, { key: 'Tab' });
        expect(tab).toBe(false);
        expect(document.activeElement).toBe(screen.getByText('First'));
        // Shift+Tab and Tab from other elements are left to the browser.
        expect(fireEvent.keyDown(screen.getByText('First'), { key: 'Tab' })).toBe(true);
        expect(fireEvent.keyDown(screen.getByText('First'), { key: 'Tab', shiftKey: true })).toBe(
            true
        );
    });

    it('opens from its trigger element and marks it', async () => {
        render(
            <>
                <button type="button" id="sort-trigger">
                    Sort
                </button>
                <AppPopover trigger="sort-trigger" reference="trigger">
                    <p>Sort options</p>
                </AppPopover>
            </>
        );
        const trigger = screen.getByRole('button', { name: 'Sort' });
        expect(trigger).toHaveAttribute('data-app-popover-trigger', 'true');
        fireEvent.click(trigger);
        expect(await screen.findByText('Sort options')).toBeInTheDocument();
        await waitFor(() => expect(document.activeElement).toBe(host()));
        fireEvent.keyDown(host() as HTMLElement, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByText('Sort options')).toBeNull());
    });

    it('uses the ios look and center alignment in ios mode', async () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(
            <AppPopover isOpen>
                <p>ios</p>
            </AppPopover>
        );
        await screen.findByText('ios');
        expect(host()).toHaveClass('ios');
        expect(host()?.querySelector('.app-popover-arrow')).not.toBeNull();
    });

    it('leaves Escape to a toast on top of it (Ionic: the top-most overlay is the toast)', async () => {
        const onDidDismiss = vi.fn();
        render(
            <>
                <AppPopover isOpen onDidDismiss={onDidDismiss}>
                    <p>under</p>
                </AppPopover>
                <AppToast isOpen message="Saved" />
            </>
        );
        await waitFor(() => expect(document.activeElement).toBe(host()));
        await waitFor(() =>
            expect(document.querySelector('.app-toast')).not.toHaveClass('app-overlay-hidden')
        );
        fireEvent.keyDown(host() as HTMLElement, { key: 'Escape' });
        await new Promise(r => setTimeout(r, 50));
        expect(onDidDismiss).not.toHaveBeenCalled();
        expect(host()).not.toHaveAttribute('aria-hidden');
    });
});
