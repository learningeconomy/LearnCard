import React, { useState, useEffect } from 'react';

import { useCheckIfUserInNetwork } from 'apps/scouts/src/components/network-prompts/hooks/useCheckIfUserInNetwork';

import NewBoostSelectMenu from 'apps/scouts/src/components/boost/boost-select-menu/NewBoostSelectMenu';
import useHighlightedCredentials from 'apps/scouts/src/hooks/useHighlightedCredentials';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';
import { ContactButton } from 'learn-card-base/svgs/ContactButton';
import { IonSpinner } from '@ionic/react';
import {
    useModal,
    CredentialCategoryEnum,
    ModalTypes,
    useGetCurrentLCNUser,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { VC } from '@learncard/types';

type AddressBookContactItemButtonProps = {
    troopTypes: Record<string, { label: string; icon: JSX.Element }>;
    resolvedCredential?: VC;
};

export const AddressBookContactItemButton: React.FC<AddressBookContactItemButtonProps> = ({
    troopTypes,
    resolvedCredential,
}) => {
    const { newModal, closeModal } = useModal();
    const [isInitialized, setIsInitialized] = useState(false);

    const handlePresentBoostModal = (category: CredentialCategoryEnum) => {
        newModal(
            <NewBoostSelectMenu handleCloseModal={() => closeModal()} category={category} />,
            {
                className: '!p-0',
                sectionClassName: '!p-0',
            },
            {
                mobile: ModalTypes.FullScreen,
                desktop: ModalTypes.FullScreen,
            }
        );
    };

    const chooseBadgeTypeModal = () => {
        newModal(
            <div className="ion-padding bg-white text-grayscale-900 font-notoSans text-[20px]">
                <h1>Choose Boost Type:</h1>
                <div className="flex flex-col items-center justify-center">
                    <button
                        className="flex items-center bg-white hover:border-solid hover:border-grayscale-200 hover:border-[1px] hover:bg-grayscale-100 hover:rounded-[30px] p-[5px] pt-[10px] pl-[10px] w-full max-w-[550px] mt-[15px] font-notoSans text-[17px] text-grayscale-800"
                        onClick={() => {
                            closeModal();
                            handlePresentBoostModal(CredentialCategoryEnum.socialBadge);
                        }}
                    >
                        <BlueBoostOutline2 className="w-[40px] h-[40px] pr-[10px]" />
                        Social Boost
                    </button>
                    <button
                        className="flex items-center bg-white hover:border-solid hover:border-grayscale-200 hover:border-[1px] hover:bg-grayscale-100 hover:rounded-[30px] p-[5px] pt-[10px] pl-[10px] w-full max-w-[550px]  font-notoSans text-[17px] text-grayscale-800"
                        onClick={() => {
                            closeModal();
                            handlePresentBoostModal(CredentialCategoryEnum.meritBadge);
                        }}
                    >
                        <PurpleMeritBadgesIcon className="w-[40px] h-[40px] pr-[10px]" />
                        Merit Badge
                    </button>
                </div>
            </div>,
            { sectionClassName: '!max-w-[400px]' },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    const checkIfUserInNetwork = useCheckIfUserInNetwork();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { isDesktop } = useDeviceTypeByWidth();

    const { credentials: currentUserCreds, isLoading } = useHighlightedCredentials(
        currentLCNUser?.profileId,
        true
    );

    const chosenHighlightedCred =
        currentUserCreds.find(cred => cred.name === resolvedCredential?.boostCredential?.name) ??
        currentUserCreds[0];

    // prevents quick flash of fallback button before query receives data - if someone has no troop status
    useEffect(() => {
        if (!isLoading) {
            setIsInitialized(true);
        }
    }, [isLoading]);

    if (isLoading && !isInitialized) {
        return (
            <IonSpinner
                name="crescent"
                color="dark"
                className="scale-[1] flex items-center justify-end w-1/5"
            />
        );
    }

    const currentUserStatus =
        chosenHighlightedCred && currentUserCreds.length > 0
            ? troopTypes[chosenHighlightedCred?.credentialSubject?.achievement?.achievementType]
                  ?.label
            : undefined;

    return currentUserStatus === 'Scout' ? (
        <div className="flex items-center justify-end w-1/5">
            <button
                onClick={() => {
                    if (!checkIfUserInNetwork()) return;
                    handlePresentBoostModal(CredentialCategoryEnum.socialBadge);
                }}
                className={`flex items-center justify-center text-white rounded-full bg-sp-blue-light-ocean w-12 h-12 ${
                    isDesktop ? 'modal-btn-desktop' : 'modal-btn-mobile'
                }`}
            >
                <BlueBoostOutline2 className="w-8 h-auto" />
            </button>
        </div>
    ) : ['Leader', 'Global Admin', 'National Admin'].includes(currentUserStatus) ? (
        <div className="flex items-center justify-end w-1/5">
            <button
                onClick={() => {
                    if (!checkIfUserInNetwork()) return;
                    chooseBadgeTypeModal();
                }}
                className={`flex items-center justify-center text-white rounded-full ${
                    isDesktop ? 'modal-btn-desktop' : 'modal-btn-mobile'
                }`}
            >
                <ContactButton className="w-12 h-auto" />
            </button>
        </div>
    ) : (
        currentUserStatus === undefined && (
            <div className="flex items-center justify-end w-1/5">
                <button
                    onClick={() => {
                        if (!checkIfUserInNetwork()) return;
                        handlePresentBoostModal(CredentialCategoryEnum.socialBadge);
                    }}
                    className={`flex items-center justify-center text-white rounded-full bg-sp-blue-light-ocean w-12 h-12 ${
                        isDesktop ? 'modal-btn-desktop' : 'modal-btn-mobile'
                    }`}
                >
                    <BlueBoostOutline2 className="w-8 h-auto" />
                </button>
            </div>
        )
    );
};

export default AddressBookContactItemButton;
