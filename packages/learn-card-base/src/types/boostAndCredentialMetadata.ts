import React from 'react';
import { z } from 'zod';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import Graduation from 'learn-card-base/svgs/Graduation';
import Briefcase from 'learn-card-base/svgs/Briefcase';
import KeyIcon from 'learn-card-base/svgs/KeyIcon';
import ScoutsPledge from 'learn-card-base/svgs/ScoutsPledge';

import BoostsIcon, { ThickBoostsIconWithShape } from 'learn-card-base/svgs/wallet/BoostsIcon';
import AchievementsIcon, {
    AchievementsIconSolid,
    ThickAchievementsIconWithShape,
} from 'learn-card-base/svgs/wallet/AchievementsIcon';
import StudiesIcon, {
    StudiesIconSolid,
    ThickStudiesIconWithShape,
} from 'learn-card-base/svgs/wallet/StudiesIcon';
import PortfolioIcon, {
    PortfolioIconSolid,
    ThickPortfolioIconWithShape,
} from 'learn-card-base/svgs/wallet/PortfolioIcon';
import AssistanceIcon, {
    AssistanceIconSolid,
    ThickAssistanceIconWithShape,
} from 'learn-card-base/svgs/wallet/AssistanceIcon';
import FamiliesIcon, { ThickFamiliesIconWithShape } from 'learn-card-base/svgs/wallet/FamiliesIcon';
import IDsIcon, { ThickIDsIconWithShape } from 'learn-card-base/svgs/wallet/IDsIcon';
import ExperiencesIcon, {
    ExperiencesIconSolid,
    ThickExperiencesIconWithShape,
} from 'learn-card-base/svgs/wallet/ExperiencesIcon';

// originally from @learncard/react -> TYPE_TO_IMG_SRC
import idsGraphic from '../assets/images/walletids.webp';
import learningHistoryGraphic from '../assets/images/backpack.png';
import skillsGraphic from '../assets/images/walletskills.webp';
import achievementsGraphic from '../assets/images/walletTrophy.png';
import badgeGraphic from '../assets/images/social-badge-2.png';
import membershipGraphic from '../assets/images/membership-graphic.png';
import apple from '../assets/images/apple.png';
import accommodationHands from '../assets/images/Accommodation-Hands.png';
import experienceMountain from '../assets/images/experience-mountain.png';

import { BoostsIconSolid } from 'learn-card-base/svgs/wallet/BoostsIcon';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';
import Kite from 'learn-card-base/svgs/shapes/Kite';
import Diamond from 'learn-card-base/svgs/shapes/Diamond';
import Hexagon from 'learn-card-base/svgs/shapes/Hexagon';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import Circle from 'learn-card-base/svgs/shapes/Circle';
import Triangle from 'learn-card-base/svgs/shapes/Triangle';
import Square from 'learn-card-base/svgs/shapes/Square';
import AllBoostsIcon, { AllBoostsIconNoBorder } from 'learn-card-base/svgs/wallet/AllBoostsIcon';
import AiSessionsIcon, {
    AiSessionsIconWithShape,
} from 'learn-card-base/svgs/wallet/AiSessionsIcon';
import AiPathwaysIcon, {
    AiPathwaysIconWithShape,
} from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import AiInsightsIcon, {
    AiInsightsIconWithShape,
} from 'learn-card-base/svgs/wallet/AiInsightsIcon';

// Used in the actual index for credentials (see: IndexMetadata in learn-card-base/src/types/credentials.ts)
export enum CredentialCategoryEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',
    workHistory = 'Work History',
    experience = 'Experience',
    learningHistory = 'Learning History',
    course = 'Course',

    skill = 'Skill',

    events = 'Events',
    family = 'Family',
    relationship = 'Relationship',

    meritBadge = 'Merit Badge',
    troops = 'Membership',

    // troops 2.0 ID categories
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',

    // AI
    aiSummary = 'AI Summary',
    aiTopic = 'AI Topic',
    aiPathway = 'AI Pathway',
    aiInsight = 'AI Insight',
    aiAssessment = 'AI Assessment',

    // todo
    membership = 'Membership',
    goals = 'Goals',

    // deprecated
    id = 'ID',
    currency = 'Currency',
}

export enum BoostCategoryOptionsEnum {
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    course = 'Course',
    job = 'Job', // not in CredentialCategory
    id = 'ID',
    workHistory = 'Work History',
    learningHistory = 'Learning History', // -> Courses
    skill = 'Skill',
    membership = 'Membership',

