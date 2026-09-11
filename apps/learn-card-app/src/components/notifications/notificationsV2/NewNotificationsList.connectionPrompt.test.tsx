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
        refetch: vi.fn(),
    }),
}));
vi.mock('learn-card-base/svgs/ArrowCircle', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({ IonSpinner: () => null }));
vi.mock('apps/learn-card-app/src/stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({
        getIconSet: () => ({ telescope: () => null }),
        getColorSet: () => ({ primaryColor: 'grayscale-900' }),
    }),
}));
vi.mock('../../generic/GenericErrorBoundary', () => ({
    default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('./GroupedConsentFlowCard', () => ({ default: () => null }));
vi.mock('./NotificationCardContainer', () => ({
    NOTIFICATION_TYPES: { CONSENT_FLOW_TRANSACTION: 'CONSENT_FLOW_TRANSACTION' },
    default: ({ notification }: { notification: TestNotification }) => (
        <div data-testid="rendered-notification">{notification.message?.body}</div>
    ),
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'alerts.loadingNotifications': () => 'Loading notifications',
    'alerts.noAlerts': () => 'No alerts',
    'alerts.refresh': () => 'Refresh',
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
