import React, { useEffect } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { IonSpinner, useIonModal } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';

import {
    useGetConnectionsRequests,
    useBlockProfileMutation,
    usePathQuery,
    useGetPaginatedConnectionRequests,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { AddressBookTabsEnum } from '../addressBookHelpers';
import ConnectModal from '../../connectPage/ConnectModal';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

const AddressBookConnectionRequests: React.FC<{
    activeTab: AddressBookTabsEnum;
    setRequestCount: React.Dispatch<React.SetStateAction<number>>;
}> = ({ setRequestCount, activeTab }) => {
    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const queryClient = useQueryClient();
    const history = useHistory();
    const { url } = useRouteMatch();
    const query = usePathQuery();

    const _profileId = query.get('profileId') ?? '';
    const _connect = query.get('connect') ?? false;

    const {
        data,
        isLoading: connectionRequestsLoading,
        error,
        refetch,
    } = useGetConnectionsRequests();
    const { mutate: blockProfile } = useBlockProfileMutation();

    const queryOptions = { limit: 10 };
    const {
        data: paginatedData,
        isLoading: paginatedDataLoading,
        fetchNextPage,
        hasNextPage,
        isFetching,
    } = useGetPaginatedConnectionRequests(queryOptions);

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
                        presentToast(
                            // @ts-ignore
                            error?.message || 'An error occurred, unable to block user',
                            {
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            }
                        );
                    },
                }
            );
        } catch (err) {
            console.log('blockProfile::error', err);
            presentToast(
                // @ts-ignore
                err?.message || 'An error occurred, unable to block user',
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        }
    };

    const updateCacheOnSuccessCallback = async (userId: string) => {
        await queryClient.cancelQueries({
            queryKey: ['getConnectionRequests'],
        });

        queryClient.setQueryData(['getConnectionRequests'], prevPendingRequest => {
            const connectionRequests = (prevPendingRequest as any)?.filter(
                (connectionReq: any) => connectionReq.profileId !== userId
            );
            setRequestCount(connectionRequests?.length);
            return connectionRequests;
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

    const isLoading = connectionRequestsLoading && paginatedDataLoading;
    const requestsExist =
        (paginatedData?.pages?.[0]?.records?.length ?? 0) > 0 || (data?.length ?? 0) > 0;

    return (
        <>
            {isLoading && (
                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full my-4">
                    <IonSpinner color="black" />
                    <p className="mt-2 font-bold text-lg">Loading...</p>
                </section>
            )}
            {requestsExist && (
                <AddressBookContactList
                    showBoostButton
                    showAcceptButton
                    contacts={data ?? []}
                    pages={paginatedData?.pages}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    setConnectionCount={setRequestCount}
                    showUnblockButton={false}
                    search=""
                    refetch={refetch}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    isFetching={isFetching}
                />
            )}
            {!isLoading && (!requestsExist || error) && (
                <section className="flex flex-col items-center justify-center my-[30px]">
                    <FloatingBottleIcon />
                    <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                        No requests yet.
                    </p>
                </section>
            )}
        </>
    );
};

export default AddressBookConnectionRequests;
