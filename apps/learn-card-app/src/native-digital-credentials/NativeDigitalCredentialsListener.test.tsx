import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NativeDigitalCredentialsListener from './NativeDigitalCredentialsListener';

const mocks = vi.hoisted(() => ({
    synchronize: vi.fn(),
    pending: vi.fn(),
    remove: vi.fn(),
    foreground: undefined as undefined | ((event: { isActive: boolean }) => void),
    query: undefined as undefined | ((event: unknown) => void),
    initialize: vi.fn(async () => ({})),
    account: () => true,
    history: { location: { pathname: '/wallet' }, replace: vi.fn() },
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' } }));
vi.mock('@capacitor/app', () => ({
    App: {
        addListener: async (_name: string, callback: typeof mocks.foreground) => {
            mocks.foreground = callback;
            return { remove: mocks.remove };
        },
    },
}));
vi.mock('react-router-dom', () => ({ useHistory: () => mocks.history }));
const client = {
    getQueryCache: () => ({
        subscribe: (callback: typeof mocks.query) => {
            mocks.query = callback;
            return vi.fn();
        },
    }),
};
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => client }));
vi.mock('learn-card-base', () => ({
    useIsLoggedIn: () => true,
    useHasCurrentUserHydrated: () => true,
    useWallet: () => ({ initWallet: mocks.initialize }),
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    currentUserStore: {
        store: { subscribe: () => vi.fn() },
        get: { currentUser: () => ({ uid: 'account' }) },
    },
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { store: { subscribe: () => vi.fn() } },
}));
const auth = { state: { status: 'authenticated' } };
vi.mock('../providers/AuthCoordinatorProvider', () => ({ useAppAuth: () => auth }));
vi.mock('../helpers/verifier-history/account', () => ({
    captureHistoryAccount: () => mocks.account,
    isHistoryAccountEligible: () => true,
    useHistoryAccountRevision: () => 0,
}));
vi.mock('./plugin', () => ({
    nativeDigitalCredentials: {
        status: async () => ({ enabled: true }),
        getPendingRequest: mocks.pending,
        clear: vi.fn(),
    },
}));
vi.mock('./runtime', () => ({
    clearNativeInventory: vi.fn(),
    synchronizeNativeInventory: mocks.synchronize,
}));
vi.mock('../paraglide/messages.js', () => ({
    'nativeCredentials.credentialTitle': () => 'Credential',
}));

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    vi.clearAllMocks();
    mocks.pending.mockResolvedValue({});
    mocks.synchronize.mockReset();
    mocks.synchronize.mockResolvedValue({ retryRequired: false });
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
const advance = async (ms = 0) => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
};

it('retries inconclusive inventory with capped backoff, pauses in background, and resets on foreground', async () => {
    mocks.synchronize.mockResolvedValue({ retryRequired: true });
    const view = render(<NativeDigitalCredentialsListener />);
    await advance();
    expect(mocks.synchronize).toHaveBeenCalledTimes(1);
    await advance(2_000);
    expect(mocks.synchronize).toHaveBeenCalledTimes(2);
    await advance(10_000);
    expect(mocks.synchronize).toHaveBeenCalledTimes(3);
    await advance(30_000);
    expect(mocks.synchronize).toHaveBeenCalledTimes(4);
    await advance(60_000);
    expect(mocks.synchronize).toHaveBeenCalledTimes(4);
    act(() => mocks.foreground?.({ isActive: true }));
    await advance(350);
    expect(mocks.synchronize).toHaveBeenCalledTimes(5);
    act(() => mocks.foreground?.({ isActive: false }));
    await advance(60_000);
    expect(mocks.synchronize).toHaveBeenCalledTimes(5);
    view.unmount();
});

it('ignores fetch-status updates and coalesces successful inventory changes', async () => {
    const view = render(<NativeDigitalCredentialsListener />);
    await advance();
    act(() =>
        mocks.query?.({
            type: 'updated',
            query: { queryKey: ['useGetCredentials'] },
            action: { type: 'fetch' },
        })
    );
    await advance(350);
    expect(mocks.synchronize).toHaveBeenCalledTimes(1);
    act(() => {
        for (let i = 0; i < 10; i++)
            mocks.query?.({
                type: 'updated',
                query: { queryKey: ['useGetCredentials'] },
                action: { type: 'success' },
            });
    });
    await advance(350);
    expect(mocks.synchronize).toHaveBeenCalledTimes(2);
    expect(mocks.synchronize.mock.calls.map(call => call[3])).toEqual([true, false]);
    act(() => mocks.foreground?.({ isActive: true }));
    await advance(350);
    expect(mocks.synchronize.mock.lastCall?.[3]).toBe(true);
    view.unmount();
});

it('retries failed foreground reassertion instead of trusting local status', async () => {
    mocks.synchronize.mockRejectedValueOnce(new Error('register failed'));
    const view = render(<NativeDigitalCredentialsListener />);
    await advance();
    await advance(2_000);
    expect(mocks.synchronize.mock.calls.map(call => call[3])).toEqual([true, true]);
    view.unmount();
});

const mount = async () => {
    const view = render(<NativeDigitalCredentialsListener />);
    await advance();
    return view;
};

describe('native foreground expiration lifecycle', () => {
    it('refreshes at credential expiration without a query or foreground event', async () => {
        mocks.synchronize.mockResolvedValueOnce({ retryRequired: false, nextRefreshAt: 2_000 });
        await mount();
        expect(mocks.synchronize).toHaveBeenCalledTimes(1);
        await advance(999);
        expect(mocks.synchronize).toHaveBeenCalledTimes(1);
        await advance(1);
        expect(mocks.synchronize).toHaveBeenCalledTimes(2);
    });

    it('suspends expiration work in the background and refreshes on foreground', async () => {
        mocks.synchronize.mockResolvedValueOnce({ retryRequired: false, nextRefreshAt: 2_000 });
        await mount();
        act(() => mocks.foreground!({ isActive: false }));
        await advance(2_000);
        expect(mocks.synchronize).toHaveBeenCalledTimes(1);
        act(() => mocks.foreground!({ isActive: true }));
        await advance(350);
        expect(mocks.synchronize).toHaveBeenCalledTimes(2);
    });

    it('does not replace registration while provider consent is open', async () => {
        mocks.synchronize.mockResolvedValueOnce({ retryRequired: false, nextRefreshAt: 2_000 });
        await mount();
        mocks.pending.mockResolvedValue({ pending: {}, isProvider: true });
        await advance(1_000);
        expect(mocks.synchronize).toHaveBeenCalledTimes(1);
        expect(mocks.history.replace).toHaveBeenCalled();
    });

    it('cancels expiration timers and native event subscription on unmount', async () => {
        mocks.synchronize.mockResolvedValueOnce({ retryRequired: false, nextRefreshAt: 2_000 });
        const view = await mount();
        view.unmount();
        await advance(2_000);
        expect(mocks.synchronize).toHaveBeenCalledTimes(1);
        expect(mocks.remove).toHaveBeenCalledOnce();
    });

    it('bounds a distant expiration so setTimeout cannot wrap into a tight refresh loop', async () => {
        mocks.synchronize.mockResolvedValueOnce({
            retryRequired: false,
            nextRefreshAt: 10_000_000_000,
        });
        await mount();
        await advance(5_000);
        expect(mocks.synchronize).toHaveBeenCalledTimes(1);
    });
});
