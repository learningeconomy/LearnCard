import { z } from 'zod';
import type { WorkloadPlan } from '@learncard/types';

// ADR-009 PLANNED/PROVISIONING are named PENDING/APPLYING by the amendment.
export const WorkloadLifecycleValidator = z.enum([
    'PENDING',
    'APPLYING',
    'READY',
    'DEGRADED',
    'FAILED',
    'RETIRING',
    'RETIRED',
]);
export type WorkloadLifecycle = z.infer<typeof WorkloadLifecycleValidator>;

export const WorkloadObservationValidator = z
    .object({
        observedRevision: z.number().int().nonnegative(),
        components: z.array(z.object({ id: z.string(), healthy: z.boolean() }).strict()).max(256),
        endpoints: z
            .array(
                z
                    .object({ id: z.string(), url: z.string().max(2048), healthy: z.boolean() })
                    .strict()
            )
            .max(256),
        failed: z.boolean().default(false),
    })
    .strict();
export type WorkloadObservation = z.infer<typeof WorkloadObservationValidator>;

export const WorkloadOperationValidator = z.object({
    operationId: z.string(),
    deploymentId: z.string(),
    action: z.enum(['APPLY', 'UPGRADE', 'RETIRE']),
    specRevision: z.number().int().nonnegative(),
    status: z.enum(['QUEUED', 'CLAIMED', 'SUCCEEDED', 'FAILED']),
    leaseToken: z.string().optional(),
    leaseExpiresAt: z.string().optional(),
    attempts: z.number().int().nonnegative(),
    createdAt: z.string(),
    updatedAt: z.string(),
    approvedSpec: z.string(),
});
export type WorkloadOperation = z.infer<typeof WorkloadOperationValidator>;
export interface OperationHandle {
    operationRef: string;
}
export interface WorkloadDriverPlan {
    approvedSpec: WorkloadPlan;
}
export interface WorkloadPlanInput {
    approvedSpec: WorkloadPlan;
}

/** Issuer binding must be approved before an agent can use it. No login key material. */
export interface WorkloadIssuerBinding {
    issuerProfileId: string;
    // TODO: add the hash-bound planner input and institution/MEMBER_OF validation.
}
