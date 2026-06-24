import { describe, it, expect, vi } from 'vitest';

// Mock MobileNavBar module-loader only: MobileNavBar.tsx transitively imports
// Ionic and learn-card-base (for useGetUnreadUserNotifications), which pulls in
// heavy crypto/binary deps (cborg/vpqr) that don't initialise correctly under
// jsdom.  We only need the MobileNavBarLinks enum values here.
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

// Asserts against the real enum string values the nav components key on.
// sidemenuHelpers (SideMenuLinksEnum) is intentionally NOT mocked, so the
// root-link id assertions verify the real enum values; only the MobileNavBar
// module is stubbed above to satisfy the jsdom loader.
describe('defaultNavLinks (LC-1921)', () => {
    it('root links are Dashboard, Passport, Apps, Contacts, Admin Tools (Alerts removed)', () => {
        expect(DEFAULT_SIDE_MENU_ROOT_LINKS.map(l => l.path)).toEqual([
            '/dashboard',
            '/passport',
            '/launchpad',
            '/contacts',
            '/admin-tools',
        ]);
        expect(DEFAULT_SIDE_MENU_ROOT_LINKS.map(l => l.path)).not.toContain('/notifications');
    });

    it('root links use the expected labels', () => {
        expect(DEFAULT_SIDE_MENU_ROOT_LINKS.map(l => l.label)).toEqual([
            'Dashboard',
            'Passport',
            'Apps',
            'Contacts',
            'Admin Tools',
        ]);
    });

    it('Passport is a root link using the wallet id', () => {
        const passport = DEFAULT_SIDE_MENU_ROOT_LINKS.find(l => l.path === '/passport');
        expect(passport?.id).toBe('wallet'); // SideMenuLinksEnum.wallet
    });

    it('secondary links are empty by default', () => {
        expect(DEFAULT_SIDE_MENU_SECONDARY_LINKS).toEqual([]);
    });

    it('mobile navbar is Dashboard, Passport, Apps with no plus/alerts', () => {
        expect(DEFAULT_NAVBAR.map(l => l.id)).toEqual([
            'dashboard', // MobileNavBarLinks.dashboard
            'wallet', // MobileNavBarLinks.wallet
            'launchpad', // MobileNavBarLinks.launchpad
        ]);
        expect(DEFAULT_NAVBAR.map(l => l.id)).not.toContain('/boost'); // plus removed
        expect(DEFAULT_NAVBAR.map(l => l.id)).not.toContain('notification'); // alerts removed
    });
});
