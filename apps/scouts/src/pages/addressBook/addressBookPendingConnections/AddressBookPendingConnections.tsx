import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { IonSpinner } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

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
                        queryKey: ['pendingConnections'],
                    });

                    queryClient.setQueryData(['pendingConnections'], prevPendingConnections => {
                        const updatedPendingConnections = prevPendingConnections?.filter(
                            connection => connection?.profileId !== profileId
                        );
                        setConnectionCount(updatedPendingConnections?.length);
                        return updatedPendingConnections;
                    });
                },
                onError(error, variables, context) {
                    refetch();
                    presentToast(error?.message || 'An error occurred, unable to cancel request', {
                        // @ts-ignore
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                },
            }
        );
        try {
        } catch (err) {
            console.log('canceledConnectionReq::error', err);
            presentToast(err?.message || 'An error occurred, unable to cancel request', {
                // @ts-ignore
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
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
                        presentToast(error?.message || 'An error occurred, unable to block user', {
                            // @ts-ignore
                            type: ToastTypeEnum.Error,
                            hasDismissButton: true,
                        });
                    },
                }
            );
        } catch (err) {
            console.log('blockProfile::error', err);
            presentToast(err?.message || 'An error occurred, unable to block user', {
                // @ts-ignore
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

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
                    showCancelButton
                    handleCancelConnectionRequest={handleCancelConnectionRequest}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    contacts={data}
                />
            )}
            {!isLoading && (data?.length === 0 || error) && (
                <section className="relative flex flex-col pt-[100px] px-[20px] text-center justify-center">
                    <img src={MiniGhost} alt="ghost" className="max-w-[250px] m-auto" />
                    No pending connections yet.
                </section>
            )}
        </>
    );
};

export default AddressBookPendingConnections;
