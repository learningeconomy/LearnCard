import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Vector from '../../components/svgs/Vector';
import SkillDisplay from './SkillDisplay';
import SkillsHubSearch from './SkillsHubSearch';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import LegacySkillDisplay from './LegacySkillDisplay';
import SkillsPageEmptyPlaceholder from './SkillsEmptyPlaceholder';
import { AiInsightsIcon } from 'learn-card-base/svgs/wallet/AiInsightsIcon';

import { useAlignments } from '../../hooks/useAlignments';
import {
    SkillsHubFilterOptionsEnum,
    SkillsHubFilterValue,
    SkillsHubSortOptionsEnum,
} from './skillshub-search.helpers';
import { CredentialCategoryEnum } from 'learn-card-base';

type SkillsMyHubProps = {};

const SkillsMyHub: React.FC<SkillsMyHubProps> = ({}) => {
    const [searchInput, setSearchInput] = useState('');
    const [filterBy, setFilterBy] = useState<SkillsHubFilterValue[]>([
        SkillsHubFilterOptionsEnum.all,
    ]);
    const [sortBy, setSortBy] = useState(SkillsHubSortOptionsEnum.recentlyAdded);

    const { alignmentsAndSkills, frameworkIds, isLoading, error, refetch } = useAlignments({
        searchInput,
        filterBy,
        sortBy,
    });

    const noSkills = alignmentsAndSkills?.length === 0;
    const noFilter =
        filterBy.length === 0 ||
        (filterBy.length === 1 && filterBy.includes(SkillsHubFilterOptionsEnum.all));
    const showPlaceholder = (noSkills && !searchInput && noFilter) || isLoading;

    return (
        <div className="flex flex-col gap-[10px] w-full">
            <Link
                to="/ai/insights"
                className="w-full bg-indigo-600 text-white flex items-center gap-[11px] rounded-full pr-[25px] shadow-bottom-2-3 overflow-hidden relative"
            >
                <div className="relative">
                    <Vector color="lime-300" className="" />
                    <AiInsightsIcon className="h-[49px] w-[49px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" />
                </div>
                <span className="text-[20px] font-poppins font-[600] leading-[130%]">
                    Explore AI Insights
                </span>
            </Link>

            {showPlaceholder && <SkillsPageEmptyPlaceholder isLoading={isLoading} />}

            {!showPlaceholder && (
                <>
                    <SkillsHubSearch
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        filterBy={filterBy}
                        setFilterBy={setFilterBy}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        frameworkIds={frameworkIds}
                    />

                    {!noSkills && (
                        <div className="flex flex-col gap-[10px] w-full">
                            {alignmentsAndSkills?.map((item, index) =>
                                item.isLegacySkill ? (
                                    <LegacySkillDisplay key={`legacy-${index}`} skill={item} />
                                ) : (
                                    <SkillDisplay key={`alignment-${index}`} skill={item} />
                                )
                            )}
                        </div>
                    )}

                    {noSkills && searchInput && (
                        <p className="font-poppins text-[14px] text-grayscale-800 font-[700] text-left">
                            No results found for <span className="italic">{searchInput}</span>
                        </p>
                    )}
                </>
            )}

            {error && (
                <BoostErrorsDisplay refetch={refetch} category={CredentialCategoryEnum.skill} />
            )}
        </div>
    );
};

export default SkillsMyHub;
