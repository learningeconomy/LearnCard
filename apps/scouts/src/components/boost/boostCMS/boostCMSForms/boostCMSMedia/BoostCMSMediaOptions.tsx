import React from 'react';

import X from 'learn-card-base/svgs/X';
import { BoostCMSState } from '../../../boost';
import CreateMediaAttachmentForm from './CreateMediaAttachmentForm';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

const BoostCMSMediaOptions: React.FC<{
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
            <AppContent>
                <AppGrid className="ion-padding">
                    <CreateMediaAttachmentForm
                        initialState={state}
                        createMode
                        // handleSave={handleSaveMediaState}
                        setParentState={setState}
                        handleCloseModal={handleCloseModal}
                    />
                </AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default BoostCMSMediaOptions;
