import { createHash, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { BindingConsentPreflightValidator } from '@learncard/types';
import { neogma } from '@instance';
import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';
import { listBindingsByEcosystem } from '@accesslayer/binding/read';
import { SERVICE_ACCOUNT_AGGREGATE_VALID } from '@accesslayer/service-account/invariants';
import { getCatalogPolicyRevision } from '@helpers/catalog-policy.helpers';
import { evaluateConsentPreflight } from '@helpers/install-intent.helpers';
import { serviceOperationClassification } from '@helpers/ecosystem-access.helpers';
import {
    verifyServiceAccountToken,
    type ServiceAccountPrincipal,
} from './service-account-auth.helpers';

export const SubmitRecordInputValidator = z
    .object({
        subjectProfileId: z.string().min(1).max(200),
        /** Provider-side identifier; stored for reconciliation, never used as identity (ADR-012 D4). */
        externalSubjectId: z.string().min(1).max(200).optional(),
        fields: z
            .record(z.string().min(1).max(100), z.string().max(2000))
            .refine(fields => Object.keys(fields).length <= 50, {
                message: 'A record may carry at most 50 fields.',
            }),
    })
    .strict();
export type SubmitRecordInput = z.infer<typeof SubmitRecordInputValidator>;

export const SubmitRecordResultValidator = z.object({
    recordId: z.string(),
    status: z.enum(['ACCEPTED', 'DUPLICATE']),
});
export type SubmitRecordResult = z.infer<typeof SubmitRecordResultValidator>;

const RESOURCE = 'completion';
const ACTION = 'ingest';

const deny: (reason: string) => never = (reason): never => {
    throw new TRPCError({ code: 'FORBIDDEN', message: reason });
};

const readApprovedSnapshot = async (bindingId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Binding {bindingId: $bindingId})-[:APPROVED_WITH]->(s:BindingConsentPreflight)
         RETURN s.snapshot AS snapshot ORDER BY s.consumedAt DESC LIMIT 1`,
        { bindingId }
    );
    const raw: unknown = result.records[0]?.get('snapshot');

    return typeof raw === 'string' ? BindingConsentPreflightValidator.parse(JSON.parse(raw)) : null;
};

/** Live learner Terms on the governing contract. Operator acceptances are not learner consent. */
const readSubjectTerms = async (subjectProfileId: string, contractId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $subjectProfileId})-[:CREATED_BY]->(t:ConsentFlowTerms)
               -[:CONSENTS_TO]->(:ConsentFlowContract {id: $contractId})
         WHERE t.educationOsAcceptedRole IS NULL
         RETURN t.id AS termsId, t.status AS status, t.expiresAt AS expiresAt,
                toString(coalesce(t.mutationVersion, 0)) AS revision
         ORDER BY t.updatedAt DESC LIMIT 1`,
        { subjectProfileId, contractId }
    );
    const row = result.records[0];

    if (!row) return null;

    const expiresAt: unknown = row.get('expiresAt');
    // Absent means no expiry; anything other than a parseable future string fails closed.
    const unexpired =
        expiresAt === null ||
        expiresAt === undefined ||
        (typeof expiresAt === 'string' && Date.parse(expiresAt) > Date.now());
    const live = row.get('status') === 'live' && unexpired;

    return { termsId: String(row.get('termsId')), revision: String(row.get('revision')), live };
};

type ReleaseCommit = {
    bindingId: string;
    bindingRevision: number;
    serviceAccountId: string;
    installId: string;
    ecosystemId: string;
    gen: number;
    termsId: string;
    subjectProfileId: string;
    externalSubjectId?: string;
    recordClass: string;
    fields: Record<string, string>;
    idempotencyKey: string;
    retentionDays: number;
    consentDecisionId: string;
};

const hashFields = (fields: Record<string, string>): string =>
    createHash('sha256')
        .update(JSON.stringify(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b))))
        .digest('hex');

/**
 * Locks the Binding, ServiceAccount and Terms, re-asserts every release predicate, then
 * stores the record and its ALLOW audit atomically. Locks serialize with revocation,
 * withdrawal, disablement and concurrent submits, so idempotency holds without a race.
 */
