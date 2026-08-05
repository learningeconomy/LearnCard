import React from 'react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { useTheme } from '../../../theme/hooks/useTheme';

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
    category: CredentialCategoryEnum;
    isGeneric?: boolean;
    className?: string;
}> = ({ category, isGeneric, className }) => {
    const { getThemedCategory } = useTheme();

    if (isGeneric) return <GenericCredentialGlyph className={className} />;

    const { icons } = getThemedCategory(category);

    // LC-1969: the feed always renders the flat solid glyph, never the
    // illustrated `IconWithShape` art — the shaped variants don't read at
    // 20-38px and made the feed look different per theme. Sets whose `Icon`
    // is already the solid glyph (`formal`, and `vetpass` by inheritance)
    // don't declare `IconSolid` and fall through to it.
    const CategoryIcon = icons?.IconSolid ?? icons?.Icon;

    if (!CategoryIcon) return <GenericCredentialGlyph className={className} />;

    return <CategoryIcon className={className} />;
};

export default ActivityCredentialIcon;
