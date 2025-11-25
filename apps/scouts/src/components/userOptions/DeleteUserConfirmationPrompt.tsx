import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/firebase';

import useFirebase from '../../hooks/useFirebase';
import { authStore, SocialLoginTypes, useWallet, useModal, useCurrentUser } from 'learn-card-base';

import { getAuthToken } from 'learn-card-base/helpers/authHelpers';

import { IonCol, IonRow, IonInput } from '@ionic/react';
import WarningIcon from '../svgs/WarningIcon';
import confirmationStore from 'learn-card-base/stores/confirmationStore';
import deletingAccountStore from 'learn-card-base/stores/deletingAccountStore';
import DeleteAccountModal from './DeleteAccountModal';
import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';

const DeleteUserConfirmationPrompt: React.FC<{
    handleCloseModal: () => void;
    handleLogout: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}> = ({ handleCloseModal, handleLogout }) => {
    const firebaseAuth = auth();
    const { removeAllVCsFromWallet, initWallet } = useWallet();
    const { deleteFirebaseUser } = useFirebase();
    const currentUser = useCurrentUser();
    const { newModal } = useModal();
    const authToken = getAuthToken();
    const currentFirebaseUser = firebaseAuth.currentUser;

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
                console.log('getLCNeworkProfile::err', err);
            }
        };

        getLCNeworkProfile();
    }, []);

    const canDelete = phrase === confirmationPhrase && !isLoading;

    const handleLCNetworkProfileDelete = async () => {
        const wallet = await initWallet();

        if (lcNetworkProfile && lcNetworkProfile?.profileId) await wallet.invoke.deleteProfile();
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
                // handles deleting a user's LCN account when logged in thru ScoutsSSO
            } else if (authStore?.get?.typeOfLogin() === SocialLoginTypes?.scoutsSSO) {
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
                        setError(`A recent login is required!`);
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
                <IonRow className="delete-user-icon-wrap flex flex-col items-center justify-center bg-white text-black">
                    <WarningIcon className="h-[48px] w-[48px]" />
                </IonRow>
                <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                    <h3 className="ion-text-center mt-2 bg-white text-2xl font-bold tracking-wider">
                        Delete Account?
                    </h3>
                </IonRow>
            </IonRow>

            <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                <p className="ion-text-center mt-2 font-normal text-sm tracking-wider bg-white px-2 delete-user-prompt-text max-w-[400px]">
                    Deleting your account will permanently delete your identity on ScoutPass and all
                    of your credentials. <b>Warning, this action cannot be undone!</b>
                </p>
                <h2 className="ion-text-center text-lg font-semibold mt-4">Confirm by typing</h2>
                <p className="ion-text-center text-base font-bold">
                    <span className="text-rose-500">{phrase} </span>
                    <br />
                    below.
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
                            Reauthenticate here
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
                        className={`text-white w-[90%] font-bold text-lg mb-4 rounded-full p-3 ${
                            canDelete ? 'bg-rose-500' : 'bg-grayscale-400'
                        }`}
                    >
                        {isLoading ? 'Loading... ' : 'Delete Forever'}
                    </button>
                </IonCol>
            </IonRow>
        </div>
    );
};

export default DeleteUserConfirmationPrompt;
