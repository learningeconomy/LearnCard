import React from 'react';

import * as m from '../../../../../paraglide/messages.js';

import X from 'learn-card-base/svgs/X';
import { BoostCMSState } from '../../../boost';

import BoostCMSAppearanceBadgeList from './BoostCMSAppearanceBadgeList';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

const BoostCMSAppearanceBadgeSelector: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
}> = ({ state, setState, handleCloseModal, showCloseButton = true, title }) => {
    return (
        <AppPage id="user-options-modal">
            <AppHeader className="ion-no-border bg-white pt-5">
                <AppRow className="w-full bg-white">
                    <AppCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </AppCol>
                </AppRow>
                {title && <AppToolbar color="#fffff">{title}</AppToolbar>}
            </AppHeader>
            <AppContent color="white">
                <AppGrid className="ion-padding">
                    <BoostCMSAppearanceBadgeList
                        state={state}
                        setState={setState}
                        handleCloseModal={handleCloseModal}
                    />
                </AppGrid>
                <div className="w-full flex items-center justify-center pb-8">
                    <button
                        onClick={() => handleCloseModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        {m['common.cancel']()}
                    </button>
                </div>
            </AppContent>
        </AppPage>
    );
};

export default BoostCMSAppearanceBadgeSelector;
