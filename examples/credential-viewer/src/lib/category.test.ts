import { describe, expect, it } from 'vitest';
import {
    customCourseEnrollment,
    customExamAccommodation,
    clrMixedRolePortfolio,
    obv3FoodAllergenPractice,
    obv3FoodAllergenFacilitator,
    obv3FoodAllergenPracticeFr,
    obv3PhishingTransfer,
} from '@learncard/credential-library';

import { getCategoryForCredential, getCategoryForFixture } from './category';

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
