import React from 'react';

import { IonCol, IonRow } from '@ionic/react';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    return (
        <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px] py-10">
            <IonCol
                size="12"
                className="flex flex-col items-center justify-center w-full bg-white mb-4"
            >
                <h6 className="font-semi-bold text-black font-poppins text-xl mb-0">
                    {t('boost.cms.publish.readyToPublish', 'Are you ready to publish?')}
                </h6>
                <p className="text-center text-black mt-4">
                    {t('boost.cms.publish.lockWarning', 'This boost will be locked in a verifiable seal forever and can\'t be changed after you publish.')}
                </p>
            </IonCol>
            <IonCol size="12" className="flex flex-col items-center justify-center w-full bg-white">
                <button
                    onClick={handlePreview}
                    className="flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 font-poppins text-xl w-full shadow-lg normal max-w-[325px] mb-4"
                >
                    {t('boost.cms.publish.preview', 'Preview')}
                </button>
                {showSaveAsDraftButton && (
                    <button
                        disabled={isSaveLoading}
                        onClick={handleSaveAndQuit}
                        className="flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 font-poppins text-xl w-full shadow-lg normal max-w-[325px] mb-4"
                    >
                        {t('boost.cms.publish.saveAsDraft', 'Save As Draft')}
                    </button>
                )}
                <button
                    disabled={isPublishLoading}
                    onClick={handlePublishBoost}
                    className="flex items-center justify-center text-white rounded-full p-[12px] bg-cyan-600 font-poppins text-xl w-full shadow-lg normal max-w-[325px]"
                >
                    <RibbonAwardIcon className="w-[30px] mr-2" /> {t('boost.cms.publish.publishAndIssue', 'Publish & Issue')}
                </button>
            </IonCol>
        </IonRow>
    );
};

export default BoostCMSPublish;
