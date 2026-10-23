import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrandingEnum } from 'learn-card-base';
import { MyLearnCardModalViewModeEnum } from './MyLearnCardModal.types';

const state = vi.hoisted(() => ({
    role: 'learner',
    hasCurrentLCNUser: true,
    currentLCNUserLoading: false,
    closeModal: vi.fn(),
    push: vi.fn(),
    updateProfile: vi.fn(),
    initWallet: vi.fn(),
    refetch: vi.fn(),
    presentToast: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    BrandingEnum: { LearnCard: 'learncard' },
    ModalTypes: { Right: 'right', Center: 'center', FullScreen: 'full-screen' },
    ToastTypeEnum: { Error: 'error' },
    getAuthConfig: () => ({ serverUrl: '' }),
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    isEmailRelayConfigured: () => false,
    useCurrentUser: () => ({ name: 'Developer' }),
    useGetConnections: () => ({ data: [] }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: state.hasCurrentLCNUser ? { role: state.role } : null,
        currentLCNUserLoading: state.currentLCNUserLoading,
        refetch: state.refetch,
    }),
    useIsCurrentUserLCNUser: () => ({ data: true, isLoading: false }),
    useModal: () => ({
        newModal: vi.fn(),
        newModalWithToken: vi.fn(),
        closeModal: state.closeModal,
        forceCloseModalByToken: vi.fn(),
    }),
    useWallet: () => ({ initWallet: state.initWallet }),
    useToast: () => ({ presentToast: state.presentToast }),
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: state.push }) }));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));
vi.mock('../../hooks/useLogout', () => ({ default: () => ({ handleLogout: vi.fn() }) }));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        capabilities: { recovery: false, deviceLinking: false },
    }),
}));
vi.mock('../network-prompts/hooks/useJoinLCNetworkModal', () => ({ default: () => ({}) }));
vi.mock('../network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: vi.fn() }),
}));
vi.mock('./LearnCardIdView', () => ({ default: () => <div /> }));
vi.mock('./LearnCardFooter', () => ({ default: () => <div /> }));
vi.mock('./SwitchAccountButton', () => ({ default: () => <div /> }));
vi.mock('./AccountSwitcherModal', () => ({ default: () => <div /> }));
vi.mock('../svgs/IdViewDivetFrame', () => ({ default: () => <div /> }));
vi.mock('../user-profile/UserProfileSetup', () => ({ default: () => <div /> }));
vi.mock('../user-profile/UserContact/UserContact', () => ({ default: () => <div /> }));
vi.mock('../qrcode-user-card/QRCodeUserCard', () => ({ default: () => <div /> }));
vi.mock('../../pages/login/LoginPageLoader/LogoutLoader', () => ({ default: () => <div /> }));
vi.mock('../../pages/adminToolsPage/AdminToolsModal/AdminToolsModal', () => ({
    default: () => <div />,
}));
vi.mock('../learncardID-CMS/LearnCardIDCMS', () => ({ default: () => <div /> }));
vi.mock('../recovery', () => ({ RecoverySetupModal: () => <div /> }));
vi.mock('../auth/ReAuthOverlay', () => ({ default: () => <div /> }));
vi.mock('learn-card-base/svgs/EmailIcon', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/CodeIcon', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/ReplyIcon', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/SignOutIcon', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/QRCodeScanner', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/BluePaintBrush', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/WrenchIcon', () => ({ WrenchColorFillIcon: () => <svg /> }));
vi.mock('learn-card-base/svgs/ShieldCheck', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/PrivacyLock', () => ({ default: () => <svg /> }));
vi.mock('learn-card-base/svgs/OrangeProfileIcon', () => ({ default: () => <svg /> }));
vi.mock('../../feedback/reporting/FeedbackSettingsRows', () => ({
    FeedbackSettingsRows: () => null,
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({}),
    useTheme: () => ({}),
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({ getTenantHeaders: () => ({}) }));
vi.mock('../../paraglide/messages.js', () => ({
    'launchpad.becomeAnApp.developerProgram': () => 'Developer Program',
    'profile.menu.joinDeveloperProgram': () => 'Join the Developer Program',
    'profile.menu.joiningDeveloperProgram': () => 'Joining the Developer Program...',
    'profile.menu.developerProgramError': () =>
        "We couldn't join the Developer Program. Please try again.",
    'profile.menu.settings': () => 'Settings',
    'profile.menu.emailAddresses': () => 'Email Addresses',
    'profile.menu.editContactCard': () => 'Edit Contact Card',
    'dataSharing.title': () => 'Privacy & Data',
    'profile.menu.adminTools': () => 'Admin Tools',
}));

import MyLearnCardModal from './MyLearnCardModal';

const renderModal = () =>
    render(<MyLearnCardModal branding={BrandingEnum.LearnCard} hideLogout hideShare />);

describe('MyLearnCardModal developer program shortcut', () => {
    beforeEach(() => {
        state.role = 'learner';
        state.hasCurrentLCNUser = true;
        state.currentLCNUserLoading = false;
        vi.clearAllMocks();
        state.updateProfile.mockResolvedValue(true);
        state.initWallet.mockResolvedValue({
            invoke: { updateProfile: state.updateProfile },
        });
        state.refetch.mockResolvedValue({ data: { role: 'developer' } });
    });

    afterEach(cleanup);

    it('shows the accessible Developer Program button to developer-role users', () => {
        state.role = 'developer';

        renderModal();

        expect(screen.getByRole('button', { name: 'Developer Program' })).toBeVisible();
    });

    it.each(['admin', 'service'])('hides the shortcut from %s-role users', role => {
        state.role = role;

        renderModal();

        expect(screen.queryByRole('button', { name: 'Developer Program' })).not.toBeInTheDocument();
    });

    it('closes the modal and opens the developer program when activated', () => {
        state.role = 'developer';

        renderModal();
        fireEvent.click(screen.getByRole('button', { name: 'Developer Program' }));

        expect(state.closeModal).toHaveBeenCalledTimes(1);
        expect(state.push).toHaveBeenCalledWith('/app-store/developer');
        expect(state.closeModal.mock.invocationCallOrder[0]).toBeLessThan(
            state.push.mock.invocationCallOrder[0]
        );
    });

    it('invites a non-developer, verifies the refreshed role, then opens the developer program', async () => {
        renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Join the Developer Program' }));

        await waitFor(() => {
            expect(state.updateProfile).toHaveBeenCalledWith({
                role: 'developer',
            });
            expect(state.refetch).toHaveBeenCalledTimes(1);
            expect(state.closeModal).toHaveBeenCalledTimes(1);
            expect(state.push).toHaveBeenCalledWith('/app-store/developer');
        });
    });

    it('disables the invitation and announces busy status while joining', async () => {
        let resolveUpdate: ((value: boolean) => void) | undefined;
        state.updateProfile.mockImplementation(
            () => new Promise<boolean>(resolve => (resolveUpdate = resolve))
        );

        renderModal();
        fireEvent.click(screen.getByRole('button', { name: 'Join the Developer Program' }));

        const invitation = screen.getByRole('button', {
            name: 'Joining the Developer Program...',
        });
        expect(invitation).toBeDisabled();
        expect(invitation).toHaveAttribute('aria-busy', 'true');

        await waitFor(() => expect(state.updateProfile).toHaveBeenCalledTimes(1));
        resolveUpdate?.(true);
        await waitFor(() => expect(state.push).toHaveBeenCalledWith('/app-store/developer'));
    });

    it.each([
        ['returns false', () => state.updateProfile.mockResolvedValue(false)],
        ['throws', () => state.updateProfile.mockRejectedValue(new Error('update failed'))],
        ['cannot refresh', () => state.refetch.mockRejectedValue(new Error('refresh failed'))],
        [
            'refreshes with a non-developer role',
            () => state.refetch.mockResolvedValue({ data: { role: 'learner' } }),
        ],
    ])(
        'keeps the modal open and reports an error when enrollment %s',
        async (_scenario, configure) => {
            configure();
            renderModal();

            fireEvent.click(
                screen.getByRole('button', {
                    name: 'Join the Developer Program',
                })
            );

            await waitFor(() => {
                expect(state.presentToast).toHaveBeenCalledWith(
                    "We couldn't join the Developer Program. Please try again.",
                    { type: 'error', hasDismissButton: true }
                );
            });

            expect(state.closeModal).not.toHaveBeenCalled();
            expect(state.push).not.toHaveBeenCalled();
            expect(
                screen.getByRole('button', {
                    name: 'Join the Developer Program',
                })
            ).toBeEnabled();
        }
    );

    it('does not offer enrollment while the profile is loading, missing, or in child mode', () => {
        state.currentLCNUserLoading = true;
        const { rerender } = renderModal();

        expect(
            screen.queryByRole('button', {
                name: 'Join the Developer Program',
            })
        ).not.toBeInTheDocument();

        state.currentLCNUserLoading = false;
        state.hasCurrentLCNUser = false;
        rerender(<MyLearnCardModal branding={BrandingEnum.LearnCard} hideLogout hideShare />);

        expect(
            screen.queryByRole('button', {
                name: 'Join the Developer Program',
            })
        ).not.toBeInTheDocument();

        state.hasCurrentLCNUser = true;
        rerender(
            <MyLearnCardModal
                branding={BrandingEnum.LearnCard}
                hideLogout
                hideShare
                viewMode={MyLearnCardModalViewModeEnum.child}
            />
        );

        expect(
            screen.queryByRole('button', {
                name: 'Join the Developer Program',
            })
        ).not.toBeInTheDocument();
    });
});
