import React, { useState } from 'react';

import { IonFooter, IonPage, IonToolbar } from '@ionic/react';
import TroopsCMSLayout from '../../TroopsCMSLayout';
import TroopIDPreviewFrontFace from './TroopIDPreviewFrontFace';
import TroopIDPreviewBackFace from './TroopIDPreviewBackFace';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../../troopCMSState';

const TroopIDPreview: React.FC<{
    rootViewMode: TroopsCMSViewModeEnum;
    viewMode: TroopsCMSViewModeEnum;
    state: TroopsCMSState;
    handleCloseModal: () => void;
}> = ({ rootViewMode, viewMode, state, handleCloseModal }) => {
    const [isFront, setIsFront] = useState<boolean>(true);

    return (
        <IonPage>
            <TroopsCMSLayout
                state={state}
                viewMode={rootViewMode}
                layoutClassName="!max-w-[375px] vc-preview-modal-safe-area"
            >
                {isFront ? (
                    <TroopIDPreviewFrontFace
                        rootViewMode={rootViewMode}
                        viewMode={viewMode}
                        state={state}
                    />
                ) : (
                    <TroopIDPreviewBackFace
                        rootViewMode={rootViewMode}
                        viewMode={viewMode}
                        state={state}
                    />
                )}
            </TroopsCMSLayout>
            <>
                <IonFooter
                    mode="ios"
                    className="w-full flex justify-center items-center ion-no-border pb-[15px] absolute bottom-0"
                >
                    <IonToolbar className="w-full" color="transparent" mode="ios">
                        <div className="w-full flex items-center justify-center">
                            <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                                <button
                                    onClick={() => handleCloseModal()}
                                    className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setIsFront(!isFront)}
                                    className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                                >
                                    {isFront ? 'Details' : 'Back'}
                                </button>
                            </div>
                        </div>
                    </IonToolbar>
                </IonFooter>
                <div
                    role="presentation"
                    className="absolute bottom-0 h-32 w-full gradient-mask-t-0 bg-white/90"
                />
            </>
        </IonPage>
    );
};

export default TroopIDPreview;
