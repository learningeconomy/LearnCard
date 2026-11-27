import React from 'react';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { AppContent, AppHeader, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

export const ClaimBoostLoggedOutPrompt: React.FC<{
    handleCloseModal: () => void;
    handleRedirectTo: () => void;
}> = ({ handleCloseModal, handleRedirectTo }) => {
    const brandingConfig = useBrandingConfig();

    return (
        <AppPage>
            <AppHeader className="ion-no-border ion-no-padding bg-white">
                <AppRow className="flex flex-col pt-[50px]">
                    <AppCol className="w-full flex items-center justify-center">
                        <h6 className="tracking-[12px] text-base font-bold text-black">
                            {brandingConfig?.name}
                        </h6>
                    </AppCol>
                </AppRow>
            </AppHeader>
            <AppContent>
                <AppGrid className="relative flex flex-col items-center justify-center h-full w-full">
                    <AppRow className="flex flex-col items-center justify-center">
                        <AppCol className="w-full flex flex-col items-center justify-center">
                            <h6 className="font-semi-bold text-grayscale-900 font-mouse font-medium text-xl mb-[25px]">
                                One more step!
                            </h6>
                            <p className="w-full text-center text-sm mb-4 text-grayscale-600 mb-[25px]">
                                Please login to claim your <br /> boost/credential.
                            </p>
                            <button
                                onClick={handleRedirectTo}
                                className="flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-emerald-700 font-mouse font-medium text-xl w-full shadow-lg"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleRedirectTo}
                                className="mt-4 text-grayscale-900 font-medium"
                            >
                                Signup
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="mt-2 text-grayscale-900 font-medium"
                            >
                                Close
                            </button>
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </AppContent>
        </AppPage>
    );
};

export default ClaimBoostLoggedOutPrompt;
