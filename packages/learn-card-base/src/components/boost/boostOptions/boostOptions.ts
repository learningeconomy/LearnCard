import React from 'react';

import ChevronShield from 'learn-card-base/svgs/ShieldChevron';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import User from 'learn-card-base/svgs/User';
import IDIcon from 'learn-card-base/svgs/IDIcon';
import Trophy from 'learn-card-base/svgs/Trophy';
import Graduation from 'learn-card-base/svgs/Graduation';
import Briefcase from 'learn-card-base/svgs/Briefcase';
import KeyIcon from 'learn-card-base/svgs/KeyIcon';
import ExperienceIcon from 'learn-card-base/svgs/ExperienceIcon';
import SocialBadgesIcon from 'learn-card-base/svgs/SocialBadgesIcon';
import AccommodationsIcon from 'learn-card-base/svgs/AccommodationsIcon';
import ScoutsPledge from 'learn-card-base/svgs/ScoutsPledge';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import FamilyIcon from 'learn-card-base/svgs/FamilyIcon';
import BoostsIcon from 'learn-card-base/svgs/wallet/BoostsIcon';
import AchievementsIcon, {
    AchievementsIconSolid,
} from 'learn-card-base/svgs/wallet/AchievementsIcon';
import StudiesIcon, { StudiesIconSolid } from 'learn-card-base/svgs/wallet/StudiesIcon';
import SkillsIcon from 'learn-card-base/svgs/SkillsIcon';
import PortfolioIcon, { PortfolioIconSolid } from 'learn-card-base/svgs/wallet/PortfolioIcon';
import AssistanceIcon, { AssistanceIconSolid } from 'learn-card-base/svgs/wallet/AssistanceIcon';
import FamiliesIcon from 'learn-card-base/svgs/wallet/FamiliesIcon';
import IDsIcon from 'learn-card-base/svgs/wallet/IDsIcon';
import ExperiencesIcon, { ExperiencesIconSolid } from 'learn-card-base/svgs/wallet/ExperiencesIcon';

import { BoostsIconSolid } from 'learn-card-base/svgs/wallet/BoostsIcon';

export enum BoostUserTypeEnum {
    self = 'self',
    someone = 'someone',
}

export enum BoostCategoryOptionsEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    course = 'Course',
    job = 'Job',
    id = 'ID',
    workHistory = 'Work History',
    currency = 'Currency',
    learningHistory = 'Learning History', // -> Courses
    skill = 'Skill',
    membership = 'Membership',
    family = 'Family',

    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',

    meritBadge = 'Merit Badge',

    // troops 2.0 ID categories
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',
    // troops 2.0 ID categories
}

export type BoostVCTypeOptionButtonProps = {
    id?: number;
    IconComponent: React.FC<{ className?: string; version?: string }>;
    SolidIconComponent: React.FC<{ className?: string; version?: string }>;
    iconCircleClass?: string;
    iconClassName?: string;
    title: string;
    categoryType: BoostCategoryOptionsEnum;
    setSelectedCategoryType: React.Dispatch<React.SetStateAction<string | null>>;
};