    // LCA specific
    family = 'Family',
    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',

    // AI
    //  (Not truly boost types, really these are just here for metadata structure purposes)
    aiSummary = 'AI Summary',
    aiTopic = 'AI Topic',
    aiPathway = 'AI Pathway',
    aiInsight = 'AI Insight',
    aiAssessment = 'AI Assessment',

    // general
    all = 'All',

    // Scouts
    meritBadge = 'Merit Badge',
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',

    // obsolete / unused / future
    currency = 'Currency',
    relationship = 'Relationship',
    events = 'Events',
    goals = 'Goals',
    describe = 'Describe',
}
export const BoostCategoryOptionsEnumValidator = z.nativeEnum(BoostCategoryOptionsEnum);

export type BoostCategoryMetadata = {
    displayName: string;

    title: string;
    titleSingular: string;
    plural?: string;
    subTitle?: string;

    credentialType: CredentialCategoryEnum;
    value: BoostCategoryOptionsEnum;

    color: string;
    darkColor?: string;
    subColor: string;
    lightColor?: string;
    badgeBackgroundColor?: string;

    IconComponent: React.FC<{ className?: string }>;
    IconWithShape: React.FC<{ className?: string }>;
    SolidIconComponent?: React.FC<{ className?: string }>;
    AltIconWithShapeForColorBg?: React.FC<{ className?: string }>;
    ShapeIcon?: React.FC<{ className?: string }>;
    shapeColor?: string;
    iconStyles?: string;

    CategoryImage: string;
    WalletIcon?: React.FC<{ className?: string }>;
};

