import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestConnectivityCheck, initialize } = vi.hoisted(() => ({
    requestConnectivityCheck: vi.fn(),
    initialize: vi.fn(),
}));

vi.mock('./connectivity', () => ({ requestConnectivityCheck }));

vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAuthCoordinator: () => ({ initialize }),
}));

vi.mock('learn-card-base', () => ({
    Overlay: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));

vi.mock('../../paraglide/messages.js', () => ({
    'connectivity.offlineTitle': () => "You're offline",
    'connectivity.offlineBody': () => "Sign in works once you're back online.",
    'connectivity.tryAgain': () => 'Try Again',
    'connectivity.checking': () => 'Checking...',
}));

import { OfflineBootGate } from './OfflineBootGate';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('OfflineBootGate', () => {
    it('renders the offline copy with a Try Again affordance', () => {
        render(<OfflineBootGate />);

        expect(screen.getByText("You're offline")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('Try Again runs the coalesced check first, then re-runs boot initialize — even when still offline', async () => {
        // Verified-offline result: initialize must STILL run (the cached-key
        // path needs no network), and only after the check settles.
        requestConnectivityCheck.mockResolvedValueOnce('offline');
        initialize.mockResolvedValueOnce(undefined);

        render(<OfflineBootGate />);
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

        // Loading state while the check is in flight.
        expect(screen.getByRole('button', { name: /Checking/i })).toBeDisabled();
        expect(requestConnectivityCheck).toHaveBeenCalledTimes(1);

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled()
        );

        expect(initialize).toHaveBeenCalledTimes(1);
        expect(requestConnectivityCheck.mock.invocationCallOrder[0]).toBeLessThan(
            initialize.mock.invocationCallOrder[0]
        );
    });

    it('a verified-online retry still hands off to initialize (auth flow untouched)', async () => {
        requestConnectivityCheck.mockResolvedValueOnce('online');
        initialize.mockResolvedValueOnce(undefined);

        render(<OfflineBootGate />);
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        });

        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled()
        );
        expect(initialize).toHaveBeenCalledTimes(1);
    });
});
