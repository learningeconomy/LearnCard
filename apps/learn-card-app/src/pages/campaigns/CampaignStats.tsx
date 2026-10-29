import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CampaignApi } from './types';
import { Busy, Notice, buttonClass, panelClass } from './ui';

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
            <h2 className="text-xl font-semibold">Campaign stats</h2>
            <p className="text-sm text-grayscale-600">
                Refreshes every 30 seconds while this page is active. Membership is not an exact
                send count; notified means inbox storage acknowledged, not push receipt.
            </p>
            {stats.isPending && <Busy>Loading stats...</Busy>}
            {stats.isError && (
                <Notice error>
                    Stats could not be refreshed. Previously displayed values may be out of date.
                </Notice>
            )}
            {stats.data && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(stats.data).map(([key, value]) => (
                        <div key={key}>
                            <dt className="text-xs text-grayscale-600">
                                {key === 'audience'
                                    ? 'Stored members'
                                    : key === 'notified'
                                      ? 'Notified (inbox)'
                                      : key}
                            </dt>
                            <dd className="text-xl font-semibold">{value.toLocaleString()}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <button
                type="button"
                className={buttonClass}
                disabled={stats.isFetching}
                onClick={() => void stats.refetch()}
            >
                {stats.isFetching ? <Busy>Refreshing stats...</Busy> : 'Refresh stats'}
            </button>
        </section>
    );
};
