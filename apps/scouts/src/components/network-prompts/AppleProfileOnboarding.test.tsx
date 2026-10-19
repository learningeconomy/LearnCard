// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    loginType: 'apple',
    authName: '',
    hasAuthUser: true,
    profile: null as { profileId: string } | null,
    createProfile: vi.fn(),
    updateNetworkProfile: vi.fn(),
    updateAuthProfile: vi.fn(),
    updateCurrentUser: vi.fn(),
    setCurrentUser: vi.fn(),
    close: vi.fn(),
    toast: vi.fn(),
    refetch: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => ({
        getCurrentUser: () => (mocks.hasAuthUser ? { displayName: mocks.authName } : null),
        updateProfile: mocks.updateAuthProfile,
    }),
    SocialLoginTypes: { apple: 'apple' },
    authStore: { use: { typeOfLogin: () => mocks.loginType } },
    currentUserStore: { set: { currentUser: mocks.setCurrentUser } },
    useSQLiteStorage: () => ({ updateCurrentUser: mocks.updateCurrentUser }),
    useWallet: () => ({
        initWallet: async () => ({
            id: { did: () => 'did:test:scout' },
            invoke: {
                createProfile: mocks.createProfile,
                updateProfile: mocks.updateNetworkProfile,
                resetLCAClient: vi.fn(),
            },
        }),
    }),
    useGetProfile: () => ({ data: mocks.profile, isLoading: false }),
    useGetCurrentLCNUser: () => ({ refetch: mocks.refetch }),
    useIsCurrentUserLCNUser: () => ({ refetch: mocks.refetch }),
    getNotificationsEndpoint: () => 'https://example.com/notifications',
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: {},
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Error: 'error' },
    getLogger: () => ({ error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({ uid: 'scout-user', privateKey: 'test-key' }),
}));
vi.mock('learn-card-base/helpers/authHelpers', () => ({ getAuthToken: () => 'test-token' }));
vi.mock('learn-card-base/components/profilePicture/ProfilePicture', () => ({
    ProfilePicture: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    default: () => null,
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ resetQueries: vi.fn() }) }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@ionic/react', () => ({
    IonRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonCol: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonSpinner: () => <span>Saving indicator</span>,
    IonInput: ({
        value,
        placeholder,
        onIonInput,
        disabled,
    }: {
        value: string;
        placeholder: string;
        disabled?: boolean;
        onIonInput?: (event: { detail: { value: string } }) => void;
    }) => (
        <input
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={e => onIonInput?.({ detail: { value: e.target.value } })}
        />
    ),
}));
vi.mock('../../helpers/externalLinkHelpers', () => ({ openPP: vi.fn(), openToS: vi.fn() }));
vi.mock('../userOptions/DeleteUserConfirmationPrompt', () => ({ default: () => null }));
vi.mock('./hooks/useJoinLCNetworkModal', () => ({ JoinNetworkModalWrapper: () => null }));

import NewJoinNetworkPrompt from './NewJoinNetworkPrompt';
import UserProfileUpdateForm from '../user-profile/UserProfileUpdateForm';
import * as m from '../../paraglide/messages.js';

const join = (): HTMLElement => screen.getByRole('button', { name: m['networkPrompts.letsGo']() });
const enterUsername = (value = 'scout-handle'): void => {
    fireEvent.change(screen.getByPlaceholderText(m['networkPrompts.usernamePlh']()), {
        target: { value },
    });
};
const renderAccount = (): void => {
    render(
        <UserProfileUpdateForm
            handleCloseModal={mocks.close}
            handleLogout={vi.fn()}
            handleChapiInfo={vi.fn()}
            showDeleteAccountButton={false}
        />
    );
};

