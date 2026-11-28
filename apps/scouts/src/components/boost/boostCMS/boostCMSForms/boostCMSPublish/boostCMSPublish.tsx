import React from 'react';

import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';

import { BoostCMSState } from '../../../boost';
import { boostCategoryOptions } from '../../../boost-options/boostOptions';
import * as m from '../../../../../paraglide/messages.js';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

export const BoostCMSPublish: React.FC<{
    state: BoostCMSState;
    handlePreview: () => void;
    handleSaveAndQuit: () => void;
    handlePublishBoost: () => void;
    showSaveAsDraftButton: boolean;
    isLoading: boolean;
    isSaveLoading: boolean;
    isPublishLoading: boolean;
}> = ({
    state,
    handlePreview,
    handleSaveAndQuit,
    handlePublishBoost,
    showSaveAsDraftButton = true,
    isPublishLoading,
    isSaveLoading,
}) => {
    // eslint-disable-next-line no-unsafe-optional-chaining -- existing expression; guarding it changes what this returns or throws
    const { title } = boostCategoryOptions?.[state?.basicInfo?.type];

    return (
        <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px] py-10">
            <AppCol
                size="12"
                className="flex flex-col items-center justify-center w-full bg-white mb-4"
            >
                <h6 className="font-semi-bold text-black text-2xl mb-0 font-notoSans">
                    {m['boostCMS.readyPublish']()}
                </h6>
                <p className="text-center text-black mt-4 font-notoSans">
                    {m['boostCMS.publishWarning']({ title })}
                </p>
            </AppCol>
            <AppCol size="12" className="flex flex-col items-center justify-center w-full bg-white">
                <button
                    onClick={handlePreview}
                    className="flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 text-xl w-full shadow-lg max-w-[325px] mb-4 font-notoSans"
                >
                    {m['common.preview']()}
                </button>
                {showSaveAsDraftButton && (
                    <button
                        disabled={isSaveLoading}
                        onClick={handleSaveAndQuit}
                        className="flex items-center justify-center text-white rounded-full px-[64px] py-[12px] bg-grayscale-900 text-xl w-full shadow-lg max-w-[325px] mb-4 font-notoSans"
                    >
                        {m['boostCMS.saveDraft']()}
                    </button>
                )}
                <button
                    disabled={isPublishLoading}
                    onClick={handlePublishBoost}
                    className="flex items-center justify-center text-white rounded-full p-[12px] bg-sp-purple-base text-xl w-full shadow-lg max-w-[325px] font-notoSans"
                >
                    <RibbonAwardIcon className="w-[30px] mr-2" /> {m['boostCMS.publishSend']()}
                </button>
            </AppCol>
        </AppRow>
    );
};

export default BoostCMSPublish;
