import React, { useState } from 'react';

import SkillDisplay from './SkillDisplay';
import SkillsHubSearch from './SkillsHubSearch';
import LegacySkillDisplay from './LegacySkillDisplay';
import SkillsPageEmptyPlaceholder from './SkillsEmptyPlaceholder';
import ExploreAiInsightsButton from '../ai-insights/ExploreAiInsightsButton';
import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';

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
            <ExploreAiInsightsButton />

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
