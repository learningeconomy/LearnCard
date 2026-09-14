import { beforeEach, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
    finalize: vi.fn(),
    recover: vi.fn(),
    invalidate: vi.fn(),
    syncing: vi.fn(),
    snapshotRef: { current: { credentialCount: 0 } },
}));
vi.mock('learn-card-base', () => ({
    useIsLoggedIn: () => true,
    useIsCurrentUserLCNUser: () => ({ data: true }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                getProfile: async () => ({ profileId: 'learner' }),
                finalizeInboxCredentials: mocks.finalize,
            },
        }),
    }),
    walletStore: { set: { setIsSyncing: mocks.syncing } },
    WalletSyncState: { Syncing: 'syncing', Completed: 'completed', NotSyncing: 'not-syncing' },
    connectionPromptKeys: { all: ['connection-prompts'] },
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock('../stores/autoVerifyStore', () => ({ useVerifySuccessTick: () => 0 }));
vi.mock('@sentry/react', () => ({ captureException: vi.fn() }));
vi.mock('@analytics', () => ({
    useAnalytics: () => ({ track: vi.fn() }),
    useProfileSnapshotCapture: () => ({ capture: vi.fn(), snapshotRef: mocks.snapshotRef }),
    AnalyticsEvents: {},
    ProfileBuildMethod: {},
    ACCOUNT_CREATED_AT_KEY: 'created',
    SESSION_START_KEY: 'session',
}));
vi.mock('./recoverInboxDeliveries', () => ({ recoverInboxDeliveries: mocks.recover }));
import { clearFinalizeCache, useFinalizeInboxCredentials } from './useFinalizeInboxCredentials';

beforeEach(() => {
    vi.clearAllMocks();
    clearFinalizeCache();
    mocks.finalize.mockResolvedValue({ verifiableCredentials: [] });
    mocks.recover.mockResolvedValue({ stored: 1, failed: 0 });
});

it.each([false, true])(
    'recovers at startup even when finalization response is lost: %s',
    async lost => {
        if (lost) mocks.finalize.mockRejectedValue(new Error('response lost'));
        renderHook(() => useFinalizeInboxCredentials());
        await waitFor(() => expect(mocks.recover).toHaveBeenCalledOnce());
        await waitFor(() =>
            expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['useGetCredentialList'] })
        );
    }
);

it('does not cache a failed local save, allowing another startup attempt', async () => {
    mocks.recover.mockResolvedValueOnce({ stored: 0, failed: 1 });
    const first = renderHook(() => useFinalizeInboxCredentials());
    await waitFor(() => expect(mocks.syncing).toHaveBeenCalledWith('completed', 0));
    first.unmount();
    renderHook(() => useFinalizeInboxCredentials());
    await waitFor(() => expect(mocks.recover).toHaveBeenCalledTimes(2));
});

it('sweeps recovery on a later login even while finalization is cached', async () => {
    const first = renderHook(() => useFinalizeInboxCredentials());
    await waitFor(() => expect(mocks.syncing).toHaveBeenCalledWith('completed', 0));
    first.unmount();
    renderHook(() => useFinalizeInboxCredentials());
    await waitFor(() => expect(mocks.recover).toHaveBeenCalledTimes(2));
    expect(mocks.finalize).toHaveBeenCalledTimes(1);
});
