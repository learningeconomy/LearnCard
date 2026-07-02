import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { useGetCurrentLCNUser } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { usePassportActivities } from './usePassportActivities';
import {
    toActivityFeedVM,
    groupActivitiesByMonth,
    type ActivityFilterId,
} from './activityFeed.helpers';
import { ActivityFeedItem } from './ActivityFeedItem';
import { ActivityFilterPopover } from './ActivityFilterPopover';

export const PassportActivityFeed: React.FC = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const myProfileId = currentLCNUser?.profileId;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ActivityFilterId>('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const { data, isPending, isError, isFetching, hasNextPage, fetchNextPage } =
        usePassportActivities();

    const onScreen = useOnScreen(sentinelRef as any, '300px', [data?.pages?.length]);
    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [onScreen, hasNextPage, fetchNextPage]);

    const groups = useMemo(() => {
        const records = data?.pages?.flatMap(p => p?.records ?? []) ?? [];
        let vms = records.map(r => toActivityFeedVM(r, myProfileId));
        if (filter !== 'all') vms = vms.filter(vm => vm.category === filter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            vms = vms.filter(
                vm =>
                    vm.title.toLowerCase().includes(q) ||
                    (vm.credentialType ?? '').toLowerCase().includes(q)
            );
        }
        return groupActivitiesByMonth(vms);
    }, [data, myProfileId, filter, search]);

    const isEmpty = !isPending && !isError && groups.length === 0;

    return (
        <section className="w-full max-w-[600px] mx-auto mt-[24px]">
            <h3 className="font-poppins text-[13px] tracking-[1px] text-grayscale-500 mb-[10px]">
                ACTIVITY
            </h3>
            <div className="flex items-center gap-2 mb-3 relative">
                <input
                    type="search"
                    aria-label="Search activity"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 rounded-full border border-grayscale-300 px-4 py-2 font-poppins text-[14px]"
                />
                <button
                    type="button"
                    onClick={() => setFilterOpen(o => !o)}
                    className="rounded-[10px] border border-grayscale-300 px-3 py-2 font-poppins text-[14px]"
                >
                    Filter
                </button>
                {/* TODO(LC-1919 polish): close popover on outside-click / Escape. */}
                {filterOpen && (
                    <div className="absolute right-0 top-[110%] z-10">
                        <ActivityFilterPopover
                            selected={filter}
                            onApply={id => {
                                setFilter(id);
                                setFilterOpen(false);
                            }}
                            onReset={() => {
                                setFilter('all');
                                setFilterOpen(false);
                            }}
                        />
                    </div>
                )}
            </div>
            {isError && (
                <p className="font-poppins text-[14px] text-rose-600 py-6 text-center">
                    Something went wrong — we couldn’t load your activity.
                </p>
            )}
            {isPending && (
                <div className="flex justify-center py-8">
                    <IonSpinner name="lines" />
                </div>
            )}
            {isEmpty && (
                <p className="font-poppins text-[14px] text-grayscale-500 py-8 text-center">
                    No activity yet.
                </p>
            )}
            {groups.map(group => (
                <div key={group.label} className="mb-2">
                    <p className="font-poppins text-[12px] tracking-[1px] text-grayscale-400 py-2">
                        {group.label}
                    </p>
                    <ol className="flex flex-col">
                        {group.items.map(item => (
                            <ActivityFeedItem key={item.id} item={item} />
                        ))}
                    </ol>
                </div>
            ))}
            <div role="presentation" ref={sentinelRef} />
            {isFetching && !isPending && (
                <div className="flex justify-center py-4">
                    <IonSpinner name="lines" />
                </div>
            )}
        </section>
    );
};

export default PassportActivityFeed;
