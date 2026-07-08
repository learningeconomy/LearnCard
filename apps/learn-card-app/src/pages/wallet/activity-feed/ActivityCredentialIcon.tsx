import React from 'react';
import { useTheme } from '../../../theme/hooks/useTheme';
import type { ActivityFeedItemVM } from './activityFeed.helpers';

const GenericCredentialGlyph: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
        <rect
            x="7"
            y="5"
            width="26"
            height="30"
            rx="4"
            fill="#EFF0F5"
            stroke="#C5C8D3"
            strokeWidth="1.6"
        />
        <path
            d="M13 14h14M13 20h14M13 26h9"
            stroke="#8B91A7"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

export const ActivityCredentialIcon: React.FC<{
    item: ActivityFeedItemVM;
    className?: string;
}> = ({ item, className }) => {
    const { getThemedCategory } = useTheme();

    if (item.isGenericCredential) return <GenericCredentialGlyph className={className} />;

    const { icons } = getThemedCategory(item.category);
    const CategoryIcon = icons?.IconWithShape ?? icons?.Icon;

    if (!CategoryIcon) return <GenericCredentialGlyph className={className} />;

    return <CategoryIcon className={className} />;
};

export default ActivityCredentialIcon;
