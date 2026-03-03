import React, { useState } from 'react';
import { useLocation, useHistory, useRouteMatch } from 'react-router-dom';

import {
    useWallet,
    useIsLoggedIn,
    redirectStore,
    useIsCurrentUserLCNUser,
    usePathQuery,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { IonCol, IonRow, IonGrid } from '@ionic/react';
import { UserProfilePicture, useCurrentUser } from 'learn-card-base';
import { AddressBookContact } from '../addressBookHelpers';
import ArrowRight from 'learn-card-base/svgs/ArrowRight';
import ExpiredInviteLink from './ExpiredInviteLink';

import { useJoinLCNetworkModal } from '../../../components/network-prompts/hooks/useJoinLCNetworkModal';
import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';

import { useAcceptConnectionRequestMutation } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

export enum AddContactViewMode {
    acceptInvite = 'acceptInvite',
    acceptConnectionRequest = 'acceptConnectionRequest',
    requestConnection = 'requestConnection',
}

export const AddContactView: React.FC<{
    mode?: AddContactViewMode;
    handleCancel?: () => void;
    user: AddressBookContact | null | undefined;
    closeModal?: boolean;
    customContainerClass?: string;
    profileId?: string;
    challenge?: string;
    handleAcceptConnectionRequest?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    updateCacheOnSuccessCallback?: any;
}> = ({
    mode = AddContactViewMode?.requestConnection,
    handleCancel = () => {},
    user,
    closeModal = false,
    customContainerClass,
    challenge,
    updateCacheOnSuccessCallback,
}) => {
    const location = useLocation();
    const history = useHistory();
    const query = usePathQuery();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();
    const { gate } = useLCNGatedAction();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();
    const { presentToast } = useToast();
    const { newModal } = useModal();

    const { mutate: acceptConnectionRequest, isPending: acceptConnectionLoading } =
        useAcceptConnectionRequestMutation();

    const isIssuingBoost = location.pathname === '/boost' || location.pathname === '/boost/update';

    const _boostCategoryType = query.get('boostCategoryType');
    const _boostSubCategoryType = query.get('boostSubCategoryType');
    const _boostUserType = query.get('boostUserType');
    const _boostUri = query.get('uri');

    const [connectionRequested, setConnectionRequested] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const handleConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();
        const wallet = await initWallet();

        const { prompted } = await gate();
        if (prompted) return;

        setLoading(true);
        try {
            const connectionReq = await wallet?.invoke?.connectWith(profileId);
            if (connectionReq) {
                presentToast('Connection Request sent', {
                    hasDismissButton: true,
                });
            }
            console.log('connectionReq', connectionReq);
            setLoading(false);
            setConnectionRequested(true);
            if (closeModal) handleCancel?.();
        } catch (err) {
            // @ts-ignore
            presentToast(err?.message ?? 'An error ocurred, unable to send connection request.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            // @ts-ignore
            if (err?.message.includes('Connection already requested')) setConnectionRequested(true);
            // @ts-ignore
            console.log('connectionReq::error', err?.message);
            setLoading(false);
        }
    };

    const handleExpiredInviteConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();
        const wallet = await initWallet();

        const { prompted } = await gate();
        if (prompted) return;

        setLoading(true);
        try {
            const connectionReq = await (wallet as any)?.invoke?.connectWithExpiredInvite(
                profileId
            );
            if (connectionReq) {
                presentToast('Connection Request sent', {
                    hasDismissButton: true,
                });
            }
            console.log('expiredInviteConnectionReq', connectionReq);
            setLoading(false);
            setConnectionRequested(true);
            if (closeModal) handleCancel?.();
        } catch (err) {
            // @ts-ignore
            presentToast(err?.message ?? 'An error ocurred, unable to send connection request.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            // @ts-ignore
            if (err?.message.includes('Connection already requested')) setConnectionRequested(true);
            // @ts-ignore
            console.log('expiredInviteConnectionReq::error', err?.message);
            setLoading(false);
        }
    };

    const handleAcceptInvite = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();
        const wallet = await initWallet();

        const { prompted } = await gate();
        if (prompted) return;

        setLoading(true);
        try {
            const connectionReq = await wallet?.invoke?.connectWithInvite(profileId, challenge);
            if (connectionReq) {
                presentToast('Connected Successfully', {
                    hasDismissButton: true,
                });
            }
            console.log('connection', connectionReq);
            setLoading(false);
            setConnectionRequested(true);
            if (closeModal) handleCancel?.();
            history.push('/contacts');
        } catch (err) {
            let _errMessage = err?.message;
            if (_errMessage.includes('Challenge not found'))
                _errMessage = 'Invite link has expired!';
            if (err?.message === 'Invite not found or has expired') {
                handleCancel?.();
                newModal(
                    <ExpiredInviteLink
                        user={user}
                        handleConnectionRequest={handleExpiredInviteConnectionRequest}
                    />,
                    {},
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            } else {
                // @ts-ignore
                presentToast(_errMessage ?? 'An error ocurred, unable to connect!', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
            // @ts-ignore
            console.log('connection::error', err?.message);
            setLoading(false);
        }
    };

    const handleAddBoostIssueTo = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();

        let _url;

        if (_boostUri) {
            _url = `/boost/update?uri=${_boostUri}&boostUserType=${_boostUserType}&boostCategoryType=${_boostCategoryType}&boostSubCategoryType=${_boostSubCategoryType}&otherUserProfileId=${profileId}`;
        } else {
            _url = `/boost?boostUserType=${_boostUserType}&boostCategoryType=${_boostCategoryType}&boostSubCategoryType=${_boostSubCategoryType}&otherUserProfileId=${profileId}`;
        }

        history.replace(_url);
        handleCancel();
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
                        await updateCacheOnSuccessCallback(profileId);
                    },
                    onError(error, variables, context) {
                        // @ts-ignore
                        presentToast(
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
            // @ts-ignore
            presentToast(error?.message || 'An error occurred, unable to accept request', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const onHandleAcceptConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        try {
            setLoading(true);
            await handleAcceptConnectionRequest?.(e, profileId);
            setLoading(false);
        } catch (e) {
            setLoading(false);
        }
    };

    let actionButton = null;

    if (mode === AddContactViewMode.requestConnection) {
        if (isLoggedIn) {
            if (isIssuingBoost) {
                actionButton = (
                    <IonCol className="flex flex-col items-center justify-center px-4">
                        <button
                            onClick={e => handleAddBoostIssueTo(e, user?.profileId)}
                            className={`w-full flex items-center justify-center bg-${primaryColor} rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4`}
                        >
                            <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" /> Boost
                        </button>
                    </IonCol>
                );
            } else {
                actionButton = (
                    <IonCol className="flex flex-col items-center justify-center px-4">
                        {!connectionRequested ? (
                            <button
                                onClick={e => handleConnectionRequest(e, user?.profileId)}
                                className="w-full flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                            >
                                {loading ? 'loading...' : 'Request Connection'}
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                            >
                                Pending request
                            </button>
                        )}
                    </IonCol>
                );
            }
        }

        if (!isLoggedIn) {
            const redirectTo = `/connect?did=${user?.did}`;
            actionButton = (
                <button
                    className="w-[90%] flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                    onClick={() => {
                        redirectStore.set.lcnRedirect(redirectTo);
                        handleCancel();
                    }}
                >
                    Login to Connect
                </button>
            );
        }
    } else if (mode === AddContactViewMode.acceptInvite) {
        actionButton = (
            <IonCol className="flex flex-col items-center justify-center px-4">
                {!connectionRequested && (
                    <button
                        onClick={e => handleAcceptInvite(e, user?.profileId)}
                        className="w-full flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                    >
                        {loading ? 'loading...' : 'Connect'}
                    </button>
                )}
            </IonCol>
        );
        if (!isLoggedIn) {
            const redirectTo = `/invite?challenge=${challenge}&profileId=${user?.profileId}`;
            actionButton = (
                <button
                    className="w-[90%] flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                    onClick={() => {
                        redirectStore.set.lcnRedirect(redirectTo);
                        handleCancel();
                    }}
                >
                    Login to Connect
                </button>
            );
        }
    } else if (mode === AddContactViewMode.acceptConnectionRequest) {
        actionButton = (
            <IonCol className="flex flex-col items-center justify-center px-4">
                {!connectionRequested ? (
                    <button
                        onClick={e => onHandleAcceptConnectionRequest(e, user?.profileId)}
                        className="w-full flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                    >
                        {acceptConnectionLoading ? 'loading...' : 'Connect'}
                    </button>
                ) : (
                    <button
                        disabled
                        className="w-full flex items-center justify-center bg-emerald-600 rounded-full px-[12px] py-[8px] text-white font-poppins text-[18px] font-semibold shadow-lg mb-4"
                    >
                        Connected
                    </button>
                )}
            </IonCol>
        );
    }

    let promptText = null;

    if (isIssuingBoost) {
        promptText = (
            <p className="text-grayscale-600 text-lg font-semibold text-center">
                Would you like to <br /> boost {user?.displayName || `@${user?.profileId}`}?
            </p>
        );
    } else if (mode === AddContactViewMode?.acceptConnectionRequest) {
        promptText = (
            <p className="text-grayscale-600 text-lg font-semibold text-center">
                {user?.displayName || `@${user?.profileId}`} has requested
                <br /> to connect with you?
            </p>
        );
    } else {
        promptText = (
            <p className="text-grayscale-600 text-lg font-semibold text-center">
                Would you like to <br /> connect with {user?.displayName || `@${user?.profileId}`}?
            </p>
        );
    }

    return (
        // <IonGrid className="flex flex-col items-center justify-center py-5 px-5">
        <IonGrid className="relative flex flex-col items-center justify-center h-[100%] w-full">
            <IonRow className={`max-w-[375px] py-[75px] ${customContainerClass}`}>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol
                        className={`w-full flex items-center justify-center ${
                            mode === AddContactViewMode?.acceptConnectionRequest
                                ? 'flex-row-reverse'
                                : ''
                        }`}
                    >
                        {isLoggedIn && !isIssuingBoost && (
                            <>
                                <UserProfilePicture
                                    customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden text-white font-medium text-4xl"
                                    customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover"
                                    customSize={120}
                                    user={currentUser}
                                />
                            </>
                        )}

                        {isLoggedIn && !isIssuingBoost && (
                            <ArrowRight className="w-[30px] h-[30px] mx-3" />
                        )}

                        <UserProfilePicture
                            customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden text-white font-medium text-4xl"
                            customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover"
                            customSize={120}
                            user={user}
                        />
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="w-full flex items-center justify-center">
                        {promptText}
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full mt-8">
                    {actionButton}
                </IonRow>
                <div onClick={handleCancel} className="w-full flex items-center justify-center">
                    <button className="text-grayscale-900 text-center text-sm">
                        {isLoggedIn ? 'Cancel' : 'Return home'}
                    </button>
                </div>
            </IonRow>
        </IonGrid>
    );
};

export default AddContactView;
