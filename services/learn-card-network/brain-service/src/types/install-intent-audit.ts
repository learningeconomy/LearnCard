import { z } from 'zod';

export const ConsentPreflightAuditActionEnum = z.enum(['CONSENT_PREFLIGHT_RESOLVED']);

export const WorkloadAuditActionEnum = z.enum([
    'WORKLOAD_APPLY_QUEUED',
    'WORKLOAD_READY',
    'WORKLOAD_DEGRADED',
    'WORKLOAD_FAILED',
    'WORKLOAD_RETIRING',
    'WORKLOAD_RETIRED_WITH_OBLIGATIONS',
]);
export type WorkloadAuditAction = z.infer<typeof WorkloadAuditActionEnum>;

export const InstallIntentAuditEventValidator = z.object({
    id: z.string(),
    action: z.string(),
    actorProfileId: z.string().optional(),
    actorDid: z.string().optional(),
    intentId: z.string().optional(),
    bindingId: z.string().optional(),
    ecosystemId: z.string(),
    authorityChangesSummary: z.string().optional(),
    timestamp: z.string(),
    beforeSummary: z.record(z.string(), z.unknown()).optional(),
    afterSummary: z.record(z.string(), z.unknown()).optional(),
});
export type InstallIntentAuditEventType = z.infer<typeof InstallIntentAuditEventValidator>;

export const FlatInstallIntentAuditEventValidator = InstallIntentAuditEventValidator.omit({
    beforeSummary: true,
    afterSummary: true,
}).extend({
    beforeSummary: z.string().optional(),
    afterSummary: z.string().optional(),
});
export type FlatInstallIntentAuditEventType = z.infer<typeof FlatInstallIntentAuditEventValidator>;
