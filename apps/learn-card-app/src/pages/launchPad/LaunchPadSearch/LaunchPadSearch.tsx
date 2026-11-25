import React from 'react';

import Search from 'learn-card-base/svgs/Search';

import { LaunchPadFilterOptionsEnum, LaunchPadSortOptionsEnum } from './launchpad-search.helpers';
import * as m from '../../../paraglide/messages.js';

type LaunchPadSearchProps = {
    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    filterBy: LaunchPadFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<LaunchPadFilterOptionsEnum>>;
    sortBy: LaunchPadSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<LaunchPadSortOptionsEnum>>;
    onFocus?: () => void;
    onBlur?: () => void;
};

export const LaunchPadSearch: React.FC<LaunchPadSearchProps> = ({
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
    onFocus,
    onBlur,
}) => {
    return (
        <div className="w-full flex items-center justify-center">
            <div className="w-full flex items-center gap-[10px] justify-between max-w-[600px] relative">
                <div className="flex-1 relative">
                    <div className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <input
                        type="text"
                        role="searchbox"
                        inputMode="search"
                        enterKeyHint="search"
                        value={searchInput}
                        placeholder={m['launchpad.searchApps']()}
                        aria-label={m['launchpad.searchApps']()}
                        onChange={e => setSearchInput(e.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className="w-full h-11 bg-grayscale-200 text-grayscale-800 placeholder:text-grayscale-500 rounded-[10px] ps-[44px] pe-3 font-normal font-notoSans text-[17px]"
                    />
                </div>
                {/*Going to hide this button for now until it gets hooked up to the new app system*/}
                {/* <LaunchPadPopOverButton
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                /> */}
            </div>
        </div>
    );
};

export default LaunchPadSearch;
