import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeveloperRoleConfirmation from './DeveloperRoleConfirmation';
import ProfileDeveloperProgram from './ProfileDeveloperProgram';
import userEvent from '@testing-library/user-event';

const state = vi.hoisted(() => ({
    did: undefined as string | undefined,
    profileType: 'parent' as string,
    user: { privateKey: 'test-account-a' },
    profile: {
        profileId: 'alice',
        role: 'learner',
        dob: '2015-01-01',
        type: undefined as string | undefined,
    },
    initWallet: vi.fn(),
    updateProfile: vi.fn(),
    getProfile: vi.fn(),
    persist: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { Center: 'center' },
    useModal: () => ({
        closeAllModals: vi.fn(),
        newModalWithToken: vi.fn(),
        forceCloseModalByToken: vi.fn(),
    }),
    useGetProfile: () => {
        return useQuery({
            queryKey: ['getProfile', state.did ?? '', undefined],
            queryFn: async () => state.profile,
            staleTime: Infinity,
        });
    },
    useWallet: () => ({ initWallet: state.initWallet }),
    currentUserStore: {
        use: { currentUser: () => state.user },
        get: { currentUser: () => state.user },
    },
    switchedProfileStore: {
        use: { switchedDid: () => state.did, profileType: () => state.profileType },
        get: { switchedDid: () => state.did, profileType: () => state.profileType },
    },
}));
vi.mock('../../helpers/queryPersistence', () => ({ persistQueryCacheNow: state.persist }));

beforeEach(() => {
    state.did = undefined;
    state.profileType = 'parent';
    state.user = { privateKey: 'test-account-a' };
    state.profile = { profileId: 'alice', role: 'learner', dob: '2015-01-01', type: undefined };
    state.getProfile.mockImplementation(async () => ({ ...state.profile }));
    state.updateProfile.mockImplementation(async () => {
        state.profile = { ...state.profile, role: 'developer' };
        return true;
    });
    state.initWallet.mockResolvedValue({
        invoke: { getProfile: state.getProfile, updateProfile: state.updateProfile },
    });
    state.persist.mockResolvedValue(undefined);
});

afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});

const setup = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const key = ['getProfile', state.did ?? '', undefined];
    queryClient.setQueryData(key, { ...state.profile });
    const onClose = vi.fn();
    const saving = { current: false };
    const view = () => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <DeveloperRoleConfirmation onClose={onClose} saving={saving} />
                <ProfileDeveloperProgram />
            </MemoryRouter>
        </QueryClientProvider>
    );
    const result = render(view());
    const confirm = () =>
        fireEvent.click(screen.getByRole('button', { name: 'Switch to Developer' }));
    return { ...result, queryClient, key, onClose, saving, confirm, view };
};

