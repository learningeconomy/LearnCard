import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@accesslayer/profile/read', () => ({ getProfileByProfileId: vi.fn() }));
vi.mock('@accesslayer/profile/relationships/read', () => ({ isProfileManaged: vi.fn() }));
vi.mock('@helpers/profile.helpers', () => ({
    transformProfileId: (id: string) => id.toLowerCase(),
    isServiceProfileExemptFromGuardianship: (isServiceProfile: unknown, type: unknown) =>
        isServiceProfile === true && type !== 'child',
}));

import {
    ageFromPersistedProfile,
    createProductionShareLinkPolicySource,
    productionShareViewEligibilitySource,
    resolveCurrentShareLinkPolicy,
} from '@helpers/share-link-policy/production';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { isProfileManaged } from '@accesslayer/profile/relationships/read';
import type { ShareLinkTransaction } from '@accesslayer/share-link/transaction';
import { createShareLinkPolicyResolver } from '@helpers/share-link-policy/resolver';

const NOW = new Date('2026-09-25T12:00:00.000Z');

const transactionWith = (profile?: {
    dob: unknown;
    type: unknown;
    isManaged: unknown;
    isServiceProfile?: unknown;
}): ShareLinkTransaction => ({
    run: vi.fn(async () => ({
        records: profile
            ? [
                  {
                      get: (key: string) =>
                          key === 'profileType'
                              ? profile.type
                              : profile[key as keyof typeof profile],
                  },
              ]
            : [],
    })),
});

describe('production share-link age policy', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('requires a valid birthdate and an eighteenth birthday before allowing adulthood', () => {
        expect(ageFromPersistedProfile({ dob: '2008-09-25' }, NOW)).toBe('adult');
        expect(ageFromPersistedProfile({ dob: '2008-09-26' }, NOW)).toBe('minor');
        expect(ageFromPersistedProfile({ dob: '2010-02-29' }, NOW)).toBe('unknown');
        expect(ageFromPersistedProfile({ dob: 'not-a-date' }, NOW)).toBe('unknown');
        expect(ageFromPersistedProfile({ dob: '2030-01-01' }, NOW)).toBe('unknown');
        expect(ageFromPersistedProfile({ dob: '1990-01-01', type: 'child' }, NOW)).toBe('minor');
        expect(ageFromPersistedProfile(null, NOW)).toBe('unknown');
    });

    it('uses the persisted profile instead of inferring adulthood from no manager', async () => {
        vi.mocked(getProfileByProfileId).mockResolvedValueOnce({ dob: '1990-01-01' } as never);
        vi.mocked(isProfileManaged).mockResolvedValueOnce(false);

        const resolver = createShareLinkPolicyResolver(createProductionShareLinkPolicySource());
        expect((await resolver.resolve('owner')).viewCountingEnabled).toBe(true);
    });
    it.each([
        { dob: undefined, type: undefined, isServiceProfile: true, eligible: true },
        { dob: 'not-a-date', type: undefined, isServiceProfile: true, eligible: true },
        { dob: '2020-01-01', type: undefined, isServiceProfile: true, eligible: true },
        { dob: '1990-01-01', type: undefined, isServiceProfile: true, eligible: true },
        { dob: undefined, type: 'child', isServiceProfile: true, eligible: false },
        { dob: undefined, type: undefined, isServiceProfile: 'true', eligible: false },
    ])(
        'uses persisted service classification in preflight and locked policy: $dob / $type / $isServiceProfile',
        async ({ dob, type, isServiceProfile, eligible }) => {
            vi.mocked(getProfileByProfileId).mockResolvedValue({
                dob,
                type,
                isServiceProfile,
            } as never);
            vi.mocked(isProfileManaged).mockResolvedValue(true);
            const resolver = createShareLinkPolicyResolver(createProductionShareLinkPolicySource());
            const preflight = await resolver.resolve('owner');
            const locked = await resolveCurrentShareLinkPolicy(
                transactionWith({ dob, type, isServiceProfile, isManaged: true }),
                'owner',
                NOW
            );
            expect(preflight.viewCountingEnabled).toBe(eligible);
            expect(locked).toEqual({ ...preflight, isServiceProfile: eligible });
            expect(locked.defaultExpiryDays).toBe(30);
        }
    );

    it('rechecks persisted age and management inside the receipt transaction', async () => {
        const adult = transactionWith({ dob: '1990-01-01', type: null, isManaged: false });
        const managed = transactionWith({ dob: '1990-01-01', type: null, isManaged: true });
        const unknown = transactionWith();
        const managedService = transactionWith({
            dob: null,
            type: null,
            isManaged: true,
            isServiceProfile: true,
        });
        const input = {
            namespace: 'test',
            ownerProfileId: 'OWNER',
            shareId: 'share',
            shareVersion: 1,
            contentVersion: 1,
            objectRef: 'object',
            operationId: 'operation',
            now: NOW,
        };

        expect(await productionShareViewEligibilitySource.isEligible(adult, input)).toBe(true);
        expect(await productionShareViewEligibilitySource.isEligible(managed, input)).toBe(false);
        expect(await productionShareViewEligibilitySource.isEligible(unknown, input)).toBe(false);
        expect(await productionShareViewEligibilitySource.isEligible(managedService, input)).toBe(
            true
        );
        expect(
            (await resolveCurrentShareLinkPolicy(unknown, 'owner', NOW)).viewCountingEnabled
        ).toBe(false);
    });
});
