import React from 'react';

import { IonRow, IonCol } from '@ionic/react';

import { useModal, ModalTypes } from 'learn-card-base';
import { openToS, openPP } from '../../helpers/externalLinkHelpers';
import ModalLayout from '../../layout/ModalLayout';
import { JoinNetworkModalWrapper } from './hooks/useJoinLCNetworkModal';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';

export const RejectNetworkPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openNetworkModal = () => {
        newModal(
            <JoinNetworkModalWrapper handleCloseModal={closeModal} showNotificationsModal={false} />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <ModalLayout handleOnClick={handleCloseModal}>
            <IonRow className="flex flex-col pb-4 pt-2 w-full">
                <IonCol className="w-full flex items-center justify-center">
                    <h6 className="tracking-[12px] text-base font-bold text-black">SCOUTPASS</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black text-2xl">{m['networkPrompts.reject.noProblem']()}</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black text-2xl">
                        {m['networkPrompts.reject.stillUse']()}
                    </h6>
                </IonCol>
            </IonRow>

            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                        <TransP
                            m={m['networkPrompts.reject.credAccess']}
                            components={[<span key="scoutpass-num" className="text-indigo-500 font-bold" />]}
                        />
                    </p>
                </IonCol>
            </IonRow>
            <IonRow className="w-full flex items-center justify-center mt-6">
                <IonCol className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                    <button
                        onClick={() => handleCloseModal()}
                        type="submit"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 text-2xl w-full shadow-lg font-medium max-w-[320px]"
                    >
                        {m['common.continue']()}
                    </button>

                    <div className="w-full flex items-center justify-center m-4">
                        <button
                            onClick={() => {
                                handleCloseModal();
                                openNetworkModal();
                            }}
                            className="text-grayscale-900 text-center text-base w-full font-medium"
                        >
                            {m['networkPrompts.reject.joinNet']()}
                        </button>
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                        {m['networkPrompts.dataOwn']()}
                        <br />
                        {m['networkPrompts.encrypted']()}
                    </p>
                    <button className="text-indigo-500 font-bold">{m['common.learnMore']()}</button>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="flex items-center justify-center">
                    <button onClick={openPP} className="text-indigo-500 font-bold text-sm">
                        {m['login.privacyPolicy']()}
                    </button>
                    <span className="text-indigo-500 font-bold text-sm">&nbsp;{m['networkPrompts.separator']()}&nbsp;</span>
                    <button onClick={openToS} className="text-indigo-500 font-bold text-sm">
                        {m['login.termsOfService']()}
                    </button>
                </IonCol>
            </IonRow>
        </ModalLayout>
    );
};

export default RejectNetworkPrompt;
