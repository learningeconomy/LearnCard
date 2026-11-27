import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLoading } from './AppLoading';

vi.mock('../feedback/AppSpinner', () => ({
    AppSpinner: ({ name }: { name: string }) => <span data-testid="spinner" data-name={name} />,
}));

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

const host = () => document.querySelector<HTMLElement>('.app-loading');

describe('AppLoading', () => {
    it('renders a labelled modal dialog with the mode spinner and the call-site classes', async () => {
        render(
            <AppLoading isOpen mode="ios" message="Logging out..." cssClass="[--background:none]" />
        );
        const dialog = await screen.findByRole('dialog', { name: 'Logging out...' });
        expect(dialog).toBe(host());
        expect(dialog.parentElement).toBe(ionApp);
        await waitFor(() => expect(dialog).not.toHaveClass('app-overlay-hidden'));
        expect(dialog.className).toBe('app-loading ios [--background:none]');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByTestId('spinner')).toHaveAttribute('data-name', 'lines');
        expect(dialog.querySelectorAll(':scope > [tabindex="0"][aria-hidden="true"]')).toHaveLength(
            2
        );
        await waitFor(() => expect(document.activeElement).toBe(dialog));
        expect(document.getElementById('ion-view-container-root')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('defaults to the md crescent spinner', async () => {
        render(<AppLoading isOpen />);
        expect((await screen.findByTestId('spinner')).dataset.name).toBe('crescent');
    });

    it('ignores Escape and backdrop clicks, and closes when isOpen turns false', async () => {
        const onDidDismiss = vi.fn();
        const { rerender } = render(
            <AppLoading isOpen message="Consenting..." onDidDismiss={onDidDismiss} />
        );
        await waitFor(() => expect(document.activeElement).toBe(host()));
        fireEvent.keyDown(host() as HTMLElement, { key: 'Escape' });
        fireEvent.click(host()?.querySelector('.app-backdrop') as Element);
        await new Promise(r => setTimeout(r, 50));
        expect(onDidDismiss).not.toHaveBeenCalled();

        rerender(<AppLoading isOpen={false} message="Consenting..." onDidDismiss={onDidDismiss} />);
        await waitFor(() => expect(host()).toBeNull());
        expect(onDidDismiss).toHaveBeenCalledTimes(1);
        expect(document.getElementById('ion-view-container-root')).not.toHaveAttribute(
            'aria-hidden'
        );
    });

    it('dismisses itself after `duration`', async () => {
        const onDidDismiss = vi.fn();
        render(<AppLoading isOpen duration={30} onDidDismiss={onDidDismiss} />);
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        expect(host()).toBeNull();
    });

    it('keeps tab focus inside the wrapper (sentinels send it back)', async () => {
        render(<AppLoading isOpen message="Fetching Data Source" />);
        await waitFor(() => expect(document.activeElement).toBe(host()));
        const [first] = Array.from(
            host()?.querySelectorAll<HTMLElement>(':scope > [tabindex="0"]') ?? []
        );
        first.focus();
        // No focusable inside the wrapper: focus falls back to the overlay host.
        expect(document.activeElement).toBe(host());
    });
});
