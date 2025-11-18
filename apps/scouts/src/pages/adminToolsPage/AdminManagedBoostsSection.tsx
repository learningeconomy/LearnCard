import React, { useEffect, useRef } from 'react';

import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { useGetPaginatedManagedBoosts } from 'learn-card-base';

import { IonSpinner } from '@ionic/react';

import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
} from '../../components/boost/boost-options/boostOptions';
import AdminManagedBoostRow from './AdminManagedBoostRow';

type AdminManagedBoostsSectionProps = {
    category: BoostCategoryOptionsEnum;
};

const AdminManagedBoostsSection: React.FC<AdminManagedBoostsSectionProps> = ({ category }) => {
    const {
        data: managedBoosts,
        isLoading: managedBoostsLoading,
        isFetching: managedBoostsFetching,
        hasNextPage: managedBoostsHasNextPage,
        fetchNextPage: managedBoostsFetchNextPage,
    } = useGetPaginatedManagedBoosts(category, { limit: 12 });

    const managedBoostInfiniteScrollRef = useRef<HTMLDivElement>(null);
    const managedBoostsOnScreen = useOnScreen(managedBoostInfiniteScrollRef as any, '-20px', [
        managedBoosts?.pages?.[0]?.records?.length,
    ]);

    useEffect(() => {
        if (managedBoostsOnScreen && managedBoostsHasNextPage) managedBoostsFetchNextPage();
    }, [
        managedBoostsFetchNextPage,
        managedBoostsHasNextPage,
        managedBoostsOnScreen,
        managedBoostInfiniteScrollRef,
    ]);

    const isLoading = managedBoostsLoading || managedBoostsFetching;

    const { title, color, IconComponent } = boostCategoryOptions[category];

    return (
        <div className="min-w-[400px]">
            <h2 className={`flex gap-[10px] items-center mb-[10px] text-${color} text-[22px]`}>
                <IconComponent className="h-[36px] w-[36px]" />
                {title}
            </h2>

            <div className="flex flex-col gap-[10px] pl-[15px]">
                {managedBoosts?.pages?.flatMap(page =>
                    page?.records
                        // ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                        ?.map((record, index) => {
                            return (
                                <AdminManagedBoostRow
                                    key={record.uri}
                                    category={category}
                                    boost={record}
                                />
                            );
                        })
                )}
                {isLoading && <IonSpinner color="dark" />}
                <div role="presentation" ref={managedBoostInfiniteScrollRef} />
            </div>
        </div>
    );
};

export default AdminManagedBoostsSection;
