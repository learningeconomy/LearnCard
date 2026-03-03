import { useMemo } from 'react';
import { BoostCMSAlignment, useGetCredentialsForSkills } from 'learn-card-base';
import { SkillFramework, SkillFrameworkNode } from '../components/boost/boost';
import {
    boostCMSSKillCategories,
    SKILLS,
    SUBSKILLS,
} from '../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';
import { VC } from '@learncard/types';
import { getFrameworkIdAndSkillIdFromUrl } from '../components/boost/alignmentHelpers';
import {
    SkillsHubFilterOptionsEnum,
    SkillsHubFilterValue,
    SkillsHubSortOptionsEnum,
} from '../pages/skills/skillshub-search.helpers';

export type SkillFrameworkNodeWithCredentials = SkillFrameworkNode & {
    credentials?: string[];
    subskills?: SkillFrameworkNodeWithCredentials[];
};

export type SkillFrameworkWithCredentials = Omit<SkillFramework, 'skills'> & {
    skills: SkillFrameworkNodeWithCredentials[];
};

export type LegacySkillEntry = {
    // Identifiers to distinguish skills
    category: string;
    skillType: string; // the raw skill type (e.g., "psychology")
    subskillType?: string; // only set for subskill entries

    // Display fields
    title: string;
    description: string;
    iconSrc: string;

    // Data fields
    credentials: VC[];
    issuanceDate: string; // most recent
    count: number;
};

export type AlignmentWithMetadata = BoostCMSAlignment & {
    credentials: VC[];
    count: number;
    frameworkId: string;
    skillId: string;
    issuanceDate: string;
};

