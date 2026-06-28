import React from 'react';
import CaretRight from 'learn-card-base/svgs/CaretRight';
import type { ActivityFeedItemVM } from './activityFeed.helpers';

const SHORT_MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
const shortDate = (iso: string) => {
    const d = new Date(iso);
    return `${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

export const ActivityFeedItem: React.FC<{ item: ActivityFeedItemVM }> = ({ item }) => (
    <li
        data-unread={item.unread}
        className={`flex items-center gap-3 w-full py-3 px-2 rounded-[12px] ${
            item.unread ? 'bg-emerald-50' : ''
        } [&:not(:last-of-type)]:border-b border-grayscale-200`}
    >
        <div className="flex-1 min-w-0">
            <p className="font-poppins text-[15px] text-grayscale-900 truncate">{item.title}</p>
            {item.credentialType && (
                <p className="font-poppins text-[13px] text-grayscale-600 truncate">
                    {item.credentialType}
                </p>
            )}
        </div>
        <span className="font-poppins text-[13px] text-grayscale-500 whitespace-nowrap">
            {shortDate(item.timestamp)}
        </span>
        <CaretRight className="h-3 w-auto text-grayscale-400" />
    </li>
);

export default ActivityFeedItem;
