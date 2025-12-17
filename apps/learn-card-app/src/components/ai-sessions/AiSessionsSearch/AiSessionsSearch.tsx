import React from 'react';

import { IonInput } from '@ionic/react';
import Search from 'learn-card-base/svgs/Search';
import AiSessionsPopOverButton from './AiSessionsPopOverButton';

import {
    AiSessionsSortOptionsEnum,
    AiSessionsFilterOptionsEnum,
    AiFilteringTypes,
} from './aiSessions-search.helpers';

export const AiSessionsSearch: React.FC<{
    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    filterBy: AiSessionsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<AiSessionsFilterOptionsEnum>>;
    filteringType?: AiFilteringTypes;
    sortBy: AiSessionsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<AiSessionsSortOptionsEnum>>;
    showFilterOptions?: boolean;
}> = ({
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    filteringType = AiFilteringTypes.topics,
    sortBy,
    setSortBy,
    showFilterOptions,
}) => {
    return (
        <div className="w-full flex items-center justify-center mt-4">
            <div className="w-full flex items-center justify-between max-w-[600px] relative">
                <div className="flex-1 relative mr-2">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <IonInput
                        type="text"
                        value={searchInput}
                        placeholder="Search"
                        onIonInput={e => setSearchInput(e.detail.value)}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] !py-[4px] font-normal !font-notoSans text-[17px] !pl-[48px]"
                    />
                </div>

                <AiSessionsPopOverButton
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    showFilteringOptions={showFilterOptions}
                    filteringType={filteringType}
                />
            </div>
        </div>
    );
};

export default AiSessionsSearch;
