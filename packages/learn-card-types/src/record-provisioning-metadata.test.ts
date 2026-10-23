import { describe, expect, it } from 'vitest';

import { RecordProvisioningBindingMetadataValidator } from './education-os';

describe('RecordProvisioningBindingMetadataValidator', () => {
    const transactional = {
        triggerAuthority: 'system-event' as const,
        purpose: 'Issue completions',
        fields: ['completionId', 'courseId'],
        idempotencyKeyField: 'completionId',
        timeoutMs: 5000,
        maxRetries: 1,
        retentionDays: 30,
    };
    const base = {
        capability: 'record-provisioning' as const,
        recordClass: 'academic' as const,
        legalBasis: 'Declared by the institution',
        identityBinding: 'roster-mapped' as const,
    };

    it('accepts a complete Transactional declaration', () => {
        expect(
            RecordProvisioningBindingMetadataValidator.safeParse({
                ...base,
                mode: 'TRANSACTIONAL',
                transactional,
            }).success
        ).toBe(true);
    });

    it('rejects mismatched mode declarations and an undeclared idempotency key', () => {
        for (const candidate of [
            { ...base, mode: 'TRANSACTIONAL' },
            { ...base, mode: 'ETL', transactional },
            {
                ...base,
                mode: 'TRANSACTIONAL',
                transactional: { ...transactional, idempotencyKeyField: 'missing' },
            },
        ]) {
            expect(RecordProvisioningBindingMetadataValidator.safeParse(candidate).success).toBe(
                false
            );
        }
    });
});