// alignments from boostOptions.ts
// ! MUST ALIGN WITH -> learn-card-base/src/helpers -> credentialHelpers.ts -> { CATEGORY_MAP }
// ! MUST ALIGN WITH -> learn-card-base/src/components/issueVC -> constants.ts -> { AchievementTypes }
export const boostCategoryMetadata: Record<BoostCategoryOptionsEnum, BoostCategoryMetadata> = {
    [BoostCategoryOptionsEnum.socialBadge]: {
        displayName: 'Boost',
        title: 'Boosts',
        titleSingular: 'Boost',
        plural: 'Boosts',

        // scouts
        subTitle: 'Social Boost',

        credentialType: CredentialCategoryEnum.socialBadge,
        value: BoostCategoryOptionsEnum.socialBadge,

        // from learn-card-base
        // color: 'blue-400',
        darkColor: 'blue-700',
        subColor: 'blue-300',

        // from learncardapp
        color: 'blue-500',
        lightColor: 'blue-200',

        ShapeIcon: Kite,
        WalletIcon: BoostsIcon,
        IconComponent: BoostsIcon,
        IconWithShape: ThickBoostsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/DRPwxXjSWKl6TTkd2OCF',
        shapeColor: 'text-[#93C5FD] w-[35px] h-[35px] !right-[-50%]',
        iconStyles: 'h-[35px] w-[35px]',

        // badge thumbnail
        SolidIconComponent: BoostsIconSolid,
        badgeBackgroundColor: 'blue-500',
    },
    [BoostCategoryOptionsEnum.achievement]: {
        displayName: 'Achievement',
        title: 'Achievements',
        titleSingular: 'Achievement',
        plural: 'Achievements',

        credentialType: CredentialCategoryEnum.achievement,
        value: BoostCategoryOptionsEnum.achievement,

        // learn-card-base
        // color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',

        // learncardapp
        color: 'pink-500',
        lightColor: 'pink-200',

        ShapeIcon: Diamond,
        WalletIcon: AchievementsIcon,
        IconComponent: AchievementsIcon,
        IconWithShape: ThickAchievementsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',

        shapeColor: 'text-pink-300 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',

        // badge thumbnail
        SolidIconComponent: AchievementsIconSolid,
        badgeBackgroundColor: 'pink-500',
    },
    [BoostCategoryOptionsEnum.course]: {
        displayName: 'Course',
        // title: 'Course', // learn-card-base
        // titleSingular: 'Course', // learn-card-base
        plural: 'Courses',

        // learncardapp
        title: 'Studies',
        titleSingular: 'Study',

        credentialType: CredentialCategoryEnum.learningHistory,
        value: BoostCategoryOptionsEnum.course,

        color: 'emerald-700',
        darkColor: 'emerald-700',
        subColor: 'emerald-500',
        lightColor: 'emerald-201',

        ShapeIcon: Diamond,
        WalletIcon: StudiesIcon,
        IconComponent: Graduation,
        IconWithShape: ThickStudiesIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/zBtHw5EqTJDb5r6Pw7cg',

        shapeColor: 'text-emerald-500 w-[35px] h-[35px]',
        iconStyles: 'h-[30px] w-[30px]',
    },
    [BoostCategoryOptionsEnum.learningHistory]: {
        displayName: 'Studies',
        title: 'Studies',
        titleSingular: 'Study',
        plural: 'Studies',

        credentialType: CredentialCategoryEnum.learningHistory,
        value: BoostCategoryOptionsEnum.learningHistory,

        color: 'emerald-700',
        darkColor: 'emerald-700',
        subColor: 'emerald-500',
        lightColor: 'emerald-201',

        ShapeIcon: Hexagon,
        WalletIcon: StudiesIcon,
        IconComponent: StudiesIcon,
        IconWithShape: ThickStudiesIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/xMW7lO1R7yv7Uy7qSzTB',

        shapeColor: 'text-emerald-500 w-[35px] h-[35px]',
        iconStyles: 'h-[30px] w-[30px]',

        // badge thumbnail
        SolidIconComponent: StudiesIconSolid,
        badgeBackgroundColor: 'emerald-500',
    },
    [BoostCategoryOptionsEnum.job]: {
        displayName: 'Job',
        title: 'Job',
        titleSingular: 'Job',
        plural: 'Jobs',

        credentialType: CredentialCategoryEnum.workHistory,
        value: BoostCategoryOptionsEnum.job,

        color: 'rose-600',
        darkColor: 'rose-700',
        subColor: 'rose-400',

        IconComponent: Briefcase,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    },
    [BoostCategoryOptionsEnum.workHistory]: {
        displayName: 'Experience',
        title: 'Experiences',
        titleSingular: 'Experience',
        plural: 'Experiences',

        credentialType: CredentialCategoryEnum.workHistory,
        value: BoostCategoryOptionsEnum.workHistory,

        color: 'cyan-500',
        darkColor: 'cyan-700',
        subColor: 'cyan-400',
        lightColor: 'cyan-201',

        ShapeIcon: Circle,
        WalletIcon: ExperiencesIcon,
        IconComponent: ExperiencesIcon,
        IconWithShape: ThickExperiencesIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/A3cfrOaQ3StXLw7guVKO',

        shapeColor: 'text-cyan-400 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px] !top-[46%]',

        // badge thumbnail
        SolidIconComponent: ExperiencesIconSolid,
        badgeBackgroundColor: 'cyan-500',
    },
    [BoostCategoryOptionsEnum.accomplishment]: {
        displayName: 'Portfolio',
        title: 'Portfolio',
        titleSingular: 'Portfolio',
        plural: 'Portfolio Items',

        credentialType: CredentialCategoryEnum.accomplishment,
        value: BoostCategoryOptionsEnum.accomplishment,

        color: 'yellow-400',
        darkColor: 'yellow-700',
        // subColor: 'yellow-400', // learn-card-base
        subColor: 'yellow-300', // learncardapp
        lightColor: 'yellow-200',

        ShapeIcon: Triangle,
        WalletIcon: PortfolioIcon,
        IconComponent: PortfolioIcon,
        IconWithShape: ThickPortfolioIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/8OIEKhtHTAutM1nzlKkT',

        shapeColor: 'text-yellow-300 rotate-180 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',

        SolidIconComponent: PortfolioIconSolid,
        badgeBackgroundColor: 'yellow-500',
    },
    [BoostCategoryOptionsEnum.accommodation]: {
        displayName: 'Assistance',
        title: 'Assistance',
        titleSingular: 'Assistance',
        plural: 'Assistances',

        credentialType: CredentialCategoryEnum.accommodation,
        value: BoostCategoryOptionsEnum.accommodation,

        // color: 'blue-400', // learn-card-base
        color: 'violet-400', // learncardapp
        darkColor: 'violet-700',
        subColor: 'violet-500',
        lightColor: 'violet-200',

        ShapeIcon: Square,
        WalletIcon: AssistanceIcon,
        IconComponent: AssistanceIcon,
        IconWithShape: ThickAssistanceIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/u9De5ed2RPe3bYWukmTc',

        shapeColor: 'text-violet-400 w-[35px] h-[35px]',
        iconStyles: 'h-[28px] w-[28px]',

        SolidIconComponent: AssistanceIconSolid,
        badgeBackgroundColor: 'violet-500',
    },

    [BoostCategoryOptionsEnum.id]: {
        displayName: 'ID',
        title: 'IDs',
        titleSingular: 'ID',
        plural: 'IDs',

        credentialType: CredentialCategoryEnum.id,
        value: BoostCategoryOptionsEnum.id,

        color: 'blue-400',
        darkColor: 'blue-700',
        subColor: 'blue-300',
        lightColor: 'blue-200',

        ShapeIcon: Hexagon,
        WalletIcon: IDsIcon,
        IconComponent: IDsIcon,
        IconWithShape: ThickIDsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/HRKQyEDZSc2NS01uur0F',

        shapeColor: 'text-blue-400 w-[35px] h-[35px]',
        iconStyles: 'h-[33px] w-[33px] !top-[55%] !left-[50%]',
    },
    [BoostCategoryOptionsEnum.skill]: {
        displayName: 'Skill',
        title: 'Skills',
        titleSingular: 'Skill',
        plural: 'Skills',

        credentialType: CredentialCategoryEnum.skill,
        value: BoostCategoryOptionsEnum.skill,

        color: 'indigo-600',
        darkColor: 'indigo-700',
        subColor: 'indigo-400',
        lightColor: 'indigo-200',

        // IconComponent: SkillsIcon, // learn-card-base
        IconComponent: PuzzlePiece, // learncardapp
        IconWithShape: SkillsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    },

    [BoostCategoryOptionsEnum.family]: {
        displayName: 'Family',
        title: 'Families',
        titleSingular: 'Family',
        plural: 'Families',

        credentialType: CredentialCategoryEnum.family,
        value: BoostCategoryOptionsEnum.family,

        color: 'pink-600',
        darkColor: 'pink-700',
        // subColor: 'pink-400', // learn-card-base
        subColor: 'pink-500', // learncardapp
        lightColor: 'pink-200',

        IconComponent: FamiliesIcon,
        IconWithShape: ThickFamiliesIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/XPxGgf7RQOmGgaFgS7QB',
    },

    [BoostCategoryOptionsEnum.membership]: {
        displayName: 'Membership',
        title: 'Membership',
        titleSingular: 'Membership',
        plural: 'Memberships',

        // scouts
        // title: 'Troop',
        // color: 'sp-green-base',
        // subColor: 'sp-green-light',
        // IconComponent: ScoutsGlobe,
        // CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',

        credentialType: CredentialCategoryEnum.membership,
        value: BoostCategoryOptionsEnum.membership,

        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',
        lightColor: 'teal-200',

        IconComponent: KeyIcon,
        IconWithShape: ThickIDsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },

    [BoostCategoryOptionsEnum.all]: {
        displayName: 'All',
        title: 'All',
        titleSingular: 'All',
        plural: 'All',

        credentialType: CredentialCategoryEnum.currency, // should never be used, just here to make TS happy
        value: BoostCategoryOptionsEnum.all,

        color: 'gradient-rainbow',
        subColor: 'gradient-rainbow',
        lightColor: 'gradient-rainbow',

        WalletIcon: AllBoostsIcon,
        IconComponent: AllBoostsIcon,
        IconWithShape: AllBoostsIcon,
        AltIconWithShapeForColorBg: AllBoostsIconNoBorder,
        CategoryImage: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',

        iconStyles: 'h-[35px] w-[35px]',
    },

    // Scouts
    [BoostCategoryOptionsEnum.meritBadge]: {
        displayName: 'Merit Badge',
        title: 'Merit Badge',
        titleSingular: 'Merit Badge',
        plural: 'Merit Badges',

        // scouts
        subTitle: 'Merit Badge',

        credentialType: CredentialCategoryEnum.meritBadge,
        value: BoostCategoryOptionsEnum.meritBadge,

        color: 'sp-purple-base',
        subColor: 'sp-purple-light',

        IconComponent: ScoutsPledge,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    },
    [BoostCategoryOptionsEnum.globalAdminId]: {
        displayName: 'Global Admin ID',
        title: 'Global Admin ID',
        titleSingular: 'Global Admin ID',
        plural: 'Global Admin IDs',

        credentialType: CredentialCategoryEnum.globalAdminId,
        value: BoostCategoryOptionsEnum.globalAdminId,

        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',

        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.nationalNetworkAdminId]: {
        displayName: 'National Network Admin ID',
        title: 'National Network Admin ID',
        titleSingular: 'National Network Admin ID',
        plural: 'National Network Admin IDs',

        credentialType: CredentialCategoryEnum.nationalNetworkAdminId,
        value: BoostCategoryOptionsEnum.nationalNetworkAdminId,

        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',

        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.troopLeaderId]: {
        displayName: 'Troop Leader ID',
        title: 'Troop Leader ID',
        titleSingular: 'Troop Leader ID',
        plural: 'Troop Leader IDs',

        credentialType: CredentialCategoryEnum.troopLeaderId,
        value: BoostCategoryOptionsEnum.troopLeaderId,

        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',

        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.scoutId]: {
        displayName: 'Scout ID',
        title: 'Scout ID',
        titleSingular: 'Scout ID',
        plural: 'Scout IDs',

        credentialType: CredentialCategoryEnum.scoutId,
        value: BoostCategoryOptionsEnum.scoutId,

        color: 'teal-400',
        darkColor: 'teal-700',
        subColor: 'teal-300',

        IconComponent: KeyIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },

    // AI
    [BoostCategoryOptionsEnum.aiSummary]: {
        displayName: 'AI Summary',
        title: 'AI Summaries',
        titleSingular: 'AI Summary',
        plural: 'AI Summaries',

        credentialType: CredentialCategoryEnum.aiSummary,
        value: BoostCategoryOptionsEnum.aiSummary,

        color: 'lime-600',
        subColor: 'lime-500',
        lightColor: 'lime-200',

        ShapeIcon: Circle,
        WalletIcon: AiSessionsIcon,
        IconComponent: AiSessionsIcon,
        IconWithShape: AiSessionsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',

        shapeColor: 'text-lime-500 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',
    },
    [BoostCategoryOptionsEnum.aiTopic]: {
        displayName: 'AI Topic',
        title: 'AI Topics',
        titleSingular: 'AI Topic',
        plural: 'AI Topics',

        credentialType: CredentialCategoryEnum.aiTopic,
        value: BoostCategoryOptionsEnum.aiTopic,

        color: 'lime-600',
        subColor: 'lime-500',
        lightColor: 'lime-200',

        ShapeIcon: Circle,
        WalletIcon: AiSessionsIcon,
        IconComponent: AiSessionsIcon,
        IconWithShape: AiSessionsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',

        shapeColor: 'text-lime-500 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',
    },
    [BoostCategoryOptionsEnum.aiPathway]: {
        displayName: 'Learning Pathway',
        title: 'Learning Pathways',
        titleSingular: 'Learning Pathway',
        plural: 'Learning Pathways',

        credentialType: CredentialCategoryEnum.aiPathway,
        value: BoostCategoryOptionsEnum.aiPathway,

        color: 'teal-600',
        subColor: 'teal-500',
        lightColor: 'teal-200',

        ShapeIcon: Triangle,
        WalletIcon: AiPathwaysIcon,
        IconComponent: AiPathwaysIcon,
        IconWithShape: AiPathwaysIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',

        shapeColor: 'text-teal-500 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',
    },
    [BoostCategoryOptionsEnum.aiInsight]: {
        displayName: 'AI Insight',
        title: 'AI Insights',
        titleSingular: 'AI Insight',
        plural: 'AI Insights',

        credentialType: CredentialCategoryEnum.aiInsight,
        value: BoostCategoryOptionsEnum.aiInsight,

        color: 'lime-600',
        subColor: 'lime-500',
        lightColor: 'lime-200',

        ShapeIcon: Hexagon,
        WalletIcon: AiInsightsIcon,
        IconComponent: AiInsightsIcon,
        IconWithShape: AiInsightsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',

        shapeColor: 'text-lime-500 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',
    },
    [BoostCategoryOptionsEnum.aiAssessment]: {
        displayName: 'AI Assessment',
        title: 'AI Assessments',
        titleSingular: 'AI Assessment',
        plural: 'AI Assessments',

        credentialType: CredentialCategoryEnum.aiAssessment,
        value: BoostCategoryOptionsEnum.aiAssessment,

        color: 'lime-600',
        subColor: 'lime-500',
        lightColor: 'lime-200',

        ShapeIcon: Hexagon,
        WalletIcon: AiInsightsIcon,
        IconComponent: AiInsightsIcon,
        IconWithShape: AiInsightsIconWithShape,
        CategoryImage: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',

        shapeColor: 'text-lime-500 w-[35px] h-[35px]',
        iconStyles: 'h-[35px] w-[35px]',
    },

    // Obsolete / deprecated / unused / not implemented yet
    [BoostCategoryOptionsEnum.events]: {
        displayName: 'Events',
        title: 'Events',
        titleSingular: 'Event',
        plural: 'Events',

        credentialType: CredentialCategoryEnum.events,
        value: BoostCategoryOptionsEnum.events,

        // placeholder to make ts happy, update it when you need it
        color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: AchievementsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',
    },
    [BoostCategoryOptionsEnum.currency]: {
        displayName: 'Currency',
        title: 'Currency',
        titleSingular: 'Currency',
        plural: 'Currencies',

        credentialType: CredentialCategoryEnum.currency,
        value: BoostCategoryOptionsEnum.currency,

        // placeholder to make ts happy, update it when you need it
        color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: AchievementsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',
    },
    [BoostCategoryOptionsEnum.goals]: {
        displayName: 'Goals',
        title: 'Goals',
        titleSingular: 'Goal',
        plural: 'Goals',

        credentialType: CredentialCategoryEnum.goals,
        value: BoostCategoryOptionsEnum.goals,

        // placeholder to make ts happy, update it when you need it
        color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: AchievementsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',
    },
    [BoostCategoryOptionsEnum.relationship]: {
        displayName: 'Relationship',
        title: 'Relationship',
        titleSingular: 'Relationship',
        plural: 'Relationships',

        credentialType: CredentialCategoryEnum.relationship,
        value: BoostCategoryOptionsEnum.relationship,

        // placeholder to make ts happy, update it when you need it
        color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: AchievementsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',
    },
    [BoostCategoryOptionsEnum.describe]: {
        displayName: 'Describe',
        title: 'Describe',
        titleSingular: 'Describe',
        plural: 'Describe',

        credentialType: CredentialCategoryEnum.currency, // doesn't exist in CredentialCategoryEnum, update when needed
        value: BoostCategoryOptionsEnum.describe,

        // placeholder to make ts happy, update it when you need it
        color: 'pink-400',
        darkColor: 'pink-700',
        subColor: 'pink-400',
        IconComponent: AchievementsIcon,
        CategoryImage: 'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',
    },
};

