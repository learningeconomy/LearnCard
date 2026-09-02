/**
 * Regression tests for the header "alerts island" unread-count that failed to
 * decrement after a notification was read.
 *
 * Root cause: `useUpdateNotification.onSuccess` and
 * `useMarkAllNotificationsRead.onSuccess` read the switched DID via
 * `switchedProfileStore.use.switchedDid()` — a zustand React hook — from inside
 * the react-query mutation callback (i.e. outside a React render). Calling a
 * hook there throws, which aborts the `invalidateQueries` / `refetchQueries`
 * for `['useGetUnreadUserNotifications', did]` before it runs, so the island
 * never refetches and the badge never decrements.
 *
 * The correct, codebase-wide pattern for reading the store from a callback is
 * the non-reactive `switchedProfileStore.get.switchedDid()` (see boosts.ts /
 * mutations.ts). The store interface is mocked in-memory here because the
 * persisted store's jsdom storage shim is not available in this test runtime.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUpdateNotificationMeta = vi.fn();
const mockMarkAllNotificationsRead = vi.fn();
const mockGetNotifications = vi.fn();

const mockWallet = {
    invoke: {
        updateNotificationMeta: mockUpdateNotificationMeta,
        markAllNotificationsRead: mockMarkAllNotificationsRead,
        getNotifications: mockGetNotifications,
    },
};

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

vi.mock('learn-card-base', () => {
    return {
        switchedProfileStore: mockSwitchedProfileStore,
        walletStore: {},
        useWallet: () => ({ initWallet: async () => mockWallet }),
        DEFAULT_ACTIVE_OPTIONS: { limit: 30, sort: 'REVERSE_CHRONOLOGICAL' },
        DEFAULT_ACTIVE_FILTER: { archived: false },
        DEFAULT_ARCHIVE_OPTIONS: { limit: 30, sort: 'REVERSE_CHRONOLOGICAL' },
        DEFAULT_ARCHIVE_FILTER: { archived: true },
    };
});

import {
    useUpdateNotification,
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
} from './notifications';

const UNREAD_KEY = ['useGetUnreadUserNotifications', ''];
const ACTIVE_KEY = [
    'useGetUserNotifications',
    '',
    { limit: 30, sort: 'REVERSE_CHRONOLOGICAL' },
    { archived: false },
];

const makeWrapper =
    (queryClient: QueryClient) =>
    ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

const seedUnread = (queryClient: QueryClient, ids: string[]) => {
    queryClient.setQueryData(UNREAD_KEY, {
        hasMore: false,
        notifications: ids.map(id => ({
            _id: id,
            read: false,
            archived: false,
            type: 'BOOST',
            sent: '',
        })),
    });
};

const unreadIds = (queryClient: QueryClient): string[] => {
    const data = queryClient.getQueryData(UNREAD_KEY) as
        | { notifications: { _id: string }[] }
        | undefined;
    return (data?.notifications ?? []).map(n => n._id);
};

describe('notification mutations — alerts island unread count', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSwitchedProfileStore.set.switchedDid(undefined); // resolves to '' in query keys
        mockUpdateNotificationMeta.mockResolvedValue(true);
        mockMarkAllNotificationsRead.mockResolvedValue(true);
        mockGetNotifications.mockResolvedValue({ hasMore: false, notifications: [] });
    });

    it('invalidates the unread query on a read update (onSuccess must not throw)', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        seedUnread(queryClient, ['n1']);

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current
            .mutateAsync({ notificationId: 'n1', payload: { read: true } })
            .catch(() => {});

        await waitFor(() =>
            expect(invalidateSpy).toHaveBeenCalledWith(
                expect.objectContaining({ queryKey: UNREAD_KEY })
            )
        );
    });

    it('optimistically removes the read notification from the unread cache', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        seedUnread(queryClient, ['n1', 'n2']);

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current
            .mutateAsync({ notificationId: 'n1', payload: { read: true } })
            .catch(() => {});

        expect(unreadIds(queryClient)).toEqual(['n2']);
    });

    it('optimistically decrements the unread cache on a claim (actionStatus + read)', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        seedUnread(queryClient, ['n1', 'n2']);

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current
            .mutateAsync({
                notificationId: 'n2',
                payload: { actionStatus: 'COMPLETED', read: true },
            })
            .catch(() => {});

        expect(unreadIds(queryClient)).toEqual(['n1']);
    });

    it('optimistically updates actionStatus across notification pages without changing other metadata', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const original = {
            pages: [
                {
                    hasMore: true,
                    cursor: 'page-2',
                    notifications: [
                        {
                            _id: 'unrelated',
                            read: false,
                            archived: false,
                            type: 'BOOST',
                            sent: '2026-08-20T12:00:00.000Z',
                            metadata: { campaign: 'summer' },
                        },
                    ],
                },
                {
                    hasMore: false,
                    notifications: [
                        {
                            _id: 'target',
                            read: false,
                            archived: false,
                            type: 'BOOST_ACCEPTED',
                            sent: '2026-08-20T12:01:00.000Z',
                            actionStatus: 'PENDING',
                            metadata: {
                                campaign: 'fall',
                                connectionPrompt: {
                                    promptId: '11111111-1111-4111-8111-111111111111',
                                    counterpartProfileId: 'counterpart-profile',
                                },
                            },
                        },
                    ],
                },
            ],
            pageParams: [undefined, 'page-2'],
        };
        queryClient.setQueryData(ACTIVE_KEY, original);

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({
            notificationId: 'target',
            payload: { actionStatus: 'COMPLETED' },
        });

        const updated = queryClient.getQueryData(ACTIVE_KEY) as typeof original;
        expect(updated.pages[1]?.notifications[0]).toEqual({
            ...original.pages[1]?.notifications[0],
            actionStatus: 'COMPLETED',
        });
        expect(updated.pages[0]).toEqual(original.pages[0]);
        expect(updated.pageParams).toEqual(original.pageParams);
    });

    it('restores the complete notification snapshot when an actionStatus update fails', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const original = {
            pages: [
                {
                    hasMore: false,
                    notifications: [
                        {
                            _id: 'target',
                            read: false,
                            archived: false,
                            type: 'BOOST_ACCEPTED',
                            sent: '2026-08-20T12:01:00.000Z',
                            actionStatus: 'PENDING',
                            metadata: { campaign: 'fall' },
                        },
                        {
                            _id: 'unrelated',
                            read: true,
                            archived: false,
                            type: 'BOOST',
                            sent: '2026-08-20T12:00:00.000Z',
                        },
                    ],
                },
            ],
            pageParams: [undefined],
        };
        queryClient.setQueryData(ACTIVE_KEY, original);
        let rejectUpdate!: (reason: unknown) => void;
        mockUpdateNotificationMeta.mockReturnValue(
            new Promise((_resolve, reject) => {
                rejectUpdate = reject;
            })
        );

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        result.current.mutate({
            notificationId: 'target',
            payload: { actionStatus: 'REJECTED' },
        });

        await waitFor(() =>
            expect(
                (queryClient.getQueryData(ACTIVE_KEY) as typeof original).pages[0]?.notifications[0]
                    ?.actionStatus
            ).toBe('REJECTED')
        );

        rejectUpdate(new Error('server error'));

        await waitFor(() => expect(queryClient.getQueryData(ACTIVE_KEY)).toEqual(original));
    });

    it('serializes notification updates per viewer so a failed update preserves a concurrent success', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const original = {
            pages: [
                {
                    hasMore: false,
                    notifications: [
                        {
                            _id: 'notification-a',
                            read: false,
                            archived: false,
                            type: 'BOOST_ACCEPTED',
                            sent: '2026-08-20T12:00:00.000Z',
                            actionStatus: 'PENDING',
                        },
                        {
                            _id: 'notification-b',
                            read: false,
                            archived: false,
                            type: 'BOOST_ACCEPTED',
                            sent: '2026-08-20T12:01:00.000Z',
                            actionStatus: 'PENDING',
                        },
                    ],
                },
            ],
            pageParams: [undefined],
        };
        queryClient.setQueryData(ACTIVE_KEY, original);
        let rejectFirst!: (reason: unknown) => void;
        mockUpdateNotificationMeta.mockImplementation((notificationId: string) => {
            if (notificationId === 'notification-a') {
                return new Promise((_resolve, reject) => {
                    rejectFirst = reject;
                });
            }

            return Promise.resolve(true);
        });

        const { result: first } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });
        const { result: second } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        first.current.mutate({
            notificationId: 'notification-a',
            payload: { actionStatus: 'REJECTED' },
        });
        second.current.mutate({
            notificationId: 'notification-b',
            payload: { actionStatus: 'COMPLETED' },
        });

        await waitFor(() =>
            expect(mockUpdateNotificationMeta).toHaveBeenCalledWith('notification-a', {
                actionStatus: 'REJECTED',
            })
        );
        expect(mockUpdateNotificationMeta).not.toHaveBeenCalledWith('notification-b', {
            actionStatus: 'COMPLETED',
        });

        rejectFirst(new Error('server error'));

        await waitFor(() =>
            expect(mockUpdateNotificationMeta).toHaveBeenCalledWith('notification-b', {
                actionStatus: 'COMPLETED',
            })
        );
        await waitFor(() => expect(second.current.isSuccess).toBe(true));
        const updated = queryClient.getQueryData(ACTIVE_KEY) as typeof original;
        expect(updated.pages[0]?.notifications).toEqual([
            original.pages[0]!.notifications[0],
            { ...original.pages[0]!.notifications[1], actionStatus: 'COMPLETED' },
        ]);
    });

    it('rolls back the optimistic unread decrement when the mutation fails', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        seedUnread(queryClient, ['n1', 'n2']);
        mockUpdateNotificationMeta.mockRejectedValue(new Error('server error'));

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current
            .mutateAsync({ notificationId: 'n1', payload: { read: true } })
            .catch(() => {});

        // Optimistic removal is reverted by onError, so the badge count is
        // restored rather than left stuck at the decremented value.
        await waitFor(() => expect(unreadIds(queryClient)).toEqual(['n1', 'n2']));
    });

    it('leaves unread membership unchanged when an actionStatus-only mutation fails', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        seedUnread(queryClient, ['n1', 'n2']);
        mockUpdateNotificationMeta.mockRejectedValue(new Error('server error'));

        const { result } = renderHook(() => useUpdateNotification(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current
            .mutateAsync({ notificationId: 'n1', payload: { actionStatus: 'REJECTED' } })
            .catch(() => {});

        await waitFor(() => expect(unreadIds(queryClient)).toEqual(['n1', 'n2']));
    });

    it('useMarkNotificationRead optimistically decrements the unread cache and invalidates it', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        seedUnread(queryClient, ['n1', 'n2']);

        const { result } = renderHook(() => useMarkNotificationRead(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync({ notificationId: 'n1' }).catch(() => {});

        // Optimistic decrement (the old code's optimistic block was dead because
        // it read `read` off the boolean return value instead of the variables).
        expect(unreadIds(queryClient)).toEqual(['n2']);

        await waitFor(() =>
            expect(invalidateSpy).toHaveBeenCalledWith(
                expect.objectContaining({ queryKey: UNREAD_KEY })
            )
        );
    });

    it('mark-all-read invalidates and refetches the unread query (onSuccess must not throw)', async () => {
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');
        seedUnread(queryClient, ['n1']);

        const { result } = renderHook(() => useMarkAllNotificationsRead(), {
            wrapper: makeWrapper(queryClient),
        });

        await result.current.mutateAsync().catch(() => {});

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith(
                expect.objectContaining({ queryKey: UNREAD_KEY })
            );
            expect(refetchSpy).toHaveBeenCalledWith(
                expect.objectContaining({ queryKey: UNREAD_KEY })
            );
        });
    });
});
