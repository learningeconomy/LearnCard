import React, { useMemo } from 'react';
import { useCredentialCollection, useModal, ModalTypes } from 'learn-card-base';
import PassportCredentialCard from './PassportCredentialCard';
import { AllCredentialsModal } from './AllCredentialsModal';
import * as m from '../../../paraglide/messages.js';

const MAX_ITEMS = 5;

export const RecentlyAdded: React.FC = () => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const collection = useCredentialCollection(undefined, { mode: 'recent', limit: MAX_ITEMS });
    const items = useMemo(
        () =>
            [...collection.records]
                .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
                .slice(0, MAX_ITEMS),
        [collection.records]
    );
    const loadingMore = !collection.isComplete && items.length < MAX_ITEMS;

    const openSeeAll = () =>
        newModal(<AllCredentialsModal onClose={closeModal} />, {
            hideButton: true,
            sectionClassName: 'max-w-[760px]!',
        });

    return (
        <section className="mb-[24px]" aria-label={m['passport.activity.recent']()}>
            <div className="flex items-center justify-between mb-[10px]">
                <h2 className="font-poppins text-[13px] tracking-[1px] text-grayscale-800">
                    {m['passport.activity.recent']()}
                </h2>
                <button
                    type="button"
                    onClick={openSeeAll}
                    className="font-poppins text-[13px] font-medium text-grayscale-800 hover:text-grayscale-900 transition-colors rounded-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {m['passport.activity.seeAll']()}
                </button>
            </div>
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden md:mx-0 md:gap-2 md:overflow-visible md:px-0 md:flex-wrap">
                {items.map(record => (
                    <PassportCredentialCard
                        key={record.uri}
                        record={record}
                        className="shrink-0 snap-start"
                    />
                ))}
            </div>
            <p
                role="status"
                aria-live="polite"
                className={`text-sm mt-2 ${collection.isError ? 'rounded-2xl border border-red-100 bg-red-50 p-3 text-red-700' : 'text-grayscale-600'}`}
            >
                {collection.isError
                    ? items.length > 0
                        ? 'Some recent credentials could not be loaded. These results are incomplete.'
                        : 'Recent credentials could not be loaded.'
                    : loadingMore
                      ? 'Loading recent credentials…'
                      : items.length === 0
                        ? m['passport.activity.emptyAll']()
                        : ''}
            </p>
            {collection.isError && (
                <button
                    type="button"
                    onClick={() => {
                        if (!collection.isFetching) void collection.retry();
                    }}
                    aria-disabled={collection.isFetching}
                    className="mt-2 py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40"
                >
                    {collection.isFetching ? 'Retrying…' : 'Retry recent credentials'}
                </button>
            )}
        </section>
    );
};

export default RecentlyAdded;
