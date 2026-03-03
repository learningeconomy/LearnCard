import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { IonFooter, IonToolbar, IonGrid, IonRow, IonCol } from '@ionic/react';

import User from '../../../components/svgs/User';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';

import AddressBookContactOptions from '../addressBook-contact-options/AddressBookContactOptions';
import BoostSelectMenu from '../../../components/boost/boost-select-menu/BoostSelectMenu';
import keyboardStore from 'learn-card-base/stores/keyboardStore';

import {
    BoostCategoryOptionsEnum,
    useIsCurrentUserLCNUser,
    useModal,
    ModalTypes,
} from 'learn-card-base';
import { useCheckIfUserInNetwork } from 'apps/scouts/src/components/network-prompts/hooks/useCheckIfUserInNetwork';
import useBoostModal from '../../../components/boost/hooks/useBoostModal';

export const AddressBookFooter: React.FC<{
    showSearch?: boolean;
    handleShowSearch?: () => void;
}> = ({ showSearch, handleShowSearch }) => {
    const history = useHistory();
    const bottomBarRef = useRef<HTMLDivElement>();

    const { handlePresentBoostModal } = useBoostModal(
        history,
        BoostCategoryOptionsEnum.socialBadge
    );

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    keyboardStore.store.subscribe(({ isOpen }) => {
        if (isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `hidden`;
        }
        if (!isOpen && Capacitor.isNativePlatform() && bottomBarRef.current) {
            bottomBarRef.current.className = `flex`;
        }
    });

    const { newModal: newContactOptionsModal, closeModal: closeContactOptionsModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const { newModal: newBoostOptionsModal, closeModal: closeBoostOptionsModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openContactOptions = () => {
        newContactOptionsModal(
            <AddressBookContactOptions
                handleCloseModal={() => closeContactOptionsModal()}
                showSearch={showSearch}
                handleShowSearch={handleShowSearch}
            />
        );
    };

    const openBoostOptions = (isSheet: boolean) => {
        newBoostOptionsModal(
            <BoostSelectMenu
                handleCloseModal={() => closeBoostOptionsModal()}
                showCloseButton={!isSheet}
                history={history as any}
                boostCredential={{} as any}
                boostUri=""
                profileId=""
            />
        );
    };

    return (
        <IonFooter className="learn-card-header ion-no-border" ref={bottomBarRef as any}>
            <IonToolbar className="ion-no-border" color="light">
                <IonGrid className="bg-white">
                    <IonRow className="w-full mt-4 flex items-center justify-center">
                        <IonCol className="flex items-center justify-between max-w-[600px]">
                            <button
                                onClick={() => {
                                    if (!checkIfUserInNetwork()) return;

                                    if (currentLCNUser) {
                                        openContactOptions();
                                    }
                                }}
                                className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-1/2 shadow-lg font-medium"
                            >
                                <User className="ml-[5px] h-[30px] w-[30px] mr-2" /> Connect
                            </button>
                            <button
                                onClick={() => {
                                    if (!checkIfUserInNetwork()) return;

                                    handlePresentBoostModal();
                                }}
                                className="modal-btn-desktop flex items-center justify-center bg-sp-purple-base rounded-full font-medium px-[18px] py-[12px] text-white text-2xl w-1/2 ml-3 shadow-lg"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Send
                            </button>
                            <button
                                onClick={() => {
                                    if (!checkIfUserInNetwork()) return;

                                    handlePresentBoostModal();
                                }}
                                className="modal-btn-mobile flex items-center justify-center bg-sp-purple-base rounded-full px-[18px] py-[12px] text-white text-2xl font-medium w-1/2 ml-3 shadow-lg"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Send
                            </button>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonToolbar>
        </IonFooter>
    );
};

export default AddressBookFooter;
