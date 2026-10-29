import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { addOutline, refreshOutline, chevronForwardOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Campaign, CampaignStatus } from '@learncard/types';
import type { CampaignApi } from './types';
import { useCampaignStats } from './CampaignStats';
import {
    Busy,
    CampaignMark,
    Notice,
    StatusPill,
    buttonClass,
    primaryClass,
    textButtonClass,
} from './ui';

const metrics = [
    ['audience', 'Stored members'],
    ['shown', 'Shown'],
    ['clicked', 'Clicked'],
    ['notified', 'Notified (inbox)'],
] as const;

const CampaignRow: React.FC<{ api: CampaignApi; campaign: Campaign }> = ({ api, campaign }) => {
    const stats = useCampaignStats(api, campaign.id);
    return (
        <tr className="grid grid-cols-2 gap-y-4 border-t border-grayscale-200 p-5 transition-colors hover:bg-grayscale-10 min-[1200px]:table-row min-[1200px]:p-0">
            <th
                scope="row"
                className="col-span-2 text-left min-[1200px]:py-5 min-[1200px]:pl-6 min-[1200px]:pr-3"
            >
                <Link
                    className="group inline-flex items-center gap-3 text-sm font-semibold text-grayscale-900 focus-visible:outline-emerald-600"
                    to={`/admin/campaigns/${encodeURIComponent(campaign.id)}`}
                >
                    {campaign.name}
                    <IonIcon
                        icon={chevronForwardOutline}
                        className="shrink-0 text-grayscale-400 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                    />
                </Link>
            </th>
            <td className="min-[1200px]:px-3 min-[1200px]:py-5">
                <StatusPill status={campaign.status} />
            </td>
            <td className="text-xs text-grayscale-600 min-[1200px]:px-3 min-[1200px]:py-5">
                <div className="flex flex-wrap gap-1.5">
                    {campaign.channels.map(channel => (
                        <span
                            key={channel}
                            className="rounded-md bg-grayscale-100 px-2 py-1 whitespace-nowrap"
                        >
                            {channel === 'inApp' ? 'In-app' : 'Inbox + push'}
                        </span>
                    ))}
                </div>
            </td>
            {metrics.map(([key, label]) => (
                <td key={key} className="text-sm tabular-nums min-[1200px]:px-3 min-[1200px]:py-5">
                    <span className="mb-1 block text-xs text-grayscale-600 min-[1200px]:hidden">
                        {label}
                    </span>
                    {stats.isError ? (
                        <span className="text-xs text-grayscale-600">Unavailable</span>
                    ) : stats.data ? (
                        stats.data[key].toLocaleString()
                    ) : (
                        <span className="text-grayscale-400" aria-label="Loading stats">
                            —
                        </span>
                    )}
                </td>
            ))}
            <td className="col-span-2 text-xs text-grayscale-600 min-[1200px]:py-5 min-[1200px]:pl-3 min-[1200px]:pr-6">
                <time
                    dateTime={campaign.updatedAt}
                    title={new Date(campaign.updatedAt).toLocaleString()}
                >
                    {new Date(campaign.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </time>
            </td>
        </tr>
    );
};

export const CampaignList: React.FC<{ api: CampaignApi }> = ({ api }) => {
    const [status, setStatus] = useState<CampaignStatus>();
    const list = useInfiniteQuery({
        queryKey: ['campaign-list', status ?? 'all'],
        initialPageParam: undefined as string | undefined,
        queryFn: ({ pageParam }) =>
            api.campaignsList({ limit: 20, cursor: pageParam, ...(status ? { status } : {}) }),
        getNextPageParam: last => (last.hasMore ? last.cursor : undefined),
        retry: false,
    });
    const campaigns = list.data?.pages.flatMap(page => page.records) ?? [];
    return (
        <div className="space-y-8">
            <header className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                    <CampaignMark />
                    <div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-grayscale-600">
                            Campaign studio
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
                    </div>
                </div>
                <Link className={primaryClass} to="/admin/campaigns?create=1">
                    <IonIcon icon={addOutline} className="text-lg" aria-hidden="true" />
                    Create campaign
                </Link>
            </header>
            <div className="rounded-[20px] border border-grayscale-200 bg-white px-6 py-6 sm:px-8">
                <div className="flex items-start gap-5">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-semibold">
                            A thoughtful message. The right audience.
                        </h2>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-grayscale-600">
                            Create a message, choose your audience, and try it yourself before going
                            live.
                        </p>
                    </div>
                    <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:block">
                        Private workspace
                    </span>
                </div>
            </div>
            <section className="space-y-4" aria-label="Campaign collection">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div
                        className="flex flex-wrap gap-1.5"
                        role="group"
                        aria-label="Filter campaigns by status"
                    >
                        {([undefined, 'draft', 'live', 'paused', 'archived'] as const).map(
                            value => (
                                <button
                                    key={value ?? 'all'}
                                    type="button"
                                    aria-pressed={status === value}
                                    onClick={() => setStatus(value)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-emerald-600 ${status === value ? 'bg-grayscale-900 text-white' : 'bg-grayscale-100 text-grayscale-600 hover:bg-grayscale-200'}`}
                                >
                                    {value
                                        ? value.charAt(0).toUpperCase() + value.slice(1)
                                        : 'All campaigns'}
                                </button>
                            )
                        )}
                    </div>
                    <button
                        type="button"
                        className={textButtonClass}
                        disabled={list.isFetching}
                        onClick={() => void list.refetch()}
                    >
                        {list.isFetching ? (
                            <Busy>Refreshing campaigns...</Busy>
                        ) : (
                            <>
                                <IonIcon icon={refreshOutline} aria-hidden="true" />
                                Refresh campaigns
                            </>
                        )}
                    </button>
                </div>
                {list.isError && (
                    <Notice error>Campaigns could not be loaded. Try refreshing.</Notice>
                )}
                {list.isPending && (
                    <div className="rounded-[20px] border border-grayscale-200 bg-white p-10 text-center text-sm text-grayscale-600">
                        <Busy>Loading campaigns...</Busy>
                    </div>
                )}
                {list.data && campaigns.length === 0 && (
                    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-grayscale-300 bg-white px-6 py-16 text-center">
                        <CampaignMark />
                        <h2 className="mt-5 text-xl font-semibold">
                            {status ? `No ${status} campaigns` : 'Your first campaign starts here'}
                        </h2>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-grayscale-600">
                            {status
                                ? 'Choose another status or start a new draft.'
                                : 'Bring your message to life, then send yourself a test.'}
                        </p>
                        <Link className={`${buttonClass} mt-6`} to="/admin/campaigns?create=1">
                            Create a draft
                        </Link>
                    </div>
                )}
                {campaigns.length > 0 && (
                    <div className="overflow-hidden rounded-[20px] border border-grayscale-200 bg-white">
                        <table className="block w-full text-sm min-[1200px]:table">
                            <caption className="sr-only">
                                Campaigns and current membership and engagement stats
                            </caption>
                            <thead className="hidden bg-grayscale-100 min-[1200px]:table-header-group">
                                <tr>
                                    {[
                                        'Name',
                                        'Status',
                                        'Channels',
                                        ...metrics.map(([, label]) => label),
                                        'Updated',
                                    ].map(label => (
                                        <th
                                            scope="col"
                                            key={label}
                                            className="px-3 py-3.5 text-left text-xs font-medium text-grayscale-600 first:pl-6 last:pr-6"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="block min-[1200px]:table-row-group">
                                {campaigns.map(campaign => (
                                    <CampaignRow key={campaign.id} campaign={campaign} api={api} />
                                ))}
                            </tbody>
                        </table>
                        <div className="border-t border-grayscale-200 px-6 py-4 text-xs leading-relaxed text-grayscale-600">
                            Notified counts inbox storage acknowledgements. Stored members are not
                            an exact send count.
                        </div>
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
            </section>
        </div>
    );
};
