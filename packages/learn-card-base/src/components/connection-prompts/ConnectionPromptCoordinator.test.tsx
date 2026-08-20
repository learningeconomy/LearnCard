// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { LCNConnectionPrompt } from '@learncard/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModalsProvider, useModalsContext } from '../modals/ModalsContext';
import { useModal } from '../modals/useModal';
import { ConnectionPromptCoordinator } from './ConnectionPromptCoordinator';
import type { ConnectionPromptCopy } from './ConnectionPromptModal';

// ConnectionPromptModal renders UserProfilePicture. Its sibling signed-in avatar reaches the
// root barrel through a legacy color-helper import, which is unrelated to coordinator behavior.
vi.mock('learn-card-base', () => ({ CredentialCategoryEnum: {} }));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: () => null }));

const state = vi.hoisted(() => ({
    loggedIn: true,
    switchedDid: undefined as string | undefined,
    prompts: [] as LCNConnectionPrompt[],
    connect: vi.fn<(promptId: string) => Promise<void>>(),
    skip: vi.fn<(promptId: string) => Promise<void>>(),
    dismissToast: vi.fn(),
}));

vi.mock('../../react-query/connectionPrompts', () => ({
    usePendingConnectionPrompts: () => ({ data: state.prompts }),
    useConnectWithConnectionPromptMutation: () => ({ mutateAsync: state.connect }),
    useSkipConnectionPromptMutation: () => ({ mutateAsync: state.skip }),
}));

vi.mock('../../stores/currentUserStore', () => ({
    useIsLoggedIn: () => state.loggedIn,
}));

vi.mock('../../stores/walletStore', () => ({
    switchedProfileStore: { use: { switchedDid: () => state.switchedDid } },
}));

vi.mock('../../hooks/useToast', () => ({
    useToast: () => ({ dismissToast: state.dismissToast }),
}));

const copy: ConnectionPromptCopy = {
    title: name => `Connect with ${name}?`,
    description: 'Stay in touch and recognize what comes next.',
    connect: 'Connect',
    skipForNow: 'Skip for Now',
    connecting: 'Connecting...',
    skipping: 'Skipping...',
    error: 'Something went wrong. Please try again.',
};

const makePrompt = (
    promptId: string,
    profileId: string,
    displayName: string,
    triggeredAt: string,
    surface: LCNConnectionPrompt['surface'] = 'POST_CLAIM'
): LCNConnectionPrompt => ({
    promptId,
    status: 'PENDING',
    surface,
    triggerId: `credential-${promptId}`,
    triggeredAt,
    updatedAt: triggeredAt,
    counterpart: {
        profileId,
        displayName,
        shortBio: '',
        image: '',
        heroImage: '',
        type: 'person',
        isServiceProfile: false,
        display: {},
    },
});

const alice = makePrompt(
    '11111111-1111-4111-8111-111111111111',
    'alice',
    'Alice',
    '2026-08-20T12:00:00.000Z'
);
const bob = makePrompt(
    '22222222-2222-4222-8222-222222222222',
    'bob',
    'Bob',
    '2026-08-20T12:01:00.000Z'
);

const ModalHarness: React.FC = () => {
    const { modals } = useModalsContext();
    const { newModal, closeModal } = useModal();
    const current = modals.at(-1);

    return (
        <>
            <button type="button" onClick={() => newModal(<div>Existing modal</div>)}>
                Open Existing
            </button>
            <button
                type="button"
                onClick={() => {
                    current?.options?.onClose?.();
                    closeModal();
                }}
            >
                Native Close
            </button>
            <output data-testid="modal-count">{modals.length}</output>
            {current?.component}
        </>
    );
};

const renderCoordinator = () =>
    render(
        <ModalsProvider>
            <ConnectionPromptCoordinator copy={copy} />
            <ModalHarness />
        </ModalsProvider>
    );

const advance = async (milliseconds: number) => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(milliseconds);
    });
};

describe('ConnectionPromptCoordinator', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        state.loggedIn = true;
        state.switchedDid = undefined;
        state.prompts = [];
        state.connect.mockReset().mockResolvedValue(undefined);
        state.skip.mockReset().mockResolvedValue(undefined);
        state.dismissToast.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('waits for the modal stack to clear, then presents the oldest POST_CLAIM prompt', async () => {
        const view = renderCoordinator();
        fireEvent.click(screen.getByRole('button', { name: 'Open Existing' }));
        state.prompts = [
            makePrompt(
                '33333333-3333-4333-8333-333333333333',
                'sender',
                'Notification Sender',
                '2026-08-20T11:59:00.000Z',
                'NOTIFICATION'
            ),
            bob,
            alice,
        ];
        view.rerender(
            <ModalsProvider>
                <ConnectionPromptCoordinator copy={copy} />
                <ModalHarness />
            </ModalsProvider>
        );

        await advance(500);
        expect(screen.getByText('Existing modal')).toBeTruthy();
        expect(screen.queryByRole('heading', { name: /Connect with/ })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));
        await advance(300);
        await advance(149);
        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
        await advance(1);

        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();
        expect(screen.queryByText('Notification Sender')).toBeNull();
        expect(state.dismissToast).toHaveBeenCalledOnce();
    });

    it('treats native close as one durable Skip action', async () => {
        state.prompts = [alice];
        renderCoordinator();
        await advance(150);

        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));

        expect(state.skip).toHaveBeenCalledOnce();
        expect(state.skip).toHaveBeenCalledWith(alice.promptId);
        expect(state.connect).not.toHaveBeenCalled();
    });

    it('does not turn a successful explicit Connect into a Skip', async () => {
        state.prompts = [alice];
        state.connect.mockImplementation(async promptId => {
            state.prompts = state.prompts.filter(prompt => prompt.promptId !== promptId);
        });
        renderCoordinator();
        await advance(150);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        });

        expect(state.connect).toHaveBeenCalledWith(alice.promptId);
        expect(state.skip).not.toHaveBeenCalled();
    });

    it('queues different counterparts one at a time without reopening the active pair', async () => {
        state.prompts = [bob, alice];
        state.skip.mockImplementation(async promptId => {
            state.prompts = state.prompts.filter(prompt => prompt.promptId !== promptId);
        });
        const view = renderCoordinator();
        await advance(150);

        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();
        view.rerender(
            <ModalsProvider>
                <ConnectionPromptCoordinator copy={copy} />
                <ModalHarness />
            </ModalsProvider>
        );
        await advance(500);
        expect(screen.getByTestId('modal-count').textContent).toBe('1');

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Skip for Now' }));
        });
        await advance(300);
        await advance(150);

        expect(screen.getByRole('heading', { name: 'Connect with Bob?' })).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
    });

    it.each([
        ['logout', () => (state.loggedIn = false)],
        ['switched-profile change', () => (state.switchedDid = 'did:web:new-profile')],
    ])('clears the active prompt before an old modal closes on %s', async (_label, resetViewer) => {
        state.prompts = [alice];
        const view = renderCoordinator();
        await advance(150);

        resetViewer();
        view.rerender(
            <ModalsProvider>
                <ConnectionPromptCoordinator copy={copy} />
                <ModalHarness />
            </ModalsProvider>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));

        expect(state.skip).not.toHaveBeenCalled();
    });
});
