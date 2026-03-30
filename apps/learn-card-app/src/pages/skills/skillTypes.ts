export enum SkillLevel {
    Hidden = 0,
    Novice = 1,
    Beginner = 2,
    Proficient = 3,
    Advanced = 4,
    Expert = 5,
}

export const SKILL_LEVEL_META = {
    [SkillLevel.Hidden]: {
        name: 'Hidden',
        color: 'grayscale-500',
        description: 'Do not display my proficiency status.',
        cardOuterBorderColor: 'gray-600',
        cardInnerBorderColor: 'grayscale-200',
        cardIconBgColor: 'grayscale-50',
        cardTextColor: 'grayscale-700',
    },
    [SkillLevel.Novice]: {
        name: 'Novice',
        color: 'grayscale-700',
        description: 'Just starting and needs guidance.',
        cardOuterBorderColor: 'gray-600',
        cardInnerBorderColor: 'grayscale-200',
        cardIconBgColor: 'grayscale-50',
        cardTextColor: 'grayscale-700',
    },
    [SkillLevel.Beginner]: {
        name: 'Beginner',
        color: 'orange-400',
        description: 'Handles simple tasks without support.',
        cardOuterBorderColor: 'orange-600',
        cardInnerBorderColor: 'orange-200',
        cardIconBgColor: 'orange-50',
        cardTextColor: 'orange-500',
    },
    [SkillLevel.Proficient]: {
        name: 'Proficient',
        color: 'violet-500',
        description: 'Works independently on routine tasks.',
        cardOuterBorderColor: 'violet-600',
        cardInnerBorderColor: 'violet-300',
        cardIconBgColor: 'violet-50',
        cardTextColor: 'violet-600',
    },
    [SkillLevel.Advanced]: {
        name: 'Advanced',
        color: 'light-blue-500',
        description: 'Solves complex tasks efficiently.',
        cardOuterBorderColor: 'sky-600',
        cardInnerBorderColor: 'sky-200',
        cardIconBgColor: 'sky-50',
        cardTextColor: 'sky-500',
    },
    [SkillLevel.Expert]: {
        name: 'Expert',
        color: 'emerald-500',
        description: 'Deep mastery; can lead and mentor others.',
        cardOuterBorderColor: 'emerald-700',
        cardInnerBorderColor: 'emerald-200',
        cardIconBgColor: 'emerald-50',
        cardTextColor: 'emerald-600',
    },
};

export const LEVELS: SkillLevel[] = [
    SkillLevel.Hidden,
    SkillLevel.Novice,
    SkillLevel.Beginner,
    SkillLevel.Proficient,
    SkillLevel.Advanced,
    SkillLevel.Expert,
];

export enum SkillProficiencyBarModeEnum {
    Slider,
    Display,
}
