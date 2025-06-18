import { vi } from 'vitest';
import type { Image } from '@learncard/types';
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
