import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const { usePassportActivities, lcn } = vi.hoisted(() => ({
    usePassportActivities: vi.fn(),
    lcn: { currentLCNUser: { profileId: 'me' } as any, currentLCNUserLoading: false },
}));
vi.mock('./usePassportActivities', () => ({ usePassportActivities }));
vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    useWallet: () => ({ initWallet: vi.fn() }),
    useGetCurrentLCNUser: () => lcn,
}));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => false }));
// The row's presentation (avatar/category icon) is covered by ActivityFeedItem's
// own test; here we only assert the feed renders a row per record.
vi.mock('./ActivityFeedItem', () => ({
    ActivityFeedItem: ({ item }: { item: { title: string } }) => <div>{item.title}</div>,
}));

import { PassportActivityFeed } from './PassportActivityFeed';

const baseQuery = {
    data: { pages: [{ records: [], hasMore: false }] },
    isPending: false,
    isError: false,
    isFetching: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
};
const recordFixture = {
    id: 'a1',
    eventType: 'CREATED',
    timestamp: '2026-06-23T00:00:00Z',
    actorProfileId: 'me',
    recipientIdentifier: 'justin',
    boost: { id: 'b', name: 'Coding 101', category: 'socialBadge' },
    recipientProfile: { profileId: 'justin', displayName: 'Justin Smith' },
};
beforeEach(() => {
    usePassportActivities.mockReset();
    lcn.currentLCNUser = { profileId: 'me' };
    lcn.currentLCNUserLoading = false;
});

describe('PassportActivityFeed', () => {
    it('shows the ACTIVITY header', () => {
        usePassportActivities.mockReturnValue(baseQuery);
        const { getByText } = render(<PassportActivityFeed />);
        expect(getByText('ACTIVITY')).toBeTruthy();
    });
    it('shows an empty state when there are no records', () => {
        usePassportActivities.mockReturnValue(baseQuery);
        const { getByText } = render(<PassportActivityFeed />);
        expect(getByText(/No activity yet/i)).toBeTruthy();
    });
    it('renders a month group + item when records exist', async () => {
        usePassportActivities.mockReturnValue({
            ...baseQuery,
            data: {
                pages: [
                    {
                        records: [
                            {
                                id: 'a1',
                                eventType: 'CREATED',
                                timestamp: '2026-06-23T00:00:00Z',
                                actorProfileId: 'me',
                                recipientIdentifier: 'justin',
                                recipientType: 'profile',
                                source: 'sendBoost',
                                boost: { id: 'b', name: 'Coding 101', category: 'socialBadge' },
                                recipientProfile: {
                                    profileId: 'justin',
                                    displayName: 'Justin Smith',
                                },
                            },
                        ],
                        hasMore: false,
                    },
                ],
            },
        });
        const { getByText } = render(<PassportActivityFeed />);
        await waitFor(() => expect(getByText('JUNE 2026')).toBeTruthy());
        expect(getByText('You sent a Badge to Justin Smith')).toBeTruthy();
    });
    it('shows an error state on query error', () => {
        usePassportActivities.mockReturnValue({ ...baseQuery, isError: true });
        const { getByText } = render(<PassportActivityFeed />);
        expect(getByText(/couldn’t load|couldn't load|Something went wrong/i)).toBeTruthy();
    });
    it('holds rows until the profile resolves (no sent/received flash)', () => {
        // Records are loaded, but the profile is still resolving: direction is
        // unknown, so the feed must not paint rows yet (they'd all read "sent").
        lcn.currentLCNUser = null;
        lcn.currentLCNUserLoading = true;
        usePassportActivities.mockReturnValue({
            ...baseQuery,
            data: { pages: [{ records: [recordFixture], hasMore: false }] },
        });
        const { queryByText } = render(<PassportActivityFeed />);
        expect(queryByText('You sent a Badge to Justin Smith')).toBeNull();
        expect(queryByText(/No activity yet/i)).toBeNull();
    });
});
