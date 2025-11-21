import React, { useState, useEffect } from 'react';

import { pushUtilities, useWallet } from 'learn-card-base';

import { IonPage } from '@ionic/react';

import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import UserProfileSetupHeader from './UserProfileSetupHeader';
import UserProfileUpdateForm from './UserProfileUpdateForm';
import NetworkSettings from '../network-settings/NetworkSettings';
import JoinNetworkPrompt from '../network-prompts/JoinNetworkPrompt';
import PushNotificationsPrompt from '../push-notifications-prompt/PushNotificationsPrompt';
import PushNotificationsSettings from '../push-notification-settings/PushNotificationsSettings';
import ModalLayout from '../../layout/ModalLayout';
import ChapiPrompt from '../chapi-prompt/ChapiPrompt';

import {
    NetworkSettingsEnum,
    NetworkSettingsState,
} from '../network-settings/networkSettings.helpers';
import {
    PushNotificationSettingsEnum,
    PushNotificationsSettingsState,
} from '../push-notification-settings/pushNotifications.helpers';

export enum UserProfileFormStateEnum {
    Account = 'account',
    Permissions = 'permissions',
    PermissionsSettings = 'permissionsSettings',
    Notifications = 'notifications',
    NotificationsSettings = 'notificationsSettings',
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
    const [notificationSettings, setNotificationSettings] =
        useState<PushNotificationsSettingsState>({
            connectionRequests: true,
            newBoosts: true,
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
                console.log('getLCNeworkProfile::err', err);
            }
        };

        getLCNeworkProfile();
    }, []);

    const handleNetworkPrompt = () => {
        // if (lcNetworkProfile) {
        //     setProfileFormState(UserProfileFormStateEnum.PermissionsSettings);
        // } else {
        setProfileFormState(UserProfileFormStateEnum.Permissions);
        // }
    };

    const handleNotificationsPrompt = async () => {
        const permissionState = await pushUtilities.getPushNotificationPermissionState();

        if (permissionState === 'GRANTED') {
            setProfileFormState(UserProfileFormStateEnum.NotificationsSettings);
        } else {
            setProfileFormState(UserProfileFormStateEnum.Notifications);
        }
    };

    const handleChapiInfo = () => {
        setProfileFormState(UserProfileFormStateEnum.Chapi);
    };

    const handleStateChange = (settingsType: NetworkSettingsEnum, settingState: boolean) => {
        const _settings = networkSettings;

        _settings[settingsType] = !settingState;
        setNetworkSettings({ ..._settings });
    };

    const handleNotificationStateChange = (
        settingsType: PushNotificationSettingsEnum,
        settingState: boolean
    ) => {
        const _settings = notificationSettings;

        _settings[settingsType] = !settingState;
        setNotificationSettings({ ..._settings });
    };

    let activeForm = (
        <section className="py-[30px]">
            <UserProfileUpdateForm
                handleCloseModal={handleCloseModal}
                handleLogout={handleLogout}
                showCancelButton={showCancelButton}
                showDeleteAccountButton={showDeleteAccountButton}
                showNetworkModal={showNetworkModal}
                showNotificationsModal={showNotificationsModal}
                handleChapiInfo={handleChapiInfo}
                title={title}
            >
                <UserProfileSetupHeader
                    showNetworkSettings={showNetworkSettings}
                    handleNetworkPrompt={handleNetworkPrompt}
                    handleNotificationsPrompt={handleNotificationsPrompt}
                />
            </UserProfileUpdateForm>
        </section>
    );

    if (profileFormState === UserProfileFormStateEnum.Permissions) {
        activeForm = (
            <ModalLayout
                handleOnClick={() => setProfileFormState(UserProfileFormStateEnum.Account)}
                allowScroll
            >
                <JoinNetworkPrompt
                    handleCloseModal={() => setProfileFormState(UserProfileFormStateEnum.Account)}
                    showNotificationsModal={false}
                    showRejectModal={false}
                />
            </ModalLayout>
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
    } else if (profileFormState === UserProfileFormStateEnum.NotificationsSettings) {
        activeForm = (
            <PushNotificationsSettings
                handleCloseModal={() => setProfileFormState(UserProfileFormStateEnum.Account)}
                settings={notificationSettings}
                handleStateChange={handleNotificationStateChange}
            />
        );
    } else if (profileFormState === UserProfileFormStateEnum.Chapi) {
        activeForm = (
            <ChapiPrompt
                handleCloseModal={() => setProfileFormState(UserProfileFormStateEnum.Account)}
            />
        );
    }

    return <>{activeForm}</>;
};

export default UserProfileSetup;
