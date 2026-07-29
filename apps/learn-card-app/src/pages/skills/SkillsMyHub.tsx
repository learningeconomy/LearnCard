import React, { useState } from 'react';

import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';
import SkillDisplay from './SkillDisplay';
import SkillsHubSearch from './SkillsHubSearch';
import SkillsPageEmptyPlaceholder from './SkillsEmptyPlaceholder';
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

    const { alignments, alignmentsAndSkills, frameworkIds, isLoading, error, refetch } =
        useAlignments({
            searchInput,
            filterBy,
            sortBy,
        });

    const noSkills = alignments.length === 0;
    const noResults = alignmentsAndSkills.length === 0;
    const showPlaceholder = isLoading;

    return (
        <div className="flex flex-col gap-[10px] w-full">
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

                    {!noResults && (
                        <div className="flex flex-col gap-[10px] w-full">
                            {alignmentsAndSkills?.map(item => (
                                <SkillDisplay key={item.targetUrl} skill={item} />
                            ))}
                        </div>
                    )}

                    {noResults && searchInput && (
                        <p className="font-poppins text-[14px] text-grayscale-800 font-[700] text-left">
                            <TransP
                                m={m['skills.myHub.noResultsFoundFor']}
                                values={{ query: searchInput }}
                                components={[<span className="italic" />]}
                            />
                        </p>
                    )}

                    {noResults && !searchInput && !noSkills && (
                        <p className="font-poppins text-sm text-grayscale-600 leading-relaxed">
                            {m['common.searchResults.noResults']()}
                        </p>
                    )}

                    {noSkills && !searchInput && <SkillsPageEmptyPlaceholder isLoading={false} />}
                </>
            )}

            {error && (
                <BoostErrorsDisplay refetch={refetch} category={CredentialCategoryEnum.skill} />
            )}
        </div>
    );
};

export default SkillsMyHub;
