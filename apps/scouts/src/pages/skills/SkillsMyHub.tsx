import React from 'react';

import BoostErrorsDisplay from '../../components/boost/boostErrors/BoostErrorsDisplay';
import SkillsCategoryList from './SkillsCategoryList';
import SkillsPageEmptyPlaceholder from './SkillsEmptyPlaceholder';
import CategoryEmptyPlaceholder from '../../components/empty-placeholder/CategoryEmptyPlaceHolder';

import { BoostCategoryOptionsEnum, useGetCredentialsForSkills } from 'learn-card-base';
import {
    aggregateCategorizedEntries,
    mapBoostsToSkills,
    RawCategorizedEntry,
} from './skills.helpers';

type SkillsMyHubProps = {};

const SkillsMyHub: React.FC<SkillsMyHubProps> = ({}) => {
    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    const skillsMap = mapBoostsToSkills(allResolvedCreds);
    const categorizedSkills: [
        string,
        RawCategorizedEntry[] & { totalSkills: number; totalSubskills: number }
    ][] = Object.entries(skillsMap);
    const aggregatedSkills = aggregateCategorizedEntries(categorizedSkills);

    return (
        <section className="w-full flex flex-col relative items-center achievements-list-container pt-[10px] px-[20px] text-center justify-center">
            <CategoryEmptyPlaceholder category={BoostCategoryOptionsEnum.skill} />
            <p className="text-black mt-10">
                <strong>Coming Soon...</strong>
            </p>
        </section>
    );

    return (
        <>
            <SkillsCategoryList
                allResolvedCreds={allResolvedCreds!}
                categorizedSkills={aggregatedSkills!}
                isLoading={allResolvedBoostsLoading}
            />

            {((!allResolvedBoostsLoading && aggregatedSkills?.length === 0) ||
                allResolvedBoostsLoading) &&
                !allResolvedCredsError && (
                    <SkillsPageEmptyPlaceholder isLoading={allResolvedBoostsLoading} />
                )}

            {allResolvedCredsError && <BoostErrorsDisplay refetch={refetch} />}
        </>
    );
};

export default SkillsMyHub;
