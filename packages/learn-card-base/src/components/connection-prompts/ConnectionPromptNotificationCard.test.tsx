// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LCNConnectionPromptActionResult, LCNPublicProfile } from '@learncard/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ConnectionPromptNotificationCard,
    type ConnectionPromptNotificationCopy,
} from './ConnectionPromptNotificationCard';

vi.mock('learn-card-base', () => ({ CredentialCategoryEnum: {} }));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: () => null }));

const state = vi.hoisted(() => ({
    status: { promptId: '11111111-1111-4111-8111-111111111111', status: 'PENDING' } as
        | LCNConnectionPromptActionResult
        | undefined,
    statusLoading: false,
    statusError: false,
    connect: vi.fn<(promptId: string) => Promise<LCNConnectionPromptActionResult>>(),
    skip: vi.fn<(promptId: string) => Promise<LCNConnectionPromptActionResult>>(),
    updateNotification:
        vi.fn<
            (variables: {
                notificationId: string;
                payload: { actionStatus: 'COMPLETED' | 'REJECTED'; read: true };
            }) => Promise<boolean>
        >(),
    warn: vi.fn(),
}));

vi.mock('../../react-query/connectionPrompts', () => ({
    useConnectionPromptStatus: () => ({
        data: state.status,
        isLoading: state.statusLoading,
        isError: state.statusError,
    }),
    useConnectWithConnectionPromptMutation: () => ({ mutateAsync: state.connect }),
    useSkipConnectionPromptMutation: () => ({ mutateAsync: state.skip }),
}));

vi.mock('../../react-query/mutations/notifications', () => ({
    useUpdateNotification: () => ({ mutateAsync: state.updateNotification }),
}));

vi.mock('../../logging/logger', () => ({
    getLogger: () => ({ warn: state.warn }),
}));

const promptId = '11111111-1111-4111-8111-111111111111';
const counterpart: LCNPublicProfile = {
    profileId: 'alice',
    displayName: 'Alice',
    shortBio: '',
    image: '',
    heroImage: '',
    type: 'person',
    isServiceProfile: false,
    display: {},
};
const copy: ConnectionPromptNotificationCopy = {
    title: name => `Connect with ${name}?`,
    description: 'Stay in touch and recognize what comes next.',
    connect: 'Connect',
    skipForNow: 'Skip for Now',
    connecting: 'Connecting...',
    skipping: 'Skipping...',
    error: 'Something went wrong. Please try again.',
    connected: 'Connected',
    skipped: 'Skipped',
    claimedType: 'Credential claimed',
};

const renderCard = () =>
    render(
        <ConnectionPromptNotificationCard
            notificationId="notification-1"
            promptMetadata={{ promptId, counterpartProfileId: counterpart.profileId }}
            counterpart={counterpart}
            title="Alice claimed your credential"
            issueDate="August 20, 2026"
            copy={copy}
        />
    );

const deferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
};

describe('ConnectionPromptNotificationCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.status = { promptId, status: 'PENDING' };
        state.statusLoading = false;
        state.statusError = false;
        state.connect.mockResolvedValue({ promptId, status: 'CONNECTED' });
        state.skip.mockResolvedValue({ promptId, status: 'SKIPPED' });
        state.updateNotification.mockResolvedValue(true);
    });

    it('shows the sender message and explicit actions only for a pending server status', () => {
        const { container } = renderCard();

        expect(screen.getByText('Alice claimed your credential')).toBeTruthy();
        expect(screen.getByText('Credential claimed')).toBeTruthy();
        expect(
            screen.getByText(
                (_content, element) =>
                    element?.tagName === 'SPAN' &&
                    element.textContent?.includes('August 20, 2026') === true
            )
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Connect' }).className).toContain(
            'rounded-[20px]'
        );
        expect(screen.getByRole('button', { name: 'Skip for Now' }).className).toContain(
            'rounded-[20px]'
        );
        expect(container.firstElementChild?.className).toContain('font-poppins');
    });

    it('connects once, disables both actions, and persists the authoritative result', async () => {
        const request = deferred<LCNConnectionPromptActionResult>();
        state.connect.mockReturnValue(request.promise);
        renderCard();

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        fireEvent.click(screen.getByRole('button', { name: 'Connecting...' }));

        expect(state.connect).toHaveBeenCalledOnce();
        expect(state.connect).toHaveBeenCalledWith(promptId);
        expect(
            (screen.getByRole('button', { name: 'Connecting...' }) as HTMLButtonElement).disabled
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: 'Skip for Now' }) as HTMLButtonElement).disabled
        ).toBe(true);

        request.resolve({ promptId, status: 'CONNECTED' });

        await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
        expect(state.updateNotification).toHaveBeenCalledWith({
            notificationId: 'notification-1',
            payload: { actionStatus: 'COMPLETED', read: true },
        });
        expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
    });

    it('skips once and marks the notification rejected and read', async () => {
        const request = deferred<LCNConnectionPromptActionResult>();
        state.skip.mockReturnValue(request.promise);
        renderCard();

        fireEvent.click(screen.getByRole('button', { name: 'Skip for Now' }));

        expect(state.skip).toHaveBeenCalledOnce();
        expect(
            (screen.getByRole('button', { name: 'Skipping...' }) as HTMLButtonElement).disabled
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled
        ).toBe(true);

        request.resolve({ promptId, status: 'SKIPPED' });

        await waitFor(() => expect(screen.getByText('Skipped')).toBeTruthy());
        expect(state.skip).toHaveBeenCalledWith(promptId);
        expect(state.updateNotification).toHaveBeenCalledWith({
            notificationId: 'notification-1',
            payload: { actionStatus: 'REJECTED', read: true },
        });
    });

    it.each([
        ['CONNECTED', 'Connected'],
        ['SKIPPED', 'Skipped'],
        ['STALE', 'Skipped'],
    ] as const)('does not offer actions when the server status is %s', (status, label) => {
        state.status = { promptId, status };
        renderCard();

        expect(screen.getByText(label)).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Skip for Now' })).toBeNull();
    });

    it('withholds actions until current status is known', () => {
        state.status = undefined;
        state.statusLoading = true;
        renderCard();

        expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Skip for Now' })).toBeNull();
    });

    it('shows a friendly error and enables retry when a prompt action fails', async () => {
        state.connect.mockRejectedValue(new Error('raw backend details'));
        renderCard();

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

        expect((await screen.findByRole('alert')).textContent).toContain(copy.error);
        expect(screen.queryByText('raw backend details')).toBeNull();
        expect(
            (screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled
        ).toBe(false);
        expect(state.updateNotification).not.toHaveBeenCalled();
    });

    it('keeps a successful graph result when notification metadata persistence fails', async () => {
        state.updateNotification.mockRejectedValue(new Error('metadata failed'));
        renderCard();

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

        await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy());
        expect(screen.queryByRole('alert')).toBeNull();
        expect(state.warn).toHaveBeenCalledOnce();
    });
});
