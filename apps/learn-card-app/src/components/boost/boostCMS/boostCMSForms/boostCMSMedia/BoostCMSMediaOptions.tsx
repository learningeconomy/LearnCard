import React, { useState } from 'react';
import { useModal } from 'learn-card-base';
import { createPortal } from 'react-dom';

import { IonToolbar, IonHeader } from '@ionic/react';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';

import { BoostCMSState, BoostCMSAppearanceDisplayTypeEnum } from '../../../boost';

type BoostCMSMediaOptionsProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    title?: String | React.ReactNode;
    displayType?: BoostCMSAppearanceDisplayTypeEnum;
    showCloseButton?: boolean;
};

const BoostCMSMediaOptions: React.FC<BoostCMSMediaOptionsProps> = ({
    state,
    setState,
    title,
    displayType,
    showCloseButton,
}) => {
    const { closeModal } = useModal();
    const [showCloseButtonState, setShowCloseButtonState] = useState<boolean>(
        showCloseButton || true
    );
    const sectionPortal = document.getElementById('section-cancel-portal');

    return (
        <>
            <section
                id="user-options-modal"
                className="max-w-[500px] flex flex-col items-center justify-center"
            >
                <IonHeader className="ion-no-border bg-white pt-5">
                    {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
                </IonHeader>

                <CreateMediaAttachmentForm
                    initialState={state}
                    createMode
                    setParentState={setState}
                    displayType={displayType}
                    showCloseButtonState={showCloseButtonState}
                    setShowCloseButtonState={setShowCloseButtonState}
                />
            </section>
            {sectionPortal &&
                showCloseButtonState &&
                createPortal(
                    <div className="w-full flex items-center justify-center">
                        <div className="flex flex-col justify-center items-center relative !border-none w-full max-w-[500px]">
                            <button
                                onClick={closeModal}
                                className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                            >
                                Close
                            </button>
                        </div>
                    </div>,
                    sectionPortal
                )}
        </>
    );
};

export default BoostCMSMediaOptions;