beforeEach(() => {
    vi.clearAllMocks();
    mocks.loginType = 'apple';
    mocks.authName = '';
    mocks.hasAuthUser = true;
    mocks.profile = null;
    mocks.createProfile.mockResolvedValue('did:web:scout');
    mocks.updateAuthProfile.mockResolvedValue(undefined);
    mocks.updateNetworkProfile.mockResolvedValue(undefined);
    mocks.updateCurrentUser.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe('ScoutPass Apple onboarding', () => {
    it('allows a blank name and saves the username consistently', async () => {
        render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
        expect(
            (screen.getByLabelText(m['userProfile.fullNameOptional']()) as HTMLInputElement)
                .required
        ).toBe(false);
        enterUsername();
        fireEvent.click(join());
        await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        expect(mocks.createProfile).toHaveBeenCalledWith(
            expect.objectContaining({
                profileId: 'scout-handle',
                displayName: 'scout-handle',
            })
        );
        expect(mocks.updateAuthProfile).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'scout-handle' })
        );
        expect(mocks.updateCurrentUser).toHaveBeenCalledWith(
            'scout-user',
            expect.objectContaining({ name: 'scout-handle' })
        );
    });

    it.each(['apple', 'google'])(
        'supports cached-key %s setup and retry without Firebase',
        async loginType => {
            mocks.loginType = loginType;
            mocks.hasAuthUser = false;
            mocks.updateAuthProfile.mockRejectedValue(new Error('No user to update'));
            mocks.createProfile.mockRejectedValueOnce(new Error('Temporary network failure'));
            render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
            fireEvent.change(screen.getByLabelText(/Full Name/), {
                target: { value: 'Scout User' },
            });
            enterUsername();
            fireEvent.click(join());
            await screen.findByText(m['networkPrompts.profileSaveFailed']());
            expect(mocks.createProfile).toHaveBeenCalledOnce();
            expect(mocks.close).not.toHaveBeenCalled();
            fireEvent.click(join());
            await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
            expect(mocks.createProfile).toHaveBeenCalledTimes(2);
            expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
            expect(mocks.updateCurrentUser).toHaveBeenLastCalledWith(
                'scout-user',
                expect.objectContaining({ name: 'Scout User' })
            );
        }
    );

    it('prefills the Apple name and permits clearing it', async () => {
        mocks.authName = 'Apple Scout';
        render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
        const name = screen.getByLabelText(m['userProfile.fullNameOptional']()) as HTMLInputElement;
        expect(name.value).toBe('Apple Scout');
        fireEvent.change(name, { target: { value: '' } });
        enterUsername();
        fireEvent.click(join());
        await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        expect(mocks.createProfile).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'scout-handle' })
        );
    });

    it('keeps invalid usernames on screen without changing profiles', async () => {
        render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
        enterUsername('!');
        fireEvent.click(join());
        expect(mocks.createProfile).not.toHaveBeenCalled();
        expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
        expect(mocks.close).not.toHaveBeenCalled();
    });

    it('waits for creation and leaves failures open for retry', async () => {
        let rejectCreation: (error: Error) => void = () => undefined;
        mocks.createProfile.mockReturnValueOnce(
            new Promise((_, reject) => {
                rejectCreation = reject;
            })
        );
        render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
        enterUsername();
        fireEvent.click(join());
        await waitFor(() => expect(mocks.createProfile).toHaveBeenCalledOnce());
        expect(mocks.close).not.toHaveBeenCalled();
        expect((screen.getByRole('button', { name: /Saving/ }) as HTMLButtonElement).disabled).toBe(
            true
        );
        await act(async () => rejectCreation(new Error('Private server error')));
        expect(screen.getByText(m['networkPrompts.profileSaveFailed']())).toBeTruthy();
        expect(screen.queryByText('Private server error')).toBeNull();
        expect(mocks.close).not.toHaveBeenCalled();
        fireEvent.click(join());
        await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
    });

    it.each(['google', 'passwordless', 'sms'])(
        'requires a name for %s sign-in',
        async loginType => {
            mocks.loginType = loginType;
            render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
            enterUsername();
            fireEvent.click(join());
            expect(mocks.createProfile).not.toHaveBeenCalled();
            const name = screen.getByLabelText(m['userProfile.fullName']()) as HTMLInputElement;
            expect(name.required).toBe(true);
            fireEvent.change(name, { target: { value: 'Scout User' } });
            fireEvent.click(join());
            await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        }
    );
});

describe('ScoutPass Apple account settings', () => {
    it('allows clearing the prefilled name and falls back to the existing username', async () => {
        mocks.authName = 'Apple Scout';
        mocks.profile = { profileId: 'existing-scout' };
        renderAccount();
        const name = screen.getByLabelText(m['userProfile.fullNameOptional']()) as HTMLInputElement;
        expect(name.value).toBe('Apple Scout');
        fireEvent.change(name, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
        await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        expect(mocks.updateNetworkProfile).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'existing-scout' })
        );
        expect(mocks.updateCurrentUser).toHaveBeenCalledWith(
            'scout-user',
            expect.objectContaining({ name: 'existing-scout' })
        );
    });

    it.each(['apple', 'google'])(
        'saves cached-key %s account changes without Firebase',
        async loginType => {
            mocks.loginType = loginType;
            mocks.hasAuthUser = false;
            mocks.profile = { profileId: 'existing-scout' };
            mocks.updateAuthProfile.mockRejectedValue(new Error('No user to update'));
            renderAccount();
            fireEvent.change(screen.getByLabelText(/Full Name/), {
                target: { value: 'Scout User' },
            });
            fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
            await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
            expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
            expect(mocks.updateNetworkProfile).toHaveBeenCalledWith(
                expect.objectContaining({ displayName: 'Scout User' })
            );
            expect(mocks.updateCurrentUser).toHaveBeenCalledWith(
                'scout-user',
                expect.objectContaining({ name: 'Scout User' })
            );
        }
    );

    it('keeps the form open and reports Apple profile update failures', async () => {
        mocks.updateAuthProfile.mockRejectedValueOnce(new Error('Private server error'));
        renderAccount();
        fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith(
                m['networkPrompts.profileSaveFailed'](),
                expect.objectContaining({ type: 'error' })
            )
        );
        expect(mocks.close).not.toHaveBeenCalled();
    });
});
