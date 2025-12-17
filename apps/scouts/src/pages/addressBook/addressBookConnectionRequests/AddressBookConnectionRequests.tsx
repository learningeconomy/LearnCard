import React, { useEffect } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { IonSpinner, useIonModal } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';
import Pulpo from '../../../assets/lotties/cuteopulpo.json';
import Lottie from 'react-lottie-player';

import {
    useGetConnectionsRequests,
    useBlockProfileMutation,
    usePathQuery,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { AddressBookTabsEnum } from '../addressBookHelpers';
import ConnectModal from '../../connectPage/ConnectModal';

const AddressBookConnectionRequests: React.FC<{
    activeTab: AddressBookTabsEnum;
    setRequestCount: React.Dispatch<React.SetStateAction<number>>;
}> = ({ setRequestCount, activeTab }) => {
    const queryClient = useQueryClient();
    const history = useHistory();
    const { url } = useRouteMatch();
    const query = usePathQuery();

    const _profileId = query.get('profileId') ?? '';
    const _connect = query.get('connect') ?? false;

    const { data, isLoading, error, refetch } = useGetConnectionsRequests();
    const { mutate: blockProfile } = useBlockProfileMutation();

    const { presentToast } = useToast();

    const handleBlockUser = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();

        try {
            blockProfile(
                { profileId },
                {
                    async onSuccess(data, { profileId }, context) {
                        refetch();
                    },
                    onError(error, variables, context) {
                        refetch();
                        presentToast(error?.message || 'An error occurred, unable to block user', {
                            type: ToastTypeEnum.Error,
                            hasDismissButton: true,
                        });
                    },
                }
            );
        } catch (err) {
            console.log('blockProfile::error', err);
            presentToast(err?.message || 'An error occurred, unable to block user', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const updateCacheOnSuccessCallback = async (userId: string) => {
        await queryClient.cancelQueries({
            queryKey: ['getConnectionRequests'],
        });

        queryClient.setQueryData(['getConnectionRequests'], prevPendingRequest => {
            const updatedPendingRequests = prevPendingRequest?.filter(
                connectionReq => connectionReq?.profileId !== userId
            );
            setConnectionCount(updatedPendingRequests?.length);
            return updatedPendingRequests;
        });

        dismissModal?.();
    };

    const [presentModal, dismissModal] = useIonModal(ConnectModal, {
        profileId: _profileId,
        handleCancel: () => dismissModal(),
        updateCacheOnSuccessCallback: updateCacheOnSuccessCallback,
    });

    useEffect(() => {
        if (_profileId && _connect) {
            presentModal({
                cssClass: 'center-modal add-contact-modal',
                backdropDismiss: false,
                showBackdrop: false,
                onDidDismiss: () => history.push('/contacts'),
            });
        }
    }, []);

    return (
        <>
            {isLoading && (
                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full pt-[100px]">
                    <IonSpinner color="black" />
                    <p className="mt-2 font-bold text-lg">Loading...</p>
                </section>
            )}
            {!isLoading && (
                <AddressBookContactList
                    showBoostButton
                    showAcceptButton
                    contacts={data}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    setConnectionCount={setRequestCount}
                />
            )}
            {!isLoading && (data?.length === 0 || error) && (
                <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                    <strong>No connection requests yet.</strong>
                    <div className="w-[280px] h-[280px] mt-[-30px]">
                        <Lottie
                            loop
                            animationData={Pulpo}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </section>
            )}
        </>
    );
};

export default AddressBookConnectionRequests;
