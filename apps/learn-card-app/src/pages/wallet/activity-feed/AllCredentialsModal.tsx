import React, { useEffect, useMemo, useRef } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useGetCredentialList, categoryMetadata, CredentialCategoryEnum } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import {
    resolveActivityCategory,
    isHiddenActivity,
    groupByRelativeTime,
} from './activityFeed.helpers';

type IndexRecord = {
    id?: string;
    uri: string;
    category?: string;
    title?: string;
    date?: string;
    imgUrl?: string;
};

export const AllCredentialsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { data, isPending, isFetching, hasNextPage, fetchNextPage } =
        useGetCredentialList(undefined);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const onScreen = useOnScreen(sentinelRef as any, '300px', [data?.pages?.length]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [onScreen, hasNextPage, fetchNextPage]);

    const groups = useMemo(() => {
        const records = (data?.pages?.flatMap(p => p?.records ?? []) ?? []) as IndexRecord[];
        const visible = records
            .filter(r => r?.uri && !isHiddenActivity(r.category))
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
        return groupByRelativeTime(visible, r => r.date);
    }, [data]);

    const isEmpty = !isPending && groups.length === 0;

    return (
        <section className="h-full w-full bg-white flex flex-col font-poppins">
            <div className="flex items-center justify-between px-5 py-4 border-b border-grayscale-100 shrink-0">
                <h2 className="text-xl font-semibold text-grayscale-900">All credentials</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 flex items-center justify-center bg-grayscale-100 hover:bg-grayscale-200 rounded-full text-grayscale-700 transition-colors"
                >
                    <IonIcon icon={closeOutline} className="text-xl" />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4">
                {isPending && (
                    <div className="h-full flex items-center justify-center">
                        <IonSpinner name="lines" />
                    </div>
                )}
                {isEmpty && (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-grayscale-500">Nothing in your passport yet.</p>
                    </div>
                )}
                {groups.map(group => (
                    <div key={group.label} className="mb-6">
                        <p className="text-[12px] tracking-[1px] text-grayscale-400 uppercase py-2">
                            {group.label}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                            {group.items.map(record => {
                                const category = resolveActivityCategory(record.category);
                                return (
                                    <BoostEarnedCard
                                        key={record.uri}
                                        record={record}
                                        categoryType={category}
                                        defaultImg={
                                            categoryMetadata[category as CredentialCategoryEnum]
                                                ?.defaultImageSrc
                                        }
                                        useWrapper={false}
                                        hideOptionsMenu
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
                <div role="presentation" ref={sentinelRef} />
                {isFetching && !isPending && (
                    <div className="flex justify-center py-4">
                        <IonSpinner name="lines" />
                    </div>
                )}
            </div>
        </section>
    );
};

export default AllCredentialsModal;
