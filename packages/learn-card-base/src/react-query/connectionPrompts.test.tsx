/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCNConnectionPrompt, LCNConnectionPromptActionResult } from '@learncard/types';

const mockGetPendingConnectionPrompts = vi.fn();
const mockGetConnectionPromptStatus = vi.fn();
const mockSkipConnectionPrompt = vi.fn();
const mockConnectWithConnectionPrompt = vi.fn();
const mockAcceptCredential = vi.fn();
const mockInitWallet = vi.fn();

const { mockSwitchedProfileStore } = vi.hoisted(() => {
    let switchedDid: string | undefined;

    return {
        mockSwitchedProfileStore: {
            use: { switchedDid: () => switchedDid },
            get: { switchedDid: () => switchedDid },
            set: { switchedDid: (did: string | undefined) => (switchedDid = did) },
        },
    };
});

const mockWallet = {
    invoke: {
        getPendingConnectionPrompts: mockGetPendingConnectionPrompts,
        getConnectionPromptStatus: mockGetConnectionPromptStatus,
        skipConnectionPrompt: mockSkipConnectionPrompt,
        connectWithConnectionPrompt: mockConnectWithConnectionPrompt,
        acceptCredential: mockAcceptCredential,
    },
};

vi.mock('../stores/walletStore', () => ({
    switchedProfileStore: mockSwitchedProfileStore,
}));
vi.mock('../stores/currentUserStore', () => ({ currentUserStore: {} }));
vi.mock('../stores/NetworkStore', () => ({ networkStore: {} }));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: mockSwitchedProfileStore,
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({ networkStore: {} }));
vi.mock('learn-card-base/hooks/useWallet', () => ({
    useWallet: () => ({ initWallet: mockInitWallet }),
}));

vi.mock('./mutations/ai-passport', () => ({ queueAiInsightCredentialRefresh: vi.fn() }));
vi.mock('./mutations/pruneConsentFlowDeletedCredentials', () => ({
    deleteCredentialFromAllContracts: vi.fn(),
}));
vi.mock('./mutations/syncAllCredentials', () => ({
    useSyncAllCredentialsToContractsMutation: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../hooks/useToast', () => ({
    ToastTypeEnum: {},
    useToast: () => ({ presentToast: vi.fn() }),
}));
vi.mock('../logging/logger', () => ({
    getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('learn-card-base', () => {
    return {
        switchedProfileStore: mockSwitchedProfileStore,
        useWallet: () => ({ initWallet: mockInitWallet }),
    };
});

import { switchedProfileStore } from '../stores/walletStore';
import { useAcceptCredentialMutation } from './mutations/mutations';
import {
    connectionPromptKeys,
    useConnectWithConnectionPromptMutation,
    useConnectionPromptStatus,
    usePendingConnectionPrompts,
    useSkipConnectionPromptMutation,
} from './connectionPrompts';

const SWITCHED_DID = 'did:web:viewer';
const PROMPT_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_PROMPT_ID = '22222222-2222-4222-8222-222222222222';
const COUNTERPART_PROFILE_ID = 'counterpart-profile';

const prompt: LCNConnectionPrompt = {
    promptId: PROMPT_ID,
    status: 'PENDING',
    surface: 'POST_CLAIM',
    triggerId: 'credential:123',
    triggeredAt: '2026-08-20T12:00:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
    counterpart: {
        profileId: COUNTERPART_PROFILE_ID,
        displayName: 'A Learner',
        shortBio: 'Learning together',
        isServiceProfile: false,
    },
};

const otherPrompt: LCNConnectionPrompt = {
    ...prompt,
    promptId: OTHER_PROMPT_ID,
    triggerId: 'credential:456',
    counterpart: { ...prompt.counterpart, profileId: 'another-profile' },
};

const makeQueryClient = (): QueryClient =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { retry: false },
        },
    });

const makeWrapper =
    (queryClient: QueryClient) =>
    ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
};

const seedActionCaches = (queryClient: QueryClient): void => {
    queryClient.setQueryData(connectionPromptKeys.pending(SWITCHED_DID), [prompt, otherPrompt]);
    queryClient.setQueryData(connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID), {
        promptId: PROMPT_ID,
        status: 'PENDING',
    });
    queryClient.setQueryData(connectionPromptKeys.status(SWITCHED_DID, OTHER_PROMPT_ID), {
        promptId: OTHER_PROMPT_ID,
        status: 'PENDING',
    });
    queryClient.setQueryData(['connections', SWITCHED_DID], []);
    queryClient.setQueryData(['paginatedConnections', SWITCHED_DID, { limit: 10 }], {
        pages: [],
        pageParams: [],
    });
    queryClient.setQueryData(['connection', SWITCHED_DID, COUNTERPART_PROFILE_ID], null);
    queryClient.setQueryData(
        ['useGetUserNotifications', SWITCHED_DID, { limit: 30 }, { archived: false }],
        { pages: [], pageParams: [] }
    );
    queryClient.setQueryData(['useGetUnreadUserNotifications', SWITCHED_DID], {
        hasMore: false,
        notifications: [],
    });
};

