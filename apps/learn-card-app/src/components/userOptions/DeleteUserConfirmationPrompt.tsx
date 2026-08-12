import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/firebase';
import { getLogger } from 'learn-card-base';
const log = getLogger('delete-user-confirmation-prompt');

import useFirebase from '../../hooks/useFirebase';
import { useWallet } from 'learn-card-base';
import { useCurrentUser, useModal } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';

import { IonCol, IonRow, IonInput } from '@ionic/react';
import WarningIcon from '../svgs/WarningIcon';
import confirmationStore from 'learn-card-base/stores/confirmationStore';
import deletingAccountStore from 'learn-card-base/stores/deletingAccountStore';
import DeleteAccountModal from './DeleteAccountModal';

import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

const DeleteUserConfirmationPrompt: React.FC<{
    handleCloseModal: () => void;
    handleLogout: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    showFixedFooter?: boolean;
    showCloseButton?: boolean;
}> = ({ handleCloseModal, handleLogout, showCloseButton = true, showFixedFooter = false }) => {
    const firebaseAuth = auth();
    const { removeAllVCsFromWallet, initWallet } = useWallet();
    const { deleteFirebaseUser } = useFirebase();
    const currentUser = useCurrentUser();
    const { newModal } = useModal();
    const authToken = getAuthToken();
    const currentFirebaseUser = firebaseAuth.currentUser;
    const brandingConfig = useBrandingConfig();

    const [phrase, setPhrase] = useState<string>(
        currentFirebaseUser?.email ?? currentFirebaseUser?.phoneNumber ?? currentUser?.email ?? ''
    );

    const [confirmationPhrase, setConfirmationPhrase] = useState<string>();
    const [lcNetworkProfile, setLcNetworkProfile] = useState<AddressBookContact | null | undefined>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

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

    const canDelete = phrase === confirmationPhrase && !isLoading;

    const handleLCNetworkProfileDelete = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) {
            const deletedProfile = await wallet.invoke.deleteProfile();
            log.info('deletedProfile::res', deletedProfile);
        }
    };

    const handleDeleteAccount = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        deletingAccountStore.set.deletingAccount(true);
        setIsLoading(true);
        if (canDelete) {
            if (authToken === 'dummy') {
                await removeAllVCsFromWallet();
                await handleLCNetworkProfileDelete();
                newModal(<DeleteAccountModal />, { sectionClassName: '!max-w-[350px]' });
                handleLogout(e);
                confirmationStore.set.showConfirmation(true);
                setIsLoading(false);
            } else {
                const userDeleted = await deleteFirebaseUser();

                if (userDeleted.success) {
                    await removeAllVCsFromWallet();
                    await handleLCNetworkProfileDelete();
                    newModal(<DeleteAccountModal />, { sectionClassName: '!max-w-[350px]' });
                    handleLogout(e);
                    confirmationStore.set.showConfirmation(true);
                    setIsLoading(false);
                } else {
                    if (userDeleted.message === 'auth/requires-recent-login') {
                        setError(m['profile.delete.recentLoginRequired']());
                    } else {
                        setError(userDeleted.message);
                    }
                    setIsLoading(false);
                    deletingAccountStore.set.deletingAccount(false);
                }
            }
        }
    };

    const handleReAuthenticateRedirect = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        handleCloseModal();
        handleLogout(e);
    };

    return (
        <div>
            <IonRow className="flex flex-col items-center justify-center bg-white text-black w-full pt-6">
                <IonRow className="flex flex-col items-center justify-center bg-white text-black delete-user-icon-wrap">
                    <WarningIcon className="h-[48px] w-[48px]" />
                </IonRow>
                <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                    <h3 className="ion-text-center mt-2 font-bold text-2xl tracking-wider bg-white">
                        {m['profile.delete.title']()}
                    </h3>
                </IonRow>
            </IonRow>
            <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                <p className="ion-text-center mt-2 font-normal text-sm tracking-wider bg-white px-2 delete-user-prompt-text max-w-[400px]">
                    <TransP
                        m={m['profile.delete.warning']}
                        values={{ brand: brandingConfig?.name }}
                        components={[<b key="w" />]}
                    />
                </p>
                <h2 className="ion-text-center text-lg font-semibold text-2x mt-4">
                    {m['profile.delete.confirmByTyping']()}
                </h2>
                <p className="ion-text-center text-base font-bold">
                    <span className="text-rose-500">{phrase} </span>
                    <br />
                    {m['profile.delete.below']()}
                </p>
            </IonRow>
            <IonRow className="flex flex-col items-center justify-center w-full ion-padding mt-3">
                <IonInput
                    autocapitalize="on"
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base max-w-[400px] ${
                        error ? 'login-input-email-error' : ''
                    }`}
                    placeholder={phrase}
                    onIonInput={e => setConfirmationPhrase(e.detail.value)}
                    value={confirmationPhrase}
                    type="text"
                />
                {error && (
                    <p className="text-center login-input-error-msg">
                        {error}{' '}
                        <button
                            onClick={handleReAuthenticateRedirect}
                            className="text-mv_blue-700 font-bold mt-2"
                        >
                            {m['profile.delete.reauthenticateHere']()}
                        </button>
                    </p>
                )}
            </IonRow>
            <IonRow className="w-full bg-white">
                <IonCol
                    size="12"
                    className="w-full flex items-center justify-center flex-col pt-2 pb-4"
                >
                    <button
                        disabled={!canDelete}
                        onClick={handleDeleteAccount}
                        className={`text-white w-[90%] font-bold text-lg mb-4 rounded-full max-w-[400px] p-3 ${
                            canDelete ? 'bg-rose-500' : 'bg-grayscale-400'
                        }`}
                    >
                        {isLoading
                            ? m['profile.delete.loading']()
                            : m['profile.delete.deleteForever']()}
                    </button>
                </IonCol>
            </IonRow>
        </div>
    );
};

export default DeleteUserConfirmationPrompt;
