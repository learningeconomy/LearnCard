// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NewNotificationsList from './NewNotificationsList';

type TestNotification = {
    _id: string;
    type: string;
    message: { body: string };
    data: Record<string, unknown>;
};

const state = vi.hoisted(() => ({ notifications: [] as TestNotification[] }));

vi.mock('learn-card-base', () => ({
    useGetUserNotifications: () => ({
        data: {
            pages: [{ notifications: state.notifications, hasMore: false }],
            pageParams: [undefined],
        },
        isLoading: false,
        isFetching: false,
        isRefetching: false,
        refetch: vi.fn(),
    }),
}));
vi.mock('react-lottie-player', () => ({ default: () => null }));
vi.mock('./NotificationSkeleton', () => ({ default: () => null }));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('./NotificationCardContainer', () => ({
    default: ({ notification }: { notification: TestNotification }) => (
        <div data-testid="rendered-notification">{notification.message?.body}</div>
    ),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'notifications.loading': () => 'Loading notifications',
    'notifications.noNotificationsFound': () => 'No notifications',
    'notifications.checkAgain': () => 'Check again',
}));

const promptId = '11111111-1111-4111-8111-111111111111';
const otherPromptId = '22222222-2222-4222-8222-222222222222';
const notification = (id: string, body: string, connectionPrompt?: unknown): TestNotification =>
    ({
        _id: id,
        type: 'BOOST_ACCEPTED',
        read: false,
        archived: false,
        from: { did: 'did:key:alice', profileId: 'alice', displayName: 'Alice' },
        to: { did: 'did:key:viewer' },
        message: { body },
        data: connectionPrompt === undefined ? {} : { metadata: { connectionPrompt } },
        sent: '2026-08-20T12:00:00.000Z',
    } as TestNotification);

describe('NewNotificationsList connection prompt delivery', () => {
    beforeEach(() => {
        state.notifications = [];
    });

    it('keeps the first actionable prompt delivery while preserving legacy and malformed entries', () => {
        state.notifications = [
            notification('prompt-first', 'First prompt', {
                promptId,
                counterpartProfileId: 'alice',
            }),
            notification('legacy', 'Legacy boost accepted'),
            notification('prompt-duplicate', 'Duplicate prompt', {
                promptId,
                counterpartProfileId: 'alice',
            }),
            notification('malformed', 'Malformed prompt', {
                promptId: 'not-a-uuid',
                counterpartProfileId: 'alice',
            }),
            notification('other-prompt', 'Other prompt', {
                promptId: otherPromptId,
                counterpartProfileId: 'bob',
            }),
        ];

        render(
            <NewNotificationsList
                options={{ limit: 30, sort: 'REVERSE_CHRONOLOGICAL' }}
                filter={{ archived: false }}
                isEmptyState={false}
                setIsEmptyState={vi.fn()}
            />
        );

        expect(
            screen.getAllByTestId('rendered-notification').map(node => node.textContent)
        ).toEqual(['First prompt', 'Legacy boost accepted', 'Malformed prompt', 'Other prompt']);
    });
});
