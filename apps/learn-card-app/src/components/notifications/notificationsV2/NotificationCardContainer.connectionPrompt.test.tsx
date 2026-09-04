// @vitest-environment jsdom

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationCardContainer } from './NotificationCardContainer';

const mocks = vi.hoisted(() => ({ promptProps: vi.fn() }));

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        accommodation: 'Accommodation',
        accomplishment: 'Accomplishment',
        achievement: 'Achievement',
        family: 'Family',
        id: 'ID',
        learningHistory: 'Learning History',
        membership: 'Membership',
        skill: 'Skill',
        socialBadge: 'Social Badge',
        workHistory: 'Work History',
    },
    ConnectionPromptNotificationCard: (props: unknown) => {
        mocks.promptProps(props);
        return <div data-testid="connection-prompt-notification" />;
    },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    useAcceptConnectionRequestMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useGetCurrentLCNUser: () => ({ refetch: vi.fn() }),
    useGetProfile: () => ({ data: undefined, isLoading: false }),
    useMarkNotificationRead: () => ({ mutate: vi.fn() }),
    useUpdateNotification: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}));

vi.mock('./NotificationBoostCard', () => ({
    default: () => <div data-testid="boost-notification" />,
}));
vi.mock('./ConnectionRequestCard', () => ({ default: () => null }));
vi.mock('./NotificationConsentFlowCard', () => ({ default: () => null }));
vi.mock('./NotificationProfileApprovalCard', () => ({ default: () => null }));
vi.mock('./NotificationAppStoreCard', () => ({ default: () => null }));
vi.mock('./NotificationGuardianApprovalCard', () => ({ default: () => null }));
vi.mock('./NotificationGuardianOutcomeCard', () => ({ default: () => null }));
vi.mock('./NotificationAppNotificationCard', () => ({ default: () => null }));
vi.mock('./NotificationCredentialStatusCard', () => ({ default: () => null }));
vi.mock('./NotificationCredentialRefreshedCard', () => ({ default: () => null }));
vi.mock('../../../paraglide/messages.js', () => ({
    'connectionPrompts.title': ({ name }: { name: string }) => `Connect with ${name}?`,
    'connectionPrompts.description': () => 'Stay in touch and recognize what comes next.',
    'connectionPrompts.connect': () => 'Connect',
    'connectionPrompts.skipForNow': () => 'Skip for Now',
    'connectionPrompts.connecting': () => 'Connecting...',
    'connectionPrompts.skipping': () => 'Skipping...',
    'connectionPrompts.error': () => 'Something went wrong. Please try again.',
    'connectionPrompts.connected': () => 'Connected',
    'connectionPrompts.skipped': () => 'Skipped',
    'connectionPrompts.claimedType': () => 'Credential claimed',
}));

const promptId = '11111111-1111-4111-8111-111111111111';
const makeNotification = (connectionPrompt?: unknown): NotificationType =>
    ({
        _id: 'notification-1',
        type: 'BOOST_ACCEPTED',
        read: false,
        archived: false,
        actionStatus: 'PENDING',
        from: {
            did: 'did:key:alice',
            profileId: 'alice',
            displayName: 'Alice',
        },
        to: { did: 'did:key:issuer' },
        message: { body: 'Alice claimed your credential' },
        data: connectionPrompt === undefined ? {} : { metadata: { connectionPrompt } },
        sent: '2026-08-20T12:00:00.000Z',
    }) as NotificationType;

const renderContainer = (notification: NotificationType) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <NotificationCardContainer notification={notification} />
        </QueryClientProvider>
    );
};

describe('NotificationCardContainer connection prompts', () => {
    beforeEach(() => vi.clearAllMocks());

    it('routes actionable BOOST_ACCEPTED metadata to the connection prompt card', () => {
        renderContainer(makeNotification({ promptId, counterpartProfileId: 'alice' }));

        expect(screen.getByTestId('connection-prompt-notification')).toBeInTheDocument();
        expect(screen.queryByTestId('boost-notification')).not.toBeInTheDocument();
        expect(mocks.promptProps).toHaveBeenCalledWith(
            expect.objectContaining({
                notificationId: 'notification-1',
                promptMetadata: { promptId, counterpartProfileId: 'alice' },
                title: 'Alice claimed your credential',
                copy: expect.objectContaining({
                    connect: 'Connect',
                    connected: 'Connected',
                    claimedType: 'Credential claimed',
                }),
            })
        );
    });

    it('keeps legacy BOOST_ACCEPTED on the boost notification card', () => {
        renderContainer(makeNotification());

        expect(screen.getByTestId('boost-notification')).toBeInTheDocument();
        expect(screen.queryByTestId('connection-prompt-notification')).not.toBeInTheDocument();
    });

    it('falls back to the legacy card for malformed prompt metadata', () => {
        renderContainer(makeNotification({ promptId: 'not-a-uuid', counterpartProfileId: 42 }));

        expect(screen.getByTestId('boost-notification')).toBeInTheDocument();
        expect(screen.queryByTestId('connection-prompt-notification')).not.toBeInTheDocument();
    });
});
