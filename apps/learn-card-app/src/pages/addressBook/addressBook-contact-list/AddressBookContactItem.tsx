import React from 'react';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';

import { IonItem, useIonAlert } from '@ionic/react';

import Plus from 'learn-card-base/svgs/Plus';
// @ts-ignore
import BoostIcon from '../../../assets/images/Learncard-new-boost-icon.png';
import SlimCaretRight from 'apps/learn-card-app/src/components/svgs/SlimCaretRight';
import MobileNavCircleIcon from 'apps/learn-card-app/src/components/svgs/MobileNavCircleIcon';
import AddressBookContactDetailsView from './AddressBookContactDetailsView';

import { LCNProfileConnectionStatusEnum, LCNProfile } from '@learncard/types';

import {
    ModalTypes,
    useModal,
    useConnectWithMutation,
    useAcceptConnectionRequestMutation,
    useCancelConnectionRequestMutation,
    useUnblockProfileMutation,
    UserProfilePicture,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import BoostTemplateSelector from 'apps/learn-card-app/src/components/boost/boost-template/BoostTemplateSelector';
import useLCNGatedAction from 'apps/learn-card-app/src/components/network-prompts/hooks/useLCNGatedAction';

import useTheme from '../../../theme/hooks/useTheme';

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
    search: string;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
    showArrow: boolean;
    refetch: () => void;
    refetchBlockedContacts?: () => void;
    refetchRequestContacts?: () => void;
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
    showArrow,
    refetch,
    refetchBlockedContacts,
    refetchRequestContacts,
}) => {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { gate } = useLCNGatedAction();
    const { newModal } = useModal({ desktop: ModalTypes.Cancel });

    const { presentToast } = useToast();
    const [presentAlert, dismissAlert] = useIonAlert();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { mutate, isPending: isLoading } = useConnectWithMutation();
    const { mutate: acceptConnectionRequest, isPending: acceptConnectionLoading } =
        useAcceptConnectionRequestMutation();
    const { mutate: cancelConnectionRequest, isPending: cancelRequestLoading } =
        useCancelConnectionRequestMutation();
    const { mutate: unblockUser, isPending: unblockLoading } = useUnblockProfileMutation();

    const handleConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();

        try {
            mutate(
                { profileId },
                {
                    async onSuccess(data, { profileId }, context) {
                        await queryClient.cancelQueries({
                            queryKey: ['getSearchProfiles', search],
                        });

                        queryClient.setQueryData(
                            ['getSearchProfiles', search],
                            (prevConnections: LCNProfile[] | undefined) =>
                                prevConnections?.map(connection => {
                                    if (connection.profileId === profileId) {
                                        return {
                                            ...connection,
                                            connectionStatus:
                                                LCNProfileConnectionStatusEnum?.Enum
                                                    ?.PENDING_REQUEST_SENT,
                                        };
                                    }
                                    return {
                                        ...connection,
                                    };
                                })
                        );

                        refetch?.();

                        presentToast('Connection Request sent', {
                            type: ToastTypeEnum.Success,
                            hasDismissButton: true,
                        });
                        console.log('onSuccess::data', data);
                    },
                    onError(error, variables, context) {
                        presentToast(
                            // @ts-ignore
                            error?.message ||
                            'An error occurred, unable to send connection request',
                            {
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            }
                        );
                    },
                }
            );
        } catch (err) {
            console.log('connectionReq::error', err);
            presentToast(
                // @ts-ignore
                err?.message || 'An error occurred, unable to send connection request',
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        }
    };

    const handleCancelConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();
        cancelConnectionRequest(
            { profileId },
            {
                async onSuccess(data, { profileId }, context) {
                    await queryClient.cancelQueries({
                        queryKey: ['getSearchProfiles', search],
                    });

                    queryClient.setQueryData(
                        ['getSearchProfiles', search],
                        (prevConnections: LCNProfile[] | undefined) =>
                            prevConnections?.map(connection => {
                                if (connection.profileId === profileId) {
                                    return {
                                        ...connection,
                                        connectionStatus:
                                            LCNProfileConnectionStatusEnum?.Enum?.NOT_CONNECTED,
                                    };
                                }
                                return {
                                    ...connection,
                                };
                            })
                    );

                    refetch?.();
                },
                onError(error, variables, context) {
                    refetch();
                    presentToast(
                        // @ts-ignore
                        error?.message || 'An error occurred, unable to cancel request',
                        {
                            type: ToastTypeEnum.Error,
                            hasDismissButton: true,
                        }
                    );
                },
            }
        );
        try {
        } catch (err) {
            console.log('canceledConnectionReq::error', err);
            presentToast(
                // @ts-ignore
                err?.message || 'An error occurred, unable to cancel request',
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        }
    };

    const handleAcceptConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();
        try {
            acceptConnectionRequest(
                { profileId },
                {
                    async onSuccess(data, { profileId }, context) {
                        await queryClient.cancelQueries({
                            queryKey: ['getSearchProfiles', search],
                        });

                        queryClient.setQueryData(
                            ['getSearchProfiles', search],
                            (prevConnections: LCNProfile[] | undefined) =>
                                prevConnections?.map(connection => {
                                    if (connection.profileId === profileId) {
                                        return {
                                            ...connection,
                                            connectionStatus:
                                                LCNProfileConnectionStatusEnum?.Enum?.CONNECTED,
                                        };
                                    }
                                    return {
                                        ...connection,
                                    };
                                })
                        );

                        const switchedDid = switchedProfileStore.get.switchedDid();
                        await queryClient.cancelQueries({
                            queryKey: ['getConnectionRequests', switchedDid ?? ''],
                        });

                        queryClient.setQueryData(
                            ['getConnectionRequests', switchedDid ?? ''],
                            (prevPendingRequest: LCNProfile[] = []) => {
                                const updatedPendingRequests = prevPendingRequest.filter(
                                    connectionReq => connectionReq?.profileId !== profileId
                                );
                                setConnectionCount(updatedPendingRequests?.length);
                                return updatedPendingRequests;
                            }
                        );

                        refetch();
                        refetchRequestContacts?.();
                    },
                    onError(error, variables, context) {
                        refetch();
                        presentToast(
                            // @ts-ignore
                            error?.message || 'An error occurred, unable to accept request',
                            {
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            }
                        );
                    },
                }
            );
        } catch (err) {
            presentToast(
                // @ts-ignore
                err?.message || 'An error occurred, unable to accept request',
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        }
    };

    const handleUnblockUser = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();

        try {
            const switchedDid = switchedProfileStore.get.switchedDid();

            unblockUser(
                { profileId },
                {
                    async onSuccess(data, { profileId }, context) {
                        const blockedProfilesKey = ['getBlockedProfiles', switchedDid ?? ''];
                        await queryClient.cancelQueries({
                            queryKey: blockedProfilesKey,
                        });

                        queryClient.setQueryData(
                            blockedProfilesKey,
                            (prevBlockedProfiles: LCNProfile[] = []) => {
                                const updatedBlockedProfiles = prevBlockedProfiles.filter(
                                    blockedProfile => blockedProfile?.profileId !== profileId
                                );
                                setConnectionCount(updatedBlockedProfiles.length);
                                return updatedBlockedProfiles;
                            }
                        );

                        const connectionsKey = ['connections', switchedDid ?? ''];
                        await queryClient.cancelQueries({
                            queryKey: connectionsKey,
                        });

                        await Promise.all([
                            refetch?.(),
                            refetchBlockedContacts?.(),
                            queryClient.invalidateQueries({
                                queryKey: connectionsKey,
                                refetchType: 'active',
                            }),
                        ]);
                    },
                    onError(error, variables, context) {
                        presentToast(
                            // @ts-ignore
                            error?.message || 'An error occurred, unable to unblock user',
                            {
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            }
                        );
                    },
                }
            );
        } catch (err) {
            console.log('unBlockProfile::error', err);
            presentToast(
                // @ts-ignore
                err?.message || 'An error occurred, unable to unblock user',
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        }
    };

    let actionButton = null;

    if (showRequestButton) {
        if (LCNProfileConnectionStatusEnum.Enum.CONNECTED === (contact as any)?.connectionStatus) {
            actionButton = (
                <button className="text-emerald-600 font-bold text-sm">Connected</button>
            );
        } else if (
            LCNProfileConnectionStatusEnum.Enum.NOT_CONNECTED === (contact as any)?.connectionStatus
        ) {
            actionButton = (
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
                                    handler: async () => {
                                        handleConnectionRequest?.(e, contact?.profileId);
                                    },
                                },
                                {
                                    text: 'Cancel',
                                    role: 'cancel',
                                    handler: () => {
                                        dismissAlert();
                                    },
                                },
                            ],
                        });
                    }}
                    className={`text-${primaryColor} font-semibold text-sm font-notoSans`}
                >
                    {isLoading ? 'Loading...' : 'Request Connection'}
                </button>
            );
        } else if (
            LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_SENT ===
            (contact as any)?.connectionStatus
        ) {
            actionButton = (
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
                                    handler: async () => {
                                        handleCancelConnectionRequest?.(e, contact?.profileId);
                                    },
                                },
                                {
                                    text: 'Cancel',
                                    role: 'cancel',
                                    handler: () => {
                                        dismissAlert();
                                    },
                                },
                            ],
                        });
                    }}
                    className={`text-${primaryColor} font-semibold text-sm text-[14px] font-notoSans`}
                >
                    <span className="text-grayscale-900 font-notoSans">Request Pending</span> •{' '}
                    {cancelRequestLoading ? 'Loading...' : 'Cancel'}
                </button>
            );
        } else if (
            LCNProfileConnectionStatusEnum.Enum.PENDING_REQUEST_RECEIVED ===
            (contact as any)?.connectionStatus
        ) {
            actionButton = (
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
                                    handler: async () => {
                                        handleAcceptConnectionRequest?.(e, contact?.profileId);
                                    },
                                },
                                {
                                    text: 'Cancel',
                                    role: 'cancel',
                                    handler: () => {
                                        dismissAlert();
                                    },
                                },
                            ],
                        });
                    }}
                    className="text-emerald-600 font-bold text-sm"
                >
                    {acceptConnectionLoading ? 'Loading...' : 'Accept Request'}
                </button>
            );
        }
    }

    const userDetails = (
        <>
            <UserProfilePicture
                customContainerClass="flex justify-center items-center min-w-[48px] min-h-[48px] w-[48px] h-[48px] max-w-[48px] max-h-[48px] rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                customImageClass="flex justify-center items-center min-w-[48px] min-h-[48px] w-[48px] h-[48px] max-w-[48px] max-h-[48px] rounded-full overflow-hidden object-cover"
                customSize={164}
                user={contact}
            />
            <div className="flex items-start justify-center flex-col">
                {contact?.displayName && (
                    <p className="text-grayscale-900 font-semibold text-[17px] font-notoSans line-clamp-2 leading-[24px]">
                        {contact?.displayName}
                    </p>
                )}
                <p className="text-grayscale-600 font-semibold font-notoSans text-[12px] line-clamp-2">
                    @{contact?.profileId}
                </p>
                {actionButton}
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
                                        handler: async () => {
                                            handleAcceptConnectionRequest?.(e, contact?.profileId);
                                        },
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => {
                                            dismissAlert();
                                        },
                                    },
                                ],
                            });
                        }}
                        className="text-emerald-600 font-bold text-base"
                    >
                        {acceptConnectionLoading ? 'Loading...' : 'Accept Request'}
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
                                        handler: async () => {
                                            handleUnblockUser?.(e, contact?.profileId);
                                        },
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => {
                                            dismissAlert();
                                        },
                                    },
                                ],
                            });
                        }}
                        className={`text-${primaryColor} font-semibold text-[14px] font-notoSans`}
                    >
                        {unblockLoading ? 'Loading...' : 'Unblock'}
                    </button>
                )}
                {/* {showDeleteButton && (
                    <button
                        onClick={e => handleRemoveConnection?.(e, contact?.profileId)}
                        className="text-rose-600 font-bold text-base"
                    >
                        Remove Contact
                    </button>
                )} */}
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
                                        handler: async () => {
                                            handleCancelConnectionRequest?.(e, contact?.profileId);
                                        },
                                    },
                                    {
                                        text: 'Cancel',
                                        role: 'cancel',
                                        handler: () => {
                                            dismissAlert();
                                        },
                                    },
                                ],
                            });
                        }}
                        className="text-rose-600 font-bold text-base"
                    >
                        {cancelRequestLoading ? 'Loading...' : 'Cancel Request'}
                    </button>
                )}
            </div>
        </>
    );

    const shouldHideButton = !showDeleteButton && showBlockButton && !showRequestButton;
    const shouldUsePortal = !showDeleteButton && showBlockButton;

    const contactItemDetails = (
        <>
            <div
                className="flex items-center justify-start w-[80%] py-2"
                onClick={e => {
                    e.stopPropagation();
                    newModal(
                        <AddressBookContactDetailsView
                            showCloseButton
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
                        }
                    );
                }}
            >
                {userDetails}
            </div>
            {showBoostButton && !showArrow && (
                <div className="flex item-center justify-end w-[20%]">
                    <button
                        onClick={async () => {
                            const { prompted } = await gate();
                            if (prompted) return;

                            newModal(
                                <BoostTemplateSelector otherUserProfileId={contact?.profileId} />,
                                {
                                    hideButton: true,
                                },
                                {
                                    desktop: ModalTypes.FullScreen,
                                    mobile: ModalTypes.FullScreen,
                                }
                            );
                        }}
                        className={`flex items-center justify-center text-white rounded-[45px] bg-${primaryColor}`}
                    >
                        <div
                            style={{
                                backgroundImage: `url(${BoostIcon})`,
                                backgroundPosition: 'center',
                                backgroundSize: 'contain',
                            }}
                            className="bg-indigo-700 relative rounded-[45px] h-[45px] w-[45px] flex items-center justify-center flex-col  "
                        >
                            <MobileNavCircleIcon className="w-[35px]" />
                            <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-9999 w-[40px] h-[40px] rounded-[12px] flex items-center justify-center">
                                <Plus className="text-grayscale-900 h-6 w-6" />
                            </div>
                        </div>
                    </button>
                </div>
            )}
            {showArrow && (
                <div className="flex item-center justify-end w-[20%]">
                    <div
                        className="flex items-center justify-start py-2"
                        onClick={e => {
                            e.stopPropagation();
                            newModal(
                                <AddressBookContactDetailsView
                                    showCloseButton
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
                                { sectionClassName: '!max-w-[400px]' }
                            );
                        }}
                    >
                        <SlimCaretRight className="text-grayscale-400 w-[24px] h-auto" />
                    </div>
                </div>
            )}
        </>
    );
    return (
        <IonItem
            lines="none"
            className="w-[95%] max-w-3xl ion-no-border px-[12px] py-[10px] flex items-center justify-between notificaion-list-item cursor-pointer last:border-b-0"
        >
            {contactItemDetails}
        </IonItem>
    );
};

export default AddressBookContactItem;
