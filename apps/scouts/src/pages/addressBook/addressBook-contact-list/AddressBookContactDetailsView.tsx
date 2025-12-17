import React from 'react';
import { Clipboard } from '@capacitor/clipboard';

import { IonRow, IonCol, useIonAlert } from '@ionic/react';

import X from 'learn-card-base/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import Block from 'learn-card-base/svgs/Block';
import TrashBin from '../../../components/svgs/TrashBin';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import CopyStack from '../../../components/svgs/CopyStack';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';

import { createPortal } from 'react-dom';

import {
    UserProfilePicture,
    useModal,
    useToast,
    ToastTypeEnum,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { LCNProfileConnectionStatusEnum, LCNProfile } from '@learncard/types';
import { useIsCurrentUserLCNUser } from 'learn-card-base';
import { useCheckIfUserInNetwork } from 'apps/scouts/src/components/network-prompts/hooks/useCheckIfUserInNetwork';
import useBoostModal from '../../../components/boost/hooks/useBoostModal';

type AddressBookContactDetailsViewProps = {
    contact: LCNProfile | null;
    handleCloseModal: () => void;
    showCloseButton: boolean;
    showBoostButton: boolean;
    showRequestButton: boolean;
    handleConnectionRequest: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showDeleteButton: boolean;
    handleRemoveConnection?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showAcceptButton: boolean;
    handleAcceptConnectionRequest: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showCancelButton: boolean;
    handleCancelConnectionRequest?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showBlockButton: boolean;
    handleBlockUser?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showUnblockButton: boolean;
    handleUnblockUser?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    history: any;
};

export const AddressBookContactDetailsView: React.FC<AddressBookContactDetailsViewProps> = ({
    contact,
    handleCloseModal,
    showCloseButton,
    showBoostButton,
    showRequestButton,
    handleConnectionRequest = () => {},
    showDeleteButton,
    handleRemoveConnection = () => {},
    showAcceptButton,
    handleAcceptConnectionRequest = () => {},
    showCancelButton,
    handleCancelConnectionRequest = () => {},
    showBlockButton,
    handleBlockUser = () => {},
    showUnblockButton,
    handleUnblockUser = () => {},
    history,
}) => {
    const { presentToast } = useToast();
    const [presentAlert, dismissAlert] = useIonAlert();
    const { closeModal } = useModal();
    const sectionPortal = document.getElementById('section-cancel-portal');
    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const checkIfUserInNetwork = useCheckIfUserInNetwork();

    const showConfirmationAlert = (
        header: string,
        handler: (e: any, profileId?: string) => void
    ) => {
        closeModal();
        presentAlert({
            backdropDismiss: false,
            cssClass: 'boost-confirmation-alert',
            header,
            buttons: [
                {
                    text: 'Confirm',
                    role: 'confirm',
                    handler: () => handler(new Event('custom'), contact?.profileId),
                },
                { text: 'Cancel', role: 'cancel', handler: () => dismissAlert() },
            ],
        });
    };

    const { handlePresentBoostModal } = useBoostModal(
        history,
        BoostCategoryOptionsEnum.socialBadge,
        true,
        true,
        contact?.profileId
    );

    const copyToClipBoard = async (privateKey: string | undefined) => {
        try {
            await Clipboard.write({
                string: privateKey,
            });
            presentToast('DID copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy DID to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    let actionButton = null;

    if (showRequestButton) {
        if (LCNProfileConnectionStatusEnum.Enum.CONNECTED === contact?.connectionStatus) {
            actionButton = (
                <button className="w-full flex items-center justify-center bg-white rounded-full px-[18px] py-[12px] text-grayscale-900 text-2xl shadow-lg mb-4">
                    <Checkmark className="ml-[5px] h-[30px] w-[30px] mr-2" />
                    Connected
                </button>
            );
        } else if (
            LCNProfileConnectionStatusEnum.Enum.NOT_CONNECTED === contact?.connectionStatus
        ) {
            actionButton = (
                <button
                    className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-solid border-b-[2px] last:border-b-0"
                    onClick={e => {
                        e.stopPropagation();
                        showConfirmationAlert(
                            'Are you sure you want to send a connection request?',
                            async () => {
                                handleConnectionRequest?.(e, contact?.profileId);
                                handleCloseModal();
                            }
                        );
                    }}
                >
                    <p className="text-grayscale-900">Request Connection</p>
                    <Plus className="h-[30px] w-[30px] text-grayscale-900" />
                </button>
            );
        } else if (
            LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_SENT === contact?.connectionStatus
        ) {
            actionButton = (
                <button
                    className="w-full flex items-center justify-center bg-white rounded-full px-[18px] py-[12px] text-grayscale-900 text-2xl shadow-lg mb-4"
                    onClick={e => {
                        e.stopPropagation();
                        showConfirmationAlert(
                            'Are you sure you want to cancel your connection request?',
                            async () => {
                                handleCancelConnectionRequest?.(e, contact?.profileId);
                                handleCloseModal();
                            }
                        );
                    }}
                >
                    <X className="ml-[5px] h-[30px] w-[30px] mr-2" />
                    Cancel Request
                </button>
            );
        } else if (
            LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_RECEIVED ===
            contact?.connectionStatus
        ) {
            actionButton = (
                <button
                    className="w-full flex items-center justify-center bg-white rounded-full px-[18px] py-[12px] text-grayscale-900 text-2xl shadow-lg mb-4"
                    onClick={e => {
                        e.stopPropagation();
                        showConfirmationAlert(
                            'Are you sure you want to accept the connection request?',
                            async () => {
                                handleAcceptConnectionRequest?.(e, contact?.profileId);
                                handleCloseModal();
                            }
                        );
                    }}
                >
                    <Checkmark className="ml-[5px] h-[30px] w-[30px] mr-2" />
                    Accept Request
                </button>
            );
        }
    }

    return (
        <section className="pt-[36px] pb-[16px]">
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="w-full flex items-center justify-center">
                    <UserProfilePicture
                        customContainerClass="flex justify-center items-center h-[70px] w-[70px] min-h-[70px] min-w-[70px] rounded-full overflow-hidden text-white font-medium text-xl"
                        customImageClass="flex justify-center items-center h-[70px] w-[70px] min-h-[70px] min-w-[70px] rounded-full overflow-hidden object-cover"
                        customSize={164}
                        user={contact}
                    />
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="w-full flex items-center justify-center">
                    <h2 className="text-center w-full font-poppins text-2xl font-semibold text-grayscale-900">
                        {contact?.displayName || contact?.profileId}
                    </h2>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full mt-2 px-4 pb-1">
                <IonCol className="flex flex-col items-center justify-center">
                    {showBoostButton && (
                        <button
                            onClick={() => {
                                closeModal();
                                if (!checkIfUserInNetwork()) return;

                                if (currentLCNUser) {
                                    handlePresentBoostModal();
                                }
                            }}
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-solid border-b-[2px] last:border-b-0"
                        >
                            <p className="text-grayscale-900">Boost</p>
                            <div className="h-[30px] w-[30px] max-h-[30px] max-w-[30px]">
                                <RibbonAwardIcon className="h-[30px] w-[30px] text-grayscale-900" />
                            </div>
                        </button>
                    )}
                    {showDeleteButton && (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                closeModal();
                                showConfirmationAlert(
                                    'Are you sure you want to remove this connection?',
                                    async () => {
                                        handleRemoveConnection(e, contact?.profileId);
                                    }
                                );
                            }}
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-solid border-b-[2px] last:border-b-0"
                        >
                            <p className="text-grayscale-900">Remove Contact</p>
                            <TrashBin className="h-[30px] w-[30px]" />
                        </button>
                    )}
                    {actionButton}
                    {showCancelButton && (
                        <button
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-solid border-b-[2px] last:border-b-0"
                            onClick={e => {
                                e.stopPropagation();
                                closeModal();
                                showConfirmationAlert(
                                    'Are you sure you want to cancel your connection request?',
                                    async () => {
                                        handleCancelConnectionRequest?.(e, contact?.profileId);
                                    }
                                );
                            }}
                        >
                            <p className="text-grayscale-900">Cancel Request</p>
                            <X className="h-[30px] w-[30px] text-grayscale-700" />
                        </button>
                    )}
                    {showBlockButton && (
                        <button
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-solid border-b-[2px] last:border-b-0"
                            onClick={e => {
                                e.stopPropagation();
                                closeModal();
                                if (!checkIfUserInNetwork()) return;
                                showConfirmationAlert(
                                    'Are you sure you want to block this user?',
                                    async () => {
                                        handleBlockUser(e, contact?.profileId);
                                    }
                                );
                            }}
                        >
                            <p className="text-grayscale-900"> Block Contact</p>
                            <Block className="h-[30px] w-[30px] text-grayscale-700" />
                        </button>
                    )}
                    {showUnblockButton && (
                        <button
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-solid border-b-[2px] last:border-b-0"
                            onClick={e => {
                                e.stopPropagation();
                                closeModal();
                                showConfirmationAlert(
                                    'Are you sure you want to unblock this user?',
                                    async () => {
                                        handleUnblockUser(e, contact?.profileId);
                                    }
                                );
                            }}
                        >
                            <p className="text-grayscale-900">Unblock Contact</p>
                            <Block className="ml-[5px] h-[30px] w-[30px] text-grayscale-700" />
                        </button>
                    )}
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full px-4 mb-4">
                <IonCol className="w-full bg-grayscale-100 flex items-center justify-between px-4 rounded-2xl">
                    <div className="w-[80%] flex flex-col justify-center items-start text-left">
                        <p className="text-grayscale-500 font-medium text-sm">
                            ScoutPass Number (DID)
                        </p>
                        <p className="w-full text-grayscale-900 line-clamp-1">{contact?.did}</p>
                    </div>
                    <div
                        onClick={() => copyToClipBoard(contact?.did)}
                        className="w-[20%] flex items-center justify-end"
                    >
                        <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                    </div>
                </IonCol>
            </IonRow>
            {sectionPortal &&
                showAcceptButton &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative max-w-[400px] !border-none">
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                closeModal();
                                showConfirmationAlert(
                                    'Are you sure you want to accept the connection request?',
                                    async () => {
                                        handleAcceptConnectionRequest?.(e, contact?.profileId);
                                    }
                                );
                            }}
                            className="bg-indigo-500 text-white text-lg font-notoSans py-2 rounded-[20px] font-semibold w-full max-w-[400px] h-full"
                        >
                            Accept Request
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                        >
                            Close
                        </button>
                    </div>,
                    sectionPortal
                )}
        </section>
    );
};

export default AddressBookContactDetailsView;
