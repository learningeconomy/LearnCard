import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { useGetCurrentLCNUser } from 'learn-card-base';
import Search from 'learn-card-base/svgs/Search';
import SortButton from 'learn-card-base/svgs/SortButton';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { usePassportActivities } from './usePassportActivities';
import {
    toActivityFeedVM,
    groupActivitiesByMonth,
    isHiddenActivity,
    type ActivityFilterId,
    type ActivityFeedItemVM,
} from './activityFeed.helpers';
import { ActivityFeedItem } from './ActivityFeedItem';
import { ActivityFilterPopover } from './ActivityFilterPopover';
import { ActivityDetailOverlay } from './ActivityDetailOverlay';

export const PassportActivityFeed: React.FC = () => {
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();
    const myProfileId = currentLCNUser?.profileId;
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ActivityFilterId>('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const [selected, setSelected] = useState<ActivityFeedItemVM | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const { data, isPending, isError, isFetching, hasNextPage, fetchNextPage } =
        usePassportActivities();

    const onScreen = useOnScreen(sentinelRef as any, '300px', [data?.pages?.length]);
    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage();
    }, [onScreen, hasNextPage, fetchNextPage]);

    const groups = useMemo(() => {
        const records = data?.pages?.flatMap(p => p?.records ?? []) ?? [];
        let vms = records
            .filter(r => !isHiddenActivity(r?.boost?.category))
            .map(r => toActivityFeedVM(r, myProfileId));
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

    // Item direction (sent/received) depends on myProfileId. Until the profile
    // resolves, toActivityFeedVM falls back to 'sent' for everything, so
    // rendering early flashes received items with the wrong title. Treat the
    // profile still loading as part of the pending state and hold the rows.
    const waiting = isPending || currentLCNUserLoading;
    const isEmpty = !waiting && !isError && groups.length === 0;

    return (
        <section className="w-full max-w-[840px] mx-auto mt-[24px]">
            <h3 className="font-poppins text-[13px] tracking-[1px] text-grayscale-500 mb-[10px]">
                ACTIVITY
            </h3>
            <div className="bg-white rounded-[20px] border border-grayscale-200 shadow-sm px-[16px] pt-[16px] pb-[8px]">
                <div className="flex items-center gap-2 mb-4 relative">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-grayscale-500" />
                        <input
                            type="search"
                            aria-label="Search activity"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full rounded-[12px] bg-grayscale-100 py-[10px] pl-11 pr-4 font-poppins text-[14px] text-grayscale-800 placeholder:text-grayscale-500 focus:outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setFilterOpen(o => !o)}
                        className="flex items-center gap-2 rounded-[12px] bg-[#EEEEFB] px-4 py-[10px] font-poppins text-[14px] font-medium uppercase tracking-[0.5px] text-[#5457C7]"
                    >
                        Filter
                        <SortButton className="h-[18px] w-[18px]" />
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

                {/* Min-height keeps the card a consistent size with only a few
                    items; empty/loading/error states center within it. */}
                <div className="min-h-[400px] flex flex-col border-t border-grayscale-100 pt-[8px] pb-[12px]">
                    {isError && (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="font-poppins text-[14px] text-rose-600 text-center">
                                Something went wrong — we couldn’t load your activity.
                            </p>
                        </div>
                    )}
                    {waiting && (
                        <div className="flex-1 flex items-center justify-center">
                            <IonSpinner name="lines" />
                        </div>
                    )}
                    {isEmpty && (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="font-poppins text-[14px] text-grayscale-500 text-center">
                                No activity yet.
                            </p>
                        </div>
                    )}
                    {!waiting &&
                        groups.map(group => (
                            <div key={group.label} className="mb-2">
                                <p className="font-poppins text-[12px] tracking-[1px] text-grayscale-400 py-2">
                                    {group.label}
                                </p>
                                <ol className="flex flex-col">
                                    {group.items.map(item => (
                                        <ActivityFeedItem
                                            key={item.id}
                                            item={item}
                                            onSelect={setSelected}
                                        />
                                    ))}
                                </ol>
                            </div>
                        ))}
                    <div role="presentation" ref={sentinelRef} />
                    {isFetching && !waiting && (
                        <div className="flex justify-center py-4">
                            <IonSpinner name="lines" />
                        </div>
                    )}
                </div>
            </div>
            {selected && (
                <ActivityDetailOverlay item={selected} onClose={() => setSelected(null)} />
            )}
        </section>
    );
};

export default PassportActivityFeed;