const commitRelease = async (
    input: ReleaseCommit
): Promise<SubmitRecordResult | 'STATE_CHANGED' | 'IDEMPOTENCY_CONFLICT'> => {
    const now = new Date();
    const payloadHash = hashFields(input.fields);
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(async tx => {
            const locked = await tx.run(
                `MATCH (b:Binding {bindingId: $bindingId})
                 SET b.releaseLock = coalesce(b.releaseLock, 0) + 1
                 WITH b
                 MATCH (sa:ServiceAccount {id: $serviceAccountId, installId: $installId,
                     ecosystemId: $ecosystemId})
                 SET sa.releaseLock = coalesce(sa.releaseLock, 0) + 1
                 WITH b, sa
                 MATCH (:Profile {profileId: $subjectProfileId})-[:CREATED_BY]->
                     (t:ConsentFlowTerms {id: $termsId})
                 SET t.releaseLock = coalesce(t.releaseLock, 0) + 1
                 WITH b, sa, t
                 WHERE b.status = 'ACTIVE' AND b.revision = $bindingRevision
                   AND sa.status = 'ENABLED' AND sa.credentialGeneration = $gen
                   AND (${SERVICE_ACCOUNT_AGGREGATE_VALID})
                   AND t.status = 'live' AND (t.expiresAt IS NULL OR t.expiresAt > $now)
                 RETURN count(*) AS ok`,
                {
                    bindingId: input.bindingId,
                    bindingRevision: input.bindingRevision,
                    serviceAccountId: input.serviceAccountId,
                    installId: input.installId,
                    ecosystemId: input.ecosystemId,
                    gen: input.gen,
                    subjectProfileId: input.subjectProfileId,
                    termsId: input.termsId,
                    now: now.toISOString(),
                }
            );
            if (Number(locked.records[0]?.get('ok')) !== 1) return 'STATE_CHANGED';

            const existing = await tx.run(
                `MATCH (r:ProvisionedRecord {bindingId: $bindingId, idempotencyKey: $idempotencyKey})
                 RETURN r.id AS id, r.subjectProfileId AS subjectProfileId, r.payloadHash AS payloadHash`,
                { bindingId: input.bindingId, idempotencyKey: input.idempotencyKey }
            );
            const prior = existing.records[0];
            let result: SubmitRecordResult;
            if (prior) {
                // A replay must be the same subject and payload; anything else is a conflict.
                if (
                    prior.get('subjectProfileId') !== input.subjectProfileId ||
                    prior.get('payloadHash') !== payloadHash
                )
                    return 'IDEMPOTENCY_CONFLICT';
                result = { recordId: String(prior.get('id')), status: 'DUPLICATE' };
            } else {
                const recordId = `record_${randomUUID()}`;
                await tx.run(
                    `CREATE (:ProvisionedRecord {id: $recordId, bindingId: $bindingId,
                         idempotencyKey: $idempotencyKey, ecosystemId: $ecosystemId,
                         installId: $installId, subjectProfileId: $subjectProfileId,
                         externalSubjectId: $externalSubjectId, recordClass: $recordClass,
                         fields: $fields, payloadHash: $payloadHash,
                         consentDecisionId: $consentDecisionId, receivedAt: $now,
                         expiresAt: $expiresAt})`,
                    {
                        ...input,
                        recordId,
                        externalSubjectId: input.externalSubjectId ?? null,
                        fields: JSON.stringify(input.fields),
                        payloadHash,
                        now: now.toISOString(),
                        expiresAt: new Date(
                            now.getTime() + input.retentionDays * 86_400_000
                        ).toISOString(),
                    }
                );
                result = { recordId, status: 'ACCEPTED' };
            }
            await tx.run(
                `CREATE (:InstallIntentAuditEvent {id: $auditId, action: 'RECORD_PROVISION_ALLOW',
                     ecosystemId: $ecosystemId, bindingId: $bindingId, timestamp: $now,
                     afterSummary: $afterSummary})`,
                {
                    auditId: `install_intent_audit_${randomUUID()}`,
                    ecosystemId: input.ecosystemId,
                    bindingId: input.bindingId,
                    now: now.toISOString(),
                    afterSummary: JSON.stringify({
                        serviceAccountId: input.serviceAccountId,
                        subjectProfileId: input.subjectProfileId,
                        reason: 'ALLOWED',
                        recordId: result.recordId,
                        status: result.status,
                    }),
                }
            );
            return result;
        });
    } finally {
        await session.close();
    }
};

/**
 * ADR-012 Transactional record release: effective access is the approved scopes ∩ ecosystem
 * authority ∩ the subject's live consent. Every attempt is audited; field values never are.
 */
