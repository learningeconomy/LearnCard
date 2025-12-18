import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { LCNProfile } from '@learncard/types';

import { IonSpinner } from '@ionic/react';

import AddressBookContactList from '../addressBook-contact-list/AddressBookContactList';

import { AddressBookTabsEnum } from '../addressBookHelpers';

import {
    useGetConnections,
    useDisconnectWithMutation,
    useBlockProfileMutation,
    useGetPaginatedConnections,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

const AddressBookConnections: React.FC<{
    activeTab: AddressBookTabsEnum;
    connectionCount: number;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
}> = ({ connectionCount, setConnectionCount, activeTab }) => {
    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const queryClient = useQueryClient();
    const { url } = useRouteMatch();

    const { data, isLoading: connectionsLoading, error, refetch } = useGetConnections();

    const queryOptions = { limit: 10 };
    const {
        data: paginatedData,
        isLoading: paginatedDataLoading,
        fetchNextPage,
        hasNextPage,
        isFetching,
    } = useGetPaginatedConnections(queryOptions);

    const { mutate } = useDisconnectWithMutation();
    const { mutate: blockProfile } = useBlockProfileMutation();

    const { presentToast } = useToast();

    useEffect(() => {
        if (!connectionsLoading && data) setConnectionCount(data?.length ?? 0);
    }, [connectionCount, data, activeTab, url]);

    const handleRemoveConnection = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => {
        e.stopPropagation();

        try {
            const switchedDid = switchedProfileStore.get.switchedDid();

            mutate(
                { profileId },
                {
                    async onSuccess(data, { profileId }, context) {
                        await queryClient.cancelQueries({
                            queryKey: ['connections', switchedDid ?? ''],
                        });

                        queryClient.setQueryData(
                            ['connections', switchedDid ?? ''],
                            (prevConnections: LCNProfile[] = []) => {
                                const updatedConnections = prevConnections.filter(
                                    connection => connection?.profileId !== profileId
                                );
                                setConnectionCount(updatedConnections.length);
                                return updatedConnections;
                            }
                        );

                        await queryClient.cancelQueries({
                            queryKey: ['paginatedConnections', switchedDid ?? '', queryOptions],
                        });

                        queryClient.setQueryData<{
                            pages: Array<{
                                cursor: string;
                                hasMore: boolean;
                                records: LCNProfile[];
                            }>;
                            pageParams: Array<string | null>;
                        }>(['paginatedConnections', switchedDid ?? '', queryOptions], old => {
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
                            // @ts-ignore
                            error?.message || 'An error occurred, unable to remove contact',
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
                err?.message || 'An error occurred, unable to remove contact',
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
            const switchedDid = switchedProfileStore.get.switchedDid();

            blockProfile(
                { profileId },
                {
                    async onSuccess(data, { profileId }, context) {
                        await queryClient.cancelQueries({
                            queryKey: ['connections', switchedDid ?? ''],
                        });

                        queryClient.setQueryData(
                            ['connections', switchedDid ?? ''],
                            (prevConnections: LCNProfile[] = []) =>
                                prevConnections.filter(c => c?.profileId !== profileId)
                        );

                        await queryClient.cancelQueries({
                            queryKey: ['paginatedConnections', switchedDid ?? '', queryOptions],
                        });

                        queryClient.setQueryData<{
                            pages: Array<{
                                cursor: string;
                                hasMore: boolean;
                                records: LCNProfile[];
                            }>;
                            pageParams: Array<string | null>;
                        }>(['paginatedConnections', switchedDid ?? '', queryOptions], old => {
                            if (!old) return old;

                            return {
                                ...old,
                                pages: old.pages.map(page => ({
                                    ...page,
                                    records: page.records.filter(
                                        record => record.profileId !== profileId
                                    ),
                                })),
                            };
                        });

                        const blockedUsersKey = ['blockedUsers', switchedDid ?? ''] as const;

                        const currentBlockedUsers = (() => {
                            const data = queryClient.getQueryData(blockedUsersKey);
                            return Array.isArray(data) ? (data as LCNProfile[]) : [];
                        })();

                        if (!currentBlockedUsers.some(user => user.profileId === profileId)) {
                            const newBlockedUser: LCNProfile = {
                                profileId,
                                displayName: '',
                                shortBio: '',
                                bio: '',
                                did: '',
                                type: '',
                                email: '',
                                role: '',
                                dob: '',
                            } as LCNProfile;

                            queryClient.setQueryData(blockedUsersKey, [
                                ...currentBlockedUsers,
                                newBlockedUser,
                            ]);
                        }

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

    const isLoading = connectionsLoading && paginatedDataLoading;
    const contactsExist =
        (paginatedData?.pages?.[0]?.records?.length ?? 0) > 0 || (data?.length ?? 0) > 0;

    return (
        <>
            {isLoading && (
                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full my-4">
                    <IonSpinner color="black" />
                    <p className="mt-2 font-bold text-lg">Loading...</p>
                </section>
            )}
            {contactsExist && (
                <AddressBookContactList
                    showBoostButton
                    showRequestButton={false}
                    showDeleteButton
                    handleRemoveConnection={handleRemoveConnection}
                    showBlockButton
                    handleBlockUser={handleBlockUser}
                    contacts={data ?? []}
                    pages={paginatedData?.pages}
                    showUnblockButton={false}
                    search=""
                    setConnectionCount={setConnectionCount}
                    refetch={refetch}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    isFetching={isFetching}
                />
            )}
            {!isLoading && (!contactsExist || error) && (
                <section className="flex flex-col items-center justify-center my-[30px]">
                    <FloatingBottleIcon />
                    <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                        No connections yet.
                    </p>
                </section>
            )}
        </>
    );
};

export default AddressBookConnections;
