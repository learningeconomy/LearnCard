import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';
import keyboardStore from 'learn-card-base/stores/keyboardStore';

import User from '../../../components/svgs/User';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';
import AddressBookContactOptions from '../addressBook-contact-options/AddressBookContactOptions';
import { useAppOverlayModal } from 'learn-card-base/ui/overlays/useAppOverlayModal';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

import { useIsCurrentUserLCNUser } from 'learn-card-base';
import useLCNGatedAction from 'apps/learn-card-app/src/components/network-prompts/hooks/useLCNGatedAction';
import { AppFooter, AppToolbar } from 'learn-card-base/ui/chrome';

export const AddressBookFooter: React.FC<{
    showSearch?: boolean;
    handleShowSearch?: () => void;
}> = ({ showSearch, handleShowSearch }) => {
    const history = useHistory();
    const bottomBarRef = useRef<HTMLDivElement>(null);

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

    const [presentCenterModal, dismissCenterModal] = useAppOverlayModal(AddressBookContactOptions, {
        handleCloseModal: () => dismissCenterModal(),
        showSearch,
        handleShowSearch,
    });

    return (
        <AppFooter className="learn-card-header ion-no-border" ref={bottomBarRef}>
            <AppToolbar className="ion-no-border" color="light">
                <AppGrid className="bg-white">
                    <AppRow className="w-full mt-4 flex items-center justify-center">
                        <AppCol className="flex items-center justify-between max-w-[600px]">
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

                                    history.push('/issue');
                                }}
                                className="bg-gradient-rainbow text-lg text-white flex items-center justify-center font-semibold py-[5px] rounded-full w-1/2 border-solid border-white border-2 px-[18px] shadow-soft-bottom mb-[10px]"
                            >
                                Boost
                                <GearPlusIcon className="ml-1 text-grayscale-800" />
                            </button>
                        </AppCol>
                    </AppRow>
                </AppGrid>
            </AppToolbar>
        </AppFooter>
    );
};

export default AddressBookFooter;
