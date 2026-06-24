import { describe, it, expect, vi } from 'vitest';

// Mock learn-card-base to avoid pulling in heavy crypto/Ionic deps during
// unit tests. We only need the SideMenuLinksEnum values.
vi.mock('learn-card-base/components/sidemenu/sidemenuHelpers', () => ({
    SideMenuLinksEnum: {
        dashboard: 'dashboard',
        wallet: 'wallet',
        launchPad: 'launchPad',
        contacts: 'contacts',
        alerts: 'alerts',
        adminTools: 'adminTools',
        aiTopics: 'aiTopics',
        aiInsights: 'aiInsights',
        aiPathways: 'aiPathways',
        pathways: 'pathways',
        skills: 'skills',
        socialBadges: 'socialBadges',
        achievements: 'achievements',
        studies: 'studies',
        portfolio: 'portfolio',
        assistance: 'assistance',
        experiences: 'experiences',
        families: 'families',
        ids: 'ids',
    },
}));

// Mock MobileNavBar to avoid Ionic/React deps — we only need the enum.
vi.mock('../../components/mobile-nav-bar/MobileNavBar', () => ({
    MobileNavBarLinks: {
        dashboard: 'dashboard',
        wallet: 'wallet',
        plus: '/boost',
        launchpad: 'launchpad',
        notification: 'notification',
    },
}));

import {
    DEFAULT_SIDE_MENU_ROOT_LINKS,
    DEFAULT_SIDE_MENU_SECONDARY_LINKS,
    DEFAULT_NAVBAR,
} from './defaultNavLinks';
import { SideMenuLinksEnum } from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import { MobileNavBarLinks } from '../../components/mobile-nav-bar/MobileNavBar';

describe('defaultNavLinks (LC-1921)', () => {
    it('root links are Dashboard, Passport, Apps, Contacts (Admin Tools stays gated)', () => {
        const paths = DEFAULT_SIDE_MENU_ROOT_LINKS.map(l => l.path);
        expect(paths).toEqual([
            '/dashboard',
            '/passport',
            '/launchpad',
            '/contacts',
            '/admin-tools',
        ]);
        expect(paths).not.toContain('/notifications');
    });

    it('Passport is a root link using the wallet id', () => {
        const passport = DEFAULT_SIDE_MENU_ROOT_LINKS.find(l => l.path === '/passport');
        expect(passport?.id).toBe(SideMenuLinksEnum.wallet);
    });

    it('secondary links are empty by default', () => {
        expect(DEFAULT_SIDE_MENU_SECONDARY_LINKS).toEqual([]);
    });

    it('mobile navbar is Dashboard, Passport, Apps with no plus/alerts', () => {
        const ids = DEFAULT_NAVBAR.map(l => l.id);
        expect(ids).toEqual([
            MobileNavBarLinks.dashboard,
            MobileNavBarLinks.wallet,
            MobileNavBarLinks.launchpad,
        ]);
        expect(ids).not.toContain(MobileNavBarLinks.plus);
        expect(ids).not.toContain(MobileNavBarLinks.notification);
    });
});
