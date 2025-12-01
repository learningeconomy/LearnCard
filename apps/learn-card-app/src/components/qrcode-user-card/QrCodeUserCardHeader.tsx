import React from 'react';

import X from 'learn-card-base/svgs/X';
import { IonHeader, IonToolbar } from '@ionic/react';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';

import { useCurrentUser, useModal, useDeviceTypeByWidth } from 'learn-card-base';

export const QrCodeUserCardHeader: React.FC<{ showCompact: boolean }> = ({ showCompact }) => {
    const { closeModal } = useModal();
    const currentUser = useCurrentUser();
    const { isMobile } = useDeviceTypeByWidth();

    const name = currentUser?.name ?? '';

    return (
        <IonToolbar className="w-full sticky top-0" color="light">
            <IonHeader className="w-full flex items-center justify-between px-2 py-2">
                <div className="flex items-center">
                    {isMobile && showCompact && (
                        <>
                            <ProfilePicture
                                customContainerClass="text-grayscale-900 h-[35px] w-[35px] min-h-[35px] min-w-[35px]"
                                customImageClass="w-full h-full object-cover"
                            />
                            {name && (
                                <p className="text-gray-900 font-semibold text-[17px] ml-2">
                                    {name}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => closeModal()}
                    className="bg-grayscale-200 p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center"
                >
                    <X className="text-grayscale-900 h-[45px] w-[45px]" />
                </button>
            </IonHeader>
        </IonToolbar>
    );
};

export default QrCodeUserCardHeader;
