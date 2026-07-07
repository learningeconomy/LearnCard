import { MobileNavBarLinks } from '../../components/mobile-nav-bar/MobileNavBar';
import { SideMenuLinksEnum } from 'learn-card-base/components/sidemenu/sidemenuHelpers';

import type { SideMenuLink, NavbarLink } from '../validators/theme.validators';

export const DEFAULT_SIDE_MENU_ROOT_LINKS: SideMenuLink[] = [
    // Dashboard gated by `useDashboardAsHome` in SideMenuRootLinks.
    { id: SideMenuLinksEnum.dashboard, label: 'Dashboard', path: '/dashboard' },
    // Passport promoted from secondary → root (LC-1921). Wallet-sync
    // spinner/label is handled in SideMenuRootLinks.
    { id: SideMenuLinksEnum.wallet, label: 'Passport', path: '/passport' },
    { id: SideMenuLinksEnum.launchPad, label: 'Apps', path: '/launchpad' },
    // Alerts (notifications) appears in the side menu on MOBILE only — on desktop
    // notifications live in the header island. The mobile-only filtering happens
    // in SideMenuRootLinks (LC-1921).
    { id: SideMenuLinksEnum.alerts, label: 'Alerts', path: '/notifications' },
    { id: SideMenuLinksEnum.myAssistant, label: 'My Assistant', path: '/ai/assistant' },
    { id: SideMenuLinksEnum.contacts, label: 'Contacts', path: '/contacts' },
    // Disable personalize as default side menu link for now
    // { id: SideMenuLinksEnum.personalize, label: 'Personalize', path: '/personalize' },
    { id: SideMenuLinksEnum.adminTools, label: 'Admin Tools', path: '/admin-tools' },
];

/**
 * Secondary (category) links are removed from the default LearnCard nav
 * (LC-1921). These pages remain routed in Routes.tsx and are reached via
 * Passport / deep links. Kept as an empty array so tenant themes can still
 * override `sideMenuSecondaryLinks` to inject categories.
 */
export const DEFAULT_SIDE_MENU_SECONDARY_LINKS: SideMenuLink[] = [];

export const DEFAULT_NAVBAR: NavbarLink[] = [
    { id: MobileNavBarLinks.dashboard, label: 'Dashboard', path: '/dashboard' },
    { id: MobileNavBarLinks.wallet, label: 'Passport', path: '/passport' },
    { id: MobileNavBarLinks.launchpad, label: 'Apps', path: '/launchpad' },
];
