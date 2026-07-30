import React from 'react';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

import GridIcon from 'learn-card-base/svgs/GridIcon';
import ListItemsIcon from 'learn-card-base/svgs/ListItemsIcon';

import { useTheme } from '../../theme/hooks/useTheme';

export const WalletPageViewModeSelector: React.FC = () => {
    const viewMode = passportPageStore.use.viewMode();
    const { colors } = useTheme();
    const hasDarkBg = Boolean(colors?.defaults?.passportBgColor);

    const isGrid = viewMode === PassportPageViewMode.grid;

    // Single toggle button: shows the icon for the mode you'll switch TO.
    // In grid mode → show the list icon (click switches to list), and vice versa.
    const nextMode = isGrid ? PassportPageViewMode.list : PassportPageViewMode.grid;

    const containerClass = hasDarkBg
        ? 'bg-white/10 border-white/10'
        : 'bg-grayscale-100 border-grayscale-100';

    const iconColorClass = hasDarkBg ? 'text-white' : 'text-grayscale-900';

    return (
        <button
            className={`rounded-[5px] fix-ripple flex items-center justify-center h-[40px] w-[40px] border-[1px] border-solid ${containerClass}`}
            aria-label={isGrid ? 'Switch to list view' : 'Switch to grid view'}
            onClick={() => passportPageStore.set.setViewMode(nextMode)}
        >
            {isGrid ? (
                <ListItemsIcon className={iconColorClass} />
            ) : (
                <GridIcon className={iconColorClass} />
            )}
        </button>
    );
};

export default WalletPageViewModeSelector;
