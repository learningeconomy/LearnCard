import React from 'react';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import AddressBookContactDetailsView from './AddressBookContactDetailsView';
import { IonItem, useIonAlert } from '@ionic/react';
import useHighlightedCredentials from 'apps/scouts/src/hooks/useHighlightedCredentials';
import GirlScoutsIcon from 'apps/scouts/src/components/svgs/GirlScoutsLogo';
import WorldScoutIcon from 'apps/scouts/src/components/svgs/WorldScoutsIcon';
import AddressBookContactItemButton from './AddressBookContactItemButton';
import {
    useModal,
    useConnectWithMutation,
    useAcceptConnectionRequestMutation,
    useCancelConnectionRequestMutation,
    useUnblockProfileMutation,
    UserProfilePicture,
    ModalTypes,
    useDeviceTypeByWidth,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { LCNProfileConnectionStatusEnum, LCNProfile, VC } from '@learncard/types';

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
    resolvedCredential?: VC;
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
    resolvedCredential,
}) => {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { newModal, closeModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    const { credentials: highlightedCreds, uris } = useHighlightedCredentials(
        contact?.profileId,
        true
    );

    const troopTypes: Record<string, { label: string; icon: JSX.Element }> = {
        'ext:TroopID': {
            label: 'Leader',
            icon: <GirlScoutsIcon className="absolute top-[-5px] left-[30px] w-[25px]" />,
        },
        'ext:ScoutID': {
            label: 'Scout',
            icon: <WorldScoutIcon className="absolute top-0 left-[30px] w-[25px]" />,
        },
        'ext:GlobalID': {
            label: 'Global Admin',
            icon: (
                <WorldScoutIcon fill={'#622599'} className="absolute top-0 left-[30px] w-[25px]" />
            ),
        },
        'ext:NetworkID': {
            label: 'National Admin',
            icon: (
                <GirlScoutsIcon
                    className={`absolute top-[-5px] w-[25px] ${isDesktop ? 'left-[30px]' : 'left-[20px]'
                        }`}
                />
            ),
        },
    };

    // The chosenHighlightedCred is filtered based on the assumption that someone is in no more than 5 troops since highlightedCreds only returns the top 5 credentials
    const chosenHighlightedCred =
        highlightedCreds.find(cred => cred.name === resolvedCredential?.boostCredential?.name) ??
        highlightedCreds[0];

    const troopStatus =
        troopTypes[chosenHighlightedCred?.credentialSubject?.achievement?.achievementType] ?? '';

    const { presentToast } = useToast();
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
                                        LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_SENT,
                                }
                                : connection
                        )
                    );
                    presentToast('Connection Request sent', {
                        type: ToastTypeEnum.Success,
                        hasDismissButton: true,
                    });
                },
                onError: (error: any) => {
                    presentToast(
                        error?.message || 'An error occurred, unable to send connection request',
                        {
                            type: ToastTypeEnum.Error,
                            hasDismissButton: true,
                        }
                    );
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
                                        LCNProfileConnectionStatusEnum.enum.NOT_CONNECTED,
                                }
                                : connection
                        )
                    );
                },
                onError: (error: any) => {
                    presentToast(error?.message || 'An error occurred, unable to cancel request', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
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
                                        LCNProfileConnectionStatusEnum.enum.CONNECTED,
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
                    presentToast(error?.message || 'An error occurred, unable to accept request', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
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
                    presentToast(error?.message || 'An error occurred, unable to unblock user', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
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
            case LCNProfileConnectionStatusEnum.enum.CONNECTED:
                return <button className="text-emerald-600 font-bold text-sm">Connected</button>;
            case LCNProfileConnectionStatusEnum.enum.NOT_CONNECTED:
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
            case LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_SENT:
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
            case LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_RECEIVED:
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
            {highlightedCreds.length !== 0 && troopStatus.icon}
            <div className="flex flex-col items-start">
                {contact.displayName && (
                    <p className="text-grayscale-900 font-semibold text-[17px] font-notoSans line-clamp-2 leading-[24px]">
                        {contact.displayName}
                    </p>
                )}
                {highlightedCreds.length !== 0 && (
                    <p className="text-grayscale-600 font-notoSans text-[12px] font-semibold">
                        {troopStatus.label} • {chosenHighlightedCred?.name}
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
        <AddressBookContactItemButton
            troopTypes={troopTypes}
            resolvedCredential={resolvedCredential}
        />
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
