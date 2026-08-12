import type { AppInstallCheckInput } from '../src/app-install';
import { checkAppInstallEligibility } from '../src/app-install';

describe('checkAppInstallEligibility', () => {
    const baseInput: AppInstallCheckInput = {
        isChildProfile: false,
        userAge: 18,
        hasContract: false,
    };

    it('should hard block when user is below minAge (when age is known)', () => {
        const result = checkAppInstallEligibility({
            ...baseInput,
            isChildProfile: false,
            userAge: 15,
            minAge: 16,
        });

        expect(result).toEqual({
            action: 'hard_blocked',
            reason: 'User does not meet the minimum age requirement of 16',
        });
    });

    it('should not hard block when userAge is unknown (minAge only applies when age is known)', () => {
        const result = checkAppInstallEligibility({
            ...baseInput,
            isChildProfile: true,
            userAge: null,
            minAge: 100,
            hasContract: false,
            ageRating: '17+',
        });

        expect(result).toEqual({
            action: 'require_dob',
            reason: 'Child profile age is unknown and must be verified by guardian',
        });
    });

    describe('child profile - unknown age', () => {
        it('should require DOB when child age is unknown and no guardian approval is present', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: null,
                hasContract: false,
            });

            expect(result).toEqual({
                action: 'require_dob',
                reason: 'Child profile age is unknown and must be verified by guardian',
            });
        });

        it('should proceed when child age is unknown but guardian approval is present', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: null,
                hasContract: false,
                hasGuardianApproval: true,
            });

            expect(result).toEqual({ action: 'proceed' });
        });
    });

    describe('child profile - age rating checks', () => {
        it('should require guardian approval when no age rating is specified', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 10,
                ageRating: undefined,
                hasContract: false,
            });

            expect(result).toEqual({
                action: 'require_guardian_approval',
                reason: 'App has no age rating; guardian approval required for child profiles',
            });
        });

        it('should treat unknown age rating values as no age rating and require guardian approval', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 10,
                ageRating: '99+',
                hasContract: false,
            });

            expect(result).toEqual({
                action: 'require_guardian_approval',
                reason: 'App has no age rating; guardian approval required for child profiles',
            });
        });

        it('should proceed when no age rating is specified but guardian approval is present', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 10,
                ageRating: undefined,
                hasContract: false,
                hasGuardianApproval: true,
            });

            expect(result).toEqual({ action: 'proceed' });
        });

        it('should require guardian approval when child is younger than the age rating minimum', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 10,
                ageRating: '12+',
                hasContract: false,
            });

            expect(result).toEqual({
                action: 'require_guardian_approval',
                reason: 'Child is under the age rating of 12+; guardian approval required',
            });
        });

        it('should proceed when child is younger than the age rating minimum but guardian approval is present', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 10,
                ageRating: '12+',
                hasContract: false,
                hasGuardianApproval: true,
            });

            expect(result).toEqual({ action: 'proceed' });
        });
    });

    describe('child profile - contract checks', () => {
        it('should require guardian approval when app has a contract (even if rating is satisfied)', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 13,
                ageRating: '12+',
                hasContract: true,
            });

            expect(result).toEqual({
                action: 'require_guardian_approval',
                reason: 'App requires consent to a contract; guardian approval required for child profiles',
            });
        });

        it('should proceed when app has a contract and guardian approval is present', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 13,
                ageRating: '12+',
                hasContract: true,
                hasGuardianApproval: true,
            });

            expect(result).toEqual({ action: 'proceed' });
        });

        it('should proceed when child is old enough for rating and there is no contract', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: true,
                userAge: 13,
                ageRating: '12+',
                hasContract: false,
            });

            expect(result).toEqual({ action: 'proceed' });
        });
    });

    describe('adult profile behavior', () => {
        it('should proceed for adults even if under the age rating (rating applies to child profiles only)', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: false,
                userAge: 16,
                ageRating: '17+',
                hasContract: true,
            });

            expect(result).toEqual({ action: 'proceed' });
        });

        it('should proceed for adults when age is unknown (no DOB requirements)', () => {
            const result = checkAppInstallEligibility({
                ...baseInput,
                isChildProfile: false,
                userAge: null,
                ageRating: '17+',
                hasContract: true,
            });

            expect(result).toEqual({ action: 'proceed' });
        });
    });
});
