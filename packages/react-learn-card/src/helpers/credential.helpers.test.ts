import { vi } from 'vitest';
import { Image } from '@learncard/types';
import {
    getImageFromImage,
    getNameFromProfile,
    getImageFromProfile,
    getInfoFromCredential,
} from './credential.helpers';
import { JffCredential, VC2CredentialWithValidFrom, VC2CredentialNoDate } from './test.helpers';

describe('Credential Helpers', () => {
    describe('getImageFromImage', () => {
        it('correctly gets simple images', () => {
            expect(getImageFromImage('nice')).toEqual('nice');
        });

        it('correctly gets complex images', () => {
            expect(getImageFromImage({ id: 'nice', type: 'image' })).toEqual('nice');
        });

        it('returns an empty string if image is missing id', () => {
            expect(getImageFromImage({ type: 'image' } as Image)).toEqual('');
        });
    });

    describe('getNameFromProfile', () => {
        it('correctly gets simple names', () => {
            expect(getNameFromProfile('nice')).toEqual('nice');
        });

        it('correctly gets complex names', () => {
            expect(getNameFromProfile({ name: 'nice' })).toEqual('nice');
        });

        it('returns an empty string if profile is missing name', () => {
            expect(getNameFromProfile({ url: 'nice' })).toEqual('');
        });
    });

    describe('getImageFromProfile', () => {
        it('correctly gets simple names', () => {
            expect(getImageFromProfile({ image: 'nice' })).toEqual('nice');
        });

        it('correctly gets complex names', () => {
            expect(getImageFromProfile({ image: { id: 'nice', type: 'image' } })).toEqual('nice');
        });

        it('returns an empty string if profile is a string', () => {
            expect(getImageFromProfile('nice')).toEqual('');
        });

        it('returns an empty string if profile image is missing id', () => {
            expect(getImageFromProfile({ image: { type: 'image' } as Image })).toEqual('');
        });
    });

    describe('getInfoFromCredential', () => {
        it('correctly handles VC 1.0 credentials with issuanceDate', () => {
            const result = getInfoFromCredential(JffCredential as any);
            expect(result.createdAt).toEqual('27 JUL 2022');
            expect(result.title).toEqual('Our Wallet Passed JFF Plugfest #1 2022');
        });

        it('correctly handles VC 2.0 credentials with validFrom', () => {
            const result = getInfoFromCredential(VC2CredentialWithValidFrom as any);
            expect(result.createdAt).toEqual('15 JAN 2024');
            expect(result.title).toEqual('Advanced TypeScript Development');
        });

        it('gracefully handles credentials with no date fields', () => {
            const result = getInfoFromCredential(VC2CredentialNoDate as any);
            expect(result.createdAt).toEqual('');
            expect(result.title).toEqual('Lifetime Learning Award');
        });

        it('prioritizes validFrom over issuanceDate when both exist', () => {
            const credentialWithBothDates = {
                ...JffCredential,
                validFrom: '2024-06-01T10:00:00.000Z',
            };
            const result = getInfoFromCredential(credentialWithBothDates as any);
            expect(result.createdAt).toEqual('01 JUN 2024');
        });

        it('handles invalid date formats gracefully', () => {
            const credentialWithInvalidDate = {
                ...JffCredential,
                issuanceDate: 'invalid-date-string',
            };
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = getInfoFromCredential(credentialWithInvalidDate as any);
            expect(result.createdAt).toEqual('');
            expect(consoleSpy).toHaveBeenCalledWith(
                'Invalid date format in credential:',
                'invalid-date-string'
            );
            consoleSpy.mockRestore();
        });

        it('respects custom date format options', () => {
            const result = getInfoFromCredential(JffCredential as any, 'yyyy-MM-dd', {
                uppercaseDate: false,
            });
            expect(result.createdAt).toEqual('2022-07-27');
        });
    });
});

describe('award-date formatting', () => {
    it.each(['20271001', '2027-10-01T00:00', '2027-10-01T00:00:00'])(
        'shows a consistent calendar award day for %s',
        awardedDate => {
            expect(
                getInfoFromCredential(
                    { ...VC2CredentialWithValidFrom, awardedDate } as never,
                    'MMM dd, yyyy',
                    { uppercaseDate: false, dateType: 'awarded' }
                ).createdAt
            ).toBe('Oct 01, 2027');
        }
    );
    it('uses the standard award date only when requested and retains issuance metadata', () => {
        const credential = { ...VC2CredentialWithValidFrom, awardedDate: '2027-10-01T00:00:00Z' };
        expect(
            getInfoFromCredential(credential as never, 'MMM dd, yyyy', {
                uppercaseDate: false,
                dateType: 'awarded',
            }).createdAt
        ).toBe('Oct 01, 2027');
        expect(getInfoFromCredential(credential as never).createdAt).toBe(
            getInfoFromCredential(VC2CredentialWithValidFrom as never).createdAt
        );
    });
    it('falls back for missing or invalid award dates without inventing a date for an undated draft', () => {
        expect(
            getInfoFromCredential(
                { ...VC2CredentialWithValidFrom, awardedDate: 'not-a-date' } as never,
                'MMM dd, yyyy',
                { uppercaseDate: false, dateType: 'awarded' }
            ).createdAt
        ).toBe(
            getInfoFromCredential(VC2CredentialWithValidFrom as never, 'MMM dd, yyyy', {
                uppercaseDate: false,
            }).createdAt
        );
        expect(
            getInfoFromCredential(VC2CredentialNoDate as never, 'MMM dd, yyyy', {
                dateType: 'awarded',
            }).createdAt
        ).toBe('');
    });
    it('keeps the UTC award day stable at a timezone boundary', () => {
        expect(
            getInfoFromCredential(
                {
                    ...VC2CredentialWithValidFrom,
                    awardedDate: '2027-10-01T23:30:00-02:00',
                } as never,
                'MMM dd, yyyy',
                { uppercaseDate: false, dateType: 'awarded' }
            ).createdAt
        ).toBe('Oct 02, 2027');
    });
});

it('treats a date-only award as a UTC calendar day', () => {
    expect(
        getInfoFromCredential(
            { ...VC2CredentialWithValidFrom, awardedDate: '2027-10-01' } as never,
            'MMM dd, yyyy',
            { uppercaseDate: false, dateType: 'awarded' }
        ).createdAt
    ).toBe('Oct 01, 2027');
});
