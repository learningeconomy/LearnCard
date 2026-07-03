import React from 'react';
import { UserProfilePicture } from 'learn-card-base';
import CaretRight from 'learn-card-base/svgs/CaretRight';
import { useTheme } from '../../../theme/hooks/useTheme';
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

// Thin right arrow separating the avatar from the credential-category icon,
// reading "this person → this credential" (matches the Figma row).
const DirectionArrow: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <path
            d="M3.5 10h11.5M11 6l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const ActivityFeedItem: React.FC<{ item: ActivityFeedItemVM }> = ({ item }) => {
    const { getThemedCategory } = useTheme();
    const { icons } = getThemedCategory(item.category);
    // Prefer the branded "with shape" icon (colored tile) used across the passport;
    // fall back to the bare icon, or nothing if the theme has neither.
    const CategoryIcon = icons?.IconWithShape ?? icons?.Icon;

    return (
        <li
            data-unread={item.unread}
            className={`flex items-center gap-3 w-full py-3 px-2 rounded-[12px] ${
                item.unread ? 'bg-emerald-50' : ''
            } [&:not(:last-of-type)]:border-b border-grayscale-100`}
        >
            <div className="flex items-center gap-[6px] shrink-0">
                <UserProfilePicture
                    user={{
                        displayName: item.avatar.displayName,
                        profileId: item.avatar.profileId,
                        image: item.avatar.image,
                    }}
                    customContainerClass="h-[40px] w-[40px] min-h-[40px] min-w-[40px] text-[15px]"
                    customImageClass="h-[40px] w-[40px] object-cover"
                />
                <DirectionArrow className="w-[16px] h-[16px] text-grayscale-300" />
                {CategoryIcon && <CategoryIcon className="w-[30px] h-[30px]" />}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-poppins text-[15px] font-[500] text-grayscale-900 truncate">
                    {item.title}
                </p>
                {item.credentialType && (
                    <p className="font-poppins text-[13px] text-grayscale-500 truncate">
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
};

export default ActivityFeedItem;
