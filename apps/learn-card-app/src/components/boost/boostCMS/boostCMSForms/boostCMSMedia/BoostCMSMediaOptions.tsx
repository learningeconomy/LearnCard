import React from 'react';
import { useModal } from 'learn-card-base';

import { IonCol, IonRow, IonGrid, IonToolbar, IonHeader } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import { BoostCMSState, BoostCMSAppearanceDisplayTypeEnum } from '../../../boost';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';

type BoostCMSMediaOptionsProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    displayType?: BoostCMSAppearanceDisplayTypeEnum;
};

const BoostCMSMediaOptions: React.FC<BoostCMSMediaOptionsProps> = ({
    state,
    setState,
    showCloseButton = true,
    title,
    displayType,
}) => {
    const { closeModal } = useModal();
    return (
        <section id="user-options-modal" className="h-[500px]">
            <IonHeader className="ion-no-border bg-white pt-5">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={closeModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar color="#fffff">{title}</IonToolbar>}
            </IonHeader>
            <div>
                <IonGrid className="">
                    <CreateMediaAttachmentForm
                        initialState={state}
                        createMode
                        // handleSave={handleSaveMediaState}
                        setParentState={setState}
                        displayType={displayType}
                    />
                </IonGrid>
            </div>
        </section>
    );
};

export default BoostCMSMediaOptions;