// ! MUST ALIGN WITH -> learn-card-base/src/helpers -> credentialHelpers.ts -> { CATEGORY_MAP }
// ! MUST ALIGN WITH -> learn-card-base/src/components/issueVC -> constants.ts -> { AchievementTypes }
export const boostVCTypeOptions = {
    [BoostUserTypeEnum.self]: [
        {
            id: 1,
            title: 'Boosts',
            IconComponent: BoostsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-400',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
        {
            id: 2,
            title: 'Skills',
            IconComponent: PuzzlePiece,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-violet-500',
            type: BoostCategoryOptionsEnum.skill,
        },
        {
            id: 3,
            title: 'Achievements',
            IconComponent: AchievementsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-pink-400',
            type: BoostCategoryOptionsEnum.achievement,
        },
        {
            id: 4,
            title: 'Studies',
            IconComponent: Graduation,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-emerald-500',
            type: BoostCategoryOptionsEnum.learningHistory,
        },
        {
            id: 5,
            title: 'ID',
            IconComponent: IDIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-400',
            type: BoostCategoryOptionsEnum.id,
        },
        {
            id: 6,
            title: 'Experiences',
            IconComponent: ExperienceIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-600',
            type: BoostCategoryOptionsEnum.workHistory,
        },
        // {
        //     id: 7,
        //     title: 'Membership',
        //     IconComponent: KeyIcon,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-teal-400',
        //     type: BoostCategoryOptionsEnum.membership,
        // },
        {
            id: 9,
            title: 'Families',
            IconComponent: FamilyIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-pink-600',
            type: BoostCategoryOptionsEnum.family,
        },
    ],
    [BoostUserTypeEnum.someone]: [
        {
            id: 1,
            title: 'Boosts',
            plural: 'Boosts',
            IconComponent: BoostsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-400',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
        {
            id: 2,
            title: 'Skill',
            plural: 'skills',
            IconComponent: PuzzlePiece,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-violet-500',
            type: BoostCategoryOptionsEnum.skill,
        },
        {
            id: 3,
            title: 'Achievement',
            plural: 'achievements',
            IconComponent: Trophy,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-pink-400',
            type: BoostCategoryOptionsEnum.achievement,
        },
        {
            id: 4,
            title: 'Courses',
            plural: 'courses',
            IconComponent: Graduation,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-emerald-500',
            type: BoostCategoryOptionsEnum.learningHistory,
        },
        {
            id: 5,
            title: 'ID',
            plural: 'IDs',
            IconComponent: IDIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-400',
            type: BoostCategoryOptionsEnum.id,
        },
        {
            id: 6,
            title: 'Experiences',
            plural: 'experiences',
            IconComponent: ExperienceIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-600',
            type: BoostCategoryOptionsEnum.workHistory,
        },
        // {
        //     id: 7,
        //     title: 'Membership',
        //     IconComponent: KeyIcon,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-teal-400',
        //     type: BoostCategoryOptionsEnum.membership,
        // },
        {
            id: 9,
            title: 'Families',
            IconComponent: FamilyIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-pink-600',
            type: BoostCategoryOptionsEnum.family,
        },
    ],
};

export const boostCategoryOptions: {
    [key: BoostCategoryOptionsEnum | string]: {
        title: string;
        value: BoostCategoryOptionsEnum;
        color: string;
        darkColor?: string;
        subColor: string;
        IconComponent: React.FC<{ className?: string; version?: string }>;
        CategoryImage: string;

        // badge thumbnail
        SolidIconComponent?: React.FC<{ className?: string; version?: string }>;
        badgeBackgroundColor?: string;
    };
} = {
    [BoostCategoryOptionsEnum.socialBadge]: {
        title: 'Boost',
        value: BoostCategoryOptionsEnum.socialBadge,
        color: 'blue-400',
        darkColor: 'blue-700',
        subColor: 'blue-300',

        IconComponent: BoostsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/DRPwxXjSWKl6TTkd2OCF',

        // badge thumbnail
        SolidIconComponent: BoostsIconSolid,
        badgeBackgroundColor: 'blue-500',
    },
    [BoostCategoryOptionsEnum.achievement]: {
        title: 'Achievement',
        value: BoostCategoryOptionsEnum.achievement,
        color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: AchievementsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',

        // badge thumbnail
        SolidIconComponent: AchievementsIconSolid,
        badgeBackgroundColor: 'pink-500',
    },
    [BoostCategoryOptionsEnum.course]: {
        title: 'Course',
        value: BoostCategoryOptionsEnum.course,
        color: 'emerald-700',
        darkColor: 'emerald-700',
        subColor: 'emerald-500',
        IconComponent: Graduation,
        CategoryImage: 'https://cdn.filestackcontent.com/zBtHw5EqTJDb5r6Pw7cg',
    },
    [BoostCategoryOptionsEnum.job]: {
        title: 'Job',
        value: BoostCategoryOptionsEnum.job,
        color: 'rose-600',
        darkColor: 'rose-700',
        subColor: 'rose-400',
        IconComponent: Briefcase,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    },
    [BoostCategoryOptionsEnum.id]: {
        title: 'ID',
        value: BoostCategoryOptionsEnum.id,
        color: 'blue-400',
        darkColor: 'blue-700',
        subColor: 'blue-300',
        IconComponent: IDsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/HRKQyEDZSc2NS01uur0F',
    },
    [BoostCategoryOptionsEnum.skill]: {
        title: 'Skill',
        value: BoostCategoryOptionsEnum.skill,
        color: 'indigo-600',
        darkColor: 'indigo-700',
        subColor: 'indigo-400',
        IconComponent: SkillsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    },
    [BoostCategoryOptionsEnum.learningHistory]: {
        title: 'Studies',
        value: BoostCategoryOptionsEnum.learningHistory,
        color: 'emerald-700',
        darkColor: 'emerald-700',
        subColor: 'emerald-500',
        IconComponent: StudiesIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/xMW7lO1R7yv7Uy7qSzTB',

        // badge thumbnail
        SolidIconComponent: StudiesIconSolid,
        badgeBackgroundColor: 'emerald-500',
    },
    [BoostCategoryOptionsEnum.workHistory]: {
        title: 'Experience',
        value: BoostCategoryOptionsEnum.workHistory,
        color: 'cyan-500',
        darkColor: 'cyan-700',
        subColor: 'cyan-400',
        IconComponent: ExperiencesIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/A3cfrOaQ3StXLw7guVKO',

        // badge thumbnail
        SolidIconComponent: ExperiencesIconSolid,
        badgeBackgroundColor: 'cyan-500',
    },
    [BoostCategoryOptionsEnum.membership]: {
        title: 'Membership',
        value: BoostCategoryOptionsEnum.membership,
        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',
        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.globalAdminId]: {
        title: 'Membership',
        value: BoostCategoryOptionsEnum.membership,
        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',
        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.nationalNetworkAdminId]: {
        title: 'Membership',
        value: BoostCategoryOptionsEnum.membership,
        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',
        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.troopLeaderId]: {
        title: 'Membership',
        value: BoostCategoryOptionsEnum.membership,
        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',
        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.scoutId]: {
        title: 'Membership',
        value: BoostCategoryOptionsEnum.membership,
        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',
        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.accomplishment]: {
        title: 'Portfolio',
        value: BoostCategoryOptionsEnum.accomplishment,
        color: 'yellow-400',
        darkColor: 'yellow-700',
        subColor: 'yellow-400',
        IconComponent: PortfolioIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/8OIEKhtHTAutM1nzlKkT',

        SolidIconComponent: PortfolioIconSolid,
        badgeBackgroundColor: 'yellow-500',
    },
    [BoostCategoryOptionsEnum.accommodation]: {
        title: 'Assistance',
        value: BoostCategoryOptionsEnum.accommodation,
        color: 'violet-400',
        darkColor: 'violet-700',
        subColor: 'violet-500',
        IconComponent: AssistanceIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/u9De5ed2RPe3bYWukmTc',

        SolidIconComponent: AssistanceIconSolid,
        badgeBackgroundColor: 'violet-500',
    },
    [BoostCategoryOptionsEnum.meritBadge]: {
        title: 'Merit Badge',
        value: BoostCategoryOptionsEnum.meritBadge,
        color: 'sp-purple-base',
        subColor: 'sp-purple-light',
        IconComponent: ScoutsPledge,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    },
    [BoostCategoryOptionsEnum.family]: {
        title: 'Families',
        value: BoostCategoryOptionsEnum.family,
        color: 'pink-600',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: FamiliesIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/XPxGgf7RQOmGgaFgS7QB',
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
        { title: 'Degree', type: AchievementTypes.Degree },
        { title: 'Certificate', type: AchievementTypes.Certificate },
        { title: 'Course Completion', type: AchievementTypes.CourseCompletion },
        { title: 'Attendance', type: AchievementTypes.Attendance },
        { title: "Dean's List", type: AchievementTypes.DeansList },
        { title: 'Honors Award', type: AchievementTypes.HonorsAward },
        { title: 'Research Publication', type: AchievementTypes.ResearchPublication },
        { title: 'Certification', type: AchievementTypes.ProfessionalCertification },
        { title: 'Fellowship', type: AchievementTypes.Fellowship },
        { title: 'Language Proficiency', type: AchievementTypes.LanguageProficiency },

        { title: 'Generic', type: AchievementTypes.Achievement },
        { title: 'Formal Award', type: AchievementTypes.Award },
        { title: 'Online Badge', type: AchievementTypes.Badge },
        { title: 'Community Service', type: AchievementTypes.CommunityService },

        // extended ( Achievement ) category types
        { title: 'Credential', type: AchievementTypes.Credential },
        { title: 'Language', type: AchievementTypes.Language },
        { title: 'Upskilling', type: AchievementTypes.Upskilling },
    ],
    [BoostCategoryOptionsEnum.id]: [
        // extended ( ID ) category types
        { title: 'School ID', type: AchievementTypes.SchoolID },
        { title: 'Employer ID', type: AchievementTypes.EmployerID },
        { title: 'College ID', type: AchievementTypes.CollegeID },
        { title: 'University ID', type: AchievementTypes.UniversityID },
        { title: 'Association ID', type: AchievementTypes.AssociationID },
        { title: 'Library Card', type: AchievementTypes.LibraryCard },
        { title: 'Taskforce ID', type: AchievementTypes.TaskforceID },
        { title: 'EventID', type: AchievementTypes.EventID },
        { title: 'Member ID', type: AchievementTypes.MemberID },
    ],
    [BoostCategoryOptionsEnum.skill]: [
        { title: 'Assessment', type: AchievementTypes.Assessment },
        { title: 'Certificate', type: AchievementTypes.Certificate },
        { title: 'Certification', type: AchievementTypes.Certification },
        { title: 'Competency', type: AchievementTypes.Competency },
        { title: 'MicroCredential', type: AchievementTypes.MicroCredential },
    ],
    [BoostCategoryOptionsEnum.learningHistory]: [
        { title: 'Course', type: AchievementTypes.Course },
        { title: 'Class', type: AchievementTypes.Class },
        { title: 'Module', type: AchievementTypes.Module },
        { title: 'Program', type: AchievementTypes.Program },
        { title: 'Study', type: AchievementTypes.Study },
        { title: 'Training', type: AchievementTypes.Training },
        { title: 'Workshop', type: AchievementTypes.Workshop },
        { title: 'Seminar', type: AchievementTypes.Seminar },
        { title: 'Webinar', type: AchievementTypes.Webinar },
        { title: 'Lecture', type: AchievementTypes.Lecture },
        { title: 'Bootcamp', type: AchievementTypes.Bootcamp },
        { title: 'Study Group', type: AchievementTypes.StudyGroup },
        { title: 'Tutoring Session', type: AchievementTypes.TutoringSession },
        { title: 'Laboratory', type: AchievementTypes.Laboratory },

        { title: 'Assignment', type: AchievementTypes.Assignment },
        { title: 'Associate Degree', type: AchievementTypes.AssociateDegree },
        { title: 'Bachelor Degree', type: AchievementTypes.BachelorDegree },
        { title: 'Certificate', type: AchievementTypes.CertificateOfCompletion },
        { title: 'Co-Curricular', type: AchievementTypes.CoCurricular },
        { title: 'Research Doctorate', type: AchievementTypes.ResearchDoctorate },

        // extended ( Learning History ) category types
        { title: 'Report Card', type: AchievementTypes.ReportCard },
        { title: 'Micro Degree', type: AchievementTypes.MicroDegree },
    ],
    [BoostCategoryOptionsEnum.workHistory]: [
        { title: 'Job', type: AchievementTypes.Job },
        { title: 'Club', type: AchievementTypes.Club },
        { title: 'Internship', type: AchievementTypes.Internship },
        { title: 'Event', type: AchievementTypes.Event },
        { title: 'Volunteering', type: AchievementTypes.Volunteering },
        { title: 'Freelance', type: AchievementTypes.Freelance },
        { title: 'Research Project', type: AchievementTypes.ResearchProject },
        { title: 'Study Abroad', type: AchievementTypes.StudyAbroad },
        { title: 'Apprenticeship', type: AchievementTypes.Apprenticeship },
        { title: 'Conference', type: AchievementTypes.Conference },
        { title: 'Sports Team', type: AchievementTypes.SportsTeam },
        { title: 'Art Exhibition', type: AchievementTypes.ArtExhibition },
        { title: 'Production', type: AchievementTypes.Production },
        { title: 'Apprenticeship', type: AchievementTypes.ApprenticeshipCertificate },
        { title: 'Journeyman', type: AchievementTypes.JourneymanCertificate },
        { title: 'Master Certificate', type: AchievementTypes.MasterCertificate },
        { title: 'Fieldwork', type: AchievementTypes.Fieldwork },

        // extended ( Work History ) category types
        { title: 'Volunteer', type: AchievementTypes.Volunteer },
        { title: 'Fellowship', type: AchievementTypes.Fellowship },
        { title: 'Board', type: AchievementTypes.Board },
    ],
    [BoostCategoryOptionsEnum.socialBadge]: [
        { title: 'Risk Taker', type: AchievementTypes.RiskTaker },
        { title: 'Opportunist', type: AchievementTypes.Opportunist },
        { title: 'Cool Cat', type: AchievementTypes.CoolCat },
        { title: 'Tastemaker', type: AchievementTypes.Tastemaker },
        { title: 'Trailblazer', type: AchievementTypes.Trailblazer },
        { title: 'Influencer', type: AchievementTypes.Influencer },
        { title: 'Connector', type: AchievementTypes.Connector },
        { title: 'Maven', type: AchievementTypes.Maven },
        { title: 'Trendsetter', type: AchievementTypes.Trendsetter },
        { title: 'Organizer', type: AchievementTypes.Organizer },
        { title: 'Moderator', type: AchievementTypes.Moderator },
        { title: 'Leader', type: AchievementTypes.Leader },
        { title: 'Catalyst', type: AchievementTypes.Catalyst },
        { title: 'Expert', type: AchievementTypes.Expert },
        { title: 'Enthusiast', type: AchievementTypes.Enthusiast },
        { title: 'Ambassador', type: AchievementTypes.Ambassador },
        { title: 'Aficionado', type: AchievementTypes.Aficionado },
        { title: 'Psychic', type: AchievementTypes.Psychic },
        { title: 'Magician', type: AchievementTypes.Magician },
        { title: 'Charmer', type: AchievementTypes.Charmer },
        { title: 'Cowboy', type: AchievementTypes.Cowboy },
        { title: 'Perfectionist', type: AchievementTypes.Perfectionist },
        { title: 'Enabler', type: AchievementTypes.Enabler },
        { title: 'Maverick', type: AchievementTypes.Maverick },
        { title: 'Informer', type: AchievementTypes.Informer },
        { title: 'Wanderer', type: AchievementTypes.Wanderer },
        { title: 'Propagator', type: AchievementTypes.Propagator },
        { title: 'Hot Shot', type: AchievementTypes.HotShot },
        { title: 'Sage', type: AchievementTypes.Sage },
        { title: 'Change Maker', type: AchievementTypes.ChangeMaker },
        { title: 'Challenger', type: AchievementTypes.Challenger },
        { title: 'Team Player', type: AchievementTypes.TeamPlayer },
        { title: 'Star', type: AchievementTypes.Star },
        { title: 'Party Animal', type: AchievementTypes.PartyAnimal },
        { title: 'Trouble Maker', type: AchievementTypes.TroubleMaker },
        { title: 'Party Planner', type: AchievementTypes.PartyPlanner },
        { title: 'Challenge Maker', type: AchievementTypes.ChallengeMaker },
        { title: 'Promoter', type: AchievementTypes.Promoter },
        { title: 'Doer', type: AchievementTypes.Doer },
        { title: 'Entertainer', type: AchievementTypes.Entertainer },
        { title: 'Connoisseur', type: AchievementTypes.Connoisseur },

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
        {
            title: 'K-Star',
            presetTitle: 'K-POP Superstar',
            type: AchievementTypes.KStar,
            description: 'For the Scout who is a K-POP super fan and is so happy to be in Korea!',
            criteria:
                'The K-POP Superstar badge is awarded to the Scout who demonstrates passionate enthusiasm for K-POP and revels in the cultural experience of being in Korea.',
        },
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
        { title: 'Assignment', type: AchievementTypes.Assignment },
        { title: 'Associate Degree', type: AchievementTypes.AssociateDegree },
        { title: 'Bachelor Degree', type: AchievementTypes.BachelorDegree },
        { title: 'Certificate', type: AchievementTypes.CertificateOfCompletion },
        { title: 'Course', type: AchievementTypes.Course },
        { title: 'Co-Curricular', type: AchievementTypes.CoCurricular },
        { title: 'Research Doctorate', type: AchievementTypes.ResearchDoctorate },

        // extended ( Learning History ) category types
        { title: 'Report Card', type: AchievementTypes.ReportCard },
        { title: 'Micro Degree', type: AchievementTypes.MicroDegree },
    ],
    // copied over work history sub categories for now
    [BoostCategoryOptionsEnum.job]: [
        { title: 'Apprenticeship', type: AchievementTypes.ApprenticeshipCertificate },
        { title: 'Journeyman', type: AchievementTypes.JourneymanCertificate },
        { title: 'Master Certificate', type: AchievementTypes.MasterCertificate },

        // extended ( Work History ) category types
        { title: 'Job', type: AchievementTypes.Job },
        { title: 'Internship', type: AchievementTypes.Internship },
        { title: 'Volunteer', type: AchievementTypes.Volunteer },
        { title: 'Fellowship', type: AchievementTypes.Fellowship },
        { title: 'Board', type: AchievementTypes.Board },
    ],
    [BoostCategoryOptionsEnum.membership]: [
        { title: 'Group', type: AchievementTypes.Group },
        { title: 'Troop', type: AchievementTypes.Troop },
        { title: 'School', type: AchievementTypes.School },
        { title: 'College', type: AchievementTypes.College },
        { title: 'University', type: AchievementTypes.University },
        { title: 'Association', type: AchievementTypes.Association },
        { title: 'Team', type: AchievementTypes.Team },
        { title: 'Workgroup', type: AchievementTypes.Workgroup },
        { title: 'Taskforce', type: AchievementTypes.Taskforce },
        { title: 'Agency', type: AchievementTypes.Agency },
        { title: 'Company', type: AchievementTypes.Company },
        { title: 'Organization', type: AchievementTypes.Organization },
        { title: 'NGO', type: AchievementTypes.NGO },
        { title: 'Legislative', type: AchievementTypes.Legislative },
        { title: 'DAO', type: AchievementTypes.DAO },
        { title: 'Community', type: AchievementTypes.Community },
        { title: 'Movement', type: AchievementTypes.Movement },
        { title: 'Club', type: AchievementTypes.Club },
        { title: 'Network', type: AchievementTypes.Network },

        { title: 'Global', type: AchievementTypes.Global },
        { title: 'Network', type: AchievementTypes.Network },
        { title: 'Troop', type: AchievementTypes.Troop },
        { title: 'Leader', type: AchievementTypes.ScoutLeader },
        { title: 'Scout', type: AchievementTypes.ScoutMember },
    ],

    [BoostCategoryOptionsEnum.globalAdminId]: [
        { title: 'Global Admin ID', type: AchievementTypes.Global },
    ],
    [BoostCategoryOptionsEnum.nationalNetworkAdminId]: [
        { title: 'National Network Admin ID', type: AchievementTypes.Network },
    ],
    [BoostCategoryOptionsEnum.troopLeaderId]: [
        { title: 'Troop Leader ID', type: AchievementTypes.Troop },
    ],
    [BoostCategoryOptionsEnum.scoutId]: [{ title: 'Scout ID', type: AchievementTypes.ScoutMember }],

    [BoostCategoryOptionsEnum.accomplishment]: [
        { title: 'Homework', type: AchievementTypes.Homework },
        { title: 'Presentation', type: AchievementTypes.Presentation },
        { title: 'Content', type: AchievementTypes.Content },
        { title: 'Practice', type: AchievementTypes.Practice },
        { title: 'Hacks', type: AchievementTypes.Hacks },
        { title: 'Ideas', type: AchievementTypes.Ideas },
        { title: 'Project', type: AchievementTypes.Project },
        { title: 'Thesis', type: AchievementTypes.Thesis },
        { title: 'Artwork', type: AchievementTypes.Artwork },
        { title: 'Software', type: AchievementTypes.Software },
        { title: 'Business Plan', type: AchievementTypes.BusinessPlan },
    ],
    [BoostCategoryOptionsEnum.accommodation]: [
        { title: 'Disability', type: AchievementTypes.Disability },
        { title: 'Medical Record', type: AchievementTypes.MedicalRecord },
        { title: 'Permission Slip', type: AchievementTypes.PermissionSlip },
        { title: 'Dietary Requirements', type: AchievementTypes.DietaryRequirements },
        { title: 'Allergy Information', type: AchievementTypes.AllergyInformation },
        { title: 'Mobility Assistance', type: AchievementTypes.MobilityAssistance },
        { title: 'Exam Adjustments', type: AchievementTypes.ExamAdjustments },
        { title: 'Special Equipment', type: AchievementTypes.SpecialEquipment },
        { title: 'Note-Taking Services', type: AchievementTypes.NoteTakingServices },
        { title: 'Sign Language', type: AchievementTypes.SignLanguageInterpreter },
        { title: 'Extended Deadline', type: AchievementTypes.ExtendedDeadline },
        { title: 'Housing Arrangement', type: AchievementTypes.HousingArrangement },
        { title: 'Transportation Services', type: AchievementTypes.TransportationServices },
    ],

    [BoostCategoryOptionsEnum.family]: [
        {
            title: 'Family',
            type: AchievementTypes.Family,
        },
    ],
};

export const defaultIDCardImage =
    'https://cdn.filestackcontent.com/rotate=deg:exif/resize=width:600/auto_image/CH8dyPGwSyChmczTdIY4';

export const defaultCategoryThumbImages = [
    // 'https://cdn.filestackcontent.com/wmy95gChQOmUXVBI24wV', // old badge
    'https://cdn.filestackcontent.com/hnnK9FFQL6XjlKdkd8Hs', // new badge
    'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag',
    'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    'https://cdn.filestackcontent.com/I4T9X90XQGSlk1YpcGGc',
    'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',
];

export const BOOST_CATEGORY_TO_WALLET_ROUTE = {
    ['ID']: 'ids',
    ['Learning History']: 'learninghistory',
    ['Achievement']: 'achievements',
    ['Work History']: 'workhistory',
    ['Skill']: 'skills',
    ['Social Badge']: 'socialBadges',
    ['Membership']: 'memberships',
    ['Family']: 'families',
};
