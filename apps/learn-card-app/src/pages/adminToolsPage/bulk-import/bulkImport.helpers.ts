import {
    BoostCMSCategorySkillEnum,
    BoostCMSSKillsCategoryEnum,
    BoostCMSSubSkillEnum,
} from 'apps/learn-card-app/src/components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { BoostCategoryOptionsEnum, constructCustomBoostType } from 'learn-card-base';

/* Take an input like
 *    ['Stem - Engineering', 'Durable - Adaptability - Flexibility', 'Durable - Adaptability - Problem Solving', 'Durable - Lifelong Learning - Critical Thinking']
 * And turn it into
 *  [
 *      {
 *          category: "stem",
 *          skill: "engineering",
 *          subskills: []
 *      },
 *      {
 *          category: "durable",
 *          skill: "adaptibility",
 *          subskills: ["flexibility", "problemSolving"]
 *      },
 *      {
 *          category: "durable",
 *          skill: "lifelongLearning",
 *          subskills: ["criticalThinking"]
 *      }
 *  ]
 */
export const parseSkills = (rawSkills: string[]) => {
    const skillsMap = new Map();

    const normalize = (str: string): string => {
        return str?.toLowerCase().replace(/[\s-]/g, '') ?? '';
    };

    function findMatchingEnumValue<T extends Record<string, string>>(
        enumObj: T,
        value: string
    ): string | undefined {
        return Object.values(enumObj).find(enumValue => normalize(enumValue) === normalize(value));
    }

    rawSkills.forEach(skillString => {
        const parts = skillString.split(' - ');
        if (parts.length < 2) return;

        const category = findMatchingEnumValue(BoostCMSSKillsCategoryEnum, parts[0]);
        const skill = findMatchingEnumValue(BoostCMSCategorySkillEnum, parts[1]);

        if (!skillsMap.has(skill)) {
            skillsMap.set(skill, {
                category,
                skill,
                subskills: [],
            });
        }

        if (parts[2]) {
            const subskill = findMatchingEnumValue(BoostCMSSubSkillEnum, parts[2]);
            skillsMap.get(skill).subskills.push(subskill);
        }
    });

    return Array.from(skillsMap.values());
};
// Thanks ChatGPT

export const parseBadgeType = (categoryType: string, badgeType: string) => {
    const existingTypeKey = Object.keys(AchievementTypes).find(typeKey => {
        const type = AchievementTypes[typeKey].replace('ext:', '');

        // remove whitespace + conver to lowercase
        const normalize = (str: string) => str?.toLowerCase().replace(/\s+/g, '') ?? '';

        return normalize(badgeType) === normalize(type);
    });

    if (existingTypeKey) {
        // MB example (known): "ext:Archery"
        // SB example (known): "ext:Adventurer"
        return AchievementTypes[existingTypeKey];
    } else {
        return constructCustomBoostType(categoryType, badgeType);
    }
};

export const mapCategoryToBoostEnum = (csvCategory: string) => {
    switch (csvCategory) {
        case 'Course':
            return BoostCategoryOptionsEnum.learningHistory;
        case 'Social Badge':
            return BoostCategoryOptionsEnum.socialBadge;
        case 'Achievement':
            return BoostCategoryOptionsEnum.achievement;
        case 'Accomplishment':
            return BoostCategoryOptionsEnum.accomplishment;
        case 'Experience':
            return BoostCategoryOptionsEnum.workHistory;
        case 'Accomodation':
            return BoostCategoryOptionsEnum.accommodation;
        case 'ID':
            return BoostCategoryOptionsEnum.id;
        default:
            console.error(`Unexpected Badge Category: ${csvCategory}. Defaulting to achievement.`);
            return BoostCategoryOptionsEnum.achievement;
    }
};
