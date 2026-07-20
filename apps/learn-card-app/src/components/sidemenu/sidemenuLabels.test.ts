import { describe, it, expect, vi } from 'vitest';
import {
    SideMenuLinksEnum,
    getSideMenuTranslationKey,
    getSideMenuLinkLabel,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';

// `defaultNavLinks` transitively imports the MobileNavBar component, which pulls
// in a module that breaks under jsdom (`TextDecoder is not a constructor`). We
// only need the link arrays, so stub the unrelated nav-bar enum it references.
vi.mock('../mobile-nav-bar/MobileNavBar', () => ({
    MobileNavBarLinks: {
        wallet: 'wallet',
        plus: 'plus',
        launchpad: 'launchpad',
        notification: 'notification',
    },
}));

import {
    DEFAULT_SIDE_MENU_ROOT_LINKS,
    DEFAULT_SIDE_MENU_SECONDARY_LINKS,
} from '../../theme/shared/defaultNavLinks';
import en from '../../../public/locales/en/translation.json';
import es from '../../../public/locales/es/translation.json';
import fr from '../../../public/locales/fr/translation.json';
import ar from '../../../public/locales/ar/translation.json';

const catalogs = { en, es, fr, ar };
const defaultLinks = [...DEFAULT_SIDE_MENU_ROOT_LINKS, ...DEFAULT_SIDE_MENU_SECONDARY_LINKS];

describe('side menu link translation keys', () => {
    // The side menu renders each label via a DYNAMIC key:
    //   m[`sidemenu.links.${getSideMenuTranslationKey(link.id)}`]()
    // A missing key resolves to undefined → calling it throws
    // ("m[...] is not a function") and the whole menu error-boundaries out.
    // Static i18n guards can't see dynamic keys, so assert here that every
    // default side-menu link resolves to a catalog entry in EVERY locale.
    it.each(Object.entries(catalogs))(
        'every default side-menu link resolves to a catalog entry (%s locale)',
        (_locale, catalog) => {
            const links = (catalog as { sidemenu: { links: Record<string, string> } }).sidemenu
                .links;

            const missing = defaultLinks
                .map(link => ({
                    label: link.label,
                    key: getSideMenuTranslationKey(link.id as string),
                }))
                .filter(({ key }) => typeof links[key] !== 'string' || links[key].length === 0)
                .map(({ label, key }) => `${label} → sidemenu.links.${key}`);

            expect(missing).toEqual([]);
        }
    );
});

describe('getSideMenuLinkLabel', () => {
    it('returns the translated message when the key exists', () => {
        const m = { 'sidemenu.links.wallet': () => 'Wallet' };

        expect(getSideMenuLinkLabel(m, { id: SideMenuLinksEnum.wallet, label: 'Passport' })).toBe(
            'Wallet'
        );
    });

    it('falls back to link.label when the translation key is missing', () => {
        const m = {}; // no keys → inline m[key]() would throw; helper must degrade

        expect(getSideMenuLinkLabel(m, { id: 'dashboard', label: 'Dashboard' })).toBe('Dashboard');
    });
});
