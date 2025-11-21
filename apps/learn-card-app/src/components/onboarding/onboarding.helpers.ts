export enum OnboardingStepsEnum {
    selectRole = 'selectRole',
    joinNetwork = 'joinNetwork',
}

export enum LearnCardRolesEnum {
    learner = 'learner',
    guardian = 'guardian',
    teacher = 'teacher',
    admin = 'admin',
    counselor = 'counselor',
}

export type LearnCardRoleType = {
    id: number;
    title: string;
    description: string;
    type: LearnCardRolesEnum;
};

export const LearnCardRoles: LearnCardRoleType[] = [
    {
        id: 1,
        title: 'Learner',
        description: "I'm a student building my profile and tracking my progress.",
        type: LearnCardRolesEnum.learner,
    },
    {
        id: 2,
        title: 'Guardian',
        description: 'I’m a parent or guardian supporting a learner.',
        type: LearnCardRolesEnum.guardian,
    },
    {
        id: 3,
        title: 'Teacher',
        description: 'I’m an educator working directly with learners.',
        type: LearnCardRolesEnum.teacher,
    },
    {
        id: 4,
        title: 'Admin',
        description: 'I manage systems, data, or user access for my organization.',
        type: LearnCardRolesEnum.admin,
    },
    {
        id: 5,
        title: 'Guidance Counselor',
        description: 'I support learners in planning their educational or career paths.',
        type: LearnCardRolesEnum.counselor,
    },
];
