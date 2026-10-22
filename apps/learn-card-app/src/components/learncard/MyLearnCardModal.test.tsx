import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrandingEnum } from 'learn-card-base';

const state = vi.hoisted(() => ({
    role: 'learner',
    closeModal: vi.fn(),
    push: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    BrandingEnum: { LearnCard: 'learncard' },
    ModalTypes: { Right: 'right', Center: 'center', FullScreen: 'full-screen' },
    getAuthConfig: () => ({ serverUrl: '' }),
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    isEmailRelayConfigured: () => false,
    useCurrentUser: () => ({ name: 'Developer' }),
    useGetConnections: () => ({ data: [] }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: { role: state.role },
        refetch: vi.fn(),
    }),
    useIsCurrentUserLCNUser: () => ({ data: true, isLoading: false }),
    useModal: () => ({
        newModal: vi.fn(),
        newModalWithToken: vi.fn(),
        closeModal: state.closeModal,
        forceCloseModalByToken: vi.fn(),
    }),
    useWallet: () => ({ initWallet: vi.fn() }),
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
vi.mock('learn-card-base/svgs/Blocks', () => ({ default: () => <svg /> }));
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
        vi.clearAllMocks();
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
});
