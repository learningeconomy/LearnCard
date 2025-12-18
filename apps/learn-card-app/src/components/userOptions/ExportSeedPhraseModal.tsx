import React, { useState } from 'react';
import { auth } from '../../firebase/firebase';

import { useCurrentUser, useModal, ModalTypes } from 'learn-card-base';

import { IonCol, IonRow, IonInput } from '@ionic/react';
import WarningIcon from '../svgs/WarningIcon';
import SeedPhraseModal from './SeedPhraseModal';

const ExportSeedPhraseModal: React.FC<{}> = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const firebaseAuth = auth();
    const currentFirebaseUser = firebaseAuth.currentUser;
    const currentUser = useCurrentUser();
    const [phrase, setPhrase] = useState<string>(
        currentFirebaseUser?.email ?? currentFirebaseUser?.phoneNumber ?? currentUser?.email ?? ''
    );
    const [confirmationPhrase, setConfirmationPhrase] = useState<string>();
    const placeholderSource = currentFirebaseUser?.phoneNumber ? 'Phone Number...' : 'Email...';
    const canExportPhrase = phrase === confirmationPhrase;

    const handleExportSeed = () => {
        closeModal();
        newModal(<SeedPhraseModal />, {
            sectionClassName: '!max-w-[450px] !bg-transparent !shadow-none',
            hideButton: true,
        });
    };

    return (
        <div>
            <IonRow className="flex flex-col items-center justify-center bg-white text-black w-full pt-5">
                <h1 className="ion-text-center text-black font-medium text-2xl tracking-wider bg-white delete-user-header-title">
                    Export Seed Phrase
                </h1>
                <IonRow className="flex flex-col items-center justify-center bg-white text-black delete-user-icon-wrap">
                    <WarningIcon className="h-[48px] w-[48px]" />
                </IonRow>
                <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                    <h3 className="ion-text-center mt-2 font-bold text-2xl tracking-wider bg-white">
                        Warning!
                    </h3>
                </IonRow>
            </IonRow>
            <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                <p className="ion-text-center mt-2 font-normal text-sm tracking-wider bg-white px-2 delete-user-prompt-text max-w-[400px]">
                    This is your LearnCard's master key. Anyone with access to this phrase can
                    control your LearnCard and your identity. - Do NOT share it. - Do NOT store it
                    online or take screenshots. - Write it down and store it offline. - If you lose
                    this, you may permanently lose access. <b>Are you sure you want to proceed?</b>
                </p>
                <h2 className="ion-text-center text-lg font-semibold text-2x mt-4">
                    Confirm by typing
                </h2>
                <p className="ion-text-center text-base font-bold">
                    <span className="text-rose-500">{phrase}</span>
                    <br />
                    below.
                </p>
            </IonRow>
            <IonRow className="flex flex-col items-center justify-center w-full ion-padding mt-3">
                <IonInput
                    autocapitalize="on"
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base max-w-[400px]"
                    placeholder={placeholderSource}
                    onIonInput={e => setConfirmationPhrase(e.detail.value)}
                    value={confirmationPhrase}
                    type="text"
                />
            </IonRow>
            <IonRow className="w-full bg-white">
                <IonCol
                    size="12"
                    className="w-full flex items-center justify-center flex-col pt-2 pb-4"
                >
                    <button
                        disabled={!canExportPhrase}
                        onClick={e => {
                            closeModal();
                            newModal(
                                <div className="p-[20px]">
                                    <p className="text-[16px] font-poppins font-medium text-grayscale-900">
                                        I understand - Reveal My Seed
                                    </p>
                                    <div className="flex justify-end items-end">
                                        <button
                                            className="text-[#0054E9] font-medium font-poppins leading-[150%] mr-[10px]"
                                            onClick={handleExportSeed}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            className="text-[#0054E9] font-medium font-poppins leading-[150%] mr-[10px]"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>,
                                { sectionClassName: '!max-w-[450px]', hideButton: true }
                            );
                        }}
                        className={`text-white w-[90%] font-bold text-lg mb-4 rounded-full max-w-[400px] p-3 ${
                            canExportPhrase ? 'bg-rose-500' : 'bg-grayscale-400'
                        }`}
                    >
                        Export Seed Phrase
                    </button>
                </IonCol>
            </IonRow>
        </div>
    );
};

export default ExportSeedPhraseModal;