// Helper type to get the boost type from a credential category
export type BoostTypeFromCredentialCategory<T extends CredentialCategoryEnum> =
    (typeof categoryMetadata)[T] extends { boostType: infer U } ? U : never;

// Helper function to get boost metadata
export function getBoostMetadata(
    category: CredentialCategoryEnum | BoostCategoryOptionsEnum
): BoostCategoryMetadata | undefined {
    // If it's already a boost category, look it up directly
    if (Object.values(BoostCategoryOptionsEnum).includes(category as BoostCategoryOptionsEnum)) {
        return boostCategoryMetadata[category as BoostCategoryOptionsEnum];
    }

    // If it's a credential category, get its boostType and look that up
    const credentialMeta = categoryMetadata[category as CredentialCategoryEnum];
    if (credentialMeta?.boostType) {
        return boostCategoryMetadata[credentialMeta.boostType];
    }

    return undefined;
}

type CredentialMetadata = {
    boostType?: BoostCategoryOptionsEnum;
    walletSubtype: WalletCategoryTypes;
    defaultImageSrc: string; // originially from @learncard/react -> TYPE_TO_IMG_SRC
    walletColor: string; // e.g. 'amber-400' - originally from @learncard/react -> TYPE_TO_WALLET_COLOR
    contractCredentialTypeOverride?: string; // AI Passport issues credentials with a category name that doesn't match CredentialCategoryEnum
} & BoostCategoryMetadata;

