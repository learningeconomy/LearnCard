import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonGrid, IonRow, IonCol, useIonModal } from '@ionic/react';

import { AddressBookTabsEnum } from '../addressBookHelpers';

import Plus from 'learn-card-base/svgs/Plus';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import useLCNGatedAction from 'apps/learn-card-app/src/components/network-prompts/hooks/useLCNGatedAction';
import AddressBookContactOptions from '../addressBook-contact-options/AddressBookContactOptions';

import { useIsCurrentUserLCNUser } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors/index';

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
    const { getColorSet } = useTheme();
    const colorSet = getColorSet(ColorSetEnum.defaults);

    const history = useHistory();
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const { gate } = useLCNGatedAction();

    let headerTitle = 'Contacts';

    if (activeTab === AddressBookTabsEnum.Search) {
        headerTitle = connectionCount === 1 ? 'Result' : 'Results';
    } else {
        headerTitle = connectionCount === 1 ? 'Contact' : 'Contacts';
    }

    const [presentCenterModal, dismissCenterModal] = useIonModal(AddressBookContactOptions, {
        handleCloseModal: () => dismissCenterModal(),
        showSearch,
        handleShowSearch,
    });

    return (
        <IonGrid className="flex w-full items-center justify-center bg-grayscale-100">
            <IonRow className="flex w-full max-w-[650px] flex-col items-center justify-center px-2">
                <IonRow className="flex w-full max-w-[600px] items-center justify-between">
                    <IonCol className="flex items-center justify-start">
                        <button
                            className="text-grayscale-50 p-0 mr-[2px] flex items-center justify-start"
                            onClick={() => {
                                history.goBack();
                            }}
                            aria-label="Back button"
                        >
                            <LeftArrow className="w-[30px] mr-[10px] h-auto text-grayscale-600 desktop:hidden" />
                            <span className="text-grayscale-900 font-poppins font-semibold text-[25px] tracking-[0.01rem]">
                                Contacts
                            </span>
                        </button>
                    </IonCol>
                    <button
                        onClick={async () => {
                            const { prompted } = await gate();
                            if (prompted) return;

                            if (currentLCNUser) {
                                presentCenterModal({
                                    cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                    backdropDismiss: true,
                                    showBackdrop: false,
                                });
                            }
                        }}
                        className={`text-${colorSet.primaryColor} flex rounded-[40px] bg-white py-[6px] px-[16px] text-[17px] font-semibold font-poppins`}
                    >
                        New
                        <Plus
                            className={`ml-[5px] w-[24px] h-[24px] text-${colorSet.primaryColor}`}
                        />
                    </button>
                </IonRow>
                {children}
            </IonRow>
        </IonGrid>
    );
};

export default AddressBookHeader;
