import { useMemo } from 'react';
import { useGetCredentialsForSkills } from 'learn-card-base';
import { SkillFramework, SkillFrameworkNode } from '../components/boost/boost';
import { VC } from '@learncard/types';
import {
    SkillsHubFilterOptionsEnum,
    SkillsHubFilterValue,
    SkillsHubSortOptionsEnum,
} from '../pages/skills/skillshub-search.helpers';
import { useGlobalSkillFrameworks } from '../helpers/globalSkillFrameworks.helpers';
import {
    aggregateHubSkillAlignments,
    getCredentialAchievementAlignments,
    type HubSkillAlignment,
} from './skillAlignment.helpers';

export type SkillFrameworkNodeWithCredentials = SkillFrameworkNode & {
    credentials?: string[];
    subskills?: SkillFrameworkNodeWithCredentials[];
};

export type SkillFrameworkWithCredentials = Omit<SkillFramework, 'skills'> & {
    skills: SkillFrameworkNodeWithCredentials[];
};

export type AlignmentWithMetadata = HubSkillAlignment<VC>;

export const useAlignments = (
    {
        searchInput,
        filterBy,
        sortBy,
    }: {
        searchInput: string;
        filterBy: SkillsHubFilterValue[];
        sortBy: SkillsHubSortOptionsEnum;
    } = {
        searchInput: '',
        filterBy: [SkillsHubFilterOptionsEnum.all],
        sortBy: SkillsHubSortOptionsEnum.recentlyAdded,
    }
) => {
    const globalSkillFrameworks = useGlobalSkillFrameworks();
    const globalFrameworkIds = useMemo(
        () => globalSkillFrameworks.map(framework => framework.frameworkId),
        [globalSkillFrameworks]
    );
    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    // Filter credentials that carry skill alignments (boost wrapper or bare OB3).
    const credentialsWithAlignments = useMemo(() => {
        return allResolvedCreds?.filter(vc => getCredentialAchievementAlignments(vc).length > 0);
    }, [allResolvedCreds]);

    const { alignments, frameworkIds } = useMemo(
        () => ({
            alignments: aggregateHubSkillAlignments(
                credentialsWithAlignments as VC[] | undefined,
                globalFrameworkIds
            ),
            frameworkIds: globalFrameworkIds,
        }),
        [credentialsWithAlignments, globalFrameworkIds]
    );

    const alignmentsAndSkills = useMemo(() => {
        const filterBySet = new Set(filterBy);
        const showAll = filterBySet.has(SkillsHubFilterOptionsEnum.all) || filterBySet.size === 0;
        const filteredByFramework = showAll
            ? alignments
            : alignments.filter(alignment => filterBySet.has(alignment.frameworkId));

        // Filter by search input (case-insensitive)
        const searchTerm = searchInput.trim().toLowerCase();
        const filtered = searchTerm
            ? filteredByFramework.filter(alignment =>
                  alignment.targetName?.toLowerCase().includes(searchTerm)
              )
            : filteredByFramework;

        // Sort based on sortBy option
        return filtered.sort((a, b) => {
            if (sortBy === SkillsHubSortOptionsEnum.alphabetical) {
                const nameA = a.targetName ?? '';
                const nameB = b.targetName ?? '';
                return nameA.localeCompare(nameB);
            }

            // Default: recentlyAdded (sort by issuanceDate descending)
            if (!a.issuanceDate && !b.issuanceDate) return 0;
            if (!a.issuanceDate) return 1;
            if (!b.issuanceDate) return -1;
            return b.issuanceDate.localeCompare(a.issuanceDate);
        });
    }, [alignments, searchInput, filterBy, sortBy]);

    return {
        alignments,
        alignmentsAndSkills,
        frameworkIds,
        isLoading: credentialsFetching || allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    };
};

export default useAlignments;