describe('connection prompt queries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        switchedProfileStore.set.switchedDid(SWITCHED_DID);
        mockInitWallet.mockResolvedValue(mockWallet);
    });

    it('scopes query keys to the switched DID', () => {
        expect(connectionPromptKeys.pending(SWITCHED_DID)).toEqual([
            'connectionPrompts',
            'pending',
            SWITCHED_DID,
        ]);
        expect(connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID)).toEqual([
            'connectionPrompts',
            'status',
            SWITCHED_DID,
            PROMPT_ID,
        ]);
    });

    it('loads pending prompts through the viewer wallet', async () => {
        const request = deferred<LCNConnectionPrompt[]>();
        mockGetPendingConnectionPrompts.mockReturnValue(request.promise);
        const queryClient = makeQueryClient();

        const { result } = renderHook(() => usePendingConnectionPrompts(), {
            wrapper: makeWrapper(queryClient),
        });

        await waitFor(() => expect(mockGetPendingConnectionPrompts).toHaveBeenCalledOnce());
        expect(result.current.isLoading).toBe(true);
        expect(mockInitWallet).toHaveBeenCalledOnce();
        expect(mockGetPendingConnectionPrompts).toHaveBeenCalledWith();

        request.resolve([prompt]);

        await waitFor(() => expect(result.current.data).toEqual([prompt]));
        expect(queryClient.getQueryData(connectionPromptKeys.pending(SWITCHED_DID))).toEqual([
            prompt,
        ]);
    });

    it('does not load pending prompts when disabled', async () => {
        const queryClient = makeQueryClient();
        const { result } = renderHook(() => usePendingConnectionPrompts(false), {
            wrapper: makeWrapper(queryClient),
        });

        await act(async () => Promise.resolve());

        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.isLoading).toBe(false);
        expect(mockInitWallet).not.toHaveBeenCalled();
        expect(mockGetPendingConnectionPrompts).not.toHaveBeenCalled();
    });

    it('does not load status without a prompt ID', async () => {
        const queryClient = makeQueryClient();
        const { result } = renderHook(() => useConnectionPromptStatus(undefined), {
            wrapper: makeWrapper(queryClient),
        });

        await act(async () => Promise.resolve());

        expect(result.current.fetchStatus).toBe('idle');
        expect(mockGetConnectionPromptStatus).not.toHaveBeenCalled();
    });

    it('loads prompt status with the prompt ID only', async () => {
        const response: LCNConnectionPromptActionResult = {
            promptId: PROMPT_ID,
            status: 'PENDING',
        };
        mockGetConnectionPromptStatus.mockResolvedValue(response);
        const queryClient = makeQueryClient();

        const { result } = renderHook(() => useConnectionPromptStatus(PROMPT_ID), {
            wrapper: makeWrapper(queryClient),
        });

        await waitFor(() => expect(result.current.data).toEqual(response));
        expect(mockGetConnectionPromptStatus).toHaveBeenCalledOnce();
        expect(mockGetConnectionPromptStatus).toHaveBeenCalledWith(PROMPT_ID);
        expect(
            queryClient.getQueryData(connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID))
        ).toEqual(response);
    });
});

