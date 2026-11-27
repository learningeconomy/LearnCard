import React from 'react';

import { IonContent, IonPage } from '@ionic/react';
import { AppCol, AppGrid, AppRow } from '../layout';
import { ACHIEVEMENT_CATEGORIES } from '../../../../../packages/learn-card-base/src/components/IssueVC/constants';
import X from 'learn-card-base/svgs/X';

import useTheme from '../../theme/hooks/useTheme';
import { AppHeader, AppToolbar } from '../chrome';

const SubHeaderActionMenu: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
    handleSelfIssue: () => void;
    handleShareCreds: () => void;
}> = ({ handleCloseModal, showCloseButton = true, title, handleSelfIssue, handleShareCreds }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleSelfIssueCredential = () => {
        handleCloseModal?.();
        handleSelfIssue?.();
    };

    const handleCreateCredBundle = () => {
        handleCloseModal?.();
        handleShareCreds?.();
    };

    return (
        <IonPage>
            {/* <AppHeader className="ion-no-border bg-white pt-5">
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
            </AppHeader> */}
            <IonContent>
                <AppGrid className="ion-padding">
                    <AppCol className="w-full flex items-center justify-center mt-8">
                        {/* desktop */}
                        <button
                            onClick={handleCreateCredBundle}
                            className={`flex items-center justify-center bg-${primaryColor} rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg modal-btn-desktop normal tracking-wide`}
                        >
                            Share Boosts
                        </button>
                        {/* mobile */}
                        <button
                            onClick={handleCreateCredBundle}
                            className={`flex items-center justify-center bg-${primaryColor} rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg modal-btn-mobile normal tracking-wide`}
                        >
                            Share Boosts
                        </button>
                    </AppCol>
                    <AppCol className="w-full flex items-center justify-center mt-1">
                        {/* desktop */}
                        <button
                            onClick={handleSelfIssueCredential}
                            className={`flex items-center justify-center bg-${primaryColor} rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg modal-btn-desktop normal tracking-wide`}
                        >
                            View Shared Boosts
                        </button>
                        {/* mobile */}
                        <button
                            onClick={handleSelfIssueCredential}
                            className={`flex items-center justify-center bg-${primaryColor} rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg modal-btn-mobile normal tracking-wide`}
                        >
                            View Shared Boosts
                        </button>
                    </AppCol>
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </AppGrid>
            </IonContent>
        </IonPage>
    );
};

export default SubHeaderActionMenu;
