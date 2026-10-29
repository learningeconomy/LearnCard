import React, { useEffect, useMemo, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useCredentialCollection } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import PassportCredentialCard from './PassportCredentialCard';
import { groupByRelativeTime } from './activityFeed.helpers';
import * as m from '../../../paraglide/messages.js';

export const AllCredentialsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const collection = useCredentialCollection();
    const {
        records,
        isPending,
        isFetching,
        isComplete,
        isError,
        hasNextPage,
        hasNextIndexPage,
        fetchNextPage,
        retry,
    } = collection;
    const sentinelRef = useRef<HTMLDivElement>(null);
    const onScreen = useOnScreen(sentinelRef, '300px', [records.length]);

    useEffect(() => {
        if (onScreen && hasNextIndexPage && !isFetching && !isError) void fetchNextPage();
    }, [onScreen, hasNextIndexPage, isFetching, isError, fetchNextPage]);

    const groups = useMemo(
        () =>
            groupByRelativeTime(
                [...records].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
                record => record.date
            ),
        [records]
    );
    const isEmpty = isComplete && records.length === 0;

    return (
        <section className="h-full w-full bg-white flex flex-col font-poppins">
            <div className="flex items-center justify-between px-5 py-4 border-b border-grayscale-100 shrink-0">
                <h2 className="text-xl font-semibold text-grayscale-900">
                    {m['passport.activity.allCreds']()}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={m['common.close']()}
                    className="w-8 h-8 flex items-center justify-center bg-grayscale-100 hover:bg-grayscale-200 rounded-full text-grayscale-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <IonIcon icon={closeOutline} className="text-xl" />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4">
                <p
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className={`text-sm mb-4 ${isError ? 'rounded-2xl border border-red-100 bg-red-50 p-3 text-red-700' : 'text-grayscale-600'}`}
                >
                    {isError
                        ? records.length > 0
                            ? `${records.length} credentials loaded. The collection is incomplete because more credentials could not be loaded.`
                            : 'Credentials could not be loaded. Try again.'
                        : isPending
                          ? 'Loading credentials…'
                          : isEmpty
                            ? m['passport.activity.emptyAll']()
                            : isComplete
                              ? `${records.length} credentials. Collection complete.`
                              : `${records.length} credentials loaded. ${isFetching ? 'Loading more…' : 'More credentials are available.'}`}
                </p>
                {groups.map(group => (
                    <div key={group.label} className="mb-6">
                        <p className="text-[12px] tracking-[1px] text-grayscale-600 uppercase py-2">
                            {group.label}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                            {group.items.map(record => (
                                <PassportCredentialCard key={record.uri} record={record} />
                            ))}
                        </div>
                    </div>
                ))}
                <div role="presentation" ref={sentinelRef} />
                {(isError || hasNextPage) && (
                    <button
                        type="button"
                        onClick={() => {
                            if (!isFetching) void (isError ? retry() : fetchNextPage());
                        }}
                        aria-disabled={isFetching}
                        className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700 hover:bg-grayscale-10 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40"
                    >
                        {isFetching
                            ? 'Loading credentials…'
                            : isError
                              ? 'Retry loading credentials'
                              : 'Load more credentials'}
                    </button>
                )}
            </div>
        </section>
    );
};

export default AllCredentialsModal;
