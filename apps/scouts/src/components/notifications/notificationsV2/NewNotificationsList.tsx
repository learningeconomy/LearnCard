import React, { useEffect } from 'react';

import Lottie from 'react-lottie-player';
import * as m from '../../../paraglide/messages.js';
import NotificationSkeleton from './NotificationSkeleton';
import lizardflame from '../../../assets/lotties/lizardflame.json';
import NotificationCardContainer from './NotificationCardContainer';

import { useGetUserNotifications } from 'learn-card-base';
import { deduplicateConnectionPromptNotifications } from 'learn-card-base/components/connection-prompts/deduplicateConnectionPromptNotifications';
import { useLoadingLine } from '../../../stores/loadingStore';

import {
    NotificationType,
    PaginatedNotificationsOptionsType,
    NotificationQueryFiltersType,
} from 'packages/plugins/lca-api-plugin/src/types';

type NewNotificationsListProps = {
    options: PaginatedNotificationsOptionsType;
    filter: NotificationQueryFiltersType;
    isEmptyState: boolean;
    setIsEmptyState: React.Dispatch<React.SetStateAction<boolean>>;
};

const NewNotificationsList: React.FC<NewNotificationsListProps> = ({
    options,
    filter,
    isEmptyState,
    setIsEmptyState,
}) => {
    const { data, isLoading, refetch, isRefetching, isFetching } = useGetUserNotifications(
        options,
        filter
    );
    useLoadingLine(isLoading || isFetching);

    useEffect(() => {
        if (!isLoading && data) {
            const isEmptyState = data?.pages?.[0]?.notifications?.length === 0;
            setIsEmptyState(isEmptyState);
        }
    }, [data, isLoading, setIsEmptyState]);

    const queryOptions = { options, filter };

    const flatNotifications = (data?.pages?.flatMap(group => group?.notifications ?? []) ??
        []) as NotificationType[];
    const visibleNotifications = deduplicateConnectionPromptNotifications(flatNotifications);
    const renderNotifications =
        data &&
        visibleNotifications.map(notification => (
            <NotificationCardContainer
                queryOptions={queryOptions}
                notification={notification}
                key={notification?._id}
            />
        ));

    const handleRefetch = () => {
        refetch();
    };

    const notificationsLoading = isRefetching || isLoading;

    return (
        <div className="m-auto max-w-[600px] h-full  bg-white">
            {notificationsLoading && !isEmptyState && (
                <section
                    className="flex w-full flex-col items-center px-[10px]"
                    role="status"
                    aria-label={m['notifications.loading']()}
                >
                    {[0, 1, 2].map(index => (
                        <NotificationSkeleton key={index} />
                    ))}
                </section>
            )}
            {!notificationsLoading && !isEmptyState && renderNotifications}
            {isEmptyState && !notificationsLoading && (
                <div className="p-[20px] flex flex-col justify-center items-center w-full h-full">
                    <div className="max-w-[280px]">
                        <Lottie
                            loop
                            animationData={lizardflame}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <p className="font-bold text-grayscale-800 mt-[20px]">
                        {m['notifications.noNotificationsFound']()}
                    </p>
                    <button
                        className="flex items-center mt-[20px] justify-center max-w-[200px] bg-indigo-500 rounded-full w-full px-[18px] py-[12px] text-white text-[20px] font-medium"
                        onClick={handleRefetch}
                    >
                        {m['notifications.checkAgain']()}
                    </button>
                </div>
            )}
            {/* <button onClick={handleFetchMore}>Fetch More</button> */}
        </div>
    );
};

export default NewNotificationsList;
