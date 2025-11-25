import { VC } from '@learncard/types';
import {
    BoostCMSCategorySkillEnum,
    BoostCMSSKillsCategoryEnum,
    BoostCMSSubSkillEnum,
} from '../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';
import { VC_WITH_URI } from 'learn-card-base';

export type SubskillMap = Record<string, number>;
export interface SkillItem {
    category: string;
    skill: string;
    subskills: SubskillMap;
}

export interface SkillSummary {
    totalSkills: number;
    totalSubskills: number;
    skills: SkillItem[];
}

export const mergeSkills = (...skills) => {
    // Initialize an empty array to store the combined elements
    let combinedSkills = [];

    // Iterate over each array passed as argument
    skills.forEach(skill => {
        // Concatenate the current array with the combinedArray
        combinedSkills = combinedSkills.concat(skill);
    });

    // Return the combined array
    return combinedSkills;
};

export const categorizeSkills = (skills: any) => {
    let categorizedSkills = skills.reduce((acc, obj) => {
        // If the category doesn't exist in the accumulator, create a new array for it
        if (!acc[obj.category]) {
            acc[obj.category] = [];
            acc[obj.category].totalSkills = 0; // Initialize totalSkills count
            acc[obj.category].totalSubskills = 0; // Initialize totalSubskills count
        }

        // Add the skill object directly without checking for duplicates
        const skillWithSubskillCounts = {
            ...obj,
            subskills: obj.subskills.reduce((subskillAcc, subskill) => {
                subskillAcc[subskill] = 1; // Initialize each subskill with count 1
                return subskillAcc;
            }, {}),
        };

        acc[obj.category].push(skillWithSubskillCounts);
        acc[obj.category].totalSkills++; // Increment totalSkills count
        acc[obj.category].totalSubskills += obj.subskills.length; // Add subskills count

        return acc;
    }, {});

    return categorizedSkills;
};

export const mapBoostsToSkills = (credentials = []) => {
    if (!credentials || credentials.length === 0) return [];

    // filter boosts with skills
    const credentialsWithSkills = credentials?.filter(vc => {
        if (vc?.boostCredential) return vc?.boostCredential?.skills?.length > 0;

        return vc?.skills?.length > 0;
    });

    // map out the skills object for each
    const mappedSkills =
        credentialsWithSkills?.map(cred => {
            if (cred?.boostCredential) return cred?.boostCredential?.skills;

            return cred?.skills;
        }) ?? [];

    // combine all mapped skills into a single array
    const combinedSkills = mergeSkills(...(mappedSkills ?? []));

    // map skills by category
    return categorizeSkills(combinedSkills);
};

export const filterBoostsBySkillCategory = (
    credentials = [],
    category: BoostCMSCategorySkillEnum
) => {
    // filter boosts with skills
    const credentialsWithSkills = credentials?.filter(vc => {
        if (vc?.boostCredential) return vc?.boostCredential?.skills?.length > 0;

        return vc?.skills?.length > 0;
    });

    // filter out boosts by category
    const credentialsBySkillCategory = credentialsWithSkills.filter(vc => {
        const skills = vc?.boostCredential?.skills || vc?.skills || [];

        const categories = [...new Set(skills?.map(skill => skill?.category))];
        if (categories.includes(category)) return true;
        return false;
    });

    return credentialsBySkillCategory ?? [];
};

export type CredentialsGroupedByCategory = {
    // all credentials grouped by category
    category: BoostCMSSKillsCategoryEnum;
    credentials: VC[] | VC_WITH_URI[];
};

export type CredentialsGroupedByCategorySkills = {
    // credentials grouped by category and skill
    category: BoostCMSSKillsCategoryEnum;
    skill: BoostCMSCategorySkillEnum;
    credentials: VC[] | VC_WITH_URI[];
};

export type CredentialsGroupedByCategorySubskill = {
    // credentials grouped by category, skill and subskill
    category: BoostCMSSKillsCategoryEnum;
    skill: BoostCMSCategorySkillEnum;
    subSkill: BoostCMSSubSkillEnum;
    credentials: VC[] | VC_WITH_URI[];
};

export type CredentialsGroupedByCategorySkillsAndSubskills = {
    credentialsGroupedByCategory: CredentialsGroupedByCategory;
    credentialsGroupedByCategorySkills: CredentialsGroupedByCategorySkills[];
    credentialsGroupedByCategorySubskill: CredentialsGroupedByCategorySubskill[];
};

/**
 * Groups credentials by category, skills, and subskills for a specific target category.
 * @param credentials - An array of credentials (VC or VC_WITH_URI).
 * @param targetCategory - The category to filter and group credentials by.
 * @returns An object containing credentials grouped by category, skills, and subskills.
 */
