import React, { useMemo } from 'react';
import { useGetCredentialList, useModal, ModalTypes } from 'learn-card-base';
import PassportCredentialCard, { ActivityIndexRecord } from './PassportCredentialCard';
import { AllCredentialsModal } from './AllCredentialsModal';
import { isHiddenActivity } from './activityFeed.helpers';
import * as m from '../../../paraglide/messages.js';

const MAX_ITEMS = 5;

export const RecentlyAdded: React.FC = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { data } = useGetCredentialList(undefined);

    const openSeeAll = () =>
        newModal(<AllCredentialsModal onClose={closeModal} />, {
            hideButton: true,
            sectionClassName: '!max-w-[760px]',
        });

    const items = useMemo(() => {
        const records = (data?.pages?.flatMap(p => p?.records ?? []) ??
            []) as ActivityIndexRecord[];
        return records
            .filter(r => r?.uri && !isHiddenActivity(r.category))
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
            .slice(0, MAX_ITEMS);
    }, [data]);

    if (items.length === 0) return null;

    return (
        <section className="mb-[24px]">
            <div className="flex items-center justify-between mb-[10px]">
                <h2 className="font-poppins text-[13px] tracking-[1px] text-grayscale-800">
                    {m['passport.activity.recent']()}
                </h2>
                <button
                    type="button"
                    onClick={openSeeAll}
                    className="font-poppins text-[13px] font-medium text-grayscale-800 hover:text-grayscale-900 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {m['passport.activity.seeAll']()}
                </button>
            </div>
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:gap-2 md:overflow-visible md:px-0 md:flex-wrap">
                {items.map(record => (
                    <PassportCredentialCard
                        key={record.uri}
                        record={record}
                        className="shrink-0 snap-start"
                    />
                ))}
            </div>
        </section>
    );
};

export default RecentlyAdded;
