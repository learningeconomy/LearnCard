import React from 'react';
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppToast } from './AppToast';
import { useAppToast } from './useAppToast';

let ionApp: HTMLElement;

beforeEach(() => {
    ionApp = Object.assign(document.createElement('div'), { className: 'app-root' });
    ionApp.innerHTML = '<div id="ion-view-container-root"></div>';
    document.body.appendChild(ionApp);
});

afterEach(() => {
    cleanup();
    ionApp.remove();
    document.documentElement.removeAttribute('mode');
});

const toasts = () => Array.from(document.querySelectorAll<HTMLElement>('.app-toast'));

describe('AppToast', () => {
    it('shows a colored message in a polite live region without hiding the page', async () => {
        render(
            <AppToast
                isOpen
                message="Link copied to clipboard!"
                color="success"
                position="bottom"
            />
        );
        const status = await screen.findByRole('status');
        const toast = toasts()[0];
        expect(toast.parentElement).toBe(ionApp);
        await waitFor(() => expect(toast).not.toHaveClass('app-overlay-hidden'));
        expect(toast.className).toBe('app-toast md app-color app-color-success');
        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(status).toHaveAttribute('aria-atomic', 'true');
        expect(toast.querySelector('.app-toast-wrapper')).toHaveClass(
            'app-toast-bottom',
            'app-toast-layout-baseline'
        );
        // Revealed to screen readers once presented (re-rendered without aria-hidden).
        await waitFor(() =>
            expect(screen.getByText('Link copied to clipboard!')).not.toHaveAttribute('aria-hidden')
        );
        expect(document.getElementById('ion-view-container-root')).not.toHaveAttribute(
            'aria-hidden'
        );
        expect(document.activeElement).toBe(document.body);
    });

    it('starts with the text aria-hidden until the enter animation completes', () => {
        render(<AppToast isOpen message="Saving" />);
        // Not presented yet (mount, then two frames, then the animation).
        const message = document.querySelector('.app-toast-message');
        expect(message === null || message.getAttribute('aria-hidden') === 'true').toBe(true);
    });

    it('leaves a presented Ionic modal underneath exposed to screen readers (focus stays there)', async () => {
        const modal = Object.assign(document.createElement('ion-modal'), { overlayIndex: 1 });
        ionApp.appendChild(modal);
        render(<AppToast isOpen message="Copied" />);
        await waitFor(() => expect(toasts()[0]).not.toHaveClass('app-overlay-hidden'));
        expect(modal).not.toHaveAttribute('aria-hidden');
        modal.remove();
    });

    it('dismisses after `duration` with the timeout role', async () => {
        const onDidDismiss = vi.fn();
        render(<AppToast isOpen message="Saved" duration={30} onDidDismiss={onDidDismiss} />);
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        expect(onDidDismiss.mock.calls[0][0].detail.role).toBe('timeout');
        expect(toasts()).toHaveLength(0);
    });
});

describe('useAppToast', () => {
    it('presents options or (message, duration), ignoring a present while its toast is up', async () => {
        const onDidDismiss = vi.fn();
        const { result } = renderHook(() => useAppToast());
        act(() =>
            result.current[0]({
                message: 'Framework created successfully!',
                color: 'success',
                onDidDismiss,
            })
        );
        act(() => result.current[0]('Ignored', 2000));
        await screen.findByText('Framework created successfully!');
        expect(toasts()).toHaveLength(1);
        expect(screen.queryByText('Ignored')).toBeNull();

        act(() => result.current[1]());
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(toasts()).toHaveLength(0));

        act(() => result.current[0]('Error: synthetic failure', 30));
        expect(await screen.findByText('Error: synthetic failure')).toBeInTheDocument();
        await waitFor(() => expect(toasts()).toHaveLength(0));
    });

    it('keeps the toast after the calling component unmounts', async () => {
        const { result, unmount } = renderHook(() => useAppToast());
        act(() => result.current[0]({ message: 'Still here', duration: 0 }));
        await screen.findByText('Still here');
        unmount();
        expect(screen.getByText('Still here')).toBeInTheDocument();
        // The hook's dismiss still closes it after the caller is gone.
        act(() => result.current[1]());
        await waitFor(() => expect(toasts()).toHaveLength(0));
    });
});
