import React, { useState, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { IonSpinner } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

import { AddressBookTabsEnum } from '../addressBookHelpers';

import {
    useGetConnections,
    useDisconnectWithMutation,
    useBlockProfileMutation,
    useGetPaginatedConnections,
    useWallet,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useGetBoostParents } from 'learn-card-base';
import PurpGhost from '../../../assets/lotties/purpghost.json';
import Lottie from 'react-lottie-player';
import { VC } from '@learncard/types';

const AddressBookConnections: React.FC<{
    activeTab: AddressBookTabsEnum;
    connectionCount: number;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
    boostId: string | undefined;
    selectedGroupId: string;
    resolvedCredential?: VC;
}> = ({
    connectionCount,
    setConnectionCount,
    activeTab,
    boostId,
    selectedGroupId,
    resolvedCredential,
}) => {
    const queryClient = useQueryClient();
    const { url } = useRouteMatch();
    const { initWallet } = useWallet();
    const [matchingConnections, setMatchingConnections] = useState<any[] | null>(null);

    const { data, isLoading, error, refetch } = useGetConnections();

    const parentBoostQuery = useGetBoostParents(boostId, 2);
    const troopParent = parentBoostQuery?.data?.records?.find((p: any) => p.type === 'ext:TroopID');

    const getTroopConnections = async (id: string) => {
        const wallet = await initWallet();
        const troopCount = await wallet.invoke.getPaginatedBoostRecipientsWithChildren(id);
        return troopCount;
    };

    useEffect(() => {
        const fetchMatchingConnections = async () => {
            if (!boostId || !data) {
                setMatchingConnections(null);
                return;
            }

            const troopData = await getTroopConnections(troopParent?.uri ?? boostId);
            const dataProfileIds = new Set(data.map(d => d.profileId));

            const troopDataFiltered = troopData?.records?.filter(record =>
                dataProfileIds.has(record?.to?.profileId)
            );
            const troopDataMapped = troopDataFiltered?.map(item => item?.to);
            setMatchingConnections(troopDataMapped);
        };

        fetchMatchingConnections();
    }, [boostId, troopParent?.uri, data, initWallet]);

    const contactsToShow = boostId ? matchingConnections : data;

    const queryOptions = { limit: 10 };
    const {
        data: paginatedData,
        fetchNextPage,
        hasNextPage,
        isFetching,
    } = useGetPaginatedConnections(queryOptions);

    const { mutate } = useDisconnectWithMutation();
    const { mutate: blockProfile } = useBlockProfileMutation();

    const { presentToast } = useToast();

    useEffect(() => {
        if (selectedGroupId === 'all') {
            setConnectionCount(data?.length ?? 0);
        } else if (!isLoading && matchingConnections !== null) {
            setConnectionCount(matchingConnections?.length);
        } else if (!isLoading && data) setConnectionCount(data?.length ?? 0);
    }, [matchingConnections, data, isLoading, activeTab, url]);

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
                        presentToast(
                            error?.message || 'An error occurred, unable to remove contact',
                            {
                                // @ts-ignore
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            }
                        );
                    },
                }
            );
        } catch (err) {
            presentToast(err?.message || 'An error occurred, unable to remove contact', {
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
                    showRequestButton={false}
                    showDeleteButton
                    handleRemoveConnection={handleRemoveConnection}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    contacts={contactsToShow}
                    pages={!matchingConnections && !boostId && paginatedData?.pages}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    isFetching={isFetching}
                    resolvedCredential={resolvedCredential}
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
