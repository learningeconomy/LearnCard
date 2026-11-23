import { ModelFactory, NeogmaInstance } from 'neogma';
import { z } from 'zod';

import { neogma } from '@instance';

export const DelegateGrantAuditDecisionValidator = z.enum(['allowed', 'denied']);
export type DelegateGrantAuditDecision = z.infer<typeof DelegateGrantAuditDecisionValidator>;

// Why a request was refused. Stored for the owner's review; never sent to the caller.
export const DelegateGrantAuditStageValidator = z.enum(['route', 'policy', 'owner']);
export type DelegateGrantAuditStage = z.infer<typeof DelegateGrantAuditStageValidator>;

export const DelegateGrantAuditOutcomeValidator = z.enum(['succeeded', 'failed']);
export type DelegateGrantAuditOutcome = z.infer<typeof DelegateGrantAuditOutcomeValidator>;

// Strict: a record says who asked for what under which grant, and nothing else. A token, a
// challenge, credential content or a recipient has no field here and is refused as an unknown key.
export const DelegateGrantAuditValidator = z
    .strictObject({
        id: z.uuid(),
        timestamp: z.iso.datetime(),
        decision: DelegateGrantAuditDecisionValidator,
        stage: DelegateGrantAuditStageValidator.optional(),
        // Absent on an allowed request means: not known (the handler has not reported back).
        outcome: DelegateGrantAuditOutcomeValidator.optional(),
        route: z.string().min(1),
        requiredScope: z.string().min(1).optional(),
        actorDid: z.string().min(1),
        grantId: z.string().min(1),
        ownerProfileId: z.string().min(1),
        resultRef: z.string().min(1).optional(),
        completedAt: z.iso.datetime().optional(),
    })
    .refine(
        record =>
            record.decision !== 'denied' ||
            (record.stage !== undefined &&
                record.outcome === undefined &&
                record.resultRef === undefined &&
                record.completedAt === undefined),
        { message: 'A denied request has a stage and no outcome' }
    )
    .refine(record => record.decision !== 'allowed' || record.stage === undefined, {
        message: 'An allowed request has no denial stage',
    });

export type DelegateGrantAuditRecord = z.infer<typeof DelegateGrantAuditValidator>;

export type DelegateGrantAuditProperties = DelegateGrantAuditRecord;

type NoRelationships = Record<string, never>;

export type DelegateGrantAuditInstance = NeogmaInstance<
    DelegateGrantAuditProperties,
    NoRelationships
>;

// No relationship on purpose: the record names the grant and the owner by id, so it stays
// readable after the grant or the profile is deleted, and deleting either never removes it.
export const DelegateGrantAudit = ModelFactory<DelegateGrantAuditProperties, NoRelationships>(
    {
        label: 'DelegateGrantAudit',
        schema: {
            id: { type: 'string', required: true, uniqueItems: true },
            timestamp: { type: 'string', required: true },
            decision: { type: 'string', required: true },
            stage: { type: 'string', required: false },
            outcome: { type: 'string', required: false },
            route: { type: 'string', required: true },
            requiredScope: { type: 'string', required: false },
            actorDid: { type: 'string', required: true },
            grantId: { type: 'string', required: true },
            ownerProfileId: { type: 'string', required: true },
            resultRef: { type: 'string', required: false },
            completedAt: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
    },
    neogma
);

export default DelegateGrantAudit;
