import WalletIcon from 'learn-card-base/svgs/WalletIcon';
import Rocket from 'learn-card-base/svgs/Rocket';
import IDIcon from 'learn-card-base/svgs/IDIcon2';
import Trophy from 'learn-card-base/svgs/Trophy';
import Graduation from 'learn-card-base/svgs/Graduation';
import Briefcase from 'learn-card-base/svgs/Briefcase';
import Lightbulb from 'learn-card-base/svgs/Lightbulb';
import GlobeStand from 'learn-card-base/svgs/GlobeStand';
import NotificationIcon2 from 'learn-card-base/svgs/NotificationIcon2';
import Campfire2 from 'learn-card-base/svgs/Campfire2';
import ScoutsPledge2 from 'learn-card-base/svgs/ScoutsPledge2';
import ScoutsGlobe2 from 'learn-card-base/svgs/ScoutsGlobe2';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import MeritBadgesIcon from 'learn-card-base/svgs/MeritBadgesIcon';
import WalletIconThin from 'learn-card-base/svgs/WalletIconThin';
import WalletIconThin2 from 'learn-card-base/svgs/WalletIconThin2';
import AiInsightsTwoTonedIcon from 'learn-card-base/svgs/SideNav/AiInsightsTwoTonedIcon';
import AiWandIcon from 'learn-card-base/svgs/AiWandIcon';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import {
    ThinnerLighterShieldChevron,
    ThinnerShieldChevron,
} from 'learn-card-base/svgs/ShieldChevron';

import { SideNavIcons } from 'learn-card-base/svgs/SideNav/SideNavIcons';
import PassportIcon from 'learn-card-base/svgs/PassportIcon';
const {
    SkillsTwoTonedIcon,
    BoostsTwoTonedIcon,
    AchievementsTwoTonedIcon,
    StudiesTwoTonedIcon,
    IDsTwoTonedIcon,
    ExperiencesTwoTonedIcon,
    PortfolioTwoTonedIcon,
    AssistanceTwoTonedIcon,
    FamiliesTwoTonedIcon,
} = SideNavIcons;

import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';
import { CredentialCategoryEnum } from 'learn-card-base/types/boostAndCredentialMetadata';

export enum SideMenuLinksEnum {
    //  root links
    launchPad = 'launchPad',
    contacts = 'contacts',
    alerts = 'alerts',
    personalize = 'personalize',
    adminTools = 'adminTools',

    // secondary links
    wallet = 'wallet',
    aiTopics = CredentialCategoryEnum.aiTopic,
    aiInsights = CredentialCategoryEnum.aiInsight,
    skills = CredentialCategoryEnum.skill,
    socialBadges = CredentialCategoryEnum.socialBadge,
    achievements = CredentialCategoryEnum.achievement,
    studies = CredentialCategoryEnum.learningHistory,
    portfolio = CredentialCategoryEnum.accomplishment,
    assistance = CredentialCategoryEnum.accommodation,
    experiences = CredentialCategoryEnum.workHistory,
    families = CredentialCategoryEnum.family,
    ids = CredentialCategoryEnum.id,
}

export type SideMenuLinks = {
    id: number;
    name: string;
    IconComponent: React.FC<{ className?: string; shadeColor?: string }>;
    path: string;
    type?: SideMenuLinksEnum;
};

export const sideMenuRootLinks: Record<BrandingEnum, SideMenuLinks[]> = {
    [BrandingEnum.learncard]: [
        {
            id: 1,
            name: 'LaunchPad',
            IconComponent: Rocket,
            path: '/launchpad',
            type: SideMenuLinksEnum.launchPad,
        },
        {
            id: 2,
            name: 'Contacts',
            IconComponent: GlobeStand,
            path: '/contacts',
            type: SideMenuLinksEnum.contacts,
        },
        {
            id: 3,
            name: 'Alerts',
            IconComponent: NotificationIcon2,
            path: '/notifications',
            type: SideMenuLinksEnum.alerts,
        },
        {
            id: 4,
            name: 'Personalize',
            IconComponent: UnicornIcon,
            path: '/personalize',
            type: SideMenuLinksEnum.personalize,
        },
        {
            id: 5,
            name: 'Admin Tools',
            IconComponent: ThinnerShieldChevron,
            path: '/admin-tools',
            type: SideMenuLinksEnum.adminTools,
        },
    ],
    [BrandingEnum.metaversity]: [
        {
            id: 1,
            name: 'Jobs',
            IconComponent: Briefcase,
            path: '/jobs',
        },
    ],
    [BrandingEnum.scoutPass]: [
        // {
        //     id: 1,
        //     name: 'My Troop',
        //     IconComponent: Backpack,
        //     path: '/boost',
        // },
        {
            id: 2,
            name: 'Campfire',
            IconComponent: Campfire2,
            path: '/campfire',
        },
        {
            id: 3,
            name: 'Contacts',
            IconComponent: ScoutsGlobe2,
            path: '/contacts',
        },
        {
            id: 4,
            name: 'Alerts',
            IconComponent: NotificationIcon2,
            path: '/notifications',
        },
        {
            id: 5,
            name: 'Admin Tools',
            IconComponent: ThinnerLighterShieldChevron,
            path: '/admin-tools',
        },
    ],
};

