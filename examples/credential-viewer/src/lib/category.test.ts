import { describe, expect, it } from 'vitest';
import {
    getFixture,
    isCredentialFixture,
    customCourseEnrollment,
    customExamAccommodation,
    clrMixedRolePortfolio,
    obv3FoodAllergenPractice,
    obv3FoodAllergenFacilitator,
    obv3FoodAllergenPracticeFr,
    obv3PhishingTransfer,
} from '@learncard/credential-library';

import { getCategoryForCredential, getCategoryForFixture } from './category';

describe('Qualifications fixture categorization', () => {
    it.each(['license', 'certification', 'apprenticeship', 'journeyman', 'master'])(
        'indexes the %s fixture in Qualifications',
        slug => {
            const fixture = getFixture(`obv3/qualification-${slug}`);
            expect(getCategoryForFixture(fixture)).toBe('Qualifications');
        }
    );

    it('keeps BoostID precedence over a qualification achievement type', () => {
        const fixture = getFixture('obv3/qualification-license');
        if (!isCredentialFixture(fixture)) throw new Error('Expected W3C fixture');
        expect(
            getCategoryForCredential({
                ...fixture.credential,
                type: ['VerifiableCredential', 'BoostID'],
            })
        ).toBe('ID');
    });
});

describe('Curated example categories', () => {
    it.each([
        [customCourseEnrollment, 'Learning History'],
        [customExamAccommodation, 'Accommodation'],
        [clrMixedRolePortfolio, 'Learning History'],
        [obv3FoodAllergenPractice, 'Achievement'],
        [obv3FoodAllergenFacilitator, 'Achievement'],
        [obv3FoodAllergenPracticeFr, 'Achievement'],
        [obv3PhishingTransfer, 'Achievement'],
    ] as const)('$0.id uses $1', (fixture, category) => {
        expect(getCategoryForFixture(fixture)).toBe(category);
    });

    it('keeps the existing fallback for an unrecognized custom type', () => {
        expect(
            getCategoryForCredential({
                type: ['VerifiableCredential', 'UnrecognizedCredential'],
                credentialSubject: { designation: 'Course enrollment' },
            })
        ).toBe('Achievement');
    });
});
