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
    },
    [SkillLevel.Novice]: {
        name: 'Novice',
        color: 'grayscale-700',
        description: 'Just starting and needs guidance.',
    },
    [SkillLevel.Beginner]: {
        name: 'Beginner',
        color: 'orange-400',
        description: 'Handles simple tasks without support.',
    },
    [SkillLevel.Proficient]: {
        name: 'Proficient',
        color: 'violet-500',
        description: 'Works independently on routine tasks.',
    },
    [SkillLevel.Advanced]: {
        name: 'Advanced',
        color: 'light-blue-500',
        description: 'Solves complex tasks efficiently.',
    },
    [SkillLevel.Expert]: {
        name: 'Expert',
        color: 'emerald-500',
        description: 'Deep mastery; can lead and mentor others.',
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
