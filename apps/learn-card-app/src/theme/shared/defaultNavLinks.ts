import { MobileNavBarLinks } from '../../components/mobile-nav-bar/MobileNavBar';
import { SideMenuLinksEnum } from 'learn-card-base/components/sidemenu/sidemenuHelpers';

import type { SideMenuLink, NavbarLink } from '../validators/theme.validators';

/**
 * Default side menu root links shared across all themes.
 * Themes can override to show/hide specific root items.
 */
export const DEFAULT_SIDE_MENU_ROOT_LINKS: SideMenuLink[] = [
    { id: SideMenuLinksEnum.launchPad, label: 'Apps', path: '/launchpad' },
    { id: SideMenuLinksEnum.contacts, label: 'Contacts', path: '/contacts' },
    { id: SideMenuLinksEnum.alerts, label: 'Alerts', path: '/notifications' },
    { id: SideMenuLinksEnum.personalize, label: 'Personalize', path: '/personalize' },
    { id: SideMenuLinksEnum.adminTools, label: 'Admin Tools', path: '/admin-tools' },
];

/**
 * Default side menu secondary (category) links shared across all themes.
 * Themes can override to reorder, rename, or remove specific categories.
 */
export const DEFAULT_SIDE_MENU_SECONDARY_LINKS: SideMenuLink[] = [
    { id: SideMenuLinksEnum.wallet, label: 'Passport', path: '/passport' },
    { id: SideMenuLinksEnum.aiTopics, label: 'AI Sessions', path: '/ai/topics' },
    { id: SideMenuLinksEnum.aiInsights, label: 'AI Insights', path: '/ai/insights' },
    { id: SideMenuLinksEnum.aiPathways, label: 'AI Pathways', path: '/ai/pathways' },
    // Pathways v2 \u2014 currently labelled "Journeys" to avoid
    // clashing with the legacy `AI Pathways` entry above. Once the
    // legacy feature is retired we can reclaim the "Pathways" label
    // here. Visibility is gated by `usePathwaysEnabled` in the side
    // menu.
    { id: SideMenuLinksEnum.pathways, label: 'Journeys', path: '/pathways' },
    { id: SideMenuLinksEnum.skills, label: 'Skills', path: '/skills' },
    { id: SideMenuLinksEnum.socialBadges, label: 'Boosts', path: '/socialBadges' },
    { id: SideMenuLinksEnum.achievements, label: 'Achievements', path: '/achievements' },
    { id: SideMenuLinksEnum.studies, label: 'Studies', path: '/learninghistory' },
    { id: SideMenuLinksEnum.portfolio, label: 'Portfolio', path: '/accomplishments' },
    { id: SideMenuLinksEnum.assistance, label: 'Assistance', path: '/accommodations' },
    { id: SideMenuLinksEnum.experiences, label: 'Experiences', path: '/workhistory' },
    { id: SideMenuLinksEnum.families, label: 'Families', path: '/families' },
    { id: SideMenuLinksEnum.ids, label: 'IDs', path: '/ids' },
];

/**
 * Default mobile navbar links shared across all themes.
 */
export const DEFAULT_NAVBAR: NavbarLink[] = [
    { id: MobileNavBarLinks.wallet, label: 'Passport', path: '/passport' },
    { id: MobileNavBarLinks.plus, label: 'Plus', path: '/boost' },
    { id: MobileNavBarLinks.launchpad, label: 'Apps', path: '/launchpad' },
    { id: MobileNavBarLinks.notification, label: 'Alerts', path: '/notifications' },
];
