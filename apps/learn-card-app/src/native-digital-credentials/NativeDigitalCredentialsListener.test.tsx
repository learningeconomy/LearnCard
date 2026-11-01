import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import NativeDigitalCredentialsListener from './NativeDigitalCredentialsListener';

const mocks = vi.hoisted(() => ({
    synchronize: vi.fn(),
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
            return { remove: vi.fn() };
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
        getPendingRequest: async () => ({}),
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
    mocks.synchronize.mockReset();
    mocks.synchronize.mockResolvedValue({ retryRequired: false });
});
afterEach(() => {
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
    view.unmount();
});
