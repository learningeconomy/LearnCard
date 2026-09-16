import { describe, expect, it, vi } from 'vitest';

import { getFeedbackReportingEligibility } from './eligibility';

/**
 * The hook half of `eligibility.ts` imports `learn-card-base`'s barrel, which
 * pulls the web3auth wallet stack and crashes under jsdom
 * ("Uint8Array expected" in ethereum-cryptography). The pure gate only needs
 * `calculateAge` from the barrel — mock it out and re-export the real helper
 * from its lightweight module so the age logic under test stays production
 * code. The hook stubs are never exercised by this suite.
 */
vi.mock('learn-card-base', async () => {
    const { calculateAge } = await import(
        '../../../../../packages/learn-card-base/src/helpers/dateHelpers'
    );
    const { getMinorAgeThreshold } = await import(
        '../../../../../packages/learn-card-base/src/constants/gdprAgeLimits'
    );

    return {
        calculateAge,
        getMinorAgeThreshold,
        switchedProfileStore: { use: { profileType: () => null } },
        useGetCurrentLCNUser: () => ({ currentLCNUser: null }),
        useGetPreferencesForDid: () => ({ data: undefined, isLoading: false }),
    };
});

const NOW = new Date('2026-08-20T12:00:00Z');

describe('getFeedbackReportingEligibility', () => {
    it.each([false, undefined])(
        'fails closed without an authenticated profile (%s)',
        hasAuthenticatedProfile => {
            expect(
                getFeedbackReportingEligibility({
                    hasAuthenticatedProfile,
                    isLoading: false,
                    preferences: {},
                    profileType: 'guardian',
                    country: 'US',
                    now: NOW,
                })
            ).toEqual({ bug: false, idea: false, isLoading: false });
        }
    );

    it.each([
        ['adult defaults', {}, 'guardian', undefined, { bug: true, idea: true }],
        [
            'bug opt-out',
            { bugReportsEnabled: false },
            'guardian',
            undefined,
            { bug: false, idea: true },
        ],
        [
            'analytics opt-out',
            { analyticsEnabled: false },
            'guardian',
            undefined,
            { bug: true, idea: false },
        ],
        ['server minor', { isMinor: true }, 'guardian', undefined, { bug: false, idea: false }],
        ['child profile', {}, 'child', undefined, { bug: false, idea: false }],
        ['underage DOB', {}, 'guardian', '2014-01-01', { bug: false, idea: false }],
    ])('%s', (_label, preferences, profileType, dob, expected) => {
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: false,
                preferences,
                profileType,
                dob,
                country: 'US',
                now: NOW,
            })
        ).toMatchObject(expected);
    });

    it('fails closed while preferences are loading', () => {
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: true,
                preferences: {},
                profileType: 'guardian',
                now: NOW,
            })
        ).toEqual({ bug: false, idea: false, isLoading: true });
    });

    it('fails closed for an invalid DOB', () => {
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: false,
                preferences: {},
                profileType: 'guardian',
                dob: 'not-a-date',
                country: 'US',
                now: NOW,
            })
        ).toEqual({ bug: false, idea: false, isLoading: false });
    });

    it('fails closed for a future DOB', () => {
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: false,
                preferences: {},
                profileType: 'guardian',
                dob: '2030-01-01',
                country: 'US',
                now: NOW,
            })
        ).toEqual({ bug: false, idea: false, isLoading: false });
    });

    it('preserves default-enabled behavior when an adult profile has no DOB', () => {
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: false,
                preferences: undefined,
                profileType: 'guardian',
                dob: undefined,
                country: undefined,
                now: NOW,
            })
        ).toEqual({ bug: true, idea: true, isLoading: false });
    });

    it('treats a user at exactly the minor-age threshold as an adult', () => {
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: false,
                preferences: {},
                profileType: 'guardian',
                dob: '2008-08-20',
                country: 'US',
                now: NOW,
            })
        ).toEqual({ bug: true, idea: true, isLoading: false });
    });

    it('uses the country-specific GDPR threshold for EU users', () => {
        const input = {
            hasAuthenticatedProfile: true,
            isLoading: false,
            preferences: {},
            profileType: 'guardian' as const,
            dob: '2009-01-01', // 17 years old at NOW
            now: NOW,
        };

        // 17 is above France's GDPR threshold (15) → adult.
        expect(getFeedbackReportingEligibility({ ...input, country: 'FR' })).toMatchObject({
            bug: true,
            idea: true,
        });
        // 17 is below the default US threshold (18) → minor.
        expect(getFeedbackReportingEligibility({ ...input, country: 'US' })).toMatchObject({
            bug: false,
            idea: false,
        });
    });

    it('applies the shared age gate before per-destination preference gates', () => {
        // Even with both destinations opted in, a server minor gets nothing.
        expect(
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: true,
                isLoading: false,
                preferences: { bugReportsEnabled: true, analyticsEnabled: true, isMinor: true },
                profileType: 'guardian',
                country: 'US',
                now: NOW,
            })
        ).toEqual({ bug: false, idea: false, isLoading: false });
    });
});
