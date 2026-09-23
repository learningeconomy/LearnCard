import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { requestConnectivityCheck } = vi.hoisted(() => ({ requestConnectivityCheck: vi.fn() }));

vi.mock('./connectivity', () => ({ requestConnectivityCheck }));

// The banner reads shared state from the 'learn-card-base' barrel; point the
// barrel at the REAL store modules so tests drive actual shared state.
vi.mock('learn-card-base', async () => {
    const connectivity = await import('learn-card-base/stores/connectivityStore');
    const walletMode = await import('learn-card-base/stores/walletModeStore');
    return {
        connectivityStore: connectivity.connectivityStore,
        walletModeStore: walletMode.walletModeStore,
    };
});

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));

vi.mock('../../paraglide/messages.js', () => ({
    'connectivity.offlineTitle': () => "You're offline",
    'connectivity.limitedTitle': () => 'Some features are unavailable',
    'connectivity.reconnect': () => 'Reconnect',
    'connectivity.reconnecting': () => 'Reconnecting…',
    'connectivity.backOnline': () => 'Back online',
    'connectivity.slowUnstable': () =>
        'Connection seems slow or unstable. Some actions may take longer.',
}));

import { connectivityStore } from 'learn-card-base/stores/connectivityStore';
import { walletModeStore } from 'learn-card-base/stores/walletModeStore';
import { OfflineBanner } from './OfflineBanner';

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

const setStores = (
    status: 'unknown' | 'online' | 'offline',
    quality: 'unknown' | 'good' | 'poor',
    walletMode: 'full' | 'offline' | null
) => {
    act(() => {
        connectivityStore.set.status(status);
        connectivityStore.set.quality(quality);
        walletModeStore.set.mode(walletMode);
    });
};

beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
        connectivityStore.set.status('unknown');
        connectivityStore.set.quality('unknown');
        connectivityStore.set.qualityReason(null);
        walletModeStore.set.mode(null);
        walletModeStore.set.upgradeNonce(0);
    });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('OfflineBanner', () => {
    it('renders nothing when online with good quality', () => {
        setStores('online', 'good', 'full');
        const { container } = render(<OfflineBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it('verified offline shows the reconnect affordance (not the quality warning)', () => {
        setStores('offline', 'poor', 'full'); // quality poor must NOT win over offline
        render(<OfflineBanner />);

        expect(screen.getByText("You're offline")).toBeInTheDocument();
        expect(screen.getByText('Reconnect')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('manual retry funnels through the singleton check, guards double taps, and upgrades the wallet only on a verified-online result', async () => {
        vi.useFakeTimers();
        const pending = deferred<'online' | 'unknown' | 'offline'>();
        requestConnectivityCheck.mockReturnValueOnce(pending.promise);
        setStores('offline', 'good', 'full');
        render(<OfflineBanner />);

        // First tap enters the reconnecting state; a second tap is a no-op.
        fireEvent.click(screen.getByRole('button'));
        expect(requestConnectivityCheck).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Reconnecting…')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button'));
        expect(requestConnectivityCheck).toHaveBeenCalledTimes(1);

        // Verified-online result: the monitor publishes the verified status
        // (that is what clears "limited"), and the upgrade is requested.
        await act(async () => {
            pending.resolve('online');
            connectivityStore.set.status('online');
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(walletModeStore.get.upgradeNonce()).toBeGreaterThan(0);
        expect(screen.getByText('Back online')).toBeInTheDocument();

        // Let the reconnecting reset (800ms) and toast auto-hide (2500ms) run.
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2600);
        });
        expect(screen.queryByText('Back online')).not.toBeInTheDocument();
    });

    it('an inconclusive retry result does NOT trigger the wallet upgrade', async () => {
        vi.useFakeTimers();
        const pending = deferred<'online' | 'unknown' | 'offline'>();
        requestConnectivityCheck.mockReturnValueOnce(pending.promise);
        setStores('offline', 'good', 'full');
        render(<OfflineBanner />);

        fireEvent.click(screen.getByRole('button'));
        await act(async () => {
            pending.resolve('unknown');
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(walletModeStore.get.upgradeNonce()).toBe(0); // no rebuild on a guess
        expect(screen.getByText('Reconnecting…')).toBeInTheDocument(); // still limited

        await act(async () => {
            await vi.advanceTimersByTimeAsync(800); // reconnecting reset timer
        });
        expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    it('local-wallet fallback with a reachable network says features are unavailable — never that the internet is down', () => {
        setStores('online', 'good', 'offline');
        render(<OfflineBanner />);

        expect(screen.getByText('Some features are unavailable')).toBeInTheDocument();
        expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
    });

    it('the advisory slow/unstable warning is an accessible status, shown only when not limited', () => {
        setStores('online', 'poor', 'full');
        render(<OfflineBanner />);

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(
            'Connection seems slow or unstable. Some actions may take longer.'
        );
    });

    it('limited (local fallback) mode also outranks the quality warning', () => {
        setStores('online', 'poor', 'offline');
        render(<OfflineBanner />);

        expect(screen.getByText('Some features are unavailable')).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('the back-online toast appears when a limited period ends', () => {
        vi.useFakeTimers();
        setStores('online', 'good', 'offline');
        const { rerender } = render(<OfflineBanner />);
        expect(screen.queryByText('Back online')).not.toBeInTheDocument();

        act(() => {
            walletModeStore.set.mode('full');
        });
        rerender(<OfflineBanner />);
        expect(screen.getByText('Back online')).toBeInTheDocument();

        // Toast is brief — hidden again after its timeout.
        act(() => {
            vi.advanceTimersByTime(2600);
        });
        expect(screen.queryByText('Back online')).not.toBeInTheDocument();
    });
});
