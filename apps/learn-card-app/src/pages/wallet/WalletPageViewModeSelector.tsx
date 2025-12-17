import React from 'react';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

import GridIcon from 'learn-card-base/svgs/GridIcon';
import ListItemsIcon from 'learn-card-base/svgs/ListItemsIcon';

export const WalletPageViewModeSelector: React.FC = () => {
    const viewMode = passportPageStore.use.viewMode();

    const isGrid = viewMode === PassportPageViewMode.grid;
    const isList = viewMode === PassportPageViewMode.list;

    return (
        <div className="rounded-[5px] fix-ripple flex items-center bg-grayscale-100 h-[40px] border-[1px] border-solid border-grayscale-100 p-[2px]">
            <button
                className={`rounded-[5px] p-[8px] ${
                    isGrid ? `bg-white iconColor shadow-soft-bottom` : 'text-white'
                }`}
                onClick={() => passportPageStore.set.setViewMode(PassportPageViewMode.grid)}
            >
                <GridIcon className={isGrid ? 'text-grayscale-900' : 'text-grayscale-600'} />
            </button>
            <button
                className={`rounded-[5px] p-[8px] ${
                    isList ? `bg-white iconColor shadow-soft-bottom` : 'text-white'
                }`}
                onClick={() => passportPageStore.set.setViewMode(PassportPageViewMode.list)}
            >
                <ListItemsIcon className={isList ? 'text-grayscale-900' : 'text-grayscale-600'} />
            </button>
        </div>
    );
};

export default WalletPageViewModeSelector;