export const submitProvisionedRecord = async (
    principal: ServiceAccountPrincipal | undefined,
    input: SubmitRecordInput
): Promise<SubmitRecordResult> => {
    let ecosystemId = 'unknown';
    let accountId: string | undefined;
    let bindingId: string | undefined;
    let outcome: SubmitRecordResult | undefined;
    let reason = 'UNAUTHENTICATED';

    try {
        if (!principal) throw new TRPCError({ code: 'UNAUTHORIZED' });
        // Reverify the token, rather than trusting even an in-process claims object.
        const claims = await verifyServiceAccountToken(principal.token);
        ecosystemId = claims.ecosystemId;
        accountId = claims.sub;

        reason = 'UNCLASSIFIED_OPERATION';
        if (serviceOperationClassification(RESOURCE, ACTION) !== 'SUBJECT_RECORD') deny(reason);

        reason = 'NO_GRANT_FOR_SUBJECT';
        const authority = await neogma.queryRunner.run(
            `MATCH (sa:ServiceAccount {id: $id, installId: $installId, ecosystemId: $ecosystemId})
             WHERE sa.status = 'ENABLED' AND sa.credentialGeneration = $gen
               AND (${SERVICE_ACCOUNT_AGGREGATE_VALID})
             MATCH (sa)-[:ACTS_FOR]->(:Ecosystem {id: $ecosystemId})
             MATCH (:IntegrationInstall {id: $installId})-[:HAS_SERVICE_ACCOUNT]->(sa)
             MATCH (sa)-[:HAS_GRANT]->(grant:ServiceAccountGrant)
             WHERE grant.serviceAccountId = sa.id AND grant.installId = sa.installId
               AND grant.resource = $resource AND grant.action = $action
             MATCH (:Profile {profileId: $subjectProfileId})-[:MEMBER_OF]->(home:Ecosystem)
             WHERE $ecosystemId IN home.pathIds
               AND ((grant.selectorKind = 'tree' AND grant.selectorValue IN home.pathIds)
                 OR (grant.selectorKind = 'id' AND grant.selectorValue = home.id))
             RETURN DISTINCT grant.resource + ':' + grant.action + ':' + grant.selectorKind + ':'
                 + grant.selectorValue AS scope`,
            {
                id: claims.sub,
                installId: claims.installId,
                ecosystemId: claims.ecosystemId,
                gen: claims.gen,
                resource: RESOURCE,
                action: ACTION,
                subjectProfileId: input.subjectProfileId,
            }
        );
        const authorityScopes = authority.records.map(record => String(record.get('scope')));
        if (!authorityScopes.length) deny(reason);

        reason = 'NO_ACTIVE_BINDING';
        const bindings = (await listBindingsByEcosystem(claims.ecosystemId)).filter(
            candidate =>
                candidate.status === 'ACTIVE' &&
                candidate.capability === 'record-provisioning' &&
                candidate.provider.resourceId === claims.installId &&
                candidate.capabilityMetadata?.mode === 'TRANSACTIONAL'
        );
        if (bindings.length !== 1) deny(reason);
        const binding = bindings[0]!;
        const metadata = binding.capabilityMetadata;
        bindingId = binding.bindingId;
        const declaration = metadata?.transactional;
        if (!metadata || !declaration) return deny(reason);

        reason = 'UNDECLARED_FIELDS';
        const declared = new Set(declaration.fields);
        const idempotencyKey = input.fields[declaration.idempotencyKeyField];
        if (Object.keys(input.fields).some(field => !declared.has(field)) || !idempotencyKey)
            deny(reason);

        reason = 'NO_APPROVAL_EVIDENCE';
        const snapshot = await readApprovedSnapshot(binding.bindingId);
        const grant = snapshot?.evidence.grant;
        const contractId = snapshot?.evidence.governanceContractId;
        if (!snapshot || !grant || !contractId) return deny(reason);

        const terms = await readSubjectTerms(input.subjectProfileId, contractId);
        // Consenting to the governed contract consents to its declared grant, no more.
        const decision = await evaluateConsentPreflight({
            ecosystemId: claims.ecosystemId,
            bindingId: binding.bindingId,
            resourceId: claims.installId,
            subjectProfileId: input.subjectProfileId,
            consentActor: { type: 'SUBJECT', profileId: input.subjectProfileId },
            consentFlowContractId: contractId,
            consentTermsId: terms?.termsId ?? 'none',
            consentRevision: terms?.revision ?? 'none',
            requestedScopes: snapshot.requirements.scopes,
            ecosystemAuthorityScopes: authorityScopes,
            consentApprovedScopes: terms?.live ? grant.scopes : [],
            requiredConsentTiers: snapshot.requirements.tiers,
            activeConsentTiers: terms?.live ? grant.tiers : [],
            consentActive: terms?.live ?? false,
            policyRevision: await getCatalogPolicyRevision(claims.ecosystemId),
            releaseChannel: 'TRANSACTIONAL',
        });
        reason = decision.allowed ? 'ALLOWED' : 'CONSENT_DENIED';
        if (!decision.allowed) deny(reason);

        if (!terms) return deny(reason);
        const committed = await commitRelease({
            bindingId: binding.bindingId,
            bindingRevision: binding.revision,
            serviceAccountId: claims.sub,
            installId: claims.installId,
            ecosystemId: claims.ecosystemId,
            gen: claims.gen,
            termsId: terms.termsId,
            subjectProfileId: input.subjectProfileId,
            externalSubjectId: input.externalSubjectId,
            recordClass: metadata.recordClass,
            fields: input.fields,
            idempotencyKey,
            retentionDays: declaration.retentionDays,
            consentDecisionId: decision.record.id,
        });
        if (typeof committed === 'string') {
            reason = committed;
            return deny(reason);
        }
        outcome = committed;

        return outcome;
    } finally {
        // Releases are audited inside their own transaction; denials are audited here.
        if (!outcome) {
            await createInstallIntentAuditEvent({
                action: 'RECORD_PROVISION_DENY',
                ecosystemId,
                bindingId,
                afterSummary: {
                    serviceAccountId: accountId,
                    subjectProfileId: input.subjectProfileId,
                    reason,
                },
            });
        }
    }
};

/** Retention enforcement for stored records; deletes records past their declared retention. */
export const purgeExpiredProvisionedRecords = async (now = new Date()): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord) WHERE r.expiresAt <= $now
         WITH r, r.id AS id DETACH DELETE r RETURN count(id) AS purged`,
        { now: now.toISOString() }
    );

    return Number(result.records[0]?.get('purged') ?? 0);
};
