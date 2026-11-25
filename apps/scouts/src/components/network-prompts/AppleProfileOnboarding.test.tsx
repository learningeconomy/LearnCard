// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    loginType: 'apple',
    authName: '',
    localName: '',
    hasAuthUser: true,
    hasCurrentUser: true,
    profile: null as { profileId: string; displayName?: string } | null | undefined,
    profileLoading: false,
    refetchProfile: vi.fn(),
    newModal: vi.fn(),
    createProfile: vi.fn(),
    updateNetworkProfile: vi.fn(),
    updateAuthProfile: vi.fn(),
    updateCurrentUser: vi.fn(),
    setCurrentUser: vi.fn(),
    close: vi.fn(),
    toast: vi.fn(),
    refetch: vi.fn(),
}));
const stableAdapter = vi.hoisted(() => ({
    getCurrentUser: () => (mocks.hasAuthUser ? { displayName: mocks.authName } : null),
    updateProfile: mocks.updateAuthProfile,
}));
vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => stableAdapter,
    authUserStore: { use: { currentUser: () => ({ displayName: mocks.authName }) } },
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
    useGetProfile: () => ({
        data: mocks.profile,
        isLoading: mocks.profileLoading,
        refetch: mocks.refetchProfile,
    }),
    useGetCurrentLCNUser: () => ({ refetch: mocks.refetch }),
    useIsCurrentUserLCNUser: () => ({ refetch: mocks.refetch }),
    getNotificationsEndpoint: () => 'https://example.com/notifications',
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    useModal: () => ({ newModal: mocks.newModal, closeModal: vi.fn() }),
    ModalTypes: {},
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Error: 'error' },
    getLogger: () => ({ error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () =>
        mocks.hasCurrentUser
            ? { uid: 'scout-user', privateKey: 'test-key', name: mocks.localName }
            : null,
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
const renderAccount = (): ReturnType<typeof render> => {
    return render(
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
    mocks.localName = '';
    mocks.hasAuthUser = true;
    mocks.hasCurrentUser = true;
    mocks.profile = null;
    mocks.profileLoading = false;
    mocks.createProfile.mockResolvedValue('did:web:scout');
    mocks.updateAuthProfile.mockResolvedValue(undefined);
    mocks.updateNetworkProfile.mockResolvedValue(undefined);
    mocks.updateCurrentUser.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe.each(['onboarding', 'account'])('ScoutPass %s keyboard focus', surface => {
    it.each(['apple', 'google'])('preserves the native %s name field focus outline', loginType => {
        mocks.loginType = loginType;
        if (surface === 'onboarding') {
            render(<NewJoinNetworkPrompt handleCloseModal={mocks.close} />);
        } else {
            renderAccount();
        }

        const name = screen.getByRole('textbox', { name: /Full Name/ });
        // Tailwind 4's outline-hidden keeps the forced-colors fallback when rings are suppressed.
        expect(name.tagName).toBe('INPUT');
        expect(name.classList.contains('focus:outline-hidden')).toBe(true);
        expect(name.classList.contains('focus:outline-none')).toBe(false);
    });
});

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
        mocks.profile = { profileId: 'existing-scout' };
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

describe.each(['onboarding', 'account'])('ScoutPass %s name enrichment', surface => {
    const form = () =>
        surface === 'onboarding' ? (
            <NewJoinNetworkPrompt handleCloseModal={mocks.close} />
        ) : (
            <UserProfileUpdateForm
                handleCloseModal={mocks.close}
                handleLogout={vi.fn()}
                handleChapiInfo={vi.fn()}
                showDeleteAccountButton={false}
            />
        );

    it('prefers the live name over stale local storage', () => {
        mocks.localName = 'Stale Local Name';
        mocks.authName = 'Live Apple Name';
        render(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(
            'Live Apple Name'
        );
    });

    it('replaces the untouched local fallback when Apple enrichment arrives', () => {
        mocks.localName = 'Stale Local Name';
        const view = render(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(
            'Stale Local Name'
        );
        mocks.authName = 'Late Apple Name';
        view.rerender(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(
            'Late Apple Name'
        );
    });

    it.each(['', 'Chosen Name'])(
        'preserves the intentional edit %j after enrichment',
        editedName => {
            mocks.localName = 'Local Name';
            const view = render(form());
            fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: editedName } });
            mocks.authName = 'Late Apple Name';
            view.rerender(form());
            expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(editedName);
        }
    );
});

describe.each(['onboarding', 'account'])('ScoutPass %s profile lookup', surface => {
    const form = () =>
        surface === 'onboarding' ? (
            <NewJoinNetworkPrompt handleCloseModal={mocks.close} />
        ) : (
            <UserProfileUpdateForm
                handleCloseModal={mocks.close}
                handleLogout={vi.fn()}
                handleChapiInfo={vi.fn()}
                showDeleteAccountButton={false}
            />
        );
    const save = () =>
        screen.getByRole('button', {
            name: surface === 'onboarding' ? m['networkPrompts.letsGo']() : m['common.save'](),
        });

    it('waits for the returning profile and saves its username as the fallback', async () => {
        mocks.profile = undefined;
        mocks.profileLoading = true;
        const view = render(form());
        if (surface === 'onboarding') enterUsername('wrong-local-handle');
        const loading = screen.getByRole('button', { name: new RegExp(m['common.loading']()) });
        expect((loading as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(loading);
        // A form submit must also be guarded independently of the disabled button.
        const htmlForm = view.container.querySelector('form');
        if (htmlForm) fireEvent.submit(htmlForm);
        expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
        expect(mocks.createProfile).not.toHaveBeenCalled();
        expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
        mocks.profile = { profileId: 'existing-scout' };
        mocks.profileLoading = false;
        view.rerender(form());
        fireEvent.click(save());
        await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        expect(mocks.createProfile).not.toHaveBeenCalled();
        expect(mocks.updateNetworkProfile).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'existing-scout' })
        );
        expect(mocks.updateAuthProfile).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'existing-scout' })
        );
        expect(mocks.updateCurrentUser).toHaveBeenCalledWith(
            'scout-user',
            expect.objectContaining({ name: 'existing-scout' })
        );
    });

    it('does not treat a failed lookup as a missing profile and permits retry', async () => {
        mocks.profile = undefined;
        const view = render(form());
        if (surface === 'onboarding') enterUsername('wrong-local-handle');
        fireEvent.click(save());
        expect(mocks.refetchProfile).toHaveBeenCalledOnce();
        expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
        expect(mocks.createProfile).not.toHaveBeenCalled();
        expect(mocks.close).not.toHaveBeenCalled();
        mocks.profile = { profileId: 'existing-scout' };
        view.rerender(form());
        fireEvent.click(save());
        await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        expect(mocks.updateNetworkProfile).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'existing-scout' })
        );
    });
});

