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
    const isList = viewMode === PassportPageViewMode.list;

    const containerClass = hasDarkBg
        ? 'bg-white/10 border-white/10'
        : 'bg-grayscale-100 border-grayscale-100';

    const activeClass = 'bg-white iconColor shadow-soft-bottom';
    const inactiveIconClass = hasDarkBg ? 'text-white/50' : 'text-grayscale-600';

    return (
        <div className={`rounded-[5px] fix-ripple flex items-center h-[40px] border-[1px] border-solid p-[2px] ${containerClass}`}>
            <button
                className={`rounded-[5px] p-[8px] ${isGrid ? activeClass : ''}`}
                onClick={() => passportPageStore.set.setViewMode(PassportPageViewMode.grid)}
            >
                <GridIcon className={isGrid ? 'text-grayscale-900' : inactiveIconClass} />
            </button>
            <button
                className={`rounded-[5px] p-[8px] ${isList ? activeClass : ''}`}
                onClick={() => passportPageStore.set.setViewMode(PassportPageViewMode.list)}
            >
                <ListItemsIcon className={isList ? 'text-grayscale-900' : inactiveIconClass} />
            </button>
        </div>
    );
};

export default WalletPageViewModeSelector;
