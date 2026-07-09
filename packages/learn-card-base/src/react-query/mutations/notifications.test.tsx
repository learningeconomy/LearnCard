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
 * mutations.ts). These tests use the REAL store so `.use.*()` genuinely throws
 * outside render, faithfully reproducing the bug.
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

// Use the REAL switchedProfileStore/walletStore so `.use.switchedDid()` behaves
// like the production hook (throws outside render). Only `useWallet` is stubbed.
vi.mock('learn-card-base', async () => {
    const { switchedProfileStore, walletStore } = await import('../../stores/walletStore');

    return {
        switchedProfileStore,
        walletStore,
        useWallet: () => ({ initWallet: async () => mockWallet }),
        DEFAULT_ACTIVE_OPTIONS: { limit: 30, sort: 'REVERSE_CHRONOLOGICAL' },
        DEFAULT_ACTIVE_FILTER: { archived: false },
        DEFAULT_ARCHIVE_OPTIONS: { limit: 30, sort: 'REVERSE_CHRONOLOGICAL' },
        DEFAULT_ARCHIVE_FILTER: { archived: true },
    };
});

import { switchedProfileStore } from '../../stores/walletStore';
import { useUpdateNotification, useMarkAllNotificationsRead } from './notifications';

const UNREAD_KEY = ['useGetUnreadUserNotifications', ''];

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
        switchedProfileStore.set.switchedDid(undefined); // resolves to '' in query keys
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
                payload: { actionStatus: 'COMPLETED', read: true } as any,
            })
            .catch(() => {});

        expect(unreadIds(queryClient)).toEqual(['n1']);
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
