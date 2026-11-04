import { withAiInsightStage } from '../diagnostics/ai-insight';
import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import { db } from '../db';
import type { ActiveAiConsentReceipt, AiConsentPurpose } from '../learncard/consent';
import { AiConsentError } from '../learncard/consent';
import { contractUri } from '../learncard/constants';
import { assertCurrentAiConsent, getCurrentAiSubject } from './privacy';
import { getPrivacySubjectRef } from './privacy-keys';

const TerminalOutcomeValidator = z.enum([
    'denied',
    'provider_error',
    'success',
    'timeout',
    'indeterminate',
]);

const GuardrailUsageValidator = z
    .object({
        sensitiveInformationPolicyUnits: z.number().int().nonnegative(),
        sensitiveInformationPolicyFreeUnits: z.number().int().nonnegative(),
    })
    .strict();
export type GuardrailAuditUsage = z.infer<typeof GuardrailUsageValidator>;

export const AiAuditTerminalValidator = z
    .object({
        outcome: TerminalOutcomeValidator,
        completedAt: z.string().datetime(),
        // Recovery cannot reconstruct the elapsed time of an interrupted operation.
        durationMs: z.number().int().nonnegative().optional(),
        usage: GuardrailUsageValidator.optional(),
        errorClass: z
            .enum(['consent_denied', 'provider_failed', 'provider_timeout', 'interrupted'])
            .optional(),
    })
    .strict();

export type AiAuditTerminal = z.infer<typeof AiAuditTerminalValidator>;

export const AiAuditEventValidator = z
    .object({
        eventId: z.string().uuid(),
        subjectRef: z.union([z.string().regex(/^[a-f0-9]{64}$/), z.literal('unauthenticated')]),
        provider: z.enum(['openai', 'anthropic', 'google', 'bedrock']),
        model: z.string().min(1).max(200),
        operation: z.enum([
            'structured-output',
            'streaming-output',
            'structured-streaming-output',
            'embedding',
            'guardrail',
        ]),
        purpose: z.enum(['credential-ingestion', 'model-inference', 'embedding']),
        dataCategories: z.array(
            z.enum(['learning-credentials', 'personal-fields', 'user-content'])
        ),
        consentContract: z.string().min(1),
        consentVersion: z.string().min(1).nullable(),
        timestamp: z.string().datetime(),
        // Intent records possibility, not a claim that the third party received data.
        egress: z.enum(['not_started', 'possible']),
        outcome: z.enum(['pending', ...TerminalOutcomeValidator.options]),
        completedAt: z.string().datetime().optional(),
        durationMs: z.number().int().nonnegative().optional(),
        usage: GuardrailUsageValidator.optional(),
        errorClass: AiAuditTerminalValidator.shape.errorClass,
        // Local-dev DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL: the guardrail step was
        // skipped, so nothing was sent to the guardrail provider.
        guardrail: z.literal('bypassed').optional(),
    })
    .strict()
    .refine(
        event =>
            event.guardrail !== 'bypassed' ||
            (event.operation === 'guardrail' && event.egress === 'not_started'),
        {
            message: 'A bypassed guardrail record must be a guardrail operation with no egress',
        }
    );

export type AiAuditEvent = z.infer<typeof AiAuditEventValidator>;

export type AiAuditOperation = Pick<AiAuditEvent, 'provider' | 'model' | 'operation'> & {
    purpose: AiConsentPurpose;
    /** Only for a guardrail step skipped by the local-dev bypass. */
    guardrail?: 'bypassed';
};

type AiAuditDependencies = {
    getSubject: () => string | undefined;
    subjectReference: (subject: string) => string;
    assertConsent: (purpose: AiConsentPurpose) => Promise<ActiveAiConsentReceipt>;
    // Must acknowledge a durable insert; eventId must have a unique index.
    persist: (event: AiAuditEvent) => Promise<void>;
    // Must atomically match eventId AND outcome=pending. Never upsert.
    complete: (eventId: string, terminal: AiAuditTerminal) => Promise<boolean>;
    now: () => Date;
    elapsed: () => number;
    eventId: () => string;
};

export class AiAuditPersistenceError extends Error {
    constructor() {
        // Never attach the storage exception: its message/cause can contain a row.
        super('AI audit persistence unavailable');
        this.name = 'AiAuditPersistenceError';
    }
}