it.each(['', 'Typed Scout'])(
    'completes missing-network setup from account settings with name %j',
    async name => {
        mocks.authName = 'Apple Scout';
        const view = renderAccount();
        fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: name } });
        fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
        expect(mocks.newModal).toHaveBeenCalledOnce();
        expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
        expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
        const setup = mocks.newModal.mock.calls[0][0];
        expect(setup.type).toBe(NewJoinNetworkPrompt);
        view.unmount();
        render(setup);
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(name);
        enterUsername();
        fireEvent.click(join());
        await waitFor(() =>
            expect(mocks.createProfile).toHaveBeenCalledWith(
                expect.objectContaining({
                    profileId: 'scout-handle',
                    displayName: name || 'scout-handle',
                })
            )
        );
        expect(mocks.updateCurrentUser).toHaveBeenCalledWith(
            'scout-user',
            expect.objectContaining({ name: name || 'scout-handle' })
        );
    }
);

it('keeps account settings open if local persistence fails and allows retry', async () => {
    mocks.profile = { profileId: 'existing-scout' };
    mocks.updateCurrentUser.mockRejectedValueOnce(new Error('disk full'));
    renderAccount();
    fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
    expect(mocks.close).not.toHaveBeenCalled();
    expect(mocks.setCurrentUser).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
    expect(mocks.updateCurrentUser).toHaveBeenCalledTimes(2);
});

