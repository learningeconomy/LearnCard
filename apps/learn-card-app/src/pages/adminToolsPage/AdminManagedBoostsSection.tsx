import React, { useEffect, useRef } from 'react';

import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import {
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
    CredentialCategory,
    useGetPaginatedManagedBoosts,
} from 'learn-card-base';

import { IonSpinner } from '@ionic/react';
import AdminManagedBoostRow from './AdminManagedBoostRow';
import { Boost } from '@learncard/types';

const ignoredCategories = [
    BoostCategoryOptionsEnum.currency, // not implemented
    BoostCategoryOptionsEnum.describe, // not implemented
    BoostCategoryOptionsEnum.skill, // not a real boost type
    BoostCategoryOptionsEnum.job, // covered by workHistory
    BoostCategoryOptionsEnum.membership, // covered by IDs
    BoostCategoryOptionsEnum.course, // covered by learningHistory
    BoostCategoryOptionsEnum.all,
];

type AdminManagedBoostsSectionProps = {
    category: BoostCategoryOptionsEnum;
    actionButtonOverride?: { text: string; onClick: (boost: Boost) => void };

    selectModeOptions?: {
        selectedUris: string[];
        handleAdd: (uri: string) => void;
        handleRemove: (uri: string) => void;
    };
};

const AdminManagedBoostsSection: React.FC<AdminManagedBoostsSectionProps> = ({
    category,
    actionButtonOverride,
    selectModeOptions,
}) => {
    if (ignoredCategories.includes(category)) return <></>;

    const {
        data: managedBoosts,
        isLoading: managedBoostsLoading,
        isFetching: managedBoostsFetching,
        hasNextPage: managedBoostsHasNextPage,
        fetchNextPage: managedBoostsFetchNextPage,
    } = useGetPaginatedManagedBoosts(
        boostCategoryMetadata[category].credentialType as CredentialCategory,
        { limit: 12 }
    );

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

    const { title, color, IconComponent } = boostCategoryMetadata[category];

    return (
        <div className="w-full">
            <h2 className={`flex gap-[10px] items-center mb-[10px] text-${color} text-[22px]`}>
                <IconComponent className="h-[36px] w-[36px]" />
                {title}
            </h2>

            <div className="flex flex-col gap-[10px]">
                {managedBoosts?.pages?.flatMap(page =>
                    page?.records
                        // ?.filter?.(record => searchResults.find(cred => cred.uri === record?.uri))
                        ?.map((record, index) => {
                            return (
                                <AdminManagedBoostRow
                                    key={record.uri}
                                    category={category}
                                    boost={record}
                                    actionButtonOverride={actionButtonOverride}
                                    selectModeOptions={selectModeOptions}
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
