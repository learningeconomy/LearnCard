/// <reference types="node" />

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { BoostCategoryOptionsEnum } from 'learn-card-base/types/boostAndCredentialMetadata';
import {
    SCOUT_PASS_CATEGORY_MESSAGE_KEYS,
    getScoutPassCategoryCopy,
} from './scoutPassCategoryCopy';

const loadCatalog = (locale: string) =>
    JSON.parse(
        readFileSync(
            fileURLToPath(
                new URL(`../../../public/locales/${locale}/translation.json`, import.meta.url)
            ),
            'utf8'
        )
    );

const requiredFields = ['titleOne', 'titleOther', 'helperPrefix', 'helperAction', 'descriptor'];
const categories = [
    BoostCategoryOptionsEnum.socialBadge,
    BoostCategoryOptionsEnum.meritBadge,
    BoostCategoryOptionsEnum.membership,
    BoostCategoryOptionsEnum.skill,
];

describe('ScoutPass category copy', () => {
    it.each(['en', 'es', 'fr', 'ar'])('has complete category keys in %s', locale => {
        const catalog = loadCatalog(locale);

        for (const category of categories) {
            const key = SCOUT_PASS_CATEGORY_MESSAGE_KEYS[category];
            expect(key, `${category} is not mapped`).toBeTruthy();
            if (!key) throw new Error(`${category} is not mapped`);
            for (const field of requiredFields) {
                expect(catalog.scoutCategories[key][field], `${locale}:${key}.${field}`).toEqual(
                    expect.any(String)
                );
            }
        }

        for (const category of categories.slice(0, 3)) {
            const key = SCOUT_PASS_CATEGORY_MESSAGE_KEYS[category];
            if (!key) throw new Error(`${category} is not mapped`);
            expect(catalog.scoutCategories[key].walletDescription).toEqual(expect.any(String));
        }
    });

    it('resolves by category enum and invokes messages at call time', () => {
        const messages = {
            'scoutCategories.socialBoosts.titleOne': () => 'Boost social',
            'scoutCategories.socialBoosts.titleOther': () => 'Boosts sociaux',
            'scoutCategories.socialBoosts.walletDescription': () => 'Étapes sociales',
            'scoutCategories.socialBoosts.helperPrefix': () => 'Présentez vos',
            'scoutCategories.socialBoosts.helperAction': () => 'étapes sociales',
            'scoutCategories.socialBoosts.descriptor': () => 'Description traduite',
        };

        expect(getScoutPassCategoryCopy(messages, BoostCategoryOptionsEnum.socialBadge)).toEqual({
            titleOne: 'Boost social',
            titleOther: 'Boosts sociaux',
            walletDescription: 'Étapes sociales',
            helperPrefix: 'Présentez vos',
            helperAction: 'étapes sociales',
            descriptor: 'Description traduite',
        });
        expect(
            getScoutPassCategoryCopy(messages, BoostCategoryOptionsEnum.achievement)
        ).toBeUndefined();
    });
});