it('does not start a save when the local user has not loaded', () => {
    mocks.profile = { profileId: 'existing-scout' };
    mocks.hasCurrentUser = false;
    renderAccount();
    fireEvent.click(screen.getByRole('button', { name: m['common.save']() }));
    expect(mocks.toast).toHaveBeenCalled();
    expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
    expect(mocks.updateCurrentUser).not.toHaveBeenCalled();
    expect(mocks.close).not.toHaveBeenCalled();
});

describe.each(['onboarding', 'account'])('ScoutPass %s saved names', surface => {
    const form = () =>
        surface === 'onboarding' ? (
            <NewJoinNetworkPrompt handleCloseModal={mocks.close} />
        ) : (
            <UserProfileUpdateForm
                handleCloseModal={mocks.close}
                handleLogout={vi.fn()}
                handleChapiInfo={vi.fn()}
                showDeleteAccountButton={false}
            />
        );
    const save = () =>
        screen.getByRole('button', {
            name: surface === 'onboarding' ? m['networkPrompts.letsGo']() : m['common.save'](),
        });

    it.each(['apple', 'google'])(
        'preserves a cached-key %s rename after Firebase reconnects',
        async loginType => {
            mocks.loginType = loginType;
            mocks.hasAuthUser = false;
            mocks.localName = 'Old Name';
            mocks.profile = { profileId: 'existing-scout', displayName: 'Old Name' };
            const view = render(form());
            fireEvent.change(screen.getByLabelText(/Full Name/), {
                target: { value: 'Chosen Name' },
            });
            fireEvent.click(save());
            await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
            expect(mocks.updateAuthProfile).not.toHaveBeenCalled();
            expect(mocks.updateNetworkProfile).toHaveBeenCalledWith(
                expect.objectContaining({ displayName: 'Chosen Name' })
            );
            mocks.localName = mocks.updateCurrentUser.mock.calls.at(-1)![1].name;
            mocks.profile = { profileId: 'existing-scout', displayName: 'Chosen Name' };
            view.unmount();
            mocks.hasAuthUser = true;
            mocks.authName = 'Old Name';
            render(form());
            expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe(
                'Chosen Name'
            );
            fireEvent.click(save());
            await waitFor(() => expect(mocks.close).toHaveBeenCalledTimes(2));
            expect(mocks.updateNetworkProfile).toHaveBeenLastCalledWith(
                expect.objectContaining({ displayName: 'Chosen Name' })
            );
            expect(mocks.updateAuthProfile).toHaveBeenCalledWith(
                expect.objectContaining({ displayName: 'Chosen Name' })
            );
        }
    );

    it('keeps the locally saved name while lookup or its cached result is stale', () => {
        mocks.localName = 'Chosen Name';
        mocks.authName = 'Old Name';
        mocks.profile = undefined;
        mocks.profileLoading = true;
        const view = render(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe('Chosen Name');
        mocks.profile = { profileId: 'existing-scout', displayName: 'Old Name' };
        mocks.profileLoading = false;
        view.rerender(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe('Chosen Name');
    });

    it('uses the existing network name when the local name is unavailable', () => {
        mocks.authName = 'Old Name';
        mocks.profile = { profileId: 'existing-scout', displayName: 'Chosen Name' };
        render(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe('Chosen Name');
    });

    it('uses Apple enrichment after lookup confirms first-time setup', () => {
        mocks.localName = 'Stale Local Name';
        mocks.authName = 'Apple Name';
        mocks.profile = undefined;
        mocks.profileLoading = true;
        const view = render(form());
        mocks.profile = null;
        mocks.profileLoading = false;
        view.rerender(form());
        expect((screen.getByLabelText(/Full Name/) as HTMLInputElement).value).toBe('Apple Name');
    });
});
