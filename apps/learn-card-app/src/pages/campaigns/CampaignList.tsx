import React from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Campaign } from '@learncard/types';
import type { CampaignApi } from './types';
import { useCampaignStats } from './CampaignStats';
import { Busy, Notice, buttonClass, primaryClass } from './ui';

const CampaignRow: React.FC<{ api: CampaignApi; campaign: Campaign }> = ({ api, campaign }) => {
    const stats = useCampaignStats(api, campaign.id);
    return (
        <tr className="border-t border-grayscale-200">
            <th scope="row" className="p-3 text-left">
                <Link
                    className="underline"
                    to={`/admin/campaigns/${encodeURIComponent(campaign.id)}`}
                >
                    {campaign.name}
                </Link>
            </th>
            <td className="p-3">{campaign.status}</td>
            <td className="p-3">{campaign.channels.join(', ')}</td>
            {(['audience', 'shown', 'clicked', 'notified'] as const).map(key => (
                <td key={key} className="p-3">
                    {stats.isError
                        ? 'Unavailable'
                        : (stats.data?.[key]?.toLocaleString() ?? 'Loading...')}
                </td>
            ))}
            <td className="p-3 whitespace-nowrap">
                {new Date(campaign.updatedAt).toLocaleString()}
            </td>
        </tr>
    );
};

export const CampaignList: React.FC<{ api: CampaignApi }> = ({ api }) => {
    const list = useInfiniteQuery({
        queryKey: ['campaign-list'],
        initialPageParam: undefined as string | undefined,
        queryFn: ({ pageParam }) => api.campaignsList({ limit: 20, cursor: pageParam }),
        getNextPageParam: last => (last.hasMore ? last.cursor : undefined),
        retry: false,
    });
    return (
        <div className="space-y-5">
            <div className="flex flex-wrap justify-between gap-3 items-center">
                <h1 className="text-xl font-semibold">Campaigns</h1>
                <Link className={primaryClass} to="/admin/campaigns?create=1">
                    Create campaign
                </Link>
            </div>
            <p className="text-sm text-grayscale-600">
                Private campaign management. Audience means stored membership. Email and exact send
                counts are not available.
            </p>
            {list.isPending && <Busy>Loading campaigns...</Busy>}
            {list.isError && <Notice error>Campaigns could not be loaded. Try refreshing.</Notice>}
            <button
                type="button"
                className={buttonClass}
                disabled={list.isFetching}
                onClick={() => void list.refetch()}
            >
                {list.isFetching ? <Busy>Refreshing campaigns...</Busy> : 'Refresh campaigns'}
            </button>
            {list.data?.pages[0]?.records.length === 0 && (
                <p>No campaigns yet. Create a draft to get started.</p>
            )}
            {list.data && (
                <div className="overflow-x-auto rounded-[20px] border border-grayscale-200 bg-white">
                    <table className="w-full text-sm">
                        <caption className="sr-only">
                            Campaigns and current membership and engagement stats
                        </caption>
                        <thead>
                            <tr>
                                {[
                                    'Name',
                                    'Status',
                                    'Channels',
                                    'Stored members',
                                    'Shown',
                                    'Clicked',
                                    'Notified (inbox)',
                                    'Updated',
                                ].map(label => (
                                    <th
                                        scope="col"
                                        key={label}
                                        className="p-3 text-left text-grayscale-700"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {list.data.pages
                                .flatMap(page => page.records)
                                .map(campaign => (
                                    <CampaignRow key={campaign.id} campaign={campaign} api={api} />
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
            {list.hasNextPage && (
                <button
                    type="button"
                    className={buttonClass}
                    disabled={list.isFetching}
                    onClick={() => void list.fetchNextPage()}
                >
                    {list.isFetchingNextPage ? (
                        <Busy>Loading more campaigns...</Busy>
                    ) : (
                        'Load more campaigns'
                    )}
                </button>
            )}
        </div>
    );
};
