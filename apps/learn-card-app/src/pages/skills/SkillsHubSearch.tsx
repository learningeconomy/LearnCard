import React from 'react';

import { conditionalPluralize } from 'learn-card-base';

import {
    SkillsHubFilterOptionsEnum,
    SkillsHubFilterValue,
    SkillsHubSortOptionsEnum,
} from './skillshub-search.helpers';

import { IonInput } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import Search from 'learn-card-base/svgs/Search';
import SkillsHubPopOverButton from './SkillsHubPopoverButton';
import SkillsHubFilterInfoBubble from './SkillsHubFilterInfoBubble';

import { SetState } from 'packages/shared-types/dist';

type SkillsHubSearchProps = {
    searchInput: string;
    setSearchInput: SetState<string>;
    filterBy: SkillsHubFilterValue[];
    setFilterBy: SetState<SkillsHubFilterValue[]>;
    sortBy: SkillsHubSortOptionsEnum;
    setSortBy: SetState<SkillsHubSortOptionsEnum>;
    frameworkIds: string[];
};

const SkillsHubSearch: React.FC<SkillsHubSearchProps> = ({
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
    frameworkIds,
}) => {
    return (
        <>
            <div className="w-full flex items-center justify-center">
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
                            className="bg-grayscale-200 text-grayscale-800 rounded-[10px] !py-[4px] font-normal !font-notoSans text-[17px] !pl-[44px] !text-left !pr-[36px]"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput('');
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <SkillsHubPopOverButton
                        filterBy={filterBy}
                        setFilterBy={setFilterBy}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        frameworkIds={frameworkIds}
                    />
                </div>
            </div>

            {filterBy.length > 0 && !filterBy.includes(SkillsHubFilterOptionsEnum.all) && (
                <div className="flex items-center gap-[10px]">
                    <span className="font-popins font-[600] text-[14px] text-grayscale-700">
                        {conditionalPluralize(filterBy.length, 'Filter')}:{' '}
                    </span>
                    {filterBy.map((filter, index) => (
                        <SkillsHubFilterInfoBubble
                            key={index}
                            filterString={filter}
                            handleRemove={() => {
                                setFilterBy(prev => prev.filter(f => f !== filter));
                            }}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default SkillsHubSearch;
