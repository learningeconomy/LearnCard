import React from 'react';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';

import AddAward from 'learn-card-base/svgs/AddAward';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import NewBoostSelectMenu from '../../../components/boost/boost-select-menu/NewBoostSelectMenu';
import AddressBookContactDetailsView from './AddressBookContactDetailsView';
import { IonItem, useIonAlert, useIonToast } from '@ionic/react';

import {
    useModal,
    useGetCurrentLCNUser,
    useConnectWithMutation,
    useAcceptConnectionRequestMutation,
    useCancelConnectionRequestMutation,
    useUnblockProfileMutation,
    CredentialCategoryEnum,
    UserProfilePicture,
    ModalTypes,
} from 'learn-card-base';
import { LCNProfileConnectionStatusEnum, LCNProfile } from '@learncard/types';

type AddressBookContactItemProps = {
    contact: LCNProfile;
    showBoostButton: boolean;
    showRequestButton: boolean;
    showDeleteButton: boolean;
    handleRemoveConnection?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showAcceptButton: boolean;
    showCancelButton: boolean;
    showBlockButton: boolean;
    handleBlockUser?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showUnblockButton: boolean;
    search: string;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
    showArrow: boolean;
};

export const AddressBookContactItem: React.FC<AddressBookContactItemProps> = ({
    contact,
    showBoostButton,
    showRequestButton,
    showDeleteButton,
    handleRemoveConnection,
    showAcceptButton,
    showCancelButton,
    showBlockButton,
    handleBlockUser,
    showUnblockButton,
    search,
    setConnectionCount,
    showArrow = false,
}) => {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { newModal, closeModal } = useModal();
    const handlePresentBoostModal = () => {
        newModal(
            <NewBoostSelectMenu
                handleCloseModal={() => closeModal()}
                category={CredentialCategoryEnum.socialBadge}
            />,
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

    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const [presentToast] = useIonToast();
    const [presentAlert, dismissAlert] = useIonAlert();

    const { mutate: connectMutate, isLoading: connectLoading } = useConnectWithMutation();
    const { mutate: acceptMutate, isLoading: acceptLoading } = useAcceptConnectionRequestMutation();
    const { mutate: cancelMutate, isLoading: cancelLoading } = useCancelConnectionRequestMutation();
    const { mutate: unblockMutate, isLoading: unblockLoading } = useUnblockProfileMutation();

    // Helper: display a confirmation alert
    const confirmAction = (header: string, onConfirm: () => void) => {
        presentAlert({
            backdropDismiss: false,
            cssClass: 'boost-confirmation-alert',
            header,
            buttons: [
                { text: 'Confirm', role: 'confirm', handler: onConfirm },
                { text: 'Cancel', role: 'cancel', handler: () => dismissAlert() },
            ],
        });
    };

    // Event handlers
    const handleConnectionRequest = (e: React.MouseEvent<HTMLButtonElement>, profileId: string) => {
        e.stopPropagation();
        connectMutate(
            { profileId },
            {
                onSuccess: async () => {
                    await queryClient.cancelQueries({ queryKey: ['getSearchProfiles', search] });
                    queryClient.setQueryData(['getSearchProfiles', search], (prev: any) =>
                        prev?.map((connection: any) =>
                            connection.profileId === profileId
                                ? {
                                      ...connection,
                                      connectionStatus:
                                          LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_SENT,
                                  }
                                : connection
                        )
                    );
                    presentToast({
                        message: 'Connection Request sent',
                        duration: 3000,
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        position: 'top',
                        cssClass: 'login-link-success-toast',
                    });
                },
                onError: (error: any) => {
                    presentToast({
                        message:
                            error?.message ||
                            'An error occurred, unable to send connection request',
                        duration: 3000,
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        position: 'top',
                        cssClass: 'login-link-warning-toast',
                    });
                },
            }
        );
    };

    const handleCancelConnectionRequest = (
        e: React.MouseEvent<HTMLButtonElement>,
        profileId: string
    ) => {
        e.stopPropagation();
        cancelMutate(
            { profileId },
            {
                onSuccess: async () => {
                    await queryClient.cancelQueries({ queryKey: ['getSearchProfiles', search] });
                    queryClient.setQueryData(['getSearchProfiles', search], (prev: any) =>
                        prev?.map((connection: any) =>
                            connection.profileId === profileId
                                ? {
                                      ...connection,
                                      connectionStatus:
                                          LCNProfileConnectionStatusEnum.Enum.NOT_CONNECTED,
                                  }
                                : connection
                        )
                    );
                },
                onError: (error: any) => {
                    presentToast({
                        message: error?.message || 'An error occurred, unable to cancel request',
                        duration: 3000,
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        position: 'top',
                        cssClass: 'login-link-warning-toast',
                    });
                },
            }
        );
    };

    const handleAcceptConnectionRequest = (
        e: React.MouseEvent<HTMLButtonElement>,
        profileId: string
    ) => {
        e.stopPropagation();
        acceptMutate(
            { profileId },
            {
                onSuccess: async () => {
                    await queryClient.cancelQueries({ queryKey: ['getSearchProfiles', search] });
                    queryClient.setQueryData(['getSearchProfiles', search], (prev: any) =>
                        prev?.map((connection: any) =>
                            connection.profileId === profileId
                                ? {
                                      ...connection,
                                      connectionStatus:
                                          LCNProfileConnectionStatusEnum.Enum.CONNECTED,
                                  }
                                : connection
                        )
                    );
                    await queryClient.cancelQueries({ queryKey: ['getConnectionRequests'] });
                    queryClient.setQueryData(['getConnectionRequests'], (prev: any) => {
                        const updated = prev?.filter((req: any) => req.profileId !== profileId);
                        setConnectionCount(updated?.length);
                        return updated;
                    });
                },
                onError: (error: any) => {
                    presentToast({
                        message: error?.message || 'An error occurred, unable to accept request',
                        duration: 3000,
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        position: 'top',
                        cssClass: 'login-link-warning-toast',
                    });
                },
            }
        );
    };

    const handleUnblockUser = (e: React.MouseEvent<HTMLButtonElement>, profileId: string) => {
        e.stopPropagation();
        unblockMutate(
            { profileId },
            {
                onSuccess: async () => {
                    await queryClient.cancelQueries({ queryKey: ['getBlockedProfiles'] });
                    queryClient.setQueryData(['getBlockedProfiles'], (prev: any) => {
                        const updated = prev?.filter(
                            (profile: any) => profile.profileId !== profileId
                        );
                        setConnectionCount(updated?.length);
                        return updated;
                    });
                },
                onError: (error: any) => {
                    presentToast({
                        message: error?.message || 'An error occurred, unable to unblock user',
                        duration: 3000,
                        buttons: [{ text: 'Dismiss', role: 'cancel' }],
                        position: 'top',
                        cssClass: 'login-link-warning-toast',
                    });
                },
            }
        );
    };

    // Declare a single modal for showing contact details
    const shouldHideButton = !showDeleteButton && showBlockButton && !showRequestButton;
    const shouldUsePortal = !showDeleteButton && showBlockButton;

    const presentCenterModal = () => {
        newModal(
            <AddressBookContactDetailsView
                handleCloseModal={() => closeModal()}
                showCloseButton={true}
                contact={contact}
                showBoostButton={showBoostButton}
                showRequestButton={showRequestButton}
                handleConnectionRequest={handleConnectionRequest}
                handleAcceptConnectionRequest={handleAcceptConnectionRequest}
                showDeleteButton={showDeleteButton}
                handleRemoveConnection={handleRemoveConnection}
                showAcceptButton={showAcceptButton}
                showCancelButton={showCancelButton}
                handleCancelConnectionRequest={handleCancelConnectionRequest}
                showBlockButton={showBlockButton}
                handleBlockUser={handleBlockUser}
                showUnblockButton={showUnblockButton}
                handleUnblockUser={handleUnblockUser}
                history={history}
            />,
            {
                sectionClassName: '!max-w-[400px]',
                hideButton: shouldHideButton,
                usePortal: shouldUsePortal,
                portalClassName: '!max-w-[400px]',
            },
            {
                mobile: ModalTypes.Cancel,
                desktop: ModalTypes.Cancel,
            }
        );
    };

    // Render an action button based on the connection status
    const renderActionButton = () => {
        if (!showRequestButton) return null;
        switch (contact.connectionStatus) {
            case LCNProfileConnectionStatusEnum.Enum.CONNECTED:
                return <button className="text-emerald-600 font-bold text-sm">Connected</button>;
            case LCNProfileConnectionStatusEnum.Enum.NOT_CONNECTED:
                return (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            presentAlert({
                                backdropDismiss: false,
                                cssClass: 'boost-confirmation-alert',
                                header: 'Are you sure you want to send a connection request?',
                                buttons: [
                                    {
                                        text: 'Confirm',
                                        role: 'confirm',
                                        handler: () =>
                                            handleConnectionRequest(e, contact.profileId),
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => dismissAlert(),
                                    },
                                ],
                            });
                        }}
                        className="text-indigo-600 font-semibold text-sm font-notoSans"
                    >
                        {connectLoading ? 'Loading...' : 'Request Connection'}
                    </button>
                );
            case LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_SENT:
                return (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            presentAlert({
                                backdropDismiss: false,
                                cssClass: 'boost-confirmation-alert',
                                header: 'Are you sure you want to cancel your connection request?',
                                buttons: [
                                    {
                                        text: 'Confirm',
                                        role: 'confirm',
                                        handler: () =>
                                            handleCancelConnectionRequest(e, contact.profileId),
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => dismissAlert(),
                                    },
                                ],
                            });
                        }}
                        className="text-indigo-600 font-semibold text-sm font-notoSans"
                    >
                        <span className="text-grayscale-800">Request Pending</span> •{' '}
                        {cancelLoading ? 'Loading...' : 'Cancel'}
                    </button>
                );
            case LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_RECEIVED:
                return (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            presentAlert({
                                backdropDismiss: false,
                                cssClass: 'boost-confirmation-alert',
                                header: 'Are you sure you want to accept the connection request?',
                                buttons: [
                                    {
                                        text: 'Confirm',
                                        role: 'confirm',
                                        handler: () =>
                                            handleAcceptConnectionRequest(e, contact.profileId),
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => dismissAlert(),
                                    },
                                ],
                            });
                        }}
                        className="text-emerald-600 font-semibold text-sm font-notoSans"
                    >
                        {acceptLoading ? 'Loading...' : 'Accept Request'}
                    </button>
                );
            default:
                return null;
        }
    };

    // Compose the user details section with profile image, name, profile ID and action buttons.
    const userDetails = (
        <div
            className="flex items-center justify-start w-4/5 py-2"
            onClick={e => {
                e.stopPropagation();
                presentCenterModal();
            }}
        >
            <UserProfilePicture
                customContainerClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                customImageClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden object-cover"
                customSize={500}
                user={contact}
            />
            <div className="flex flex-col items-start">
                {contact.displayName && (
                    <p className="text-grayscale-900 font-semibold text-[17px] font-notoSans line-clamp-2 leading-[24px]">
                        {contact.displayName}
                    </p>
                )}
                <p className="text-grayscale-600 font-semibold font-notoSans text-[12px] line-clamp-2">
                    @{contact.profileId}
                </p>
                {renderActionButton()}
                {showAcceptButton && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            presentAlert({
                                backdropDismiss: false,
                                cssClass: 'boost-confirmation-alert',
                                header: 'Are you sure you want to accept the connection request?',
                                buttons: [
                                    {
                                        text: 'Confirm',
                                        role: 'confirm',
                                        handler: () =>
                                            handleAcceptConnectionRequest(e, contact.profileId),
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => dismissAlert(),
                                    },
                                ],
                            });
                        }}
                        className="text-emerald-600 font-semibold text-sm font-notoSans"
                    >
                        {acceptLoading ? 'Loading...' : 'Accept Request'}
                    </button>
                )}
                {showUnblockButton && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            presentAlert({
                                backdropDismiss: false,
                                cssClass: 'boost-confirmation-alert',
                                header: 'Are you sure you want to unblock this user?',
                                buttons: [
                                    {
                                        text: 'Confirm',
                                        role: 'confirm',
                                        handler: () => handleUnblockUser(e, contact.profileId),
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => dismissAlert(),
                                    },
                                ],
                            });
                        }}
                        className="text-indigo-600 font-bold text-base"
                    >
                        {unblockLoading ? 'Loading...' : 'Unblock'}
                    </button>
                )}
                {showCancelButton && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            presentAlert({
                                backdropDismiss: false,
                                cssClass: 'boost-confirmation-alert',
                                header: 'Are you sure you want to cancel your connection request?',
                                buttons: [
                                    {
                                        text: 'Confirm',
                                        role: 'confirm',
                                        handler: () =>
                                            handleCancelConnectionRequest(e, contact.profileId),
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => dismissAlert(),
                                    },
                                ],
                            });
                        }}
                        className="text-rose-600 font-bold text-base"
                    >
                        {cancelLoading ? 'Loading...' : 'Cancel Request'}
                    </button>
                )}
            </div>
        </div>
    );

    // Render boost button (if enabled) or an arrow button (if showArrow is true)
    const boostOrArrowButton = showBoostButton ? (
        <div className="flex items-center justify-end w-1/5">
            <button
                onClick={() => {
                    if (!currentLCNUser && !currentLCNUserLoading) {
                        handlePresentJoinNetworkModal();
                        return;
                    }
                    handlePresentBoostModal();
                }}
                className="flex items-center justify-center text-white rounded-full bg-indigo-500 w-12 h-12 modal-btn-desktop"
            >
                <AddAward className="w-8 h-auto" />
            </button>
            <button
                onClick={() => {
                    if (!currentLCNUser && !currentLCNUserLoading) {
                        handlePresentJoinNetworkModal();
                        return;
                    }
                    handlePresentBoostModal();
                }}
                className="flex items-center justify-center text-white rounded-full bg-indigo-500 w-12 h-12 modal-btn-mobile"
            >
                <AddAward className="w-8 h-auto" />
            </button>
        </div>
    ) : (
        showArrow && (
            <div className="flex items-center justify-end w-1/5">
                <div
                    className="flex items-center justify-start py-2"
                    onClick={e => {
                        e.stopPropagation();
                        presentCenterModal({
                            cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                            backdropDismiss: false,
                            showBackdrop: false,
                        });
                    }}
                >
                    <CaretLeft className="text-grayscale-900 w-10 rotate-180" />
                </div>
            </div>
        )
    );

    return (
        <IonItem
            lines="none"
            className="w-full max-w-3xl ion-no-border px-3 py-4 flex items-center justify-between cursor-pointer"
        >
            {userDetails}
            {boostOrArrowButton}
        </IonItem>
    );
};

export default AddressBookContactItem;