export const categoryMetadata: Record<CredentialCategoryEnum, CredentialMetadata> = {
    [CredentialCategoryEnum.socialBadge]: {
        boostType: BoostCategoryOptionsEnum.socialBadge,
        walletSubtype: WalletCategoryTypes.socialBadges,
        defaultImageSrc: badgeGraphic,
        walletColor: 'cyan-200',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.socialBadge],
    },
    [CredentialCategoryEnum.learningHistory]: {
        boostType: BoostCategoryOptionsEnum.learningHistory,
        walletSubtype: WalletCategoryTypes.learningHistory,
        defaultImageSrc: apple,
        walletColor: 'emerald-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.learningHistory],
    },
    [CredentialCategoryEnum.course]: {
        boostType: BoostCategoryOptionsEnum.course,
        walletSubtype: WalletCategoryTypes.learningHistory,
        defaultImageSrc: apple,
        walletColor: 'emerald-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.course],
    },
    [CredentialCategoryEnum.workHistory]: {
        boostType: BoostCategoryOptionsEnum.workHistory,
        walletSubtype: WalletCategoryTypes.jobHistory,
        defaultImageSrc: experienceMountain,
        walletColor: 'rose-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.workHistory],
    },
    [CredentialCategoryEnum.experience]: {
        boostType: BoostCategoryOptionsEnum.workHistory,
        walletSubtype: WalletCategoryTypes.jobHistory,
        defaultImageSrc: experienceMountain,
        walletColor: 'rose-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.workHistory],
    },
    [CredentialCategoryEnum.accommodation]: {
        boostType: BoostCategoryOptionsEnum.accommodation,
        walletSubtype: WalletCategoryTypes.accommodations,
        defaultImageSrc: accommodationHands,
        walletColor: 'amber-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.accommodation],
    },
    [CredentialCategoryEnum.accomplishment]: {
        boostType: BoostCategoryOptionsEnum.accomplishment,
        walletSubtype: WalletCategoryTypes.accomplishments,
        defaultImageSrc: learningHistoryGraphic, // weird, but that's what's in react-learn-card's TYPE_TO_IMG_SRC
        walletColor: 'lime-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.accomplishment],
    },
    [CredentialCategoryEnum.achievement]: {
        boostType: BoostCategoryOptionsEnum.achievement,
        walletSubtype: WalletCategoryTypes.achievements,
        defaultImageSrc: achievementsGraphic,
        walletColor: 'spice-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.achievement],
    },
    [CredentialCategoryEnum.family]: {
        boostType: BoostCategoryOptionsEnum.family,
        walletSubtype: WalletCategoryTypes.families,
        defaultImageSrc: 'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',
        walletColor: '', // No matching color found
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.family],
    },
    [CredentialCategoryEnum.id]: {
        boostType: BoostCategoryOptionsEnum.id,
        walletSubtype: WalletCategoryTypes.ids,
        defaultImageSrc: idsGraphic,
        walletColor: 'yellow-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.id],
    },
    [CredentialCategoryEnum.skill]: {
        boostType: BoostCategoryOptionsEnum.skill,
        walletSubtype: WalletCategoryTypes.skills,
        defaultImageSrc: skillsGraphic,
        walletColor: 'indigo-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.skill],
    },
    [CredentialCategoryEnum.membership]: {
        boostType: BoostCategoryOptionsEnum.membership,
        walletSubtype: WalletCategoryTypes.membership,
        defaultImageSrc: membershipGraphic,
        walletColor: 'teal-300',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.membership],
    },

    // Scouts
    [CredentialCategoryEnum.meritBadge]: {
        boostType: BoostCategoryOptionsEnum.meritBadge,
        walletSubtype: WalletCategoryTypes.meritBadges,
        defaultImageSrc: badgeGraphic, // Using social badge graphic as fallback
        walletColor: 'cyan-200', // Using social badge color as fallback
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.meritBadge],
    },
    [CredentialCategoryEnum.globalAdminId]: {
        boostType: BoostCategoryOptionsEnum.globalAdminId,
        walletSubtype: WalletCategoryTypes.notImplemented,
        defaultImageSrc: idsGraphic, // Using ID graphic as fallback
        walletColor: 'yellow-300', // Using ID color as fallback
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.globalAdminId],
    },
    [CredentialCategoryEnum.nationalNetworkAdminId]: {
        boostType: BoostCategoryOptionsEnum.nationalNetworkAdminId,
        walletSubtype: WalletCategoryTypes.notImplemented,
        defaultImageSrc: idsGraphic, // Using ID graphic as fallback
        walletColor: 'yellow-300', // Using ID color as fallback
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.nationalNetworkAdminId],
    },
    [CredentialCategoryEnum.troopLeaderId]: {
        boostType: BoostCategoryOptionsEnum.troopLeaderId,
        walletSubtype: WalletCategoryTypes.notImplemented,
        defaultImageSrc: idsGraphic, // Using ID graphic as fallback
        walletColor: 'yellow-300', // Using ID color as fallback
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.troopLeaderId],
    },
    [CredentialCategoryEnum.scoutId]: {
        boostType: BoostCategoryOptionsEnum.scoutId,
        walletSubtype: WalletCategoryTypes.notImplemented,
        defaultImageSrc: idsGraphic, // Using ID graphic as fallback
        walletColor: 'yellow-300', // Using ID color as fallback
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.scoutId],
    },

    // AI
    [CredentialCategoryEnum.aiSummary]: {
        boostType: BoostCategoryOptionsEnum.aiSummary,
        walletSubtype: WalletCategoryTypes.aiSummaries,
        defaultImageSrc: '',
        walletColor: '',
        contractCredentialTypeOverride: 'ai-summary',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.aiSummary],
    },
    [CredentialCategoryEnum.aiTopic]: {
        boostType: BoostCategoryOptionsEnum.aiTopic,
        walletSubtype: WalletCategoryTypes.aiTopics,
        defaultImageSrc: '',
        walletColor: '',
        contractCredentialTypeOverride: 'ai-topic',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.aiTopic],
    },
    [CredentialCategoryEnum.aiPathway]: {
        boostType: BoostCategoryOptionsEnum.aiPathway,
        walletSubtype: WalletCategoryTypes.aiPathways,
        defaultImageSrc: '',
        walletColor: '',
        contractCredentialTypeOverride: 'learning-pathway',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.aiPathway],
    },
    [CredentialCategoryEnum.aiInsight]: {
        boostType: BoostCategoryOptionsEnum.aiInsight,
        walletSubtype: WalletCategoryTypes.aiInsights,
        defaultImageSrc: '',
        walletColor: '',
        // contractCredentialTypeOverride: 'ai-insight', // These credentials use the proper CredentialCategory string, so intentionally no override
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.aiInsight],
    },
    [CredentialCategoryEnum.aiAssessment]: {
        boostType: BoostCategoryOptionsEnum.aiAssessment,
        walletSubtype: WalletCategoryTypes.aiAssessments,
        defaultImageSrc: '',
        walletColor: '',
        contractCredentialTypeOverride: 'ai-assessment',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.aiAssessment],
    },

    // Obsolete / deprecated / unused / not implemented yet
    [CredentialCategoryEnum.events]: {
        boostType: BoostCategoryOptionsEnum.events,
        walletSubtype: WalletCategoryTypes.events,
        defaultImageSrc: '',
        walletColor: '',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.events],
    },
    [CredentialCategoryEnum.currency]: {
        boostType: BoostCategoryOptionsEnum.currency,
        walletSubtype: WalletCategoryTypes.currencies,
        defaultImageSrc: '',
        walletColor: '',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.currency],
    },
    [CredentialCategoryEnum.goals]: {
        boostType: BoostCategoryOptionsEnum.goals,
        walletSubtype: WalletCategoryTypes.goals,
        defaultImageSrc: '',
        walletColor: '',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.goals],
    },
    [CredentialCategoryEnum.relationship]: {
        boostType: BoostCategoryOptionsEnum.relationship,
        walletSubtype: WalletCategoryTypes.relationships,
        defaultImageSrc: '',
        walletColor: '',
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.relationship],
    },
};

