import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppAlert } from './AppAlert';
import { useAppAlert, type AppAlertOptions } from './useAppAlert';

let ionApp: HTMLElement;

beforeEach(() => {
    ionApp = Object.assign(document.createElement('div'), { className: 'app-root' });
    ionApp.innerHTML = '<div id="ion-view-container-root"></div>';
    document.body.appendChild(ionApp);
});

afterEach(() => {
    cleanup();
    ionApp.remove();
    document.body.className = '';
});

const host = () => document.querySelector<HTMLElement>('.app-alert');
const presented = async () => {
    await waitFor(() => expect(host()).not.toHaveClass('app-overlay-hidden'));
    return host() as HTMLElement;
};

describe('AppAlert', () => {
    it('renders an alertdialog labelled by its header and sub-header, in the app root', async () => {
        render(
            <AppAlert
                isOpen
                mode="md"
                cssClass="boost-confirmation-alert"
                header="Sharing failed"
                subHeader="Network"
                message="Please try again."
                buttons={['OK']}
            />
        );
        const el = await presented();
        expect(el.parentElement).toBe(ionApp);
        expect(el.className).toBe('app-alert boost-confirmation-alert md');
        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAccessibleName('Sharing failed Network');
        expect(dialog).toHaveAccessibleDescription('Please try again.');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sharing failed');
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Network');
        // One button and no inputs: the button takes focus, as ion-alert did.
        await waitFor(() => expect(document.activeElement).toHaveTextContent('OK'));
        expect(document.getElementById('ion-view-container-root')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    it('stacks more than two buttons vertically and focuses the dialog', async () => {
        render(<AppAlert isOpen message="Pick" buttons={['A', 'B', 'C']} />);
        await presented();
        expect(document.querySelector('.alert-button-group')).toHaveClass(
            'alert-button-group-vertical'
        );
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('alertdialog')));
    });

    it('runs the cancel handler on Escape and dismisses with role backdrop', async () => {
        const cancel = vi.fn();
        const onDidDismiss = vi.fn();
        render(
            <AppAlert
                isOpen
                message="Discard changes?"
                buttons={[
                    { text: 'Cancel', role: 'cancel', handler: cancel },
                    { text: 'Discard', role: 'destructive' },
                ]}
                onDidDismiss={onDidDismiss}
            />
        );
        await presented();
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('alertdialog')));
        fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(onDidDismiss.mock.calls[0][0].detail.role).toBe('backdrop');
        await waitFor(() => expect(host()).toBeNull());
    });

    it('passes input values to handlers, and a `false` return keeps it open', async () => {
        const onDidDismiss = vi.fn();
        const handler = vi.fn((values?: Record<string, string>) =>
            values?.pin ? undefined : false
        );
        render(
            <AppAlert
                isOpen
                header="Enter PIN"
                inputs={[{ name: 'pin', placeholder: 'PIN', attributes: { maxlength: 4 } }]}
                buttons={[
                    { text: 'Cancel', role: 'cancel' },
                    { text: 'Unlock', handler },
                ]}
                onDidDismiss={onDidDismiss}
            />
        );
        await presented();
        const input = screen.getByPlaceholderText('PIN');
        expect(input).toHaveAttribute('maxlength', '4');
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(handler).toHaveBeenCalledWith({ pin: '' }));
        expect(onDidDismiss).not.toHaveBeenCalled();

        fireEvent.input(input, { target: { value: '1234' } });
        fireEvent.click(screen.getByText('Unlock'));
        await waitFor(() => expect(onDidDismiss).toHaveBeenCalledTimes(1));
        expect(onDidDismiss.mock.calls[0][0].detail.data).toEqual({ values: { pin: '1234' } });
    });

    it('ignores the backdrop when backdropDismiss is false', async () => {
        const onDidDismiss = vi.fn();
        render(
            <AppAlert isOpen backdropDismiss={false} message="Wait" onDidDismiss={onDidDismiss} />
        );
        await presented();
        fireEvent.click(host()?.querySelector('.app-backdrop') as Element);
        await new Promise(r => setTimeout(r, 50));
        expect(onDidDismiss).not.toHaveBeenCalled();
    });
});

describe('useAppAlert', () => {
    let api: ReturnType<typeof useAppAlert>;
    const Harness: React.FC = () => {
        api = useAppAlert();
        return null;
    };

    it('present(message) shows an "Ok" button, ignores a second present, and dismiss() closes', async () => {
        render(<Harness />);
        act(() => api[0]('Signed in with a different account.'));
        await presented();
        expect(screen.getByText('Ok')).toBeInTheDocument();
        act(() => api[0]({ message: 'second' } as AppAlertOptions));
        expect(document.querySelectorAll('.app-alert')).toHaveLength(1);
        act(() => api[1]());
        await waitFor(() => expect(host()).toBeNull());
    });

    it('outlives the calling component', async () => {
        const { unmount } = render(<Harness />);
        act(() => api[0]({ header: 'Saved', buttons: ['OK'] }));
        await presented();
        unmount();
        expect(host()).not.toBeNull();
        fireEvent.click(screen.getByText('OK'));
        await waitFor(() => expect(host()).toBeNull());
    });
});