export function groupCredentialsByCategorySkillsAndSubskills(
    credentials: (VC | VC_WITH_URI)[],
    targetCategory: BoostCMSSKillsCategoryEnum
): CredentialsGroupedByCategorySkillsAndSubskills {
    // Maps to store credentials grouped by different criteria.
    const categoryMap = new Map<BoostCMSSKillsCategoryEnum, (VC | VC_WITH_URI)[]>();
    const categorySkillMap = new Map<string, (VC | VC_WITH_URI)[]>(); // Key: "category|skill"
    const categorySubskillMap = new Map<string, (VC | VC_WITH_URI)[]>(); // Key: "category|skill|subskill"

    // Iterate over each credential to process its skills.
    for (const credential of credentials) {
        const skills = credential?.boostCredential?.skills ?? [];

        // Iterate over each skill in the credential.
        for (const { category, skill, subskills = [] } of skills) {
            // Skip if the skill's category does not match the target category.
            if (category !== targetCategory) continue;

            // Group the credential by the main category.
            if (!categoryMap.has(category)) categoryMap.set(category, []);
            categoryMap.get(category)!.push(credential);

            // Group the credential by skill, using a composite key.
            const skillKey = `${category}|${skill}`;
            if (!categorySkillMap.has(skillKey)) categorySkillMap.set(skillKey, []);
            categorySkillMap.get(skillKey)!.push(credential);

            // Group the credential by each subskill, using a composite key.
            for (const subskill of subskills) {
                const subskillKey = `${category}|${skill}|${subskill}`;
                if (!categorySubskillMap.has(subskillKey)) categorySubskillMap.set(subskillKey, []);
                categorySubskillMap.get(subskillKey)!.push(credential);
            }
        }
    }

    // Structure and return the grouped credentials.
    return {
        // All credentials for the target category.
        credentialsGroupedByCategory: {
            category: targetCategory,
            credentials: categoryMap.get(targetCategory) ?? [],
        },
        // Credentials grouped by each skill.
        credentialsGroupedByCategorySkills: Array.from(categorySkillMap.entries()).map(
            ([key, credentials]) => {
                const [category, skill] = key.split('|') as [
                    BoostCMSSKillsCategoryEnum,
                    BoostCMSCategorySkillEnum
                ];
                return { category, skill, credentials };
            }
        ),
        // Credentials grouped by each subskill.
        credentialsGroupedByCategorySubskill: Array.from(categorySubskillMap.entries()).map(
            ([key, credentials]) => {
                const [category, skill, subSkill] = key.split('|') as [
                    BoostCMSSKillsCategoryEnum,
                    BoostCMSCategorySkillEnum,
                    BoostCMSSubSkillEnum
                ];
                return { category, skill, subSkill, credentials };
            }
        ),
    };
}

export interface RawCategorizedEntry {
    category: string;
    skill: string;
    subskills: Record<string, number>;
}

export type CategorizedData = Array<[string, RawCategorizedEntry[]]>;

export interface AggregatedEntry {
    category: string;
    skill: string;
    count: number;
    subskills: Record<string, number>;
}

/**
 * Takes categorized data and returns an array of [category, entries] tuples,
 * where entries is an array of AggregatedEntry objects (one per unique skill),
 * and also has .totalSkills and .totalSubskills fields on the array.
 */
export function aggregateCategorizedEntries(
    data: CategorizedData
): Array<[string, AggregatedEntry[] & { totalSkills: number; totalSubskills: number }]> {
    // Map over each category in the data.
    return data.map(([category, entries]) => {
        // Use a map to aggregate skills and their counts.
        const map: Record<string, AggregatedEntry> = {};

        // Iterate over each entry in the category to process skills.
        for (const { skill, subskills } of entries) {
            // If the skill is not yet in the map, initialize it.
            if (!map[skill]) {
                map[skill] = { category, skill, count: 0, subskills: {} };
            }
            // Increment the count for this skill.
            map[skill].count++;
            // Accumulate the counts for each subskill.
            for (const [sub, cnt] of Object.entries(subskills)) {
                map[skill].subskills[sub] = (map[skill].subskills[sub] || 0) + cnt;
            }
        }

        // Convert the map of aggregated skills to an array.
        const aggregated = Object.values(map) as AggregatedEntry[];

        // Calculate the total number of skills by summing up their counts.
        const totalSkills = aggregated.reduce((sum, e) => sum + e.count, 0);

        // Calculate the total number of subskills by summing up their counts.
        const totalSubskills = aggregated.reduce(
            (sum, e) => sum + Object.values(e.subskills).reduce((s, v) => s + v, 0),
            0
        );

        // Attach the calculated totals directly to the aggregated array.
        (aggregated as any).totalSkills = totalSkills;
        (aggregated as any).totalSubskills = totalSubskills;

        // Return the category and the aggregated entries with totals.
        return [
            category,
            aggregated as AggregatedEntry[] & { totalSkills: number; totalSubskills: number },
        ];
    });
}

export type AggregatedData = Array<
    [string, AggregatedEntry[] & { totalSkills: number; totalSubskills: number }]
>;

export const getTopSkills = (data: AggregatedData, count: number) => {
    return (
        data
            .flatMap(([, entries]) =>
                // Flatten skills and subskills from each entry into a single array
                entries.flatMap(entry => [
                    // Add the main skill
                    { name: entry.skill, count: entry.count, type: 'skill' },
                    // Add all subskills
                    ...Object.entries(entry.subskills).map(([name, count]) => ({
                        name,
                        count,
                        type: 'subskill',
                    })),
                ])
            )
            // Sort by count in descending order to find the top skills
            .sort((a, b) => b.count - a.count)
            // Take the top N
            .slice(0, count)
    );
};
