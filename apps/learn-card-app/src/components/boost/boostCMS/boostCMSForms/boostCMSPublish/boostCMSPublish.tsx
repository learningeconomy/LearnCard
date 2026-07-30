import React from 'react';

import { IonCol, IonRow } from '@ionic/react';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import * as m from '../../../../../paraglide/messages.js';

type BoostCMSPublishProps = {
    handlePreview: () => void;
    handleSaveAndQuit: () => void;
    handlePublishBoost: () => void;
    showSaveAsDraftButton: boolean;
    isLoading: boolean;
    isSaveLoading: boolean;
    isPublishLoading: boolean;
};

export const BoostCMSPublish: React.FC<BoostCMSPublishProps> = ({
    handlePreview,
    handleSaveAndQuit,
    handlePublishBoost,
    showSaveAsDraftButton = true,
    isPublishLoading,
    isSaveLoading,
}) => {
    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px] py-10">
            <IonCol
                size="12"
                className="flex flex-col items-center justify-center w-full bg-white mb-4"
            >
                <h6 className="font-semi-bold text-black font-poppins text-xl mb-0">
                    {m['boost.cms.publish.readyToPublish']()}
                </h6>
                <p className="text-center text-black mt-4">
                    {m['boost.cms.publish.lockWarning']()}
                </p>
            </IonCol>
            <IonCol size="12" className="flex flex-col items-center justify-center w-full bg-white">
                <button
                    onClick={handlePreview}
                    className="flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 font-poppins text-xl w-full shadow-lg normal max-w-[325px] mb-4"
                >
                    {m['common.preview']()}
                </button>
                {showSaveAsDraftButton && (
                    <button
                        disabled={isSaveLoading}
                        onClick={handleSaveAndQuit}
                        className="flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 font-poppins text-xl w-full shadow-lg normal max-w-[325px] mb-4"
                    >
                        {m['boost.cms.publish.saveAsDraft']()}
                    </button>
                )}
                <button
                    disabled={isPublishLoading}
                    onClick={handlePublishBoost}
                    className="flex items-center justify-center text-white rounded-full p-[12px] bg-cyan-600 font-poppins text-xl w-full shadow-lg normal max-w-[325px]"
                >
                    <RibbonAwardIcon className="w-[30px] mr-2" />{' '}
                    {m['boost.cms.publish.publishAndIssue']()}
                </button>
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSPublish;
