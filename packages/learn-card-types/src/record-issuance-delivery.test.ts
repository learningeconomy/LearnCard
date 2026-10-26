import { describe, expect, it } from 'vitest';

import { RecordIssuanceDeclarationValidator } from './education-os';

describe('RecordIssuanceDeclarationValidator delivery', () => {
    const issuance = {
        issuerGroupId: 'group-1',
        issuerIdentityProfileId: 'issuer-1',
        template: {
            kind: 'obv3-achievement' as const,
            criteria: 'Completed the course.',
            fieldMap: { achievementId: 'courseId', name: 'courseTitle' },
        },
    };

    it('accepts an absent delivery, which means push', () => {
        const parsed = RecordIssuanceDeclarationValidator.safeParse(issuance);
        expect(parsed.success).toBe(true);
        expect(parsed.success && parsed.data.delivery).toBeUndefined();
    });

    it('accepts push and offer', () => {
        for (const delivery of ['push', 'offer']) {
            expect(
                RecordIssuanceDeclarationValidator.safeParse({ ...issuance, delivery }).success
            ).toBe(true);
        }
    });

    it('rejects an unknown delivery', () => {
        for (const delivery of ['email', '', null]) {
            expect(
                RecordIssuanceDeclarationValidator.safeParse({ ...issuance, delivery }).success
            ).toBe(false);
        }
    });
});