export type AlignmentOrSkillEntry =
    | (LegacySkillEntry & { isLegacySkill: true })
    | (AlignmentWithMetadata & { isLegacySkill: false });

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
    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    } = useGetCredentialsForSkills();

    // filter boosts with alignments
    const credentialsWithAlignments = useMemo(() => {
        return allResolvedCreds?.filter(vc => {
            const alignment = (vc as VC)?.boostCredential?.credentialSubject?.achievement
                ?.alignment;
            if (alignment && alignment.length > 0) return true;

            return false;
        });
    }, [allResolvedCreds]);

    const credentialsWithSkills = useMemo(() => {
        return allResolvedCreds?.filter(vc => {
            if (vc?.boostCredential) return vc?.boostCredential?.skills?.length > 0;

            return vc?.skills?.length > 0;
        });
    }, [allResolvedCreds]);

    const legacySkills: LegacySkillEntry[] = useMemo(() => {
        const skillMap = new Map<string, LegacySkillEntry>();

        credentialsWithSkills?.forEach(vc => {
            const credSkills = vc?.boostCredential?.skills ?? vc?.skills ?? [];
            const issuanceDate =
                vc?.boostCredential?.issuanceDate ?? vc?.boostCredential?.validFrom ?? '';

            credSkills.forEach(
                (skillEntry: { category: string; skill: string; subskills?: string[] }) => {
                    const { category, skill, subskills } = skillEntry;

                    // Get category metadata for icon
                    const categoryMeta = boostCMSSKillCategories?.find(c => c.type === category);
                    const iconSrc = categoryMeta?.IconComponent ?? '';

                    // --- Process the main skill ---
                    const skillKey = `${category}:${skill}`;
                    const skillMeta = SKILLS.find(s => s.type === skill);
                    const skillTitle = skillMeta?.title ?? skill;
                    const skillDescription = skillMeta?.description ?? '';

                    if (skillMap.has(skillKey)) {
                        const existing = skillMap.get(skillKey)!;
                        existing.credentials.push(vc);
                        existing.count++;
                        // Update issuanceDate if this one is more recent
                        if (
                            issuanceDate &&
                            (!existing.issuanceDate || issuanceDate > existing.issuanceDate)
                        ) {
                            existing.issuanceDate = issuanceDate;
                        }
                    } else {
                        skillMap.set(skillKey, {
                            category,
                            skillType: skill,
                            title: skillTitle,
                            description: skillDescription,
                            iconSrc,
                            credentials: [vc],
                            issuanceDate,
                            count: 1,
                        });
                    }

                    // --- Process each subskill ---
                    subskills?.forEach(subskill => {
                        const subskillKey = `${category}:${skill}:${subskill}`;
                        const subskillMeta = SUBSKILLS.find(s => s.type === subskill);
                        const subskillTitle = subskillMeta?.title ?? subskill;

                        if (skillMap.has(subskillKey)) {
                            const existing = skillMap.get(subskillKey)!;
                            existing.credentials.push(vc);
                            existing.count++;
                            if (
                                issuanceDate &&
                                (!existing.issuanceDate || issuanceDate > existing.issuanceDate)
                            ) {
                                existing.issuanceDate = issuanceDate;
                            }
                        } else {
                            skillMap.set(subskillKey, {
                                category,
                                skillType: skill,
                                subskillType: subskill,
                                title: subskillTitle,
                                description: subskillMeta?.description ?? subskill,
                                iconSrc,
                                credentials: [vc],
                                issuanceDate,
                                count: 1,
                            });
                        }
                    });
                }
            );
        });

        return Array.from(skillMap.values());
    }, [credentialsWithSkills]);

    const { alignments, frameworkIds } = useMemo(() => {
        const alignmentMap = new Map<string, AlignmentWithMetadata>();
        const frameworkIdSet = new Set<string>();

        credentialsWithAlignments?.forEach(vc => {
            const credentialAlignments = (vc as VC)?.boostCredential?.credentialSubject?.achievement
                ?.alignment;
            const issuanceDate =
                (vc as VC)?.boostCredential?.issuanceDate ?? vc?.boostCredential?.validFrom ?? '';

            if (credentialAlignments && Array.isArray(credentialAlignments)) {
                credentialAlignments.forEach(alignment => {
                    const { targetUrl } = alignment;
                    const { frameworkId, skillId } = getFrameworkIdAndSkillIdFromUrl(targetUrl);

                    // Collect unique frameworkIds
                    if (frameworkId) {
                        frameworkIdSet.add(frameworkId);
                    }

                    if (targetUrl) {
                        if (alignmentMap.has(targetUrl)) {
                            const existing = alignmentMap.get(targetUrl)!;
                            existing.credentials.push(vc);
                            existing.count++;
                            // Update issuanceDate if this one is more recent
                            if (
                                issuanceDate &&
                                (!existing.issuanceDate || issuanceDate > existing.issuanceDate)
                            ) {
                                existing.issuanceDate = issuanceDate;
                            }
                        } else {
                            alignmentMap.set(targetUrl, {
                                ...alignment,
                                credentials: [vc],
                                issuanceDate,
                                count: 1,
                                frameworkId,
                                skillId,
                            });
                        }
                    }
                });
            }
        });

        return {
            alignments: Array.from(alignmentMap.values()),
            frameworkIds: Array.from(frameworkIdSet),
        };
    }, [credentialsWithAlignments]);

    const alignmentsAndSkills: AlignmentOrSkillEntry[] = useMemo(() => {
        const combined: AlignmentOrSkillEntry[] = [
            ...legacySkills.map(skill => ({ ...skill, isLegacySkill: true as const })),
            ...alignments.map(alignment => ({ ...alignment, isLegacySkill: false as const })),
        ];

        // Filter by filterBy options
        const filterBySet = new Set(filterBy);
        const showAll = filterBySet.has(SkillsHubFilterOptionsEnum.all) || filterBySet.size === 0;
        const showLegacy = filterBySet.has(SkillsHubFilterOptionsEnum.legacy);

        const filteredByType = showAll
            ? combined
            : combined.filter(entry => {
                  if (entry.isLegacySkill) {
                      // Show legacy skills only if "legacy" is selected
                      return showLegacy;
                  } else {
                      // Show alignment if its frameworkId is in the filter set
                      return filterBySet.has(entry.frameworkId);
                  }
              });

        // Filter by search input (case-insensitive)
        const searchTerm = searchInput.trim().toLowerCase();
        const filtered = searchTerm
            ? filteredByType.filter(entry => {
                  const name = entry.isLegacySkill ? entry.title : entry.targetName;
                  return name?.toLowerCase().includes(searchTerm);
              })
            : filteredByType;

        // Sort based on sortBy option
        return filtered.sort((a, b) => {
            if (sortBy === SkillsHubSortOptionsEnum.alphabetical) {
                const nameA = (a.isLegacySkill ? a.title : a.targetName) ?? '';
                const nameB = (b.isLegacySkill ? b.title : b.targetName) ?? '';
                return nameA.localeCompare(nameB);
            }

            // Default: recentlyAdded (sort by issuanceDate descending)
            if (!a.issuanceDate && !b.issuanceDate) return 0;
            if (!a.issuanceDate) return 1;
            if (!b.issuanceDate) return -1;
            return b.issuanceDate.localeCompare(a.issuanceDate);
        });
    }, [legacySkills, alignments, searchInput, filterBy, sortBy]);

    return {
        alignments,
        legacySkills,
        alignmentsAndSkills,
        frameworkIds,
        isLoading: credentialsFetching || allResolvedBoostsLoading,
        error: allResolvedCredsError,
        refetch,
    };
};

export default useAlignments;