describe('Developer role confirmation', () => {
    it.each(['learner', 'developer'])(
        'blocks a child account with role %s even when opened directly',
        role => {
            state.profileType = 'child';
            state.profile.role = role;
            const { confirm, onClose } = setup();
            expect(onClose).toHaveBeenCalled();
            confirm();
            expect(state.initWallet).not.toHaveBeenCalled();
            expect(state.updateProfile).not.toHaveBeenCalled();
            expect(state.persist).not.toHaveBeenCalled();
        }
    );

    it('blocks a child network profile even if the profile-type store is stale', async () => {
        state.profile.type = 'child';
        const { confirm, onClose } = setup();
        confirm();
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(state.updateProfile).not.toHaveBeenCalled();
        expect(state.persist).not.toHaveBeenCalled();
    });

    it('closes and blocks confirmation if the active account becomes a child', () => {
        const { rerender, view, onClose, confirm } = setup();
        state.profileType = 'child';
        rerender(view());
        expect(onClose).toHaveBeenCalled();
        confirm();
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it.each([320, 399, 400, 1024])('matches visual and keyboard order at %spx', width => {
        const originalWidth = window.innerWidth;
        try {
            window.innerWidth = width;
            setup();
            const expected =
                width < 400 ? ['Switch to Developer', 'Cancel'] : ['Cancel', 'Switch to Developer'];
            const actions = screen.getByRole('group', { name: 'Switch to Developer?' });
            const buttons = Array.from(actions.querySelectorAll('button'));
            expect(buttons.map(button => button.textContent)).toEqual(expected);
            userEvent.tab();
            expect(document.activeElement).toBe(buttons[0]);
            userEvent.tab();
            expect(document.activeElement).toBe(buttons[1]);
            expect(buttons.every(button => button.classList.contains('min-h-12'))).toBe(true);

            window.innerWidth = width < 400 ? 400 : 399;
            fireEvent(window, new Event('resize'));
            expect(
                Array.from(actions.querySelectorAll('button')).map(button => button.textContent)
            ).toEqual([...expected].reverse());
        } finally {
            window.innerWidth = originalWidth;
        }
    });

    it('cancels without initializing a wallet or changing a role', () => {
        const { onClose } = setup();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledOnce();
        expect(state.initWallet).not.toHaveBeenCalled();
    });

    it.each([undefined, 'did:example:org'])(
        'saves only the role for active profile %s and persists refreshed observers before closing',
        async did => {
            state.did = did;
            state.profileType = did ? 'service' : 'parent';
            const { confirm, onClose, queryClient, key } = setup();
            const publicKey = ['getProfile', '', 'alice'];
            queryClient.setQueryData(publicKey, { profileId: 'alice', displayName: 'Alice' });
            confirm();
            await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
            expect(state.updateProfile).toHaveBeenCalledExactlyOnceWith({ role: 'developer' });
            expect(queryClient.getQueryData(key)).toEqual({ ...state.profile, role: 'developer' });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Developer Program' })).toBeTruthy()
            );
            expect(state.persist).toHaveBeenCalledWith(queryClient);
            expect(state.persist.mock.invocationCallOrder[0]).toBeLessThan(
                onClose.mock.invocationCallOrder[0]
            );
            expect(queryClient.getQueryData(publicKey)).toEqual({
                profileId: 'alice',
                displayName: 'Alice',
            });
            expect(queryClient.getQueryState(publicKey)?.isInvalidated).toBe(true);
        }
    );

    it('disables actions and prevents duplicate submissions while saving', async () => {
        let resolveUpdate!: (value: boolean) => void;
        state.updateProfile.mockImplementation(
            () =>
                new Promise<boolean>(resolve => {
                    resolveUpdate = resolve;
                })
        );
        const { confirm, onClose } = setup();
        confirm();
        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledOnce());
        expect(screen.getByRole('status').textContent).toContain('Switching...');
        expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(
            true
        );
        const button = screen.getByRole('button', { name: 'Switching...' });
        expect((button as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(button);
        expect(state.updateProfile).toHaveBeenCalledOnce();
        await act(async () => {
            state.profile.role = 'developer';
            resolveUpdate(true);
        });
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });

    it.each(['reject', 'false'])('shows a friendly error on %s and allows retry', async failure => {
        if (failure === 'reject')
            state.updateProfile.mockRejectedValueOnce(new Error('private server detail'));
        else state.updateProfile.mockResolvedValueOnce(false);
        const { confirm, onClose } = setup();
        confirm();
        await waitFor(() =>
            expect(screen.getByRole('alert').textContent).toContain(
                'We couldn’t save your role. Please try again.'
            )
        );
        expect(screen.queryByText('private server detail')).toBeNull();
        expect(onClose).not.toHaveBeenCalled();
        confirm();
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    });

    it('allows retrying cache persistence without repeating a successful role mutation', async () => {
        state.persist.mockRejectedValueOnce(new Error('storage unavailable'));
        const { confirm, onClose } = setup();
        confirm();
        await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain(
            'Your role is now Developer, but we couldn’t refresh this device. Please try again.'
        );
        expect(screen.queryByText('We couldn’t save your role. Please try again.')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
        expect(state.updateProfile).toHaveBeenCalledOnce();
        expect(state.persist).toHaveBeenCalledTimes(2);
    });

    it.each(['saved-profile', 'cancel-queries'])(
        'distinguishes a %s failure after a successful server update',
        async failure => {
            const { confirm, onClose, queryClient } = setup();
            if (failure === 'saved-profile') {
                state.getProfile
                    .mockResolvedValueOnce({ ...state.profile })
                    .mockRejectedValueOnce(new Error('refresh unavailable'));
            } else {
                vi.spyOn(queryClient, 'cancelQueries').mockRejectedValueOnce(
                    new Error('cache unavailable')
                );
            }
            confirm();
            await waitFor(() =>
                expect(screen.getByRole('alert').textContent).toContain(
                    'Your role is now Developer'
                )
            );
            expect(onClose).not.toHaveBeenCalled();
            expect(state.updateProfile).toHaveBeenCalledOnce();
            fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
            await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
            expect(state.updateProfile).toHaveBeenCalledOnce();
        }
    );

    it.each(['profile', 'login'])(
        'closes when the %s account changes before confirmation',
        async kind => {
            const { rerender, view, onClose, confirm } = setup();
            if (kind === 'profile') state.did = 'did:example:b';
            else state.user = { privateKey: 'test-account-b' };
            rerender(view());
            expect(onClose).toHaveBeenCalled();
            confirm();
            expect(state.initWallet).not.toHaveBeenCalled();
        }
    );

    it.each(['account', 'child'])(
        'does not mutate if the %s eligibility changes during wallet initialization',
        async change => {
            let resolveWallet!: (value: unknown) => void;
            state.initWallet.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveWallet = resolve;
                    })
            );
            const { confirm } = setup();
            confirm();
            await act(async () => {
                if (change === 'child') state.profileType = 'child';
                else state.did = 'did:example:b';
                resolveWallet({
                    invoke: { getProfile: state.getProfile, updateProfile: state.updateProfile },
                });
            });
            expect(state.updateProfile).not.toHaveBeenCalled();
        }
    );

    it('does not overwrite either account cache if the account changes during saving', async () => {
        let resolveUpdate!: (value: boolean) => void;
        state.updateProfile.mockImplementation(
            () =>
                new Promise<boolean>(resolve => {
                    resolveUpdate = resolve;
                })
        );
        const { confirm, queryClient, key } = setup();
        const otherKey = ['getProfile', 'did:example:b', undefined];
        queryClient.setQueryData(otherKey, { profileId: 'bob', role: 'teacher' });
        confirm();
        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledOnce());
        await act(async () => {
            state.did = 'did:example:b';
            resolveUpdate(true);
        });
        expect(queryClient.getQueryData(key)).toMatchObject({ role: 'learner' });
        expect(queryClient.getQueryData(otherKey)).toMatchObject({ role: 'teacher' });
        expect(state.persist).not.toHaveBeenCalled();
    });
});
