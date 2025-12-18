import { ViewMode } from '../types/theme.types';
import { ThemeEnum } from '../helpers/theme-helpers';
import { CredentialCategoryEnum } from 'learn-card-base';
import { Theme, validateThemeData } from '../validators/theme.validators';
import { MobileNavBarLinks } from '../../components/mobile-nav-bar/MobileNavBar';
import { SideMenuLinksEnum } from 'learn-card-base/components/sidemenu/sidemenuHelpers';

import SwitcherIcon from '../../theme/images/colorful-switcher-icon.png';
import BlocksIcon from '../../theme/images/colorful-blocks-icon.png';

import { colors } from '../colors';
import { icons } from '../icons';
import { styles } from '../styles';

export const colorfulTheme: Theme = validateThemeData({
    id: ThemeEnum.Colorful,
    name: 'colorful',
    displayName: 'Colorful',
    categories: [
        {
            labels: {
                singular: 'AI Session',
                plural: 'AI Sessions',
            },
            categoryId: CredentialCategoryEnum.aiTopic,
        },
        {
            labels: {
                singular: 'AI Pathway',
                plural: 'AI Pathways',
            },
            categoryId: CredentialCategoryEnum.aiPathway,
        },
        {
            labels: {
                singular: 'AI Insight Hub',
                plural: 'AI Insights Hub',
            },
            categoryId: CredentialCategoryEnum.aiInsight,
        },
        {
            labels: {
                singular: 'Skill',
                plural: 'Skills Hub',
            },
            categoryId: CredentialCategoryEnum.skill,
        },
        {
            labels: {
                singular: 'Boost',
                plural: 'Boosts',
            },
            categoryId: CredentialCategoryEnum.socialBadge,
        },
        {
            labels: {
                singular: 'Achievement',
                plural: 'Achievements',
            },
            categoryId: CredentialCategoryEnum.achievement,
        },
        {
            labels: {
                singular: 'Study',
                plural: 'Studies',
            },
            categoryId: CredentialCategoryEnum.learningHistory,
        },
        {
            labels: {
                singular: 'Portfolio',
                plural: 'Portfolio',
            },
            categoryId: CredentialCategoryEnum.accomplishment,
        },
        {
            labels: {
                singular: 'Assistance',
                plural: 'Assistance',
            },
            categoryId: CredentialCategoryEnum.accommodation,
        },
        {
            labels: {
                singular: 'Experience',
                plural: 'Experiences',
            },
            categoryId: CredentialCategoryEnum.workHistory,
        },
        {
            labels: {
                singular: 'Family',
                plural: 'Families',
            },
            categoryId: CredentialCategoryEnum.family,
        },
        {
            labels: {
                singular: 'ID',
                plural: 'IDs',
            },
            categoryId: CredentialCategoryEnum.id,
        },
    ],
    sideMenuRootLinks: [
        {
            id: SideMenuLinksEnum.launchPad,
            label: 'LaunchPad',
            path: '/launchpad',
        },
        {
            id: SideMenuLinksEnum.contacts,
            label: 'Contacts',
            path: '/contacts',
        },
        {
            id: SideMenuLinksEnum.alerts,
            label: 'Alerts',
            path: '/notifications',
        },
        {
            id: SideMenuLinksEnum.personalize,
            label: 'Personalize',
            path: '/personalize',
        },
        {
            id: SideMenuLinksEnum.adminTools,
            label: 'Admin Tools',
            path: '/admin-tools',
        },
    ],
    sideMenuSecondaryLinks: [
        {
            id: SideMenuLinksEnum.wallet,
            label: 'Passport',
            path: '/passport',
        },
        {
            id: SideMenuLinksEnum.aiTopics,
            label: 'AI Sessions',
            path: '/ai/topics',
        },
        {
            id: SideMenuLinksEnum.aiInsights,
            label: 'AI Insights Hub',
            path: '/ai/insights',
        },
        {
            id: SideMenuLinksEnum.skills,
            label: 'Skills',
            path: '/skills',
        },
        {
            id: SideMenuLinksEnum.socialBadges,
            label: 'Boosts',
            path: '/socialBadges',
        },
        {
            id: SideMenuLinksEnum.achievements,
            label: 'Achievements',
            path: '/achievements',
        },
        {
            id: SideMenuLinksEnum.studies,
            label: 'Studies',
            path: '/learninghistory',
        },
        {
            id: SideMenuLinksEnum.portfolio,
            label: 'Portfolio',
            path: '/accomplishments',
        },
        {
            id: SideMenuLinksEnum.assistance,
            label: 'Assistance',
            path: '/accommodations',
        },
        {
            id: SideMenuLinksEnum.experiences,
            label: 'Experiences',
            path: '/workhistory',
        },
        {
            id: SideMenuLinksEnum.families,
            label: 'Families',
            path: '/families',
        },
        {
            id: SideMenuLinksEnum.ids,
            label: 'IDs',
            path: '/ids',
        },
    ],
    navbar: [
        {
            id: MobileNavBarLinks.wallet,
            label: 'Passport',
            path: '/passport',
        },
        {
            id: MobileNavBarLinks.plus,
            label: 'Plus',
            path: '/boost',
        },
        {
            id: MobileNavBarLinks.launchpad,
            label: 'LaunchPad',
            path: '/launchpad',
        },
    ],
    colors: colors[ThemeEnum.Colorful],
    icons: icons[ThemeEnum.Colorful],
    styles: styles[ThemeEnum.Colorful],
    defaults: {
        viewMode: ViewMode.Grid,
        switcherIcon: SwitcherIcon,
        buildMyLCIcon: BlocksIcon,
    },
} as const);
