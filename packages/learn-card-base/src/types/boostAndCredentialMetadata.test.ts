import { describe, expect, it } from 'vitest';
import {
    CredentialCategoryEnum,
    categoryMetadata,
    getCategoryMetadata,
} from './boostAndCredentialMetadata';

describe('getCategoryMetadata', () => {
    it('returns metadata for a known category', () => {
        expect(getCategoryMetadata(CredentialCategoryEnum.workHistory)).toBe(
            categoryMetadata[CredentialCategoryEnum.workHistory]
        );
    });

    it.each([undefined, null, '', 'Not A Category', 'toString', '__proto__'])(
        'falls back to Achievement metadata for %j',
        category => {
            expect(getCategoryMetadata(category)).toBe(
                categoryMetadata[CredentialCategoryEnum.achievement]
            );
        }
    );
});
