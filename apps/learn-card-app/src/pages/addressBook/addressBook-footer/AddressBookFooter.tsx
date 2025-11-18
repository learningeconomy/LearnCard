import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';
import keyboardStore from 'learn-card-base/stores/keyboardStore';

import User from '../../../components/svgs/User';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';
import BoostTemplateSelector from 'apps/learn-card-app/src/components/boost/boost-template/BoostTemplateSelector';
import AddressBookContactOptions from '../addressBook-contact-options/AddressBookContactOptions';
import { IonFooter, IonToolbar, IonGrid, IonRow, IonCol, useIonModal } from '@ionic/react';

import { ModalTypes, useIsCurrentUserLCNUser, useModal } from 'learn-card-base';

export const AddressBookFooter: React.FC<{
    showSearch?: boolean;
    handleShowSearch?: () => void;
}> = ({ showSearch, handleShowSearch }) => {
    const history = useHistory();
    const bottomBarRef = useRef<HTMLDivElement>();
    const { newModal } = useModal({ desktop: ModalTypes.Cancel });

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const { gate } = useLCNGatedAction();

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `hidden`;
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `flex`;
        }
    });

    const [presentCenterModal, dismissCenterModal] = useIonModal(AddressBookContactOptions, {
        handleCloseModal: () => dismissCenterModal(),
        showSearch,
        handleShowSearch,
    });

    return (
        <IonFooter className="learn-card-header ion-no-border" ref={bottomBarRef}>
            <IonToolbar className="ion-no-border" color="light">
                <IonGrid className="bg-white">
                    <IonRow className="w-full mt-4 flex items-center justify-center">
                        <IonCol className="flex items-center justify-between max-w-[600px]">
                            <button
                                onClick={async () => {
                                    const { prompted } = await gate();
                                    if (prompted) return;

                                    if (currentLCNUser) {
                                        presentCenterModal({
                                            cssClass:
                                                'generic-modal show-modal ion-disable-focus-trap',
                                            backdropDismiss: true,
                                            showBackdrop: false,
                                        });
                                    }
                                }}
                                className="bg-grayscale-900 text-lg text-white flex items-center justify-center font-semibold py-[8px] mr-2 rounded-full w-1/2 px-[18px] shadow-soft-bottom mb-[10px]"
                            >
                                Connect <User className="ml-[5px] h-[30px] w-[30px] ml-2" />
                            </button>
                            <button
                                onClick={async () => {
                                    const { prompted } = await gate();
                                    if (prompted) return;

                                    newModal(
                                        <BoostTemplateSelector />,
                                        {
                                            hideButton: true,
                                        },
                                        {
                                            desktop: ModalTypes.FullScreen,
                                            mobile: ModalTypes.FullScreen,
                                        }
                                    );
                                }}
                                className="bg-gradient-rainbow text-lg text-white flex items-center justify-center font-semibold py-[5px] rounded-full w-1/2 border-solid border-white border-[2px] px-[18px] shadow-soft-bottom mb-[10px]"
                            >
                                Boost
                                <GearPlusIcon className="ml-1 text-grayscale-800" />
                            </button>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonToolbar>
        </IonFooter>
    );
};

export default AddressBookFooter;
