import React, { useEffect } from 'react';

import { useLoadingLine } from 'apps/learn-card-app/src/stores/loadingStore';
import { useGetUserNotifications } from 'learn-card-base';

import { IonSpinner } from '@ionic/react';
import ArrowCircle from 'learn-card-base/svgs/ArrowCircle';
import GenericErrorBoundary from '../../generic/GenericErrorBoundary';
import NotificationCardContainer from './NotificationCardContainer';
import GroupedConsentFlowCard from './GroupedConsentFlowCard';
import { buildNotificationListItems } from './consentFlowGrouping';

import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';
import { ColorSetEnum } from '../../../theme/colors/index';

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
    const { getIconSet, getColorSet } = useTheme();
    const { telescope: TelescopeIcon } = getIconSet(IconSetEnum.placeholders);
    const colorSet = getColorSet(ColorSetEnum.defaults);

    const primaryColor = colorSet.primaryColor;

    const { data, isLoading, refetch, isFetching } = useGetUserNotifications(options, filter);

    useEffect(() => {
        if (!isLoading && data) {
            const isEmptyState = data?.pages?.[0]?.notifications?.length === 0;
            setIsEmptyState(isEmptyState);
        }
    }, [data, isLoading, setIsEmptyState]);

    useLoadingLine(isLoading || isFetching);

    const queryOptions = { options, filter };

    const flatNotifications: NotificationType[] =
        data?.pages?.flatMap(group => group?.notifications ?? []) ?? [];

    const listItems = buildNotificationListItems(flatNotifications);

    const renderNotifications = listItems.map(item => {
        if (item.kind === 'consentGroup') {
            return (
                <GenericErrorBoundary key={`group-${item.key}`}>
                    <GroupedConsentFlowCard notifications={item.notifications} />
                </GenericErrorBoundary>
            );
        }

        return (
            <GenericErrorBoundary key={item.notification?._id}>
                <NotificationCardContainer
                    queryOptions={queryOptions}
                    notification={item.notification}
                />
            </GenericErrorBoundary>
        );
    });

    const handleRefetch = () => refetch();

    // Gate the full-screen spinner on the INITIAL load only. Including
    // `isRefetching` here tore the whole list down and rebuilt it on every
    // background refetch — that caused the constant flashing and remounted each
    // card (wiping local accepted state). Background refetches now surface only
    // via the subtle top loading line (useLoadingLine above).
    const notificationsLoading = isLoading;

    return (
        <div className="m-auto max-w-[600px] h-full bg-white">
            {notificationsLoading && !isEmptyState && (
                <div className="min-w-[300px] min-h-[300px] h-full w-full relative flex flex-col items-center justify-center">
                    <IonSpinner name="crescent" color="grayscale-900" className="scale-[4] mb-8" />
                    <p className="flex items-center justify-center text-left text-grayscale-900 font-medium text-sm line-clamp-1 mt-8">
                        Loading Notifications...
                    </p>
                </div>
            )}
            {!notificationsLoading && !isEmptyState && renderNotifications}
            {isEmptyState && !notificationsLoading && (
                <div className="p-[20px] flex flex-col justify-center items-center w-full h-full">
                    <TelescopeIcon className="w-[150px] h-[130px]" />
                    <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                        No alerts found.
                    </p>
                    <button
                        className={`font-poppins flex items-center mt-[20px] justify-center max-w-[200px] bg-${primaryColor} rounded-full w-full font-semibold px-[18px] py-[12px] text-white text-[18px] shadow-button-bottom`}
                        onClick={handleRefetch}
                    >
                        Refresh <ArrowCircle className="w-[20px] h-[20px] ml-2 text-white" />
                    </button>
                </div>
            )}
            {/* <button onClick={handleFetchMore}>Fetch More</button> */}
        </div>
    );
};

export default NewNotificationsList;
