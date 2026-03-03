import React from 'react';

import ShieldChevron from 'learn-card-base/svgs/ShieldChevron';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import User from 'learn-card-base/svgs/User';
import Trophy from 'learn-card-base/svgs/Trophy';
import Graduation from 'learn-card-base/svgs/Graduation';
import Briefcase from 'learn-card-base/svgs/Briefcase';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import ScoutsPledge from 'learn-card-base/svgs/ScoutsPledge';
import ScoutsGlobe from 'learn-card-base/svgs/ScoutsGlobe';
import BoostOutline2, { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import {
    BoostCategoryMetadata,
    BoostCategoryOptionsEnum,
    boostCategoryMetadata,
} from 'learn-card-base';

export enum BoostUserTypeEnum {
    self = 'self',
    someone = 'someone',
}

// ! MUST ALIGN WITH -> learn-card-base/src/helpers -> credentialHelpers.ts -> { CATEGORY_MAP }
// ! MUST ALIGN WITH -> learn-card-base/src/components/issueVC -> constants.ts -> { AchievementTypes }
export const boostVCTypeOptions = {
    [BoostUserTypeEnum.self]: [
        {
            id: 1,
            title: 'Badge',
            IconComponent: ScoutsPledge,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-sp-purple-base',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
    ],
    [BoostUserTypeEnum.someone]: [
        {
            id: 1,
            title: 'Merit Badge',
            IconComponent: ScoutsPledge,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-sp-purple-base',
            type: BoostCategoryOptionsEnum.meritBadge,
        },
        {
            id: 2,
            title: 'Boost',
            IconComponent: BoostOutline2,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-sp-blue-dark-ocean',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
    ],
};

// relevant info has been ported to learn-card-base, but there are some differences...
export const boostCategoryOptions: {
    [key: BoostCategoryOptionsEnum | string]: {
        title: string;
        subTitle?: string;
        value: BoostCategoryOptionsEnum;
        color: string;
        subColor: string;
        IconComponent: React.ReactNode | string;
        CategoryImage: string;
    } & BoostCategoryMetadata;
} = {
    [BoostCategoryOptionsEnum.socialBadge]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.socialBadge],
        title: 'Social Boosts',
        subTitle: 'Social Boost',
        color: 'sp-blue-dark-ocean',
        subColor: 'sp-blue-ocean',
        IconComponent: BlueBoostOutline2,
        CategoryImage: 'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    },
    [BoostCategoryOptionsEnum.achievement]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.achievement],
        color: 'spice-500',
        subColor: 'spice-400',
        IconComponent: Trophy,
        CategoryImage: 'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    },
    [BoostCategoryOptionsEnum.course]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.course],
        CategoryImage: 'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    },
    [BoostCategoryOptionsEnum.job]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.job],
    },
    [BoostCategoryOptionsEnum.id]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.id],
        title: 'Troop',
        color: 'sp-green-base',
        subColor: 'sp-green-light',
        IconComponent: ScoutsGlobe,
        CategoryImage: 'https://cdn.filestackcontent.com/Otl66rNhTFu66mGf96Iq',
    },
    [BoostCategoryOptionsEnum.membership]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.membership],
        title: 'Troop',
        value: BoostCategoryOptionsEnum.membership,
        color: 'sp-green-base',
        subColor: 'sp-green-light',
        IconComponent: ScoutsGlobe,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.skill]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.skill],
        title: 'Skill',
        value: BoostCategoryOptionsEnum.skill,
        color: 'indigo-600',
        subColor: 'indigo-400',
        IconComponent: PuzzlePiece,
        CategoryImage: 'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    },
    [BoostCategoryOptionsEnum.learningHistory]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.learningHistory],
        title: 'Learning History',
        value: BoostCategoryOptionsEnum.learningHistory,
        color: 'emerald-700',
        subColor: 'emerald-500',
        IconComponent: Graduation,
        CategoryImage: 'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    },
    [BoostCategoryOptionsEnum.workHistory]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.workHistory],
        title: 'Work History',
        value: BoostCategoryOptionsEnum.workHistory,
        color: 'rose-600',
        subColor: 'rose-400',
        IconComponent: Briefcase,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    },
    [BoostCategoryOptionsEnum.meritBadge]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.meritBadge],
        title: 'Merit Badge',
        subTitle: 'Merit Badge',
        value: BoostCategoryOptionsEnum.meritBadge,
        color: 'sp-purple-base',
        subColor: 'sp-purple-light',
        IconComponent: ScoutsPledge,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ', // TODO
    },
};

