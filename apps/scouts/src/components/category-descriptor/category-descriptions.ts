import { BoostCategoryOptionsEnum } from 'learn-card-base';

export const CATEGORY_DESCRIPTIONS: {
    [key: BoostCategoryOptionsEnum | string]: {
        id: number;
        text: string;
        type: BoostCategoryOptionsEnum;
    };
} = {
    // Boosts
    [BoostCategoryOptionsEnum.socialBadge]: {
        id: 3,
        text: `Social Boosts are digital awards that can be given 
        for recognition of achievements, statuses, roles, or milestones. 
        They serve to recognize accomplishments, indicate member roles, 
        encourage participation, and foster community engagement. These 
        boosts can denote anything from completing tasks, participating 
        in events, to being part of specific groups. 
        Let your imagination run wild!`,
        type: BoostCategoryOptionsEnum.socialBadge,
    },
    // Troops
    [BoostCategoryOptionsEnum.membership]: {
        id: 7,
        text: `Troops are the foundational units of the scouting 
        experience, representing the scout's group affiliation. 
        Each troop ID includes key details such as the scout's 
        role within the troop and connections to fellow members. 
        Troops help foster a sense of community, collaboration, 
        and shared responsibility among scouts as they work together 
        to achieve goals and participate in activities. Through their 
        troop affiliations, scouts form lasting bonds and take part 
        in meaningful, team-driven experiences.`,
        type: BoostCategoryOptionsEnum.id,
    },
    [BoostCategoryOptionsEnum.meritBadge]: {
        id: 8,
        text: `Merit Badges are earned by scouts to recognize the
        mastery of values, completion of tasks, or achievements in 
        various areas of interest. These badges represent personal 
        growth, hands-on learning, and the pursuit of knowledge in 
        subjects ranging from outdoor survival to community service. 
        Merit Badges symbolize a scout's dedication and commitment 
        to personal development and serve as milestones in their 
        scouting journey.`,
        type: BoostCategoryOptionsEnum.id,
    },
    [BoostCategoryOptionsEnum.skill]: {
        id: 9,
        text: `Competencies represent the knowledge, skills, and 
        abilities you develop through your scouting journey. These
        are the practical capabilities and expertise you gain in
        various areas, from outdoor survival and first aid to leadership
        and teamwork. As you earn competencies, you're not just collecting
        achievements—you're building a foundation of valuable, real-world
        skills that will serve you throughout your life. Each competency is a stepping stone in your personal growth and development as a scout.`,
        type: BoostCategoryOptionsEnum.skill,
    },
};
