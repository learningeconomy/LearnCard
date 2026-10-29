import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CampaignApi } from './types';
import { Busy, Notice, textButtonClass, panelClass, SectionHeading } from './ui';

export const useCampaignStats = (api: CampaignApi, id: string) =>
    useQuery({
        queryKey: ['campaign-stats', id],
        queryFn: () => api.campaignsGetStats(id),
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
        retry: false,
    });

export const CampaignStatsPanel: React.FC<{ api: CampaignApi; id: string }> = ({ api, id }) => {
    const stats = useCampaignStats(api, id);
    return (
        <section className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeading
                    title="Campaign stats"
                    description="See how your audience engages with this campaign."
                />
                <span className="inline-flex items-center gap-2 text-xs text-grayscale-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Refreshes every 30 seconds
                </span>
            </div>
            {stats.isPending && <Busy>Loading stats...</Busy>}
            {stats.isError && (
                <Notice error>
                    Stats could not be refreshed. Previously displayed values may be out of date.
                </Notice>
            )}
            {stats.data && (
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                    {Object.entries(stats.data).map(([key, value]) => (
                        <div
                            key={key}
                            className="rounded-2xl bg-grayscale-10 p-4 border border-grayscale-100"
                        >
                            <dt className="text-xs text-grayscale-600 capitalize">
                                {key === 'audience'
                                    ? 'Stored members'
                                    : key === 'notified'
                                      ? 'Notified (inbox)'
                                      : key}
                            </dt>
                            <dd className="mt-2 text-2xl font-semibold tabular-nums">
                                {value.toLocaleString()}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
            <p className="text-xs leading-relaxed text-grayscale-500">
                Stored members are not an exact send count. Notified counts inbox storage
                acknowledgements, not device receipt.
            </p>
            <button
                type="button"
                className={textButtonClass}
                disabled={stats.isFetching}
                onClick={() => void stats.refetch()}
            >
                {stats.isFetching ? <Busy>Refreshing stats...</Busy> : 'Refresh stats'}
            </button>
        </section>
    );
};