export const CATEGORY_TO_SUBCATEGORY_LIST: {
    [key: BoostUserTypeEnum | string]: {
        title: string;
        presetTitle?: string;
        description?: string;
        criteria?: string;
        image?: string;
        type: any;
    }[];
} = {
    [BoostCategoryOptionsEnum.achievement]: [
        {
            title: 'Generic',
            type: AchievementTypes.Achievement,
        },
        {
            title: 'Formal Award',
            type: AchievementTypes.Award,
        },
        {
            title: 'Online Badge',
            type: AchievementTypes.Badge,
        },
        {
            title: 'Community Service',
            type: AchievementTypes.CommunityService,
        },

        // extended ( Achievement ) category types
        {
            title: 'Credential',
            type: AchievementTypes.Credential,
        },
        {
            title: 'Language',
            type: AchievementTypes.Language,
        },
        {
            title: 'Training',
            type: AchievementTypes.Training,
        },
        {
            title: 'Workshop',
            type: AchievementTypes.Workshop,
        },
        {
            title: 'Upskilling',
            type: AchievementTypes.Upskilling,
        },
    ],
    [BoostCategoryOptionsEnum.id]: [
        // {
        //     title: 'License',
        //     type: AchievementTypes.License,
        // },

        // extended ( ID ) category types
        // {
        //     title: 'Student ID',
        //     type: AchievementTypes.StudentID,
        // },
        {
            title: 'Member ID',
            type: AchievementTypes.MemberID,
        },
        // {
        //     title: 'Member NFT ID',
        //     type: AchievementTypes.MemberNFTID,
        // },
        // {
        //     title: 'Drivers License',
        //     type: AchievementTypes.DriversLicense,
        // },
        // {
        //     title: 'State/National ID',
        //     type: AchievementTypes.StateOrNationalID,
        // },
        // {
        //     title: 'Passport',
        //     type: AchievementTypes.Passport,
        // },
    ],
    [BoostCategoryOptionsEnum.membership]: [
        // Troops 2.0
        {
            title: 'Global',
            type: AchievementTypes.Global,
        },
        {
            title: 'Network',
            type: AchievementTypes.Network,
        },
        {
            title: 'Troop',
            type: AchievementTypes.Troop,
        },
        {
            title: 'Leader',
            type: AchievementTypes.ScoutLeader,
        },
        {
            title: 'Scout',
            type: AchievementTypes.ScoutMember,
        },
        // Troops 2.0

        // {
        //     title: 'Group',
        //     type: AchievementTypes.Group,
        // },
        // {
        //     title: 'Project',
        //     type: AchievementTypes.Project,
        // },
        // {
        //     title: 'Class',
        //     type: AchievementTypes.Class,
        // },
        // {
        //     title: 'School',
        //     type: AchievementTypes.School,
        // },
        // {
        //     title: 'College',
        //     type: AchievementTypes.College,
        // },
        // {
        //     title: 'University',
        //     type: AchievementTypes.University,
        // },
        // {
        //     title: 'Association',
        //     type: AchievementTypes.Association,
        // },
        // {
        //     title: 'Team',
        //     type: AchievementTypes.Team,
        // },
        // {
        //     title: 'Workgroup',
        //     type: AchievementTypes.Workgroup,
        // },
        // {
        //     title: 'Taskforce',
        //     type: AchievementTypes.Taskforce,
        // },
        // {
        //     title: 'Agency',
        //     type: AchievementTypes.Agency,
        // },
        // {
        //     title: 'Company',
        //     type: AchievementTypes.Company,
        // },
        // {
        //     title: 'Organization',
        //     type: AchievementTypes.Organization,
        // },
        // {
        //     title: 'NGO',
        //     type: AchievementTypes.NGO,
        // },
        // {
        //     title: 'Legislative',
        //     type: AchievementTypes.Legislative,
        // },
        // {
        //     title: 'DAO',
        //     type: AchievementTypes.DAO,
        // },
        // {
        //     title: 'Community',
        //     type: AchievementTypes.Community,
        // },
        // {
        //     title: 'Movement',
        //     type: AchievementTypes.Movement,
        // },
        // {
        //     title: 'Club',
        //     type: AchievementTypes.Club,
        // },
    ],
    [BoostCategoryOptionsEnum.skill]: [
        {
            title: 'Assessment',
            type: AchievementTypes.Assessment,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.Certificate,
        },
        {
            title: 'Certification',
            type: AchievementTypes.Certification,
        },
        {
            title: 'Competency',
            type: AchievementTypes.Competency,
        },
        {
            title: 'MicroCredential',
            type: AchievementTypes.MicroCredential,
        },
    ],
    [BoostCategoryOptionsEnum.learningHistory]: [
        {
            title: 'Assignment',
            type: AchievementTypes.Assignment,
        },
        {
            title: 'Associate Degree',
            type: AchievementTypes.AssociateDegree,
        },
        {
            title: 'Bachelor Degree',
            type: AchievementTypes.BachelorDegree,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.CertificateOfCompletion,
        },
        {
            title: 'Course',
            type: AchievementTypes.Course,
        },
        {
            title: 'Co-Curricular',
            type: AchievementTypes.CoCurricular,
        },
        {
            title: 'Research Doctorate',
            type: AchievementTypes.ResearchDoctorate,
        },

        // extended ( Learning History ) category types
        {
            title: 'Report Card',
            type: AchievementTypes.ReportCard,
        },
        {
            title: 'Micro Degree',
            type: AchievementTypes.MicroDegree,
        },
    ],
    [BoostCategoryOptionsEnum.workHistory]: [
        {
            title: 'Apprenticeship',
            type: AchievementTypes.ApprenticeshipCertificate,
        },
        {
            title: 'Fieldwork',
            type: AchievementTypes.Fieldwork,
        },
        {
            title: 'Journeyman',
            type: AchievementTypes.JourneymanCertificate,
        },
        {
            title: 'Master Certificate',
            type: AchievementTypes.MasterCertificate,
        },

        // extended ( Work History ) category types
        {
            title: 'Job',
            type: AchievementTypes.Job,
        },
        {
            title: 'Internship',
            type: AchievementTypes.Internship,
        },
        {
            title: 'Volunteer',
            type: AchievementTypes.Volunteer,
        },
        {
            title: 'Fellowship',
            type: AchievementTypes.Fellowship,
        },
        {
            title: 'Board',
            type: AchievementTypes.Board,
        },
    ],
    // copied over achievement sub categories for now
    [BoostCategoryOptionsEnum.socialBadge]: [
        // {
        //     title: 'Risk Taker',
        //     type: AchievementTypes.RiskTaker,
        // },
        // {
        //     title: 'Opportunist',
        //     type: AchievementTypes.Opportunist,
        // },
        // {
        //     title: 'Cool Cat',
        //     type: AchievementTypes.CoolCat,
        // },
        // {
        //     title: 'Tastemaker',
        //     type: AchievementTypes.Tastemaker,
        // },
        // {
        //     title: 'Trailblazer',
        //     type: AchievementTypes.Trailblazer,
        // },
        // {
        //     title: 'Influencer',
        //     type: AchievementTypes.Influencer,
        // },
        // {
        //     title: 'Connector',
        //     type: AchievementTypes.Connector,
        // },
        // {
        //     title: 'Maven',
        //     type: AchievementTypes.Maven,
        // },
        // {
        //     title: 'Trendsetter',
        //     type: AchievementTypes.Trendsetter,
        // },
        // {
        //     title: 'Organizer',
        //     type: AchievementTypes.Organizer,
        // },
        // {
        //     title: 'Moderator',
        //     type: AchievementTypes.Moderator,
        // },
        // {
        //     title: 'Leader',
        //     type: AchievementTypes.Leader,
        // },
        // {
        //     title: 'Catalyst',
        //     type: AchievementTypes.Catalyst,
        // },
        // {
        //     title: 'Expert',
        //     type: AchievementTypes.Expert,
        // },
        // {
        //     title: 'Enthusiast',
        //     type: AchievementTypes.Enthusiast,
        // },
        // {
        //     title: 'Ambassador',
        //     type: AchievementTypes.Ambassador,
        // },
        // {
        //     title: 'Aficionado',
        //     type: AchievementTypes.Aficionado,
        // },
        // {
        //     title: 'Psychic',
        //     type: AchievementTypes.Psychic,
        // },
        // {
        //     title: 'Magician',
        //     type: AchievementTypes.Magician,
        // },
        // {
        //     title: 'Charmer',
        //     type: AchievementTypes.Charmer,
        // },
        // {
        //     title: 'Cowboy',
        //     type: AchievementTypes.Cowboy,
        // },
        // {
        //     title: 'Perfectionist',
        //     type: AchievementTypes.Perfectionist,
        // },
        // {
        //     title: 'Enabler',
        //     type: AchievementTypes.Enabler,
        // },
        // {
        //     title: 'Maverick',
        //     type: AchievementTypes.Maverick,
        // },
        // {
        //     title: 'Informer',
        //     type: AchievementTypes.Informer,
        // },
        // {
        //     title: 'Wanderer',
        //     type: AchievementTypes.Wanderer,
        // },
        // {
        //     title: 'Propagator',
        //     type: AchievementTypes.Propagator,
        // },
        // {
        //     title: 'Hot Shot',
        //     type: AchievementTypes.HotShot,
        // },
        // {
        //     title: 'Sage',
        //     type: AchievementTypes.Sage,
        // },
        // {
        //     title: 'Change Maker',
        //     type: AchievementTypes.ChangeMaker,
        // },
        // {
        //     title: 'Challenger',
        //     type: AchievementTypes.Challenger,
        // },
        // {
        //     title: 'Team Player',
        //     type: AchievementTypes.TeamPlayer,
        // },
        // {
        //     title: 'Star',
        //     type: AchievementTypes.Star,
        // },
        // {
        //     title: 'Party Animal',
        //     type: AchievementTypes.PartyAnimal,
        // },
        // {
        //     title: 'Trouble Maker',
        //     type: AchievementTypes.TroubleMaker,
        // },
        // {
        //     title: 'Party Planner',
        //     type: AchievementTypes.PartyPlanner,
        // },
        // {
        //     title: 'Challenge Maker',
        //     type: AchievementTypes.ChallengeMaker,
        // },
        // {
        //     title: 'Promoter',
        //     type: AchievementTypes.Promoter,
        // },
        // {
        //     title: 'Doer',
        //     type: AchievementTypes.Doer,
        // },
        // {
        //     title: 'Entertainer',
        //     type: AchievementTypes.Entertainer,
        // },
        // {
        //     title: 'Connoisseur',
        //     type: AchievementTypes.Connoisseur,
        // },

        // ScoutPass official Badges
        {
            title: 'Adventurer',
            presetTitle: 'Adventure Ally',
            type: AchievementTypes.Adventurer,
            description: 'For the Scout who is always up for an adventure!',
            criteria:
                'The Adventure Ally Badge is awarded to the Scout who consistently exhibits enthusiasm, courage, and commitment in undertaking new and challenging adventures.',
        },
        {
            title: 'Unifier',
            presetTitle: 'Unity Builder',
            type: AchievementTypes.Unifier,
            description:
                'For the Scout who helps build bridges and create a safe environment, no matter what!',
            criteria:
                'The Unity Builder Badge is awarded to the Scout who demonstrates exceptional effort in promoting harmony and cooperation among diverse groups, consistently fostering unity and understanding in all situations.',
        },
        {
            title: 'Protector',
            presetTitle: 'Sunscreen Sergeant',
            type: AchievementTypes.Protector,
            description: 'For the Scout who is always prepared for the sun!',
            criteria:
                'The Sunscreen Sergeant Badge is awarded to the Scout who consistently brings and applies sunscreen during all outdoor activities, reminding others to do the same to ensure sun safety.',
        },
        {
            title: 'Jester',
            presetTitle: 'Jamboree Jester',
            type: AchievementTypes.Jester,
            description: 'For the Scout who is always making people laugh!',
            criteria:
                'The Jamboree Jester Badge is awarded to the Scout who consistently brings joy and laughter to their troop, making the camp a more enjoyable experience with their humor and high spirits.',
        },
        {
            title: 'Survivor',
            presetTitle: "Bear Grylls' Protégé",
            type: AchievementTypes.Survivor,
            description: 'For the Scout who just may be the next Bear Grylls!',
            criteria:
                "Earn the Bear Grylls' Protégé Badge by demonstrating exceptional survival skills, leadership, resilience in extreme conditions, and an extraordinary commitment to outdoor exploration and adventure.",
        },
        {
            title: 'Knot Master',
            presetTitle: 'Friendship Knot Fanatic',
            type: AchievementTypes.KnotMaster,
            description: 'For the Scout tying friendship knots every day!',
            criteria:
                'The Friendship Knot Fanatic Badge is awarded to the Scout demonstrating a consistent and passionate dedication to tying friendship knots.',
        },
        {
            title: 'Change Maker',
            presetTitle: 'Development Go-al Getter',
            type: AchievementTypes.ChangeMaker,
            description: 'For the Scout dedicated to a better world by achieving the SDGs!',
            criteria:
                'The Development Go-al Getter Badge is earned by a Scout who actively contributes to achieving the Sustainable Development Goals (SDGs) through community service.',
        },
        {
            title: 'Diplomat',
            presetTitle: 'Neckerchief Negotiator',
            type: AchievementTypes.Diplomat,
            description: 'For the Scout who is constantly trading scarves!',
            criteria:
                'The Neckerchief Negotiator badge is awarded to the Scout who showcases consistent engagement and enthusiasm in exchanging scarves with others, promoting camaraderie and diversity.',
        },
        {
            title: 'Optimist',
            presetTitle: 'Sunshine Scout',
            type: AchievementTypes.Optimist,
            description: 'For the Scout always bringing a positive, sunshiney vibe!',
            criteria:
                'Earn the Sunshine Scout badge by consistently spreading positivity and uplifting spirits in your Scout group.',
        },
        {
            title: 'Mosquito Magnet',
            presetTitle: 'Mosquito Magnet',
            type: AchievementTypes.MosquitoMagnet,
            description: 'For the Scout who just can’t get a break from mosquitoes!',
            criteria:
                'The Mosquito Magnet badge is earned by a Scout who consistently demonstrates resilience and a positive attitude when dealing with pesky mosquitoes during outdoor activities.',
        },
        {
            title: 'Stylist',
            presetTitle: 'Outdoor Fashionista',
            type: AchievementTypes.Stylist,
            description: 'For the Scout who dresses well, no matter where they go!',
            criteria:
                'Earn the Outdoor Fashionista badge by consistently showcasing a unique sense of style and creativity in your outdoor attire while participating in scouting activities.',
        },
        {
            title: 'Samaritan',
            presetTitle: 'Helping Hand Hero',
            type: AchievementTypes.Samaritan,
            description: 'For the Scout always willing lend a helping hand!',
            criteria:
                'The Helping Hand Hero badge is earned by a Scout who consistently demonstrates their readiness to assist others, embodying the spirit of service and camaraderie.',
        },
        {
            title: 'Innovator',
            presetTitle: 'Poncho Prodigy',
            type: AchievementTypes.Innovator,
            description: 'For the Scout who is never afraid of a little rain!',
            criteria:
                'Earn the Poncho Prodigy badge by demonstrating resilience and adaptability in outdoor activities, regardless of weather conditions.',
        },
        {
            title: 'Prankster',
            presetTitle: 'Mischief Maestro',
            type: AchievementTypes.Prankster,
            description: 'For the Scout who keeps getting into a little harmless trouble!',
            criteria:
                'Earn the Mischief Maestro badge by demonstrating an uncanny knack for playful and harmless mischief, providing a spark of unexpected fun in Scout activities.',
        },
        {
            title: 'Inspirer',
            presetTitle: 'Motivation Maven',
            type: AchievementTypes.Inspirer,
            description: 'For the Scout who keeps us all motivated and excited!',
            criteria:
                'Earn the Motivation Maven badge by consistently inspiring and energizing your group with your positive spirit and enthusiasm.',
        },
        {
            title: 'Organizer',
            presetTitle: 'Master Coordinator',
            type: AchievementTypes.Organizer,
            description: 'For the Scout helping keep things coordinated and organised - thank you!',
            criteria:
                'Earn the Master Coordinator badge by demonstrating leadership, exceptional organizational skills, and taking initiative to ensure smooth and effective coordination within Scout activities.',
        },
        {
            title: 'Supporter',
            presetTitle: 'Supportive Squad',
            type: AchievementTypes.Supporter,
            description: 'For the Scout who is a supportive friend to all!',
            criteria:
                'Earn the Supportive Squad badge by consistently demonstrating kindness, empathy and support towards your fellow Scouts, fostering a positive and inclusive group environment.',
        },
        {
            title: 'Rested',
            presetTitle: 'Napping Ninja',
            type: AchievementTypes.Rested,
            description: 'For the Scout who can nap anywhere!',
            criteria:
                'The Napping Ninja badge is earned by the Scout who demonstrates a unique ability to take a nap in various settings, embracing the true spirit of adaptability and relaxation.',
        },
        {
            title: 'Celebrator',
            presetTitle: 'Jamboree Joybringer',
            type: AchievementTypes.Celebrator,
            description: 'For the Scout who brings joy everywhere they go!',
            criteria:
                'Earn the Jamboree Joybringer badge by embodying positivity and bringing joy to your fellow Scouts during Scout camp or events.',
        },
        {
            title: 'Trustworthy',
            presetTitle: 'Reliable Buddy',
            type: AchievementTypes.Trustworthy,
            description: 'For the Scout who is always reliable and there for their friends!',
            criteria:
                'Earn the Reliable Buddy badge by consistently demonstrating reliability and providing support to fellow Scouts whenever needed, helping create safe environments for everyone.',
        },
        // ! deprecated
        // {
        //     title: 'K-Star',
        //     presetTitle: 'K-POP Superstar',
        //     type: AchievementTypes.KStar,
        //     description: 'For the Scout who is a K-POP super fan and is so happy to be in Korea!',
        //     criteria:
        //         'The K-POP Superstar badge is awarded to the Scout who demonstrates passionate enthusiasm for K-POP and revels in the cultural experience of being in Korea.',
        // },
        {
            title: 'Connector',
            presetTitle: 'Social Navigator',
            type: AchievementTypes.Connector,
            description: 'For the most social Scout I know!',
            criteria:
                'Earn the Social Navigator badge by demonstrating exceptional skills in fostering friendships, promoting collaboration, and enhancing group dynamics within the Scout community.',
        },
        {
            title: 'Polyglot',
            presetTitle: 'Language Lover',
            type: AchievementTypes.Polyglot,
            description:
                'For the Scout who is making a great effort to learn and speak other languages - I’m impressed!',
            criteria:
                'Earn the Language Lover badge by demonstrating consistent effort and progress in learning and speaking other languages.',
        },
        {
            title: 'Trader',
            presetTitle: 'Patch Trading Pro',
            type: AchievementTypes.Trader,
            description: 'For the Scout who is trading badges left and right!',
            criteria:
                'Earn the Patch Trading Pro badge by demonstrating enthusiastic participation in the exchange of Scout patches with others.',
        },
        {
            title: 'Resilient',
            presetTitle: 'Resilience Rockstar',
            type: AchievementTypes.Resilient,
            description: 'For the Scout who excels in bouncing back from tough situations!',
            criteria:
                'The Resilience Rockstar badge is earned by the Scout who consistently demonstrates remarkable tenacity and adaptability in the face of challenges.',
        },
        {
            title: 'Fun-maker',
            presetTitle: 'Master of Fun',
            type: AchievementTypes.FunMaker,
            description: 'Shoutout to the Scout making our camp fun and exciting!',
            criteria:
                'Earn the Master of Fun badge by actively contributing to the enjoyment and engagement of your camp with creative and lively activities.',
        },
        {
            title: 'Tentmate',
            presetTitle: 'Tentmate of the Year',
            type: AchievementTypes.TentMate,
            description: 'Shoutout to the Scout who is the best tentmate I could ask for!',
            criteria:
                'Earn the Tentmate of the Year badge by demonstrating exceptional camaraderie, respect, and helpfulness as a tentmate at Scout camp.',
        },
        {
            title: 'Pack Master',
            presetTitle: 'Packing Prodigy',
            type: AchievementTypes.PackMaster,
            description: 'Shoutout to the Scout who packs like a pro - please teach me your ways!',
            criteria:
                'Earn the Packing Prodigy badge by demonstrating exceptional and efficient packing skills during scouting adventures.',
        },
        {
            title: 'Later Bird',
            presetTitle: 'Sunrise Snoozer',
            type: AchievementTypes.LaterBird,
            description: 'Shoutout to the Scout who manages to sleep late every morning!',
            criteria:
                'Earn the Sunrise Snoozer badge by demonstrating your ability to indulge in extra morning slumber, consistently enjoying a late rise.',
        },
        {
            title: 'Snoozer',
            presetTitle: 'Lights Out Leader',
            type: AchievementTypes.Snoozer,
            description: 'Shoutout to the Scout who always falls asleep first!',
            criteria:
                'Earn the Lights Out Leader badge by being the Scout who consistently prioritizes rest and is often the first to call it a night during camp.',
        },
        // {
        //     title: 'Sub-Hero',
        //     presetTitle: 'Subcamp Superhero',
        //     type: AchievementTypes.SubHero,
        //     description: 'Shoutout to the hero of our subcamp!',
        //     criteria:
        //         'Earn the Subcamp Superhero badge by demonstrating exemplary community engagement, leadership, and support within your subcamp.',
        // },
        {
            title: 'Connoisseur',
            presetTitle: 'Camp Setup Connoisseur',
            type: AchievementTypes.Connoisseur,
            description:
                'Shoutout to the Scout who has the most useful and creative camp setup ideas!',
            criteria:
                'Earn the Camp Setup Connoisseur badge by demonstrating exceptional creativity and practicality in establishing and organizing your campsite.',
        },
        {
            title: 'Snore Master',
            presetTitle: 'Sleep Symphony Soloist',
            type: AchievementTypes.SnoreMaster,
            description: 'Shoutout to the Scout who snores through the night - we love you anyway!',
            criteria:
                'The Sleep Symphony Soloist badge is awarded to the Scout who fearlessly embraces the chorus of the night, proving that sleep and camping can harmoniously coexist.',
        },
        {
            title: 'Insomniac',
            presetTitle: 'No-Sleep Nomad',
            type: AchievementTypes.Insomniac,
            description: 'Shoutout to the Scout who never seems to sleep!',
            criteria:
                'Earn the No-Sleep Nomad badge by demonstrating unwavering commitment and active participation in scouting activities at all hours of the day and night.',
        },
        {
            title: 'Early Bird',
            presetTitle: 'Rise-and-Shine Champ',
            type: AchievementTypes.EarlyBird,
            description: 'Shoutout to the Scout who is always up first with loads of energy!',
            criteria:
                'The Rise-and-Shine Champ badge is awarded to the Scout who consistently exhibits early-rising enthusiasm and high energy at the start of each day.',
        },
        {
            title: 'Chef',
            presetTitle: 'Camp Masterchef',
            type: AchievementTypes.Chef,
            description:
                'Shoutout to the masterchef of our camp, making sure every meal is awesome!',
            criteria:
                'Earn the Camp Masterchef badge by showcasing culinary creativity and consistently delivering enjoyable meals within your camp.',
        },
        {
            title: 'Griller',
            presetTitle: 'Charcoal Chef',
            type: AchievementTypes.Griller,
            description:
                'Shoutout to the Scout who tried their best but charred our meal - we love you anyway!',
            criteria:
                'The Charcoal Chef badge is earned by the Scout who demonstrates good effort in outdoor cooking, regardless of the result, emphasizing the learning experience and the spirit of trying.',
        },
        // {
        //     title: 'Foodie',
        //     presetTitle: 'Food House Foodie',
        //     type: AchievementTypes.Foodie,
        //     description: 'Shoutout to the Scout dedicated to trying every food house!',
        //     criteria:
        //         'Earn the Food House Foodie badge by exploring and tasting diverse cuisines from a variety of food houses at the Jamboree.',
        // },
        {
            title: 'Hydrator',
            presetTitle: 'Hydration Hero',
            type: AchievementTypes.Hydrator,
            description:
                'Shoutout to the Scout who is always prepared, hydrated and looking out for their friends!',
            criteria:
                "Earn the Hydration Hero badge by demonstrating a commitment to being prepared, hydrated, and caring for others' well-being.",
        },
        {
            title: 'Rescuer',
            presetTitle: 'Snack Attack Saver',
            type: AchievementTypes.Rescuer,
            description:
                'Shoutout to the Scout who always has snacks on hand - you are a true hero!',
            criteria:
                'Earn the Snack Attack Saver badge by being the ultimate snacker with a stash of treats ready to share at all times.',
        },
        {
            title: 'Scout Influencer',
            presetTitle: '@WorldScouting Star',
            type: AchievementTypes.ScoutInfluencer,
            description:
                'Thanks for following @worldscouting! We’re so happy to have you in our online #Scouts community!',
            criteria:
                'Earn the @WorldScouting Star badge for following @worldscouting and being a valued member of the online #Scouts community.',
        },
        {
            title: 'Snapchat Scout',
            presetTitle: 'Snapchat Savant',
            type: AchievementTypes.SnapchatScout,
            description: 'For the one who is the master of all things #Scouts on Snapchat!',
            criteria:
                'Earn the Snapchat Savant badge by demonstrating expertise in all things #Scouts on Snapchat.',
        },
        {
            title: 'Insta Guru',
            presetTitle: 'Instagram Guru',
            type: AchievementTypes.InstaGuru,
            description: 'For the one who makes sure we have great #Scouts memories on Instagram!',
            criteria:
                'Earn the Instagram Guru badge by showcasing memorable #Scouts moments on Instagram!',
        },
        {
            title: 'TickTrend Setter',
            presetTitle: 'TikTok Trooper',
            type: AchievementTypes.TickTrendSetter,
            description: 'For the one who makes such fun #Scouts videos on TikTok!',
            criteria:
                'Earn the TikTok Trooper badge by creating entertaining #Scouts videos on TikTok.',
        },
    ],
    // copied over learning history types for now
    [BoostCategoryOptionsEnum.course]: [
        {
            title: 'Assignment',
            type: AchievementTypes.Assignment,
        },
        {
            title: 'Associate Degree',
            type: AchievementTypes.AssociateDegree,
        },
        {
            title: 'Bachelor Degree',
            type: AchievementTypes.BachelorDegree,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.CertificateOfCompletion,
        },
        {
            title: 'Course',
            type: AchievementTypes.Course,
        },
        {
            title: 'Co-Curricular',
            type: AchievementTypes.CoCurricular,
        },
        {
            title: 'Research Doctorate',
            type: AchievementTypes.ResearchDoctorate,
        },

        // extended ( Learning History ) category types
        {
            title: 'Report Card',
            type: AchievementTypes.ReportCard,
        },
        {
            title: 'Micro Degree',
            type: AchievementTypes.MicroDegree,
        },
    ],
    // copied over work history sub categories for now
    [BoostCategoryOptionsEnum.job]: [
        {
            title: 'Apprenticeship',
            type: AchievementTypes.ApprenticeshipCertificate,
        },
        {
            title: 'Fieldwork',
            type: AchievementTypes.Fieldwork,
        },
        {
            title: 'Journeyman',
            type: AchievementTypes.JourneymanCertificate,
        },
        {
            title: 'Master Certificate',
            type: AchievementTypes.MasterCertificate,
        },

        // extended ( Work History ) category types
        {
            title: 'Job',
            type: AchievementTypes.Job,
        },
        {
            title: 'Internship',
            type: AchievementTypes.Internship,
        },
        {
            title: 'Volunteer',
            type: AchievementTypes.Volunteer,
        },
        {
            title: 'Fellowship',
            type: AchievementTypes.Fellowship,
        },
        {
            title: 'Board',
            type: AchievementTypes.Board,
        },
    ],
    [BoostCategoryOptionsEnum.meritBadge]: [
        {
            title: 'Archery',
            presetTitle: 'Archery',
            type: AchievementTypes.Archery,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Archery-qjjk7nbqjdp20a8bkyxk52eqcw9x9weiflmucyyp28.png',
            description:
                'Archery is a fun way for Scouts to exercise minds as well as bodies, developing a steady hand, a good eye, and a disciplined mind. This merit badge can provide a thorough introduction to those who are new to the bow and arrow—but even for the experienced archer, earning the badge can help to increase the understanding and appreciation of archery.',
            criteria: `1. Do the following:
    (a) Explain the five range safety rules.
    (b) Explain the four whistle commands used on the range.
    (c) Explain how to safely remove arrows from the target and return them to your quiver
    (d) Tell about your local and state laws for owning and using archery equipment.
2. Do the following:
    (a) Name and point to the parts of an arrow.
    (b) Describe three or more different types of arrows.
    (c) Name the four principle materials for making arrow shafts.
    (d) Do ONE of the following:
    (1) Make a complete arrow from a bare shaft using appropriate equipment available to you.
    (2) To demonstrate arrow repair, inspect the shafts and prepare and replace at least three vanes, one point, and one nock. You may use as many arrows as necessary to accomplish this. The repairs can be done on wood, fiberglass, or aluminum arrows.
    (e) Explain how to properly care for and store arrows.
3. Do the following:
    (a) Explain the proper use, care, and storage of, as well as the reasons for using tabs, arm guards, shooting gloves, and quivers.
    (b) Explain the following terms: draw length, draw weight, mechanical release and barebow.
4. Explain the following:
    (a) The difference between an end and a round
    (b) The differences among field, target, and 3-D archery
    (c) How the five-color World Archery Federation target is scored
    (d) How the National Field Archery Association (NFAA) black-and-white field targets and blue indoor targets are scored
5. Do ONE of the following options.
    A.) Option A - Using a Recurve Bow or Longbow
        (a) Name and point to the parts of the recurve or longbow you are shooting.
        (b) Explain how to properly care for and store recurve bows and longbows.
        (c) Demonstrate and explain USA Archery's "Steps of Shooting" for the bow you are shooting.
        (d) Demonstrate the proper way to string a recurve bow or longbow.
        (e) Using a bow square, locate and mark with dental floss, crimp-on, or other method, the nocking point on the bowstring of the bow you are using.
        (f) Do ONE of the following:
            (1) Using a recurve bow or longbow and arrows with a finger release, shoot a single round of one of the following BSA, USA Archery, or NFAA rounds:
                (a) An NFAA field round of 14 targets and make a score of 60 points
                (b) A BSA Scout field round of 14 targets and make a score of 80 points
                (c) World Archery/USA Archery indoor* round and make a score of 80 points
                (d) An NFAA indoor* round and make a score of 50 points
            (2) Shooting 30 arrows in five-arrow ends at an 80-centimeter (32-inch) five-color target at 10 yards and using the 10 scoring regions, make a score of 150.
            (3) As a member of the USA Archery Junior Olympic Archery Development program (JOAD), earn your indoor or outdoor green, purple, and gray achievement award pins using a recurve bow or longbow.
            (4) As a member of the NFAA's Junior Division, earn a Cub or Youth 100-score Progression Patch.
B.) Option B - Using a Compound Bow
    (a) Name and point to the parts of the compound bow you are shooting.
    (b) Explain how to properly care for and store compound bows.
    (c) Demonstrate and explain USA Archery's "Steps of Shooting" for the bow you are shooting.
    (d) Explain why it is necessary to have the string or cable on a compound bow replaced at an archery shop.
    (e) Locate and mark with dental floss, crimp-on, or other method, the nocking point on the bowstring of the bow you are using.
    (f) Do ONE of the following:
        (1) Using a compound bow and arrows with a finger release, shoot a single round of ONE of the following BSA, NAA,or NFAA rounds:
            (a) An NFAA field round of 14 targets and make a score of 70 points
            (b) A BSA Scout field round of 14 targets and make a score of 90 points
            (c) A World Archery/USA Archery indoor* round and make a score of 90 points
            (d) An NFAA indoor* round and make a score of 60 points
        (2) Shooting at an 80-centimeter (32-inch) five-color target using the 10 scoring regions, make a minimum score of 160. Accomplish this in the following manner:
            Shoot 15 arrows in five-arrow ends, at a distance of 10 yards
            AND
            Shoot 15 arrows in five-arrow ends, at a distance of 15 yards.
        (3) As a member of the USA Archery Junior Olympic Archery Development program (JOAD), earn your indoor or outdoor green, purple, and gray achievement award pins using a compound bow.
        (4) As a member of the NFAA's Junior Division, earn a Cub or Youth 100-score Progression Patch.`,
        },
        {
            title: 'Astronomy',
            presetTitle: 'Astronomy',
            type: AchievementTypes.Astronomy,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Astronomy-qjjk7nbqjdp20a8bkyxk52eqcw9x9weiflmucyyp28.png',
            description:
                'In learning about astronomy, Scouts study how activities in space affect our own planet and bear witness to the wonders of the night sky: the nebulae, or giant clouds of gas and dust where new stars are born; old stars dying and exploding; meteor showers and shooting stars; the moon, planets, and a dazzling array of stars.',
            criteria: `1. Do the following:
    (a) Explain to your counselor the most likely hazards you may encounter while participating in astronomy activities, and what you should do to anticipate, help prevent, mitigate, and respond to these hazards.
    (b) Explain first aid for injuries or illnesses such as heat and cold reactions, dehydration, bites and stings, and damage to your eyes that could occur during observation.
    (c) Describe the proper clothing and other precautions for safely making observations at night and in cold weather.
    (d) Explain how to safely observe the Sun, objects near the Sun and solar eclipses.
2. Explain what light pollution is and how it and air pollution affect astronomy.
3. With the aid of diagrams (or real telescopes if available), do each of the following:
    (a) Explain why binoculars and telescopes are important astronomical tools. Demonstrate or explain how these tools are used.
    (b) Describe the similarities and differences of several types of astronomical telescopes, including at least one that observes light beyond the visible part of the spectrum (i.e., radio, X-ray, ultraviolet, or infrared).
    (c) Explain the purposes of at least three instruments used with astronomical telescopes.
    (d) Describe the proper care and storage of telescopes and binoculars both at home and in the field.
4. Do the following*:
    (a) Identify in the sky at least 10 constellations, at least four of which are in the zodiac.
    (b) Identify in the sky at least eight conspicuous stars, five of which are of magnitude 1 or brighter.
    (c) Make two sketches of the Big Dipper. In one sketch, show the Big Dipper's orientation in the early evening sky. In another sketch, show its position several hours later. In both sketches, show the North Star and the horizon. Record the date and time each sketch was made.
    (d) Explain what we see when we look at the Milky Way.
5. Do the following:
    (a) List the names of the five most visible planets. Explain which ones can appear in phases similar to lunar phases and which ones cannot, and explain why.
    (b) Using the Internet (with your parent or guardian's permission) and other resources, find out when each of the five most visible planets that you identified in requirement 5a will be observable in the evening sky during the next 12 months, then compile this information in the form of a chart or table.
    (c) Describe the motion of the planets across the sky.
    (d) Observe a planet and describe what you saw.
6. Do the following:
    (a) Sketch the face of the Moon and indicate at least five seas and five craters. Label these landmarks.
    (b) Sketch the phase and position of the Moon, at the same hour and place, for four nights within a one-week period. Include landmarks on the horizon such as hills, trees, and buildings. Explain the changes you observe.
    (c) List the factors that keep the Moon in orbit around Earth.
    (d) With the aid of diagrams, explain the relative positions of the Sun, Earth, and the Moon at the times of lunar and solar eclipses, and at the times of new, first-quarter, full, and last-quarter phases of the Moon.
7. Do the following:
    (a) Describe the composition of the Sun, its relationship to other stars, and some effects of its radiation on Earth's weather and communications.
    (b) Define sunspots and describe some of the effects they may have on solar radiation.
    (c) Identify at least one red star, one blue star, and one yellow star (other than the Sun). Explain the meaning of these colors.
8. With your counselor's approval and guidance, do ONE of the following:
    (a) Visit a planetarium or astronomical observatory. Submit a written report, a scrapbook, or a video presentation afterward to your counselor that includes the following information:
        Activities occurring there
        Exhibits and displays you saw
        Telescopes and other instruments being used
        Celestial objects you observed
    (b) Plan and participate in a three-hour observation session that includes using binoculars or a telescope. List the celestial objects you want to observe, and find each on a star chart or in a guidebook. Prepare a log or notebook. Discuss with your counselor what you hope to observe prior to your observation session. Review your log or notebook with your counselor afterward.**
    (c) Plan and host a star party for your Scout troop or other group such as your class at school. Use binoculars or a telescope to show and explain celestial objects to the group.
    (d) Help an astronomy club in your community hold a star party that is open to the public.
    (e) Personally take a series of photographs or digital images of the movement of the Moon, a planet, an asteroid, meteor, or a comet. In your visual display, label each image and include the date and time it was taken. Show all positions on a star chart or map. Show your display at school or at a troop meeting. Explain the changes you observed.
9. Find out about three career opportunities in astronomy. Pick one and find out the education, training, and experience required for this profession. Discuss this with your counselor, and explain why this profession might interest you.`,
        },
        {
            title: 'Chess',
            presetTitle: 'Chess',
            type: AchievementTypes.Chess,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Chess-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            description:
                'Chess is among the oldest board games in the world, and it ranks among the most popular games ever created. Chess is played worldwide—even over the Internet. Players meet for fun and in competition, everywhere from kitchen tables and park benches to formal international tournaments.',
            criteria: `1. Discuss with your merit badge counselor the history of the game of chess. Explain why it is considered a game of planning and strategy.
2. Discuss with your merit badge counselor the following:
    (a) The benefits of playing chess, including developing critical thinking skills, concentration skills, and decision-making skills, and how these skills can help you in other areas of your life
    (b) Sportsmanship and chess etiquette
3. Demonstrate to your counselor that you know each of the following. Then, using Scouting's Teaching EDGE*, teach someone (preferably another Scout) who does not know how to play chess:
    (a) The name of each chess piece
    (b) How to set up a chessboard
    (c) How each chess piece moves, including castling and en passant captures
4. Do the following:
    (a) Demonstrate scorekeeping using the algebraic system of chess notation.
    (b) Discuss the differences between the opening, the middle game, and the endgame.
    (c) Explain four opening principles.
    (d) Explain the four rules for castling.
    (e) On a chessboard, demonstrate a "scholar's mate" and a "fool's mate."
    (f) Demonstrate on a chessboard four ways a chess game can end in a draw.
5. Do the following:
    (a) Explain four of the following elements of chess strategy: exploiting weaknesses, force, king safety, pawn structure, space, tempo, time.
    (b) Explain any five of these chess tactics: clearance sacrifice, decoy, discovered attack, double attack, fork, interposing, overloading, overprotecting, pin, remove the defender, skewer, zwischenzug.
    (c) Set up a chessboard with the white king on e1, the white rooks on a1 and h1, and the black king on e5. With White to move first, demonstrate how to force checkmate on the black king.
    (d) Set up and solve five direct-mate problems provided by your merit badge counselor.
6. Do ONE of the following:
    (a) Play at least three games of chess with other Scouts and/or your merit badge counselor. Replay the games from your score sheets and discuss with your counselor how you might have played each game differently.
    (b) Play in a scholastic (youth) chess tournament and use your score sheets from that tournament to replay your games with your merit badge counselor. Discuss with your counselor how you might have played each game differently.
    (c) Organize and run a chess tournament with at least four players, plus you. Have each competitor play at least two games.`,
        },
        {
            title: 'Dog Care',
            presetTitle: 'Dog Care',
            type: AchievementTypes.DogCare,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/DogCare-qjjk7nbqjdp20a8bkyxk52eqcw9x9weiflmucyyp28.png',
            description:
                'The love and interdependence between humans and dogs has endured for thousands of years. Evidence suggests that dogs and humans started relying on each other thousands of years ago. Today, dogs are our coworkers and companions. They assist search-and-rescue teams, law enforcement officers, hunters, farmers, and people with disabilities. They also play with us and keep us company.',
            criteria: `1. Do the following:
    (a) Briefly discuss the historical origin and domestication of the dog.
    (b) Describe some common characteristics of the dogs that make up each of the seven major dog groups.
    (c) Tell some specific characteristics of seven breeds of dogs (one from each major group), OR give a short history of one breed.
2. Point out on a dog or a sketch at least 10 body parts. Give the correct name of each one.
3. Do the following:
    (a) Explain the importance of house-training, obedience training, and socialization training for your dog.
    (b) Explain what "responsible pet ownership" means.
    (c) Explain what issues (including temperament) must be considered when deciding on what breed of dog to get as a family pet.
4. For two months, keep and care for your dog.* Maintain a log of your activities during this period that includes these items: feeding schedule, types of food used, amount fed, exercise periods, training schedule, a weekly body weight record, grooming and bathing schedules, veterinary care, if necessary, and costs. Also include a brief description of the type of housing/shelter arrangements you have for your dog.
5. Explain the correct way to obedience train a dog and what equipment you would need. Show with your dog any three of these commands: "come," "sit," "down," "heel," "stay," "fetch" or "get it," and "drop it."
6. Do the following.
    (a) Discuss the proper vaccination schedule for a dog in your area from puppyhood through adulthood.
    (b) Discuss the control methods for preventing fleas, ticks, heartworms, and intestinal parasites (worms) for a dog in your area from puppyhood through adulthood.
    (c) Explain the importance of dental care and tooth brushing to your pet's health.
    (d) Discuss the benefits of grooming your dog's coat and nails on a regular basis.
    (e) Discuss with your counselor any seasonal conditions (like hot summers, cold winters, or extreme humidity) where you live that need to be considered for your dog.
    (f) Discuss with your counselor the considerations and advantages of spaying or neutering your dog.
7. Do the following:
    (a) Explain precautions to take in handling a hurt dog.
    (b) Show how to put on an emergency muzzle.
    (c) Explain how to treat wounds. Explain first aid for a dog bite.
    (d) Show how to put on a simple dressing and bandage the foot, body, or head of your dog.
    (e) Explain what to do if a dog is hit by a car.
    (f) List the things needed in every dog owner's first-aid kit.
    (g) Tell the dangers of home treatment of a serious ailment.
    (h) Briefly discuss the cause and method of spread, the signs and symptoms and the methods of prevention of rabies, parvovirus, distemper, and heartworms in dogs.
8. Visit a veterinary hospital or an animal shelter and give a report about your visit to your counselor.
9. Know the laws and ordinances involving dogs that are in force in your community.
10. Learn about three career opportunities for working with dogs. Pick one and find out about the education, training, and experience required for this career, and discuss this with your counselor. Tell why this profession interests you.`,
        },
        {
            title: 'Engineering',
            presetTitle: 'Engineering',
            type: AchievementTypes.Engineering,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Engineering-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            description:
                'Engineers use both science and technology to turn ideas into reality, devising all sorts of things, ranging from a tiny, low-cost battery for your cell phone to a gigantic dam across the mighty Yangtze River in China.',
            criteria: `1. Select a manufactured item in your home (such as a toy or an appliance) and, under adult supervision and with the approval of your counselor, investigate how and why it works as it does. Find out what sort of engineering activities were needed to create it. Discuss with your counselor what you learned and how you got the information.
2. Select an engineering achievement that has had a major impact on society. Using resources such as the internet (with your parent or guardian's permission), books, and magazines, find out about the engineers who made this engineering feat possible, the special obstacles they had to overcome, and how this achievement has influenced the world today. Tell your counselor what you learned.
3. Explain the work of six types of engineers. Pick two of the six and explain how their work is related.
4. Visit with an engineer (who may be your counselor or parent) and do the following:
    (a) Discuss the work this engineer does and the tools the engineer uses.
    (b) Discuss with the engineer a current project and the engineer's particular role in it.
    (c) Find out how the engineer's work is done and how results are achieved.
    (d) Ask to see the reports that the engineer writes concerning the project.
    (e) Discuss with your counselor what you learned about engineering from this visit.
5. Use the systems engineering approach to design an original piece of patrol equipment, a toy or a useful device for the home, office or garage.
6. Do TWO of the following:
    (a) Transforming motion. Using common materials or a construction set, make a simple model that will demonstrate motion. Explain how the model uses basic mechanical elements like levers and inclined planes to demonstrate motion. Describe an example where this mechanism is used in a real product.
    (b) Using electricity. Make a list of 10 electrical appliances in your home. Find out approximately how much electricity each uses in one month. Learn how to find out the amount and cost of electricity used in your home during periods of light and heavy use. List five ways to conserve electricity.
    (c) Understanding electronics. Using an electronic device such as a smartphone or tablet computer, find out how sound, video, text or images travel from one location to another. Explain how the device was designed for ease of use, function, and durability.
    (d) Using materials. Do experiments to show the differences in strength and heat conductivity in wood, metal, and plastic. Discuss with your counselor what you have learned.
    (e) Converting energy. Do an experiment to show how mechanical, heat, chemical, solar, and/or electrical energy may be converted from one or more types of energy to another. Explain your results. Describe to your counselor what energy is and how energy is converted and used in your surroundings.
    (f) Moving people. Find out the different ways people in your community get to work. Make a study of traffic flow (number of vehicles and relative speed) in both heavy and light traffic periods. Discuss with your counselor what might be improved to make it easier for people in your community to get where they need to go.
    (g) Building an engineering project. Enter a project in a science or engineering fair or similar competition. (This requirement may be met by participation on an engineering competition project team.) Discuss with your counselor what your project demonstrates, the kinds of questions visitors to the fair asked you, and how well you were able to answer their questions.
7. Explain what it means to be a registered Professional Engineer (P.E.). Name the types of engineering work for which registration is most important.
8. Study the Engineer's Code of Ethics. Explain how it is like the Scout Oath and Scout Law
9. Find out about three career opportunities in engineering. Pick one and research the education, training, and experience required for this profession. Discuss this with your counselor, and explain why this profession might interest you.`,
        },
        {
            title: 'Music',
            presetTitle: 'Music',
            type: AchievementTypes.Music,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Music-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            description:
                'The history of music is rich and exciting. Through the ages, new music has been created by people who learned from tradition, then explored and innovated. All the great music has not yet been written. Today, the possibilities for creating new music are limitless.',
            criteria: `1. Sing or play a simple song or hymn chosen by your counselor, using good technique, phrasing, tone, rhythm, and dynamics. Read all the signs and terms of the score.
2. Name the five general groups of musical instruments. Create an illustration that shows how tones are generated and how instruments produce sound.
3. Do TWO of the following:
    (a) Attend a live performance, or listen to three hours of recordings from any two of the following musical styles: blues, jazz, classical, country, bluegrass, ethnic, gospel, musical theater, opera. Describe the sound of the music and the instruments used. Identify the composers or songwriters, the performers, and the titles of the pieces you heard. If it was a live performance, describe the setting and the reaction of the audience. Discuss your thoughts about the music.
    (b) Interview an adult member of your family about music. Find out what the most popular music was when he or she was your age. Find out what his or her favorite music is now, and listen to three of your relative's favorite tunes with him or her. How do those favorites sound to you? Had you ever heard any of them? Play three of your favorite songs for your relative, and explain why you like these songs. Ask what he or she thinks of your favorite music.
    (c) Serve for six months as a member of a school band, choir, or other organized musical group, or perform as a soloist in public six times.
    (d) List five people who are important in the history of American music and explain to your counselor why they continue to be influential. Include at least one composer, one performer, one innovator, and one person born more than 100 years ago.
4. Do ONE of the following:
    (a) Teach three songs to a group of people. Lead them in singing the songs, using proper hand motions.
    (b) Compose and write the score for a piece of music of 12 measures or more, and play this music on an instrument.
    (c) Make a traditional instrument and learn to play it.
5. Define for your counselor intellectual property (IP). Explain how to properly obtain and share recorded music.`,
        },
        {
            title: 'Nuclear Science',
            presetTitle: 'Nuclear Science',
            type: AchievementTypes.NuclearScience,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/NuclearScience-qjjk7p7ex1rmni5l9zqta1xnjo0npalz3uxtbivwps.png',
            description:
                'Nuclear science gives us a simple explanation of the natural world. The ultimate goal of nuclear science is to find out if there is one fundamental rule that explains how matter and forces interact. Earning the Nuclear Science merit badge is a chance for Scouts to learn about this exciting field at the cutting edge of science today.',
            criteria: `1. Do the following:
    (a) Explain radiation and the difference between ionizing and nonionizing radiation.
    (b) Explain the ALARA principle and the measures required by law to minimize these risks. Describe what safety requirements you will need to consider while performing the requirements in this merit badge.
    (c) Describe the radiation hazard symbol and explain where it should be used.
    (d) Explain how we are exposed to ionizing radiation from outside the earth as well as on earth every day. List four examples of Naturally Occurring Radioactive Materials, NORM, that are in your house or grocery store and explain why they are radioactive.
    (e) Explain the difference between radiation exposure and contamination. Describe the hazards of radiation to humans, the environment, and wildlife. Calculate your approximate annual radiation dose and compare to that of someone who works in a nuclear power plant.
2. Do the following:
    (a) Tell the meaning of the following: atom, nucleus, proton, neutron, electron, quark, isotope; alpha particle, beta particle, gamma ray, X-ray; ionization, radioactivity, radioisotope, and stability.
    (b) Choose an element from the periodic table. Construct 3-D models for the atoms of three isotopes of this element, showing neutrons, protons, and electrons. Write down the isotope notation for each model including the atomic and mass numbers. In a separate model or diagram, explain or show how quarks make up protons and neutrons.
3. Do ONE of the following; then discuss modern particle physics with your counselor:
    (a) Visit an accelerator, research lab, or university where scientists study the properties of the nucleus or nucleons.
    (b) List three particle accelerators and describe several experiments that each accelerator performs, including basic science and practical applications.
4. Do TWO of the following; then discuss with your counselor:
    (a) Build an electroscope. Show how it works. Place a radiation source inside and explain the effect it causes.
    (b) Make a cloud chamber. Show how it can be used to see the tracks caused by radiation. Explain what is happening.
    (c) Perform an experiment demonstrating half-life. Discuss decay chains.
5. Do ONE of the following; then discuss with your counselor the principles of radiation safety:
    (a) Using a radiation survey meter and a radioactive source, show how the counts per minute change as the source gets closer to or farther from the radiation detector. Place three different materials between the source and the detector, then explain any differences in the measurements per minute. Explain how time, distance, and shielding can reduce an individual's radiation dose.
    (b) Describe how radon is detected in homes. Discuss the steps taken for the long-term and short-term test methods, tell how to interpret the results, and explain when each type of test should be used. Explain the health concern related to radon gas and tell what steps can be taken to reduce radon in buildings.
    (c) Visit a place where X-rays are used. Draw a floor plan of this room. Show where the unit, the unit operator, and the patient would be when the X-ray unit is operated. Explain the precautions taken and the importance of those precautions.
6. Do ONE of the following; then discuss with your counselor how nuclear energy is used to produce electricity:
    (a) Make a drawing showing how nuclear fission happens. Observe a mousetrap reactor (setup by an adult) and use it to explain how a chain reaction could be started. Explain how a chain reaction could be stopped or controlled in a nuclear reactor. Explain what is meant by a "critical mass."
    (b) Visit a local nuclear power plant or nuclear reactor either in person or online (with your parent's permission). Learn how a reactor works and how the plant generates electricity. Find out what percentage of electricity in the United States is generated by nuclear power plants, by coal, and by gas.
7. Give an example of each of the following in relation to how energy from an atom can be used: nuclear medicine, environmental applications, industrial applications, space exploration, and radiation therapy. For each example, explain the application and its significance to nuclear science.
8. Find out about three career opportunities in nuclear science that interest you. Pick one and find out the education, training, and experience required for this profession and discuss this with your counselor. Tell why this profession interests you.`,
        },
        {
            title: 'Programming',
            presetTitle: 'Programming',
            type: AchievementTypes.Programming,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Programming-qjjk7p7ex1rmni5l9zqta1xnjo0npalz3uxtbivwps.png',
            description:
                'Programming merit badge will take you “behind the screen” for a look at the complex codes that make digital devices useful and fun.',
            criteria: `1. Safety. Do the following:
    (a) View the Personal Safety Awareness "Digital Safety" video (with your parent or guardian's permission.)
    (b) Discuss first aid and prevention for the types of injuries that could occur during programming activities, including repetitive stress injuries and eyestrain.
2. History. Do the following:
    (a) Give a brief history of programming, including at least three milestones related to the advancement or development of programming.
    (b) Discuss with your counselor the history of programming and the evolution of programming languages.
3. General knowledge. Do the following:
    (a) Create a list of five popular programming languages in use today and describe which industry or industries they are primarily used in and why.
    (b) Describe three different programmed devices you rely on every day.
4. Intellectual property. Do the following:
    (a) Explain the four types of intellectual property used to protect computer programs.
    (b) Describe the difference between licensing and owning software.
    (c) Describe the differences between freeware, open source, and commercial software, and why it is important to respect the terms of use of each.
5. Projects. Do the following:
    (a) With your counselor's approval, choose a sample program. Modify the code or add a function or subroutine to it. Debug and demonstrate the modified program to your counselor.
    (b) With your counselor's approval, choose a second programming language and development environment, different from those used for requirement 5a and in a different industry from 5a. Then write, debug, and demonstrate a functioning program to your counselor, using that language and environment.
    (c) With your counselor's approval, choose a third programming language and development environment, different from those used for requirements 5a and 5b and in a different industry from 5a or 5b. Then write, debug, and demonstrate a functioning program to your counselor, using that language and environment.
    (d) Explain how the programs you wrote for requirements 5a, 5b, and 5c process inputs, how they make decisions based on those inputs, and how they provide outputs based on the decision making.
6. Careers. Find out about three career opportunities that require knowledge in programming. Pick one and find out the education, training, and experience required. Discuss this with your counselor and explain why this career might be of interest to you.`,
        },
        {
            title: 'Space Exploration',
            presetTitle: 'Space Exploration',
            type: AchievementTypes.SpaceExploration,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/SpaceExploration-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            description:
                'Space is mysterious. We explore space for many reasons, not least because we don’t know what is out there, it is vast, and humans are full of curiosity. Each time we send explorers into space, we learn something we didn’t know before. We discover a little more of what is there.',
            criteria: `1. Tell the purpose of space exploration and include the following:
    (a) Historical reasons
    (b) Immediate goals in terms of specific knowledge
    (c) Benefits related to Earth resources, technology, and new products
    (d) International relations and cooperation
2. Design a collector's card, with a picture on the front and information on the back, about your favorite space pioneer. Share your card and discuss four other space pioneers with your counselor.
3. Build, launch, and recover a model rocket.* Make a second launch to accomplish a specific objective. (Rocket must be built to meet the safety code of the National Association of Rocketry. See the "Model Rocketry" chapter of the Space Exploration merit badge pamphlet.) Identify and explain the following rocket parts:
    (a) Body tube
    (b) Engine mount
    (c) Fins
    (d) Igniter
    (e) Launch lug
    (f) Nose cone
    (g) Payload
    (h) Recovery system
    (i) Rocket engine
4. Discuss and demonstrate each of the following:
    (a) The law of action-reaction
    (b) How rocket engines work
    (c) How satellites stay in orbit
    (d) How satellite pictures of Earth and pictures of other planets are made and transmitted
5. Do TWO of the following:
    (a) Discuss with your counselor a robotic space exploration mission and a historic crewed mission. Tell about each mission's major discoveries, its importance, and what was learned from it about the planets, moons, or regions of space explored.
    (b) Using magazine photographs, news clippings, and electronic articles (such as from the Internet), make a scrapbook about a current planetary mission.
    (c) Design a robotic mission to another planet, moon, comet, or asteroid that will return samples of its surface to Earth. Name the planet, moon, comet, or asteroid your spacecraft will visit. Show how your design will cope with the conditions of the environments of the planet, moon, comet, or asteroid.
6. Describe the purpose, operation, and components of ONE of the following:
    (a) Space shuttle or any other crewed orbital vehicle, whether government-owned (U.S. or foreign) or commercial
    (b) International Space Station
7. Design an inhabited base located within our solar system, such as Titan, asteroids, or other locations that humans might want to explore in person. Make drawings or a model of your base. In your design, consider and plan for the following:
    (a) Source of energy
    (b) How it will be constructed
    (c) Life-support system
    (d) Purpose and function
8. Discuss with your counselor two possible careers in space exploration that interest you. Find out the qualifications, education, and preparation required and discuss the major responsibilities of those positions.`,
        },
        {
            title: 'Wilderness Survival',
            presetTitle: 'Wilderness Survival',
            type: AchievementTypes.WildernessSurvival,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/WildernessSurvival-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            description:
                'In their outdoor activities, Scouts learn to bring the clothing and gear they need, to make good plans, and do their best to manage any risks. But now and then, something unexpected happens. When things go wrong, the skills of wilderness survival can help make everything right again.',
            criteria: `1. Do the following:
    (a) Explain to your counselor the hazards you are most likely to encounter while participating in wilderness survival activities, and what you should do to anticipate, help prevent, mitigate, or lessen these hazards.
    (b) Show that you know first aid for and how to prevent injuries or illnesses likely to occur in backcountry settings, including hypothermia, heat reactions, frostbite, dehydration, blisters, insect stings, tick bites, and snakebites.
2. From memory list the seven priorities for survival in a backcountry or wilderness location. Explain the importance of each one with your counselor.
3. Describe ways to avoid panic and maintain a high level of morale when lost, and explain why this is important.
4. Describe the steps you would take to survive in the following exposure conditions:
    (a) Cold and snowy
    (b) Wet
    (c) Hot and dry
    (d) Windy
    (e) At or on the water
5. Put together a personal survival kit and be able to explain how each item in it could be useful.
6. Using three different methods (other than matches), build and light three fires.
7. Do the following:
    (a) Show five different ways to attract attention when lost.
    (b) Demonstrate how to use a signal mirror.
    (c) Describe from memory five ground-to- air signals and tell what they mean.
8. Improvise a natural shelter. For the purpose of this demonstration, use techniques that have little negative impact on the environment. Spend a night in your shelter.
9. Explain how to protect yourself from insects, reptiles, bears, and other animals of the local region.
10. Demonstrate three ways to treat water found in the outdoors to prepare it for drinking.
11. Show that you know the proper clothing to wear while in the outdoors during extremely hot and cold weather and during wet conditions.
12. Explain why it usually is not wise to eat edible wild plants or wildlife in a wilderness survival situation.`,
        },
    ],
};

export const defaultIDCardImage = 'https://svgur.com/i/w0y.svg';
export const defaultIssuerThumbnail = 'https://svgur.com/i/19Ma.svg';

export const defaultCategoryThumbImages = [
    'https://cdn.filestackcontent.com/wmy95gChQOmUXVBI24wV',
    'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    'https://cdn.filestackcontent.com/Otl66rNhTFu66mGf96Iq',
    'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
];

export const BOOST_CATEGORY_TO_WALLET_ROUTE = {
    ['ID']: 'ids',
    ['Learning History']: 'learninghistory',
    ['Achievement']: 'achievements',
    ['Work History']: 'workhistory',
    ['Skill']: 'skills',
    ['Social Badge']: 'boosts',
    ['Membership']: 'troops',
    ['Merit Badge']: 'badges',
};
