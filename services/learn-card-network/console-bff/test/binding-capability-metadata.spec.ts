import { describe, it, expect } from 'vitest';

import { BindingCapabilityMetadataValidator } from '@learncard/types';

// Mirrors the `metadataFor` fixture shape in brain-service's test/helpers/record-binding.ts —
// the same record-provisioning capabilityMetadata the scenario runner and brain-service's own
// tests use. This is literally the `capabilityMetadata` input to `bindingsRouter.propose`
// (src/trpc/bindings.ts), which is how S14 ("revoke the push binding; approve an offer
// binding") proposes the replacement offer-mode binding before approving it.
const baseMetadata = {
    capability: 'record-provisioning' as const,
    mode: 'TRANSACTIONAL' as const,
    recordClass: 'academic' as const,
    legalBasis: 'FERPA school-official exception (declared by the institution, not established).',
    identityBinding: 'roster-mapped' as const,
    transactional: {
        triggerAuthority: 'system-event',
        purpose: 'Issue a course completion credential.',
        fields: ['completionId', 'courseId', 'courseTitle', 'completedAt'],
        idempotencyKeyField: 'completionId',
        timeoutMs: 5000,
        maxRetries: 2,
        retentionDays: 30,
    },
    issuance: {
        issuerGroupId: 'group_test',
        issuerIdentityProfileId: 'profile_test',
        template: {
            kind: 'obv3-achievement' as const,
            achievementType: 'Course',
            criteria: 'Completed every module of the course.',
            fieldMap: {
                achievementId: 'courseId',
                name: 'courseTitle',
                completedAt: 'completedAt',
            },
        },
    },
};

describe("BindingCapabilityMetadataValidator (propose's capabilityMetadata input)", () => {
    it('accepts an offer-mode issuance declaration (S14: propose an offer binding)', () => {
        const result = BindingCapabilityMetadataValidator.safeParse({
            ...baseMetadata,
            issuance: { ...baseMetadata.issuance, delivery: 'offer' },
        });

        expect(result.success).toBe(true);
    });

    it('still rejects an unrecognized issuance.delivery value', () => {
        const result = BindingCapabilityMetadataValidator.safeParse({
            ...baseMetadata,
            issuance: { ...baseMetadata.issuance, delivery: 'carrier-pigeon' },
        });

        expect(result.success).toBe(false);
    });

    it('accepts push delivery (the default push-mode binding, unaffected by this fix)', () => {
        const result = BindingCapabilityMetadataValidator.safeParse({
            ...baseMetadata,
            issuance: { ...baseMetadata.issuance, delivery: 'push' },
        });

        expect(result.success).toBe(true);
    });

    it('accepts issuance with no delivery field at all (delivery stays optional)', () => {
        const result = BindingCapabilityMetadataValidator.safeParse(baseMetadata);

        expect(result.success).toBe(true);
    });
});
