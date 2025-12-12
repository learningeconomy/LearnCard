import React from 'react';

import { IonInput } from '@ionic/react';
import Search from 'learn-card-base/svgs/Search';
import LaunchPadPopOverButton from './LaunchPadPopOverButton';

import { LaunchPadFilterOptionsEnum, LaunchPadSortOptionsEnum } from './launchpad-search.helpers';

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
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <IonInput
                        type="text"
                        value={searchInput}
                        placeholder="Search apps..."
                        onIonInput={e => setSearchInput(e.detail.value ?? '')}
                        onIonFocus={onFocus}
                        onIonBlur={onBlur}
                        className="bg-grayscale-200 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[17px] !pl-[44px]"
                    />
                </div>

                <LaunchPadPopOverButton
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />
            </div>
        </div>
    );
};

export default LaunchPadSearch;
