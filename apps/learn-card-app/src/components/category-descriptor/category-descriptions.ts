import { BoostCategoryOptionsEnum } from 'learn-card-base';

export const CATEGORY_DESCRIPTIONS: {
    [key: BoostCategoryOptionsEnum | string]: {
        id: number;
        text: string;
        type: BoostCategoryOptionsEnum;
    };
} = {
    [BoostCategoryOptionsEnum.learningHistory]: {
        id: 1,
        text: `Studies are structured programs of learning designed to 
        impart knowledge or skills in specific subjects or areas. 
        They can range from academic disciplines and vocational 
        training to professional development and personal interests. 
        Studies are offered in various formats, including in-person 
        classroom settings, online platforms, or hybrid arrangements.
`,
        type: BoostCategoryOptionsEnum.learningHistory,
    },
    [BoostCategoryOptionsEnum.accommodation]: {
        id: 2,
        text: `Accommodations are adjustments made to the environment or
        processes to enable students, employees, or participants with
        disabilities to participate fully. Examples include providing
        extra time on tests for students with learning disabilities,
        offering sign language interpreters for individuals who are
        deaf, adjusting work schedules for those with medical needs, or
        modifying a workspace for accessibility.`,
        type: BoostCategoryOptionsEnum.accommodation,
    },
    [BoostCategoryOptionsEnum.socialBadge]: {
        id: 3,
        text: `Social Badges are digital icons or labels used on
        online platforms to signify achievements, statuses,
        roles, or milestones of users. They serve to
        recognize accomplishments, indicate member roles,
        encourage participation, and foster community
        engagement. These badges can denote anything from
        completing tasks, participating in events, to being
        part of specific groups.`,
        type: BoostCategoryOptionsEnum.socialBadge,
    },
    [BoostCategoryOptionsEnum.achievement]: {
        id: 4,
        text: `Achievements are milestones or accomplishments that are earned
        through effort, skill, or perseverance. They signify the
        completion of goals, the overcoming of challenges, or the
        recognition of excellence in various aspects of life, including
        personal, professional, educational, or recreational areas.
        Achievements can range from academic degrees, career
        advancements, personal milestones, creative endeavors, to
        competitive victories.`,
        type: BoostCategoryOptionsEnum.achievement,
    },
    [BoostCategoryOptionsEnum.accomplishment]: {
        id: 5,
        text: `A portfolio is a curated collection of an individual’s work, 
        projects, or achievements that showcase their skills, experience, and growth over time.
        It serves as tangible proof of capability and creativity, often spanning professional, 
        academic, or personal domains, and is used to demonstrate value to potential collaborators, 
        employers, or audiences`,
        type: BoostCategoryOptionsEnum.accomplishment,
    },
    [BoostCategoryOptionsEnum.skill]: {
        id: 5,
        text: `Skills are abilities or competencies developed through training,
        practice, or experience that enable an individual to perform
        tasks effectively. They can be classified into hard skills,
        which are specific, teachable, and often quantifiable abilities
        related to a particular task or job, such as coding, welding, or
        foreign language proficiency. Soft skills, on the other hand,
        are interpersonal and cognitive abilities that facilitate human
        interactions, such as communication, problem-solving, and
        teamwork.`,
        type: BoostCategoryOptionsEnum.skill,
    },
    [BoostCategoryOptionsEnum.workHistory]: {
        id: 6,
        text: `Experiences are the knowledge and skills gained from
        involvement in various professional roles and activities
        over time. They encompass the breadth of work-related tasks,
        projects, and responsibilities an individual has undertaken
        within different organizations or as a freelancer.
        Professional experiences contribute significantly to an
        individual's expertise, capabilities, and understanding of
        industry standards and practices.`,
        type: BoostCategoryOptionsEnum.workHistory,
    },
    [BoostCategoryOptionsEnum.id]: {
        id: 7,
        text: `IDs are essential digital or physical credentials used 
        to verify an individual's identity in various contexts. They provide 
        a secure way to store and access personal identification information, 
        enabling access to services, facilities, or systems that require user 
        authentication. Whether used for logging into platforms, verifying age, 
        or gaining entry to secure areas, IDs are a fundamental tool in ensuring 
        privacy, security, and convenience across different domains.`,
        type: BoostCategoryOptionsEnum.id,
    },
    [BoostCategoryOptionsEnum.family]: {
        id: 8,
        text: `Families are connected through shared learning journeys and accomplishments.
        This feature helps guardians organize profiles, manage permissions, and track educational progress. 
        With tools for switching accounts, connecting games, and monitoring engagement styles,
        Families fosters growth and celebrates achievements while offering insights into each member’s learning path.`,
        type: BoostCategoryOptionsEnum.family,
    },
};