export const createAiAuditBoundary = (dependencies: AiAuditDependencies) =>
    async function withAiAudit<Result>(
        operation: AiAuditOperation,
        callback: (recordUsage: (usage: GuardrailAuditUsage) => void) => Promise<Result>
    ): Promise<Result> {
        const startedAt = dependencies.now();
        const startedElapsed = dependencies.elapsed();
        const subject = dependencies.getSubject();
        const subjectRef = subject ? dependencies.subjectReference(subject) : 'unauthenticated';
        const eventId = dependencies.eventId();
        let receipt: ActiveAiConsentReceipt | undefined;
        let consentError: unknown;
        let usage: GuardrailAuditUsage | undefined;

        // Consent lookup is local policy work, not provider I/O. Denials get the
        // same durable intent/terminal protocol as allowed attempts.
        try {
            receipt = await dependencies.assertConsent(operation.purpose);
        } catch (error) {
            consentError = error;
        }

        const intent = AiAuditEventValidator.parse({
            ...operation,
            eventId,
            subjectRef,
            dataCategories: receipt
                ? [
                      'user-content',
                      ...(receipt.credentialUris.length ? ['learning-credentials'] : []),
                      ...(receipt.personalFields.length ? ['personal-fields'] : []),
                  ]
                : [],
            consentContract: receipt?.contractUri ?? contractUri,
            consentVersion: receipt?.revision ?? null,
            timestamp: startedAt.toISOString(),
            // A bypassed guardrail never contacts its provider.
            egress: receipt && operation.guardrail !== 'bypassed' ? 'possible' : 'not_started',
            outcome: 'pending',
        });

        try {
            await dependencies.persist(intent);
        } catch {
            // An ambiguous acknowledgement can leave a pending row, but must never
            // allow callback invocation. Recovery marks that row indeterminate.
            return withAiInsightStage('audit', () => {
                throw new AiAuditPersistenceError();
            });
        }

        const finish = async (terminal: Pick<AiAuditTerminal, 'outcome' | 'errorClass'>) => {
            try {
                const transitioned = await dependencies.complete(
                    eventId,
                    AiAuditTerminalValidator.parse({
                        ...terminal,
                        ...(usage ? { usage } : {}),
                        completedAt: dependencies.now().toISOString(),
                        durationMs: Math.max(
                            0,
                            Math.round(dependencies.elapsed() - startedElapsed)
                        ),
                    })
                );
                if (!transitioned) throw new AiAuditPersistenceError();
            } catch {
                // Do not insert another row or attempt a different terminal outcome.
                // The write may have committed despite a lost acknowledgement. Pending
                // rows are reconciled; already-terminal rows remain immutable.
                return withAiInsightStage('audit', () => {
                    throw new AiAuditPersistenceError();
                });
            }
        };

        if (!receipt) {
            await finish({ outcome: 'denied', errorClass: 'consent_denied' });
            throw consentError;
        }

        let result: Result;
        try {
            result = await callback(value => {
                usage = GuardrailUsageValidator.parse(value);
            });
        } catch (error) {
            const timeout = error instanceof Error && error.name === 'TimeoutError';
            const denied = error instanceof AiConsentError;
            await finish({
                outcome: denied ? 'denied' : timeout ? 'timeout' : 'provider_error',
                errorClass: denied
                    ? 'consent_denied'
                    : timeout
                      ? 'provider_timeout'
                      : 'provider_failed',
            });
            throw error;
        }

        // Keep completion outside the callback catch: a storage error is not a
        // provider failure and must not cause a second terminal transition.
        await finish({ outcome: 'success' });
        return result;
    };

// The audit check gates a provider call, so it does not trust the request's
// earlier read. Guardrail masking opens a nested audit per text, so inside one
// AI call the audit checks share one read (oncePerAiCall); the first check of
// every AI call reads fresh.
export const assertAuditConsent = (purpose: AiConsentPurpose) =>
    assertCurrentAiConsent(purpose, { fresh: true, oncePerAiCall: true });

export const withAiAudit = createAiAuditBoundary({
    getSubject: getCurrentAiSubject,
    subjectReference: getPrivacySubjectRef,
    assertConsent: assertAuditConsent,
    persist: async event => {
        await db.storeAiAuditEvent(event);
    },
    complete: async (eventId, terminal) => {
        return db.completeAiAuditEvent(eventId, terminal);
    },
    now: () => new Date(),
    elapsed: () => performance.now(),
    eventId: randomUUID,
});

/**
 * Startup/periodic or operator-driven abandonment of old pending attempts.
 * This is not a retry, and never asserts that the provider failed or succeeded.
 * A still-running attempt older than the operational cutoff may be abandoned;
 * its later completion cannot overwrite this terminal indeterminate outcome.
 * Never delete pending records with a TTL or replay their provider callbacks.
 */
export const reconcileInterruptedAiAudits = async (before: Date): Promise<number> => {
    const now = new Date();
    if (!Number.isFinite(before.getTime()) || before >= now)
        throw new Error('Audit reconciliation requires a past cutoff');
    return db.reconcileAiAuditEvents(before.toISOString(), now.toISOString());
};
