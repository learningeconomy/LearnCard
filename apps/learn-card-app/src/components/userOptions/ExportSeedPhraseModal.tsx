import React, { useState } from 'react';

import { IonCol, IonRow } from '@ionic/react';
import WarningIcon from '../svgs/WarningIcon';
import SeedPhraseModal from './SeedPhraseModal';

import { useCurrentUser, useModal, ModalTypes } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import { auth } from '../../firebase/firebase';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

const ExportSeedPhraseModal: React.FC<{}> = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const brandingConfig = useBrandingConfig();
    const firebaseAuth = auth();
    const currentFirebaseUser = firebaseAuth.currentUser;
    const currentUser = useCurrentUser();

    const [phrase, setPhrase] = useState<string>(
        currentFirebaseUser?.email ?? currentFirebaseUser?.phoneNumber ?? currentUser?.email ?? ''
    );
    const [confirmationPhrase, setConfirmationPhrase] = useState<string>();
    const placeholderSource = currentFirebaseUser?.phoneNumber
        ? m['profile.export.phonePlaceholder']()
        : m['profile.export.emailPlaceholder']();
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
                    {m['profile.export.title']()}
                </h1>
                <IonRow className="flex flex-col items-center justify-center bg-white text-black delete-user-icon-wrap">
                    <span aria-hidden="true">
                        <WarningIcon className="h-[48px] w-[48px]" />
                    </span>
                </IonRow>
                <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                    <h2 className="ion-text-center mt-2 font-bold text-2xl tracking-wider bg-white">
                        {m['profile.export.warning']()}
                    </h2>
                </IonRow>
            </IonRow>
            <IonRow className="flex flex-col items-center justify-center bg-white text-black">
                <p className="ion-text-center mt-2 font-normal text-sm tracking-wider bg-white px-2 delete-user-prompt-text max-w-[400px]">
                    <TransP
                        m={m['profile.export.masterKeyWarning']}
                        values={{ brand: brandingConfig?.name }}
                        components={[<b key="w" />]}
                    />
                </p>
                <h2
                    id="export-phrase-confirmation-label"
                    className="ion-text-center text-lg font-semibold text-2x mt-4"
                >
                    {m['profile.export.confirmByTyping']()}
                </h2>
                <p
                    id="export-phrase-confirmation-description"
                    className="ion-text-center text-base font-bold"
                >
                    <span className="text-red-700">{phrase}</span>
                    <br />
                    {m['profile.export.below']()}
                </p>
            </IonRow>
            <IonRow className="flex flex-col items-center justify-center w-full ion-padding mt-3">
                <input
                    id="export-phrase-confirmation"
                    autoCapitalize="on"
                    className="w-full bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-400 rounded-[15px] px-4 py-3 font-medium tracking-widest text-base max-w-[400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent"
                    placeholder={placeholderSource}
                    onChange={event => setConfirmationPhrase(event.target.value)}
                    value={confirmationPhrase ?? ''}
                    type="text"
                    autoComplete="off"
                    aria-labelledby="export-phrase-confirmation-label"
                    aria-describedby="export-phrase-confirmation-description"
                />
            </IonRow>
            <IonRow className="w-full bg-white">
                <IonCol
                    size="12"
                    className="w-full flex items-center justify-center flex-col pt-2 pb-4"
                >
                    <button
                        type="button"
                        disabled={!canExportPhrase}
                        onClick={e => {
                            closeModal();
                            newModal(
                                <div className="p-[20px]">
                                    <h2 className="text-[16px] font-poppins font-medium text-grayscale-900">
                                        {m['profile.export.revealPrompt']()}
                                    </h2>
                                    <div className="flex justify-end items-end">
                                        <button
                                            type="button"
                                            className="text-[#0054E9] font-medium font-poppins leading-[150%] mr-[10px]"
                                            onClick={handleExportSeed}
                                        >
                                            {m['profile.export.confirm']()}
                                        </button>
                                        <button
                                            type="button"
                                            className="text-[#0054E9] font-medium font-poppins leading-[150%] mr-[10px]"
                                            onClick={closeModal}
                                        >
                                            {m['profile.export.cancel']()}
                                        </button>
                                    </div>
                                </div>,
                                { sectionClassName: '!max-w-[450px]', hideButton: true }
                            );
                        }}
                        className={`text-white w-[90%] font-bold text-lg mb-4 rounded-full max-w-[400px] p-3 ${
                            canExportPhrase ? 'bg-red-700' : 'bg-grayscale-400'
                        }`}
                    >
                        {m['profile.export.button']()}
                    </button>
                </IonCol>
            </IonRow>
        </div>
    );
};

export default ExportSeedPhraseModal;
