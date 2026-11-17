import React from 'react';

import { useHcpActivity, useHcpGrants } from 'learn-card-base/hcp/useHcp';
import * as m from '../../paraglide/messages.js';
import { activitySentence, appNames } from './hcpModel';
import { formatWhen, HcpEmpty, HcpError, HcpLoading } from './HcpStates';

const ActivitySection: React.FC = () => {
    const activity = useHcpActivity();
    const active = useHcpGrants('active');
    const revoked = useHcpGrants('revoked');
    const expired = useHcpGrants('expired');

    if (activity.isPending) return <HcpLoading />;
    if (activity.isError) return <HcpError onRetry={() => void activity.refetch()} />;

    const events = activity.data.pages.flatMap(page => page.events);
    if (events.length === 0)
        return (
            <HcpEmpty title={m['hcp.activity.emptyTitle']()} body={m['hcp.activity.emptyBody']()} />
        );

    const names = appNames(
        [...(active.data ?? []), ...(revoked.data ?? []), ...(expired.data ?? [])],
        events
    );

    return (
        <div className="space-y-3">
            <ul className="bg-white rounded-2xl px-4 border border-grayscale-200">
                {events.map(event => (
                    <li
                        key={event.eventId}
                        className="py-3 border-b border-grayscale-200 last:border-b-0"
                    >
                        <p className="text-sm text-grayscale-900">
                            {activitySentence(event, names)}
                        </p>
                        <p className="text-xs text-grayscale-500">{formatWhen(event.timestamp)}</p>
                    </li>
                ))}
            </ul>
            {activity.hasNextPage && (
                <button
                    type="button"
                    disabled={activity.isFetchingNextPage}
                    onClick={() => void activity.fetchNextPage()}
                    className="w-full py-2 rounded-[20px] border border-grayscale-300 text-sm text-grayscale-700"
                >
                    {activity.isFetchingNextPage ? m['common.loading']() : m['hcp.activity.more']()}
                </button>
            )}
        </div>
    );
};

export default ActivitySection;
