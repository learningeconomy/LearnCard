import React from 'react';

import { IonInput } from '@ionic/react';
import Search from 'learn-card-base/svgs/Search';
import LearnerInsightsPopOverButton from './LearnerInsightsPopOverButton';

import {
    LearnerInsightsFilterOptionsEnum,
    LearnerInsightsSortOptionsEnum,
} from './learner-insights.helpers';

type RequestInsightsSearchProps = {
    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    filterBy: LearnerInsightsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<LearnerInsightsFilterOptionsEnum>>;
    sortBy: LearnerInsightsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<LearnerInsightsSortOptionsEnum>>;
};

export const LearnerInsightsSearch: React.FC<RequestInsightsSearchProps> = ({
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
}) => {
    return (
        <div className="w-full flex items-center justify-center mb-2">
            <div className="w-full flex items-center gap-[10px] justify-between max-w-[600px] relative">
                <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                        <Search className="text-grayscale-900 w-[24px] h-[24px]" />
                    </div>
                    <IonInput
                        type="text"
                        value={searchInput}
                        placeholder="Search"
                        onIonInput={e => setSearchInput(e.detail.value)}
                        className="text-left bg-grayscale-200 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[17px] !pl-[44px]"
                    />
                </div>

                <LearnerInsightsPopOverButton
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />
            </div>
        </div>
    );
};

export default LearnerInsightsSearch;
