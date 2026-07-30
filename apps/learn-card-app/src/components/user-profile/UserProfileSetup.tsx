import React, { useState, useEffect } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('user-profile-setup');

import { useWallet } from 'learn-card-base';

import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import UserProfileUpdateForm from './UserProfileUpdateForm';
import NetworkSettings from '../network-settings/NetworkSettings';
import JoinNetworkPrompt from '../network-prompts/JoinNetworkPrompt';
import PushNotificationsPrompt from '../push-notifications-prompt/PushNotificationsPrompt';
import ChapiPrompt from '../chapi-prompt/ChapiPrompt';

import {
    NetworkSettingsEnum,
    NetworkSettingsState,
} from '../network-settings/networkSettings.helpers';

// i18n: no user-facing strings — composition/state component
export enum UserProfileFormStateEnum {
    Account = 'account',
    Permissions = 'permissions',
    PermissionsSettings = 'permissionsSettings',
    Notifications = 'notifications',
    Chapi = 'chapi',
}

type UserProfileSetupProps = {
    title?: string;
    handleCloseModal: () => void;
    handleLogout: () => void;
    showCancelButton?: boolean;
    showDeleteAccountButton?: boolean;
    showNetworkModal?: boolean;
    showNetworkSettings?: boolean;
    showNotificationsModal?: boolean;
};

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({
    title,
    handleCloseModal,
    handleLogout,
    showCancelButton = true,
    showDeleteAccountButton = true,
    showNetworkModal = false,
    showNetworkSettings = false,
    showNotificationsModal = true,
}) => {
    const { initWallet } = useWallet();

    const [walletDid, setWalletDid] = useState<string>('');
    const [lcNetworkProfile, setLcNetworkProfile] = useState<AddressBookContact | null | undefined>(
        null
    );
    const [profileFormState, setProfileFormState] = useState<UserProfileFormStateEnum>(
        UserProfileFormStateEnum.Account
    );
    const [networkSettings, setNetworkSettings] = useState<NetworkSettingsState>({
        sendRequests: true,
        receiveRequests: true,
        showDisplayName: true,
        showProfilePicture: true,
    });

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };

        if (!walletDid) {
            getWalletDid();
        }
    }, [walletDid]);

    useEffect(() => {
        const getLCNeworkProfile = async () => {
            try {
                const wallet = await initWallet();
                const profile = await wallet?.invoke?.getProfile();
                if (profile) {
                    setLcNetworkProfile(profile);
                }
            } catch (err) {
                log.info('getLCNeworkProfile::err', err);
            }
        };

        getLCNeworkProfile();
    }, []);

    const handleNotificationsPrompt = () => {
        setProfileFormState(UserProfileFormStateEnum.Notifications);
    };

    const handleChapiInfo = () => {
        setProfileFormState(UserProfileFormStateEnum.Chapi);
    };

    const handleStateChange = (settingsType: NetworkSettingsEnum, settingState: boolean) => {
        const _settings = networkSettings;

        _settings[settingsType] = !settingState;
        setNetworkSettings({ ..._settings });
    };

    let activeForm = (
        <section className="h-full">
            <UserProfileUpdateForm
                handleCloseModal={handleCloseModal}
                handleLogout={handleLogout}
                showCancelButton={showCancelButton}
                showDeleteAccountButton={showDeleteAccountButton}
                showNetworkModal={showNetworkModal}
                showNotificationsModal={showNotificationsModal}
                handleChapiInfo={handleChapiInfo}
                onOpenNotifications={handleNotificationsPrompt}
                showNotificationsRow={showNetworkSettings}
                title={title}
            />
        </section>
    );

    if (profileFormState === UserProfileFormStateEnum.Permissions) {
        activeForm = (
            <JoinNetworkPrompt
                handleCloseModal={() => setProfileFormState(UserProfileFormStateEnum.Account)}
                showNotificationsModal={false}
                showRejectModal={false}
            />
        );
    } else if (profileFormState === UserProfileFormStateEnum.PermissionsSettings) {
        activeForm = (
            <NetworkSettings
                handleCloseModal={() => setProfileFormState(UserProfileFormStateEnum.Account)}
                settings={networkSettings}
                handleStateChange={handleStateChange}
            />
        );
    } else if (profileFormState === UserProfileFormStateEnum.Notifications) {
        activeForm = (
            <PushNotificationsPrompt
                handleCloseModal={() => setProfileFormState(UserProfileFormStateEnum.Account)}
            />
        );
    } else if (profileFormState === UserProfileFormStateEnum.Chapi) {
        activeForm = (
            <ChapiPrompt onBack={() => setProfileFormState(UserProfileFormStateEnum.Account)} />
        );
    }

    return <>{activeForm}</>;
};

export default UserProfileSetup;
