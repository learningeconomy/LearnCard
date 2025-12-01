import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { IonSpinner } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';

import {
    useGetPendingConnections,
    useCancelConnectionRequestMutation,
    useBlockProfileMutation,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { AddressBookTabsEnum } from '../addressBookHelpers';

const AddressBookPendingConnections: React.FC<{
    activeTab: AddressBookTabsEnum;
    connectionCount: number;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
}> = ({ activeTab, connectionCount, setConnectionCount }) => {
    const queryClient = useQueryClient();
    const { url } = useRouteMatch();

    const { data, isLoading, error, refetch } = useGetPendingConnections();
    const { mutate } = useCancelConnectionRequestMutation();
    const { mutate: blockProfile } = useBlockProfileMutation();

    const { presentToast } = useToast();

    useEffect(() => {
        if (!isLoading && data) {
            setConnectionCount(data?.length ?? 0);
        }
    }, [connectionCount, data, activeTab, url]);

    const handleCancelConnectionRequest = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();
        mutate(
            { profileId },
            {
                async onSuccess(data, { profileId }, context) {
                    await queryClient.cancelQueries({
                        queryKey: ['getPendingConnections'],
                    });

                    queryClient.setQueryData(
                        ['getPendingConnections'],
                        (prevPendingConnections: any) => {
                            const updatedPendingConnections = prevPendingConnections?.filter(
                                (connection: any) => connection.profileId !== profileId
                            );
                            setConnectionCount(updatedPendingConnections?.length);
                            return updatedPendingConnections;
                        }
                    );
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

    return (
        <>
            {isLoading && (
                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full mt-4">
                    <IonSpinner color="black" />
                    <p className="mt-2 font-bold text-lg">Loading...</p>
                </section>
            )}
            {!isLoading && (
                <AddressBookContactList
                    showBoostButton
                    showCancelButton
                    handleCancelConnectionRequest={handleCancelConnectionRequest}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    contacts={data ?? []}
                    showUnblockButton={false}
                    search=""
                    setConnectionCount={setConnectionCount}
                    refetch={refetch}
                />
            )}
            {!isLoading && (data?.length === 0 || error) && (
                <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                    <strong>No pending connections yet</strong>
                </section>
            )}
        </>
    );
};

export default AddressBookPendingConnections;
