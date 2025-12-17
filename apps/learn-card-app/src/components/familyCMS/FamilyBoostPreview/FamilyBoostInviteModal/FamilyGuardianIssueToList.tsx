import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
    IonCol,
    IonContent,
    IonFooter,
    IonGrid,
    IonHeader,
    IonPage,
    IonRow,
    IonToolbar,
    useIonAlert,
} from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';
import BoostAddressBookContactItem from '../../../boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactItem';

import { BoostAddressBookEditMode } from '../../../boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import { ShortBoostState } from '../../../boost/boost';
import { addAdmin, addBoostSomeone } from '../../../boost/boostHelpers';
import { updateAdminList, useWallet } from 'learn-card-base';

import useTheme from '../../../../theme/hooks/useTheme';

const FamilyGuardianIssueToList: React.FC<{
    state: ShortBoostState;
    setState: React.Dispatch<React.SetStateAction<ShortBoostState>>;
    handleOpenSearch: () => void;
    handleCloseModal: () => void;
    boostUri: string;
}> = ({ state, setState, handleOpenSearch, handleCloseModal, boostUri }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const queryClient = useQueryClient();
    const [presentAlert] = useIonAlert();
    const { initWallet } = useWallet();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const guardians = state?.issueTo ?? [];
    const renderIssuedTo = guardians?.map((contact, index) => {
        return (
            <BoostAddressBookContactItem
                state={state}
                setState={setState}
                contact={contact}
                key={index}
                mode={BoostAddressBookEditMode.delete}
                customListItemStyles="border-b-solid border-b-grayscale-100 border-b-2 !py-4"
            />
        );
    });

    const handleCancel = () => {
        handleCloseModal();
        setState({ issueTo: [] });
    };

    const handleInviteGuardians = async () => {
        const wallet = await initWallet();
        try {
            if (guardians?.length > 0) {
                setIsLoading(true);
                await Promise.all(
                    guardians?.map(async guardian => {
                        const profileId = guardian?.profileId;

                        const adminForBoost = await addAdmin(wallet, boostUri, profileId);
                        await addBoostSomeone(wallet, profileId, boostUri);

                        await updateAdminList(queryClient, boostUri, guardian);

                        return adminForBoost;
                    })
                );
                setIsLoading(false);
            }

            handleCancel();
        } catch (e) {
            setIsLoading(false);
            if (e?.message) {
                presentAlert(e?.message);
            }

            console.error('handleAddAdmins::error', e);
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border bg-white pt-4 border-b-solid border-b-grayscale-100 border-b-2 pb-4 vc-preview-modal-safe-area">
                <IonCol className="w-full flex items-center justify-center">
                    <div className="boost-issue-container w-full flex items-center justify-between mx-[20px] max-w-[600px]">
                        <p className="boost-issue-to-text font-poppins text-2xl text-grayscale-900">
                            Invite Guardians
                        </p>
                        <div
                            className="flex-shrink-0 cursor-pointer"
                            onClick={() => handleOpenSearch()}
                        >
                            <Plus className="text-grayscale-900 round-bottom-shadow-btn w-[50px] h-[50px] flex-shrink-0 p-[8px] flex justify-center items-center" />
                        </div>
                    </div>
                </IonCol>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid className="pl-4 bg-white pt-0">
                    <IonCol className="pt-0 w-full flex items-center justify-center">
                        {renderIssuedTo}
                    </IonCol>
                </IonGrid>
            </IonContent>
            <IonFooter>
                <IonToolbar color="light" className="ion-no-border">
                    <IonRow className="w-full flex items-center justify-center px-4">
                        <div className="boost-issue-container w-full flex items-center justify-center max-w-[600px]">
                            <button
                                onClick={handleCancel}
                                className="flex flex-1 items-center font-medium justify-center bg-grayscale-200 rounded-full my-[20px] px-[18px] py-[12px] text-grayscale-900 font-poppins text-xl w-full shadow-lg normal tracking-wide disabled:opacity-[50%] mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInviteGuardians}
                                className={`flex flex-1 items-center font-medium justify-center bg-${primaryColor} rounded-full my-[20px] px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide disabled:opacity-[50%] ${
                                    isLoading ? 'opacity-[50%]' : ''
                                }`}
                                disabled={state?.issueTo?.length === 0}
                            >
                                {' '}
                                {isLoading ? 'Loading...' : 'Invite'}
                            </button>
                        </div>
                    </IonRow>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default FamilyGuardianIssueToList;
