import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { IonSpinner, useIonToast } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

import { AddressBookTabsEnum } from '../addressBookHelpers';

import {
    useGetConnections,
    useDisconnectWithMutation,
    useBlockProfileMutation,
    useGetPaginatedConnections,
} from 'learn-card-base';
import PurpGhost from '../../../assets/lotties/purpghost.json';
import Lottie from 'react-lottie-player';

const AddressBookConnections: React.FC<{
    activeTab: AddressBookTabsEnum;
    connectionCount: number;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
}> = ({ connectionCount, setConnectionCount, activeTab }) => {
    const queryClient = useQueryClient();
    const { url } = useRouteMatch();

    const { data, isLoading, error, refetch } = useGetConnections();

    const queryOptions = { limit: 10 };
    const {
        data: paginatedData,
        fetchNextPage,
        hasNextPage,
        isFetching,
    } = useGetPaginatedConnections(queryOptions);

    const { mutate } = useDisconnectWithMutation();
    const { mutate: blockProfile } = useBlockProfileMutation();

    const [presentToast] = useIonToast();

    useEffect(() => {
        if (!isLoading && data) setConnectionCount(data?.length ?? 0);
    }, [connectionCount, data, activeTab, url]);

    const handleRemoveConnection = async (
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
                            queryKey: ['connections'],
                        });

                        queryClient.setQueryData(['connections'], prevConnections => {
                            const updatedConnections = prevConnections?.filter(
                                connection => connection?.profileId !== profileId
                            );
                            setConnectionCount(updatedConnections?.length);
                            return updatedConnections;
                        });

                        await queryClient.cancelQueries({
                            queryKey: ['paginatedConnections', queryOptions],
                        });

                        queryClient.setQueryData<{
                            pages: Array<{
                                cursor: string;
                                hasMore: boolean;
                                records: Array<any>;
                            }>;
                            pageParams: Array<string | null>;
                        }>(['paginatedConnections', queryOptions], old => {
                            if (!old) return old;

                            const newPages = old.pages.map(page => ({
                                ...page,
                                records: page.records.filter(
                                    record => record.profileId !== profileId
                                ),
                            }));

                            return {
                                ...old,
                                pages: newPages,
                            };
                        });
                    },
                    onError(error, variables, context) {
                        refetch();
                        presentToast({
                            // @ts-ignore
                            message:
                                error?.message || 'An error occurred, unable to remove contact',
                            duration: 3000,
                            buttons: [
                                {
                                    text: 'Dismiss',
                                    role: 'cancel',
                                },
                            ],
                            position: 'top',
                            cssClass: 'login-link-warning-toast',
                        });
                    },
                }
            );
        } catch (err) {
            presentToast({
                // @ts-ignore
                message: err?.message || 'An error occurred, unable to remove contact',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'login-link-warning-toast',
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
                        presentToast({
                            // @ts-ignore
                            message: error?.message || 'An error occurred, unable to block user',
                            duration: 3000,
                            buttons: [
                                {
                                    text: 'Dismiss',
                                    role: 'cancel',
                                },
                            ],
                            position: 'top',
                            cssClass: 'login-link-warning-toast',
                        });
                    },
                }
            );
        } catch (err) {
            console.log('blockProfile::error', err);
            presentToast({
                // @ts-ignore
                message: err?.message || 'An error occurred, unable to block user',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'login-link-warning-toast',
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
                    showRequestButton={false}
                    showDeleteButton
                    handleRemoveConnection={handleRemoveConnection}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    contacts={data}
                    pages={paginatedData?.pages}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    isFetching={isFetching}
                />
            )}
            {!isLoading && (data?.length === 0 || error) && (
                <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                    <strong>No connections yet.</strong>
                    <div className="w-[280px] h-[280px] mt-[-30px]">
                        <Lottie
                            loop
                            animationData={PurpGhost}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </section>
            )}
        </>
    );
};

export default AddressBookConnections;