export const sidemenuLinks: Record<BrandingEnum, SideMenuLinks[]> = {
    [BrandingEnum.learncard]: [
        {
            id: 9,
            name: 'Passport',
            IconComponent: PassportIcon,
            path: '/passport',
            type: SideMenuLinksEnum.passport,
        },
        {
            id: 10,
            name: 'AI Sessions',
            IconComponent: AiWandIcon,
            path: '/ai/topics',
            type: SideMenuLinksEnum.aiTopics,
        },
        {
            id: 11,
            name: 'AI Insights',
            IconComponent: AiInsightsTwoTonedIcon,
            path: '/ai/insights',
            type: SideMenuLinksEnum.aiInsights,
        },
        {
            id: 5,
            name: 'Skills',
            IconComponent: SkillsTwoTonedIcon,
            path: '/skills',
            type: SideMenuLinksEnum.skills,
        },
        {
            id: 2,
            name: 'Boosts',
            IconComponent: BoostsTwoTonedIcon,
            path: '/socialBadges',
            type: SideMenuLinksEnum.socialBadges,
        },
        {
            id: 3,
            name: 'Achievements',
            IconComponent: AchievementsTwoTonedIcon,
            path: '/achievements',
            type: SideMenuLinksEnum.achievements,
        },
        {
            id: 1,
            name: 'Studies',
            IconComponent: StudiesTwoTonedIcon,
            path: '/learninghistory',
            type: SideMenuLinksEnum.studies,
        },
        {
            id: 4,
            name: 'Portfolio',
            IconComponent: PortfolioTwoTonedIcon,
            path: '/accomplishments',
            type: SideMenuLinksEnum.portfolio,
        },
        {
            id: 7,
            name: 'Assistance',
            IconComponent: AssistanceTwoTonedIcon,
            path: '/accommodations',
            type: SideMenuLinksEnum.assistance,
        },
        {
            id: 6,
            name: 'Experiences',
            IconComponent: ExperiencesTwoTonedIcon,
            path: '/workhistory',
            type: SideMenuLinksEnum.experiences,
        },
        {
            id: 9,
            name: 'Families',
            IconComponent: FamiliesTwoTonedIcon,
            path: '/families',
            type: SideMenuLinksEnum.families,
        },
        {
            id: 8,
            name: 'IDs',
            IconComponent: IDsTwoTonedIcon,
            path: '/ids',
            type: SideMenuLinksEnum.ids,
        },
        // {
        //     id: 9,
        //     name: 'Memberships',
        //     IconComponent: MembershipsIconThin,
        //     path: '/memberships',
        // },
    ],

    [BrandingEnum.metaversity]: [
        {
            id: 2,
            name: 'Wallet',
            IconComponent: WalletIcon,
            path: '/wallet',
        },
        {
            id: 3,
            name: 'IDs',
            IconComponent: IDIcon,
            path: '/ids',
        },
        {
            id: 4,
            name: 'Learning History',
            IconComponent: Graduation,
            path: '/learninghistory',
        },
        {
            id: 7,
            name: 'Work History',
            IconComponent: Briefcase,
            path: '/workhistory',
        },
        {
            id: 5,
            name: 'Achievements',
            IconComponent: Trophy,
            path: '/achievements',
        },
        {
            id: 6,
            name: 'Skills',
            IconComponent: Lightbulb,
            path: '/skills',
        },
    ],
    [BrandingEnum.scoutPass]: [
        // {
        //     id: 6,
        //     name: 'My Troop',
        //     IconComponent: Backpack,
        //     path: '/boost',
        // },
        // {
        //     id: 7,
        //     name: 'Notifications',
        //     IconComponent: NotificationIcon,
        //     path: '/notifications',
        // },
        // {
        //     id: 8,
        //     name: 'My Profile',
        //     IconComponent: User,
        //     path: '/profile',
        // },
        {
            id: 9,
            name: 'Wallet',
            IconComponent: WalletIconThin2,
            path: '/wallet',
        },
        {
            id: 10,
            name: 'Social Boosts',
            IconComponent: BoostOutline2,
            path: '/boosts',
        },
        {
            id: 11,
            name: 'Merit Badges',
            IconComponent: MeritBadgesIcon,
            path: '/badges',
        },
        {
            id: 12,
            name: 'Troops',
            IconComponent: ScoutsPledge2,
            path: '/troops',
        },
        {
            id: 13,
            name: 'Skills',
            IconComponent: SkillsTwoTonedIcon,
            path: '/skills',
        },
    ],
};

export const sideMenuLearnCardBrandingStyles = {
    mainBg: 'grayscale-100',
    brandingTextColor: '!text-emerald-700',
    bradingSpanColor: '',
    defaultListStyles: 'learn-card-side-menu-list',
    defaultLinkStyles: 'learn-card-side-menu-list-item-link',
    secondaryLinkStyles: 'learn-card-side-menu-secondary-list-item-link',
    activeLinkStyles: 'learn-card-side-menu-list-item-link-active',
    secondaryActiveLinkStyles: 'learn-card-side-menu-secondary-list-item-link-active',
    defaultDividerStyles: 'bg-grayscale-700',
};

export const sideMenuMetaversityBrandingStyles = {
    mainBg: 'metaversity-primary-blue',
    brandingTextColor: '!text-white',
    bradingSpanColor: '!text-white',
    defaultListStyles: 'mv-side-menu-list',
    defaultLinkStyles: 'mv-side-menu-list-item-link',
    activeLinkStyles: 'mv-side-menu-list-item-link-active',
    defaultDividerStyles: 'bg-white',
};

export const sideMenuScoutPassStyles = {
    mainBg: 'grayscale-100',
    brandingTextColor: '!text-white',
    bradingSpanColor: '',
    defaultListStyles: 'scout-pass-side-menu-list',
    defaultLinkStyles: 'scout-pass-side-menu-list-item-link',
    activeLinkStyles: 'scout-pass-side-menu-list-item-link-active',
    defaultDividerStyles: 'bg-grayscale-700',

    secondaryListStyles: 'scout-pass-secondary-side-menu-list',
    secondaryLinkStyles: 'scout-pass-side-menu-secondary-list-item-link',
    secondaryActiveLinkStyles: 'scout-pass-side-menu-secondary-list-item-link-active',
};
