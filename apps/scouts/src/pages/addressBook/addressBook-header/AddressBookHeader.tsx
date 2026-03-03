import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonGrid, IonRow, IonCol } from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import { useIsCurrentUserLCNUser, useModal, ModalTypes } from 'learn-card-base';
import { useCheckIfUserInNetwork } from 'apps/scouts/src/components/network-prompts/hooks/useCheckIfUserInNetwork';
import AddressBookContactOptions from '../addressBook-contact-options/AddressBookContactOptions';
import AddUser from 'apps/scouts/src/components/svgs/AddUser';

import { AddressBookTabsEnum } from '../addressBookHelpers';

export const AddressBookHeader: React.FC<{
    activeTab: AddressBookTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<AddressBookTabsEnum>>;
    connectionCount: number;
    search: string;
    clearSearch: () => void;
    children?: any;
    showSearch?: boolean;
    handleShowSearch?: () => void;
}> = ({
    activeTab,
    setActiveTab,
    connectionCount,
    search,
    clearSearch,
    children,
    showSearch,
    handleShowSearch,
}) => {
    const history = useHistory();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    let headerTitle = 'Contacts';

    if (activeTab === AddressBookTabsEnum.Search) {
        headerTitle = connectionCount === 1 ? 'Result' : 'Results';
    } else {
        headerTitle = connectionCount === 1 ? 'Contact' : 'Contacts';
    }

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openContactOptions = () => {
        newModal(
            <AddressBookContactOptions
                handleCloseModal={() => closeModal()}
                showSearch={showSearch}
                handleShowSearch={handleShowSearch}
            />
        );
    };

    return (
        <IonGrid className="flex w-full items-center justify-center bg-grayscale-100">
            <IonRow className="flex w-full max-w-[650px] flex-col items-center justify-center px-2">
                <IonRow className="flex w-full max-w-[600px] items-center justify-between">
                    <IonCol className="flex items-center justify-start">
                        <button
                            className="font-rubik mr-[10px] flex items-center p-0 text-xl font-bold"
                            onClick={() => {
                                history.goBack();
                            }}
                            aria-label="Back button"
                        >
                            <LeftArrow className="w-[30px] mr-[10px] h-auto font text-grayscale-800 desktop:hidden" />{' '}
                            Contacts
                        </button>
                    </IonCol>
                    <button
                        onClick={() => {
                            if (!checkIfUserInNetwork()) return;

                            if (currentLCNUser) {
                                openContactOptions();
                            }
                        }}
                        className="flex rounded-[40px] bg-sp-purple-base shadow-md shadow-black/25 py-[7px] px-[20px] text-white text-[15px] font-semibold font-notoSans"
                    >
                        <AddUser className="mr-[5px]" fill="#9FED8F" />
                        New
                    </button>
                </IonRow>
                {children}
            </IonRow>
        </IonGrid>
    );
};

export default AddressBookHeader;
