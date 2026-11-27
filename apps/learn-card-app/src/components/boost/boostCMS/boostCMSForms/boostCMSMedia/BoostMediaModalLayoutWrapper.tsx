import React from 'react';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
import X from 'learn-card-base/svgs/X';
import { AppContent, AppHeader, AppPage, AppToolbar } from 'learn-card-base/ui/chrome';

type BoostMediaModalLayoutWrapperProps = {
    showCloseButton?: boolean;
    handleCloseModal?: () => void;
    title?: string;
    children: React.ReactNode;
};

export const BoostMediaModalLayoutWrapper: React.FC<BoostMediaModalLayoutWrapperProps> = ({
    showCloseButton,
    handleCloseModal,
    title,
    children,
}) => {
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
                <AppGrid className="ion-padding">{children}</AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default BoostMediaModalLayoutWrapper;