describe('connection prompt mutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        switchedProfileStore.set.switchedDid(SWITCHED_DID);
        mockInitWallet.mockResolvedValue(mockWallet);
    });

    it('optimistically skips only the selected prompt and invalidates prompt and notification caches', async () => {
        const request = deferred<LCNConnectionPromptActionResult>();
        mockSkipConnectionPrompt.mockReturnValue(request.promise);
        const queryClient = makeQueryClient();
        seedActionCaches(queryClient);

        const { result } = renderHook(() => useSkipConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        act(() => result.current.mutate(PROMPT_ID));

        await waitFor(() =>
            expect(queryClient.getQueryData(connectionPromptKeys.pending(SWITCHED_DID))).toEqual([
                otherPrompt,
            ])
        );
        expect(
            queryClient.getQueryData(connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID))
        ).toEqual({ promptId: PROMPT_ID, status: 'SKIPPED' });
        expect(mockSkipConnectionPrompt).toHaveBeenCalledWith(PROMPT_ID);

        request.resolve({ promptId: PROMPT_ID, status: 'SKIPPED' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(
            queryClient.getQueryState(connectionPromptKeys.pending(SWITCHED_DID))?.isInvalidated
        ).toBe(true);
        expect(
            queryClient.getQueryState(['useGetUnreadUserNotifications', SWITCHED_DID])
                ?.isInvalidated
        ).toBe(true);
        expect(
            queryClient.getQueryState([
                'useGetUserNotifications',
                SWITCHED_DID,
                { limit: 30 },
                { archived: false },
            ])?.isInvalidated
        ).toBe(true);
    });

    it('restores every prompt cache snapshot when skip fails', async () => {
        mockSkipConnectionPrompt.mockRejectedValue(new Error('server error'));
        const queryClient = makeQueryClient();
        seedActionCaches(queryClient);
        const previousPromptCaches = queryClient.getQueriesData({
            queryKey: connectionPromptKeys.all,
        });

        const { result } = renderHook(() => useSkipConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        await act(async () => {
            await result.current.mutateAsync(PROMPT_ID).catch(() => undefined);
        });

        expect(queryClient.getQueriesData({ queryKey: connectionPromptKeys.all })).toEqual(
            previousPromptCaches
        );
    });

    it('connects by prompt ID and invalidates all connection-facing caches', async () => {
        mockConnectWithConnectionPrompt.mockResolvedValue({
            promptId: PROMPT_ID,
            status: 'CONNECTED',
        });
        const queryClient = makeQueryClient();
        seedActionCaches(queryClient);

        const { result } = renderHook(() => useConnectWithConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        await act(async () => result.current.mutateAsync(PROMPT_ID));

        expect(mockConnectWithConnectionPrompt).toHaveBeenCalledOnce();
        expect(mockConnectWithConnectionPrompt).toHaveBeenCalledWith(PROMPT_ID);
        expect(
            queryClient.getQueryData(connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID))
        ).toEqual({ promptId: PROMPT_ID, status: 'CONNECTED' });
        expect(queryClient.getQueryState(['connections', SWITCHED_DID])?.isInvalidated).toBe(true);
        expect(
            queryClient.getQueryState(['paginatedConnections', SWITCHED_DID, { limit: 10 }])
                ?.isInvalidated
        ).toBe(true);
        expect(
            queryClient.getQueryState(['connection', SWITCHED_DID, COUNTERPART_PROFILE_ID])
                ?.isInvalidated
        ).toBe(true);
    });

    it('removes a newly created optimistic status cache when connect fails', async () => {
        const request = deferred<LCNConnectionPromptActionResult>();
        mockConnectWithConnectionPrompt.mockReturnValue(request.promise);
        const queryClient = makeQueryClient();
        queryClient.setQueryData(connectionPromptKeys.pending(SWITCHED_DID), [prompt]);
        const previousPromptCaches = queryClient.getQueriesData({
            queryKey: connectionPromptKeys.all,
        });
        const statusKey = connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID);

        const { result } = renderHook(() => useConnectWithConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        act(() => result.current.mutate(PROMPT_ID));

        await waitFor(() =>
            expect(queryClient.getQueryData(statusKey)).toEqual({
                promptId: PROMPT_ID,
                status: 'CONNECTED',
            })
        );

        request.reject(new Error('server error'));

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(queryClient.getQueriesData({ queryKey: connectionPromptKeys.all })).toEqual(
            previousPromptCaches
        );
        expect(queryClient.getQueryState(statusKey)).toBeUndefined();
    });

    it('restores an existing undefined status cache when connect fails', async () => {
        const request = deferred<LCNConnectionPromptActionResult>();
        mockConnectWithConnectionPrompt.mockReturnValue(request.promise);
        const queryClient = makeQueryClient();
        queryClient.setQueryData(connectionPromptKeys.pending(SWITCHED_DID), [prompt]);
        const statusKey = connectionPromptKeys.status(SWITCHED_DID, PROMPT_ID);
        queryClient.getQueryCache().build(queryClient, {
            queryKey: statusKey,
            queryFn: async () => ({ promptId: PROMPT_ID, status: 'PENDING' as const }),
        });
        const previousStatusState = queryClient.getQueryState(statusKey);
        expect(previousStatusState).toBeDefined();
        expect(queryClient.getQueryData(statusKey)).toBeUndefined();

        const { result } = renderHook(() => useConnectWithConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        act(() => result.current.mutate(PROMPT_ID));
        await waitFor(() =>
            expect(queryClient.getQueryData(statusKey)).toEqual({
                promptId: PROMPT_ID,
                status: 'CONNECTED',
            })
        );

        request.reject(new Error('server error'));

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(queryClient.getQueryState(statusKey)).toEqual(previousStatusState);
    });

    it('does not overwrite another viewer cache when the current viewer action fails', async () => {
        const request = deferred<LCNConnectionPromptActionResult>();
        mockSkipConnectionPrompt.mockReturnValue(request.promise);
        const queryClient = makeQueryClient();
        seedActionCaches(queryClient);
        const otherDid = 'did:web:other-viewer';
        const otherPendingKey = connectionPromptKeys.pending(otherDid);
        const otherStatusKey = connectionPromptKeys.status(otherDid, OTHER_PROMPT_ID);
        queryClient.setQueryData(otherPendingKey, [otherPrompt]);
        queryClient.setQueryData(otherStatusKey, {
            promptId: OTHER_PROMPT_ID,
            status: 'PENDING',
        });

        const { result } = renderHook(() => useSkipConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        act(() => result.current.mutate(PROMPT_ID));
        await waitFor(() =>
            expect(queryClient.getQueryData(connectionPromptKeys.pending(SWITCHED_DID))).toEqual([
                otherPrompt,
            ])
        );

        queryClient.setQueryData(otherPendingKey, []);
        queryClient.setQueryData(otherStatusKey, {
            promptId: OTHER_PROMPT_ID,
            status: 'CONNECTED',
        });
        request.reject(new Error('server error'));

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(queryClient.getQueryData(otherPendingKey)).toEqual([]);
        expect(queryClient.getQueryData(otherStatusKey)).toEqual({
            promptId: OTHER_PROMPT_ID,
            status: 'CONNECTED',
        });
    });

    it('serializes prompt actions for one viewer so a failed action cannot roll back a success', async () => {
        const skipRequest = deferred<LCNConnectionPromptActionResult>();
        mockSkipConnectionPrompt.mockReturnValue(skipRequest.promise);
        mockConnectWithConnectionPrompt.mockResolvedValue({
            promptId: OTHER_PROMPT_ID,
            status: 'CONNECTED',
        });
        const queryClient = makeQueryClient();
        seedActionCaches(queryClient);

        const { result: skipResult } = renderHook(() => useSkipConnectionPromptMutation(), {
            wrapper: makeWrapper(queryClient),
        });
        const { result: connectResult } = renderHook(
            () => useConnectWithConnectionPromptMutation(),
            { wrapper: makeWrapper(queryClient) }
        );

        act(() => {
            skipResult.current.mutate(PROMPT_ID);
            connectResult.current.mutate(OTHER_PROMPT_ID);
        });

        await waitFor(() => expect(mockSkipConnectionPrompt).toHaveBeenCalledWith(PROMPT_ID));
        expect(mockConnectWithConnectionPrompt).not.toHaveBeenCalled();

        skipRequest.reject(new Error('server error'));

        await waitFor(() =>
            expect(mockConnectWithConnectionPrompt).toHaveBeenCalledWith(OTHER_PROMPT_ID)
        );
        await waitFor(() => expect(connectResult.current.isSuccess).toBe(true));
        expect(queryClient.getQueryData(connectionPromptKeys.pending(SWITCHED_DID))).toEqual([
            prompt,
        ]);
        expect(
            queryClient.getQueryData(connectionPromptKeys.status(SWITCHED_DID, OTHER_PROMPT_ID))
        ).toEqual({ promptId: OTHER_PROMPT_ID, status: 'CONNECTED' });
    });

    it('invalidates pending prompts only after credential acceptance succeeds', async () => {
        mockAcceptCredential.mockResolvedValue(true);
        const queryClient = makeQueryClient();
        queryClient.setQueryData(connectionPromptKeys.pending(SWITCHED_DID), []);

        const { result } = renderHook(() => useAcceptCredentialMutation(), {
            wrapper: makeWrapper(queryClient),
        });

        expect(
            queryClient.getQueryState(connectionPromptKeys.pending(SWITCHED_DID))?.isInvalidated
        ).toBe(false);

        await act(async () =>
            result.current.mutateAsync({ uri: 'lc:credential:123', metadata: { source: 'claim' } })
        );

        expect(mockAcceptCredential).toHaveBeenCalledWith('lc:credential:123', {
            metadata: { source: 'claim' },
        });
        expect(
            queryClient.getQueryState(connectionPromptKeys.pending(SWITCHED_DID))?.isInvalidated
        ).toBe(true);
    });
});
