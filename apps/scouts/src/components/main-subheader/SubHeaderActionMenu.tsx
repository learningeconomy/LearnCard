import React from 'react';

import * as m from '../../paraglide/messages.js';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

const SubHeaderActionMenu: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}> = ({ handleCloseModal, handleSelfIssue, handleShareCreds }) => {
    const handleSelfIssueCredential = () => {
        handleCloseModal?.();
        handleSelfIssue?.();
    };

    const handleCreateCredBundle = () => {
        handleCloseModal?.();
        handleShareCreds?.();
    };

    return (
        <AppPage>
            <AppContent>
                <AppGrid className="ion-padding">
                    <AppCol className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={handleCreateCredBundle}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                            {m['common.share']()}
                        </button>
                    </AppCol>
                    <AppCol className="w-full flex items-center justify-center mt-1">
                        <button
                            onClick={handleSelfIssueCredential}
                            className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] text-white font-mouse text-3xl w-full shadow-lg uppercase tracking-wide"
                        >
                            {m['sidemenu.viewSharedBoosts']()}
                        </button>
                    </AppCol>
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default SubHeaderActionMenu;
