import React, { useEffect, useRef } from 'react';

import { useModal } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { useGetPaginatedManagedBoosts } from 'learn-card-base';

import BulkParentSelectorCredentialItem from './BulkParentSelectorCredentialItem';
import { BoostSkeleton } from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';

import { ignoredCategories } from './BulkParentSelectorModal';
import { BoostCategoryOptionsEnum } from '../../../../components/boost/boost-options/boostOptions';
import { Boost } from '@learncard/types';

type BulkParentSelectorCredentialListProps = {
    category: BoostCategoryOptionsEnum;
    setParentUri: React.Dispatch<React.SetStateAction<string>>;
    parentUri?: string;
    searchInput?: string;
};

const BulkParentSelectorCredentialList: React.FC<BulkParentSelectorCredentialListProps> = ({
    category,
    setParentUri,
    parentUri,
    searchInput,
}) => {
    if (ignoredCategories.includes(category)) return <></>;

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

    const filteredManagedBoosts = managedBoosts?.pages?.flatMap(page =>
        page?.records?.filter(record =>
            record.name.toLowerCase().includes(searchInput?.toLowerCase() || '')
        )
    );

    return (
        <section className="flex flex-col gap-[10px] w-full">
            {filteredManagedBoosts?.map((record: Boost) => {
                return (
                    <BulkParentSelectorCredentialItem
                        key={record.uri}
                        category={category}
                        boost={record}
                        setParentUri={setParentUri}
                        parentUri={parentUri}
                    />
                );
            })}

            {isLoading && <BoostSkeleton containerClassName="w-full h-[46px] rounded-[10px]" />}
            <div role="presentation" ref={managedBoostInfiniteScrollRef} />
        </section>
    );
};

export default BulkParentSelectorCredentialList;
