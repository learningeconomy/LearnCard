import React, { useState } from 'react';

import * as m from '../../../../paraglide/messages.js';
import TroopsCMSLayout from '../../TroopsCMSLayout';
import TroopIDPreviewFrontFace from './TroopIDPreviewFrontFace';
import TroopIDPreviewBackFace from './TroopIDPreviewBackFace';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../../troopCMSState';
import { AppFooter, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';

const TroopIDPreview: React.FC<{
    rootViewMode: TroopsCMSViewModeEnum;
    viewMode: TroopsCMSViewModeEnum;
    state: TroopsCMSState;
    handleCloseModal: () => void;
}> = ({ rootViewMode, viewMode, state, handleCloseModal }) => {
    const [isFront, setIsFront] = useState<boolean>(true);

    return (
        <AppPage>
            <TroopsCMSLayout
                state={state}
                viewMode={rootViewMode}
                layoutClassName="max-w-[375px]! vc-preview-modal-safe-area"
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
                <AppFooter
                    mode="ios"
                    className="w-full flex justify-center items-center ion-no-border pb-[15px] absolute bottom-0"
                >
                    <AppToolbar className="w-full" color="transparent" mode="ios">
                        <div className="w-full flex items-center justify-center">
                            <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                                <button
                                    onClick={() => handleCloseModal()}
                                    className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                                >
                                    {m['common.close']()}
                                </button>
                                <button
                                    onClick={() => setIsFront(!isFront)}
                                    className="bg-white text-grayscale-900 text-lg rounded-full py-[12px] w-full mr-2 shadow-soft-bottom"
                                >
                                    {isFront ? m['common.details']() : m['common.back']()}
                                </button>
                            </div>
                        </div>
                    </AppToolbar>
                </AppFooter>
                <div
                    role="presentation"
                    className="absolute bottom-0 h-32 w-full gradient-mask-t-0 bg-white/90"
                />
            </>
        </AppPage>
    );
};

export default TroopIDPreview;
