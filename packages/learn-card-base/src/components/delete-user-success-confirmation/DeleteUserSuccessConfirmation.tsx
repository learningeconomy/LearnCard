import React from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';

import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';
import { IonHeader, IonToolbar } from '@ionic/react';

export const DeleteUserSuccessConfirmation: React.FC<{ branding: BrandingEnum }> = ({
    branding = BrandingEnum.learncard,
}) => {
    let brandingContainerStyles;
    let statusBarColor;

    if(branding === BrandingEnum.learncard) {
        brandingContainerStyles = 'bg-white text-emerald-600';
        statusBarColor = 'light';
    } else if (branding === BrandingEnum.metaversity) {
        brandingContainerStyles = 'bg-white text-mv_blue-700';
        statusBarColor = 'light';
    } else if (branding === BrandingEnum.scoutPass) {
        brandingContainerStyles = 'bg-white text-sp-purple';
        statusBarColor = 'light';
    }

    return (
        <IonHeader>
            <IonToolbar color={statusBarColor}>
                <div className={`w-full ${brandingContainerStyles}`}>
                    <div className="flex flex-col items-center justify-center text-center w-full p-2">
                        <Checkmark className="h-[36px] w-[36px]" />
                        <p className="font-semibold">
                            Your account was successfully
                            <br /> deleted.
                        </p>
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default DeleteUserSuccessConfirmation;
