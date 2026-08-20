// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { LCNConnectionPrompt } from '@learncard/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModalsProvider, useModalsContext } from '../modals/ModalsContext';
import CenterModal from '../modals/CenterModal';
import { useModal } from '../modals/useModal';
import { ConnectionPromptCoordinator } from './ConnectionPromptCoordinator';
import ConnectionPromptModal, {
    type ConnectionPromptCopy,
    type ConnectionPromptModalProps,
} from './ConnectionPromptModal';

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

const deferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
};

let capturedPromptActions: Pick<ConnectionPromptModalProps, 'onConnect' | 'onSkip'> | null = null;

const ModalHarness: React.FC = () => {
    const { modals } = useModalsContext();
    const { newModal, closeAllModals } = useModal();
    const current = modals.findLast(modal => modal.open);

    if (
        React.isValidElement<ConnectionPromptModalProps>(current?.component) &&
        current.component.type === ConnectionPromptModal
    ) {
        capturedPromptActions = {
            onConnect: current.component.props.onConnect,
            onSkip: current.component.props.onSkip,
        };
    }

    return (
        <>
            <button
                type="button"
                onClick={() => newModal(<div>Existing modal</div>, { hideButton: false })}
            >
                Open Existing
            </button>
            <button
                type="button"
                onClick={() => {
                    document.querySelector<HTMLButtonElement>('.center-modal-x')?.click();
                }}
            >
                Native Close
            </button>
            <button type="button" onClick={closeAllModals}>
                Close All
            </button>
            <button
                type="button"
                onClick={() => void capturedPromptActions?.onConnect(alice.promptId)}
            >
                Run Captured Connect
            </button>
            <button
                type="button"
                onClick={() => void capturedPromptActions?.onSkip(alice.promptId)}
            >
                Run Captured Skip
            </button>
            <output data-testid="modal-count">{modals.length}</output>
            {current && (
                <CenterModal
                    component={current.component}
                    options={current.options}
                    open={current.open}
                />
            )}
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
        capturedPromptActions = null;
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

    it('uses prompt id to select deterministically when timestamps are equal', async () => {
        state.prompts = [{ ...bob, triggeredAt: alice.triggeredAt }, alice];
        renderCoordinator();
        await advance(150);

        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Connect with Bob?' })).toBeNull();
    });

    it('keeps the modal open with skipping feedback until one native Skip succeeds', async () => {
        const request = deferred<void>();
        state.prompts = [alice];
        state.skip.mockImplementation(async promptId => {
            await request.promise;
            state.prompts = state.prompts.filter(prompt => prompt.promptId !== promptId);
        });
        renderCoordinator();
        await advance(150);

        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));
        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));

        expect(state.skip).toHaveBeenCalledOnce();
        expect(state.skip).toHaveBeenCalledWith(alice.promptId);
        expect(state.connect).not.toHaveBeenCalled();
        expect(
            (screen.getByRole('button', { name: 'Skipping...' }) as HTMLButtonElement).disabled
        ).toBe(true);
        expect(
            (screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled
        ).toBe(true);
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();

        await act(async () => {
            request.resolve(undefined);
            await request.promise;
        });

        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
        expect(state.skip).toHaveBeenCalledOnce();
    });

    it('keeps the modal open with a friendly retry after native Skip fails', async () => {
        const request = deferred<void>();
        state.prompts = [alice];
        state.skip
            .mockImplementationOnce(() => request.promise.then(() => undefined))
            .mockResolvedValueOnce(undefined);
        renderCoordinator();
        await advance(150);

        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));

        expect(state.skip).toHaveBeenCalledOnce();
        expect(screen.getByRole('button', { name: 'Skipping...' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();

        await act(async () => {
            request.reject(new Error('raw native skip failure'));
            await request.promise.catch(() => undefined);
        });

        expect(screen.getByRole('alert').textContent).toBe(copy.error);
        expect(screen.queryByText('raw native skip failure')).toBeNull();
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));
            await Promise.resolve();
        });
        expect(state.skip).toHaveBeenCalledTimes(2);
        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
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

    it('suppresses native dismissal during Connect and resets the guard after failure', async () => {
        const request = deferred<void>();
        state.prompts = [alice];
        state.connect.mockReturnValue(request.promise);
        renderCoordinator();
        await advance(150);

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));

        expect(state.connect).toHaveBeenCalledOnce();
        expect(state.skip).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();

        await act(async () => {
            request.reject(new Error('connect failed'));
            await request.promise.catch(() => undefined);
        });

        expect(state.skip).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toBe(copy.error);

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));
            await Promise.resolve();
        });
        expect(state.skip).toHaveBeenCalledOnce();
        expect(state.skip).toHaveBeenCalledWith(alice.promptId);
    });

    it('suppresses native dismissal while an explicit Skip is pending', async () => {
        const request = deferred<void>();
        state.prompts = [alice];
        state.skip.mockReturnValue(request.promise);
        renderCoordinator();
        await advance(150);

        fireEvent.click(screen.getByRole('button', { name: 'Skip for Now' }));
        fireEvent.click(screen.getByRole('button', { name: 'Native Close' }));

        expect(state.skip).toHaveBeenCalledOnce();
        expect(state.skip).toHaveBeenCalledWith(alice.promptId);
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();

        await act(async () => {
            request.reject(new Error('skip failed'));
            await request.promise.catch(() => undefined);
        });

        expect(state.skip).toHaveBeenCalledOnce();
        expect(screen.getByRole('alert').textContent).toBe(copy.error);
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();
    });

    it('closes only its owned modal when another modal is stacked during Connect', async () => {
        const request = deferred<void>();
        state.prompts = [alice];
        state.connect.mockReturnValue(request.promise);
        renderCoordinator();
        await advance(150);

        fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open Existing' }));
        expect(screen.getByText('Existing modal')).toBeTruthy();
        expect(screen.getByTestId('modal-count').textContent).toBe('2');

        await act(async () => {
            request.resolve(undefined);
            await request.promise;
        });
        await advance(300);

        expect(screen.getByText('Existing modal')).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
        expect(screen.getByTestId('modal-count').textContent).toBe('1');
        expect(state.skip).not.toHaveBeenCalled();
    });

    it('treats closeAllModals as administrative removal without Skip', async () => {
        state.prompts = [alice];
        renderCoordinator();
        await advance(150);
        const staleActions = capturedPromptActions;

        fireEvent.click(screen.getByRole('button', { name: 'Close All' }));

        await act(async () => {
            await staleActions?.onConnect(alice.promptId);
            await staleActions?.onSkip(alice.promptId);
        });
        await advance(300);

        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
        expect(state.skip).not.toHaveBeenCalled();
        expect(state.connect).not.toHaveBeenCalled();
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
    ])('closes the owned modal and rejects stale actions on %s', async (_label, resetViewer) => {
        state.prompts = [alice];
        const view = renderCoordinator();
        await advance(150);
        expect(screen.getByRole('heading', { name: 'Connect with Alice?' })).toBeTruthy();

        resetViewer();
        view.rerender(
            <ModalsProvider>
                <ConnectionPromptCoordinator copy={copy} />
                <ModalHarness />
            </ModalsProvider>
        );

        expect(screen.queryByRole('heading', { name: 'Connect with Alice?' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Run Captured Connect' }));
        fireEvent.click(screen.getByRole('button', { name: 'Run Captured Skip' }));

        expect(state.connect).not.toHaveBeenCalled();
        expect(state.skip).not.toHaveBeenCalled();

        await advance(300);
        expect(screen.getByTestId('modal-count').textContent).toBe('0');
    });
});
