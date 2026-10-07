/// <reference types="node" />

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import {
    sideMenuRootLinks,
    sidemenuLinks,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import {
    SCOUT_PASS_SIDE_MENU_MESSAGE_KEYS,
    getScoutPassSideMenuLinkLabel,
} from './scoutPassSideMenuLabels';

const loadCatalog = (locale: string) =>
    JSON.parse(
        readFileSync(
            fileURLToPath(
                new URL(`../../../public/locales/${locale}/translation.json`, import.meta.url)
            ),
            'utf8'
        )
    );

const scoutPassLinks = [
    ...sideMenuRootLinks[BrandingEnum.scoutPass],
    ...sidemenuLinks[BrandingEnum.scoutPass],
];

describe('ScoutPass side-menu labels', () => {
    it.each(['en', 'es', 'fr', 'ar'])('covers every configured link in %s', locale => {
        const catalog = loadCatalog(locale);

        for (const link of scoutPassLinks) {
            const key = SCOUT_PASS_SIDE_MENU_MESSAGE_KEYS[link.path];
            expect(key, `${link.path} is not mapped`).toBeTruthy();
            expect(catalog.sidemenu.links[key], `${locale}:${key}`).toEqual(expect.any(String));
            expect(catalog.sidemenu.links[key].length).toBeGreaterThan(0);
        }
    });

    it('returns a translated label and falls back safely for an unknown route', () => {
        const messages = { 'sidemenu.links.wallet': () => 'Portefeuille' };

        expect(getScoutPassSideMenuLinkLabel(messages, { path: '/wallet', name: 'Wallet' })).toBe(
            'Portefeuille'
        );
        expect(getScoutPassSideMenuLinkLabel(messages, { path: '/future', name: 'Future' })).toBe(
            'Future'
        );
    });
});