export const walletSubtypeToCredentialCategory = (walletSubtype: WalletCategoryTypes) => {
    const category: CredentialCategoryEnum = Object.entries(categoryMetadata).find(
        ([key, value]) => value.walletSubtype === walletSubtype
    )?.[0] as CredentialCategoryEnum;
    return category;
};

export const walletSubtypeToDefaultImageSrc = (walletSubtype: WalletCategoryTypes) => {
    return categoryMetadata[walletSubtypeToCredentialCategory(walletSubtype)].defaultImageSrc;
};

export const contractCategoryNameToCategoryMetadata = (
    categoryName: string
): CredentialMetadata | undefined => {
    // legacy handling
    if (categoryName === 'summaryInfo') {
        categoryName = 'ai-summary';
    } else if (categoryName === 'topicInfo') {
        categoryName = 'ai-topic';
    } else if (categoryName === 'learningPathway' || categoryName === 'ai-pathway') {
        categoryName = 'learning-pathway';
    } else if (categoryName === 'assessment') {
        categoryName = 'ai-assessment';
    }

    // This is guaranteed to be a CredentialCategoryEnum OR something from contractCredentialTypeOverride
    //   check if in categoryMetadata first
    //   else, check contractCredentialTypeOverride
    return (
        categoryMetadata[categoryName as CredentialCategoryEnum] ||
        Object.values(categoryMetadata).find(
            category => category.contractCredentialTypeOverride === categoryName
        )
    );
};
