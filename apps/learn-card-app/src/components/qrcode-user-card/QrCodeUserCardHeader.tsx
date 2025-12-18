import React from 'react';

import X from 'learn-card-base/svgs/X';
import { IonHeader, IonToolbar } from '@ionic/react';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ProfilePicture, {
    UserProfilePicture,
} from 'learn-card-base/components/profilePicture/ProfilePicture';

import { useCurrentUser, useModal, useDeviceTypeByWidth } from 'learn-card-base';

export const QrCodeUserCardHeader: React.FC<{
    showCompact: boolean;
    showBackButton?: boolean;
    handleBackButton?: () => void;
    handleClose?: () => void;
    overrideName?: string;
    overrideImage?: string;
}> = ({
    showCompact,
    showBackButton,
    handleBackButton,
    handleClose,
    overrideName,
    overrideImage,
}) => {
    const { closeModal } = useModal();
    const currentUser = useCurrentUser();
    const { isMobile } = useDeviceTypeByWidth();

    const name = overrideName ?? currentUser?.name ?? '';

    const handleCloseModal = () => {
        if (handleClose) handleClose();
        else closeModal();
    };

    let profilePicture = (
        <ProfilePicture
            customContainerClass="text-grayscale-900 h-[35px] w-[35px] min-h-[35px] min-w-[35px]"
            customImageClass="w-full h-full object-cover"
        />
    );

    if (overrideImage || overrideName) {
        profilePicture = (
            <UserProfilePicture
                user={{
                    name,
                    image: overrideImage,
                }}
                customContainerClass="text-grayscale-900 text-white h-[35px] w-[35px] min-h-[35px] min-w-[35px]"
                customImageClass="w-full h-full object-cover"
            />
        );
    }

    return (
        <IonToolbar className="w-full sticky top-0" color="light">
            <IonHeader className="w-full flex items-center justify-between px-2 py-2">
                <div className="flex items-center">
                    {showBackButton && (
                        <button
                            type="button"
                            onClick={() => handleBackButton?.()}
                            className="bg-grayscale-200 p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center mr-2"
                        >
                            <SkinnyCaretRight className="text-grayscale-900 h-[45px] w-[45px] rotate-180" />
                        </button>
                    )}

                    {isMobile && showCompact && (
                        <>
                            {profilePicture}
                            {name && (
                                <p className="text-gray-900 font-semibold text-[17px] ml-2 capitalize">
                                    {name}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-grayscale-200 p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center"
                >
                    <X className="text-grayscale-900 h-[45px] w-[45px]" />
                </button>
            </IonHeader>
        </IonToolbar>
    );
};

export default QrCodeUserCardHeader;
