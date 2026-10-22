import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    BindingConsentPreflightValidator,
    BINDING_CONSENT_REQUIREMENTS,
    BINDING_CONSENT_COLLECTION_PATHS,
} from '@learncard/types';
import { neogma } from '@instance';
import { readGovernedConsentEvidence } from '@accesslayer/consentflowcontract/governance';
import {
    hashBindingConsentPreflight,
    hashConsentEvidence,
} from '@helpers/consent-preflight-hash.helpers';
import { FlatBindingValidator, type BindingRecordType } from 'types/binding';
import { inflateBinding, serializeBindingRecord } from './shared';
import { evaluateEvidence, resolveRequirements } from './consent-preflight';

// Reference-only registry-adapter approvals intentionally need no preflight.
export const ApproveBindingInputValidator = z
    .object({
        bindingId: z.string().min(1),
        expectedRevision: z.number().int().nonnegative(),
        preflightId: z.string().min(1).optional(),
        preflightHash: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
    })
    .strict();

const stale: (codes: string[]) => never = (codes): never => {
    throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: `PREFLIGHT_STALE: ${codes.join(', ')}`,
        cause: { code: 'PREFLIGHT_STALE', missing: codes },
    });
};

/** Approval, activation, snapshot consumption and audit commit together or not at all. */
export const approveBindingWithPreflight = async (
    input: z.infer<typeof ApproveBindingInputValidator>,
    actorProfileId: string,
    actorDid?: string
): Promise<BindingRecordType> => {
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(async (tx): Promise<BindingRecordType> => {
            const locked = await tx.run(
                `MATCH (b:Binding {bindingId: $bindingId})
                 SET b.consentPreflightLock = coalesce(b.consentPreflightLock, 0) + 1
                 RETURN properties(b) AS binding`,
                input
            );
            if (!locked.records[0])
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Binding not found.' });
            const binding = inflateBinding(
                FlatBindingValidator.parse(locked.records[0].get('binding'))
            );
            const authority = await tx.run(
                `MATCH (e:Ecosystem {id: $ecosystemId}), (p:Profile {profileId: $actorProfileId})
                 OPTIONAL MATCH (p)-[m:MEMBER_OF]->(e)
                 SET e.governanceLock = coalesce(e.governanceLock, 0) + 1,
                     p.governanceLock = coalesce(p.governanceLock, 0) + 1,
                     m.governanceLock = coalesce(m.governanceLock, 0) + 1
                 WITH e, p, m WHERE e.ownerProfileId = p.profileId OR m.role IN ['OWNER', 'ADMIN']
                 RETURN e.id`,
                { ecosystemId: binding.ecosystemId, actorProfileId }
            );
            if (!authority.records.length)
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Ecosystem administration required.',
                });

            let preflightId: string | null = null;
            let preflightHash: string | null = null;
            if (binding.capability !== 'registry-adapter') {
                if (!input.preflightId || !input.preflightHash) stale(['PREFLIGHT_REQUIRED']);
                const stored = await tx.run(
                    `MATCH (b:Binding {bindingId: $bindingId})-[:HAS_CONSENT_PREFLIGHT]->
                         (s:BindingConsentPreflight {preflightId: $preflightId})
                     SET s.approvalLock = coalesce(s.approvalLock, 0) + 1
                     RETURN s.snapshot AS snapshot, s.hash AS hash, s.consumedAt AS consumedAt,
                         s.bindingId AS bindingId, s.ecosystemId AS ecosystemId`,
                    input
                );
                const row = stored.records[0];
                if (!row) stale(['PREFLIGHT_NOT_FOUND']);
                if (row.get('consumedAt')) stale(['PREFLIGHT_CONSUMED']);
                const parsed = BindingConsentPreflightValidator.safeParse(
                    JSON.parse(z.string().parse(row.get('snapshot')))
                );
                if (!parsed.success) stale(['PREFLIGHT_INTEGRITY']);
                const snapshot = parsed.data;
                if (
                    snapshot.hash !== hashBindingConsentPreflight(snapshot) ||
                    snapshot.hash !== row.get('hash') ||
                    snapshot.hash !== input.preflightHash
                )
                    stale(['PREFLIGHT_HASH_MISMATCH']);
                if (
                    snapshot.preflightId !== input.preflightId ||
                    snapshot.bindingId !== binding.bindingId ||
                    row.get('bindingId') !== binding.bindingId ||
                    snapshot.ecosystemId !== binding.ecosystemId ||
                    row.get('ecosystemId') !== binding.ecosystemId ||
                    snapshot.capability !== binding.capability ||
                    snapshot.bindingRevision !== binding.revision ||
                    binding.revision !== input.expectedRevision
                )
                    stale(['PREFLIGHT_BINDING_MISMATCH']);

                // Hold all mutable evidence locks through re-resolution and commit. Node locks
                // also serialize ordinary Terms updates without modifying ConsentFlow writers.
                await tx.run(
                    `MATCH (e:Ecosystem {id: $ecosystemId})-[g:GOVERNS_CONSENT_CONTRACT]->(c:ConsentFlowContract)
                     SET c.audienceLock = coalesce(c.audienceLock, 0) + 1,
                         g.governanceLock = coalesce(g.governanceLock, 0) + 1
                     WITH e, c
                     OPTIONAL MATCH (p:Profile)-[:CREATED_BY]->(t:ConsentFlowTerms)-[:CONSENTS_TO]->(c)
                     OPTIONAL MATCH (p)-[m:MEMBER_OF]->(e)
                     SET t.governanceLock = coalesce(t.governanceLock, 0) + 1,
                         p.governanceLock = coalesce(p.governanceLock, 0) + 1,
                         m.governanceLock = coalesce(m.governanceLock, 0) + 1`,
                    { ecosystemId: binding.ecosystemId }
                );
                await tx.run(
                    `UNWIND $endpoints AS endpoint
                     MATCH (target {id: endpoint.resourceId, targetType: endpoint.resourceType})
                     SET target.consentPreflightLock = coalesce(target.consentPreflightLock, 0) + 1
                     WITH target MATCH (i:InstallIntent {intentId: target.intentId})
                     SET i.consentPreflightLock = coalesce(i.consentPreflightLock, 0) + 1`,
                    { endpoints: [binding.provider, binding.consumer] }
                );
                const requirements = await resolveRequirements(binding, tx);
                const rows = await readGovernedConsentEvidence(binding.ecosystemId, tx);
                const evidence = rows.find(
                    candidate =>
                        candidate.contractId === snapshot.evidence.governanceContractId &&
                        candidate.termsId === snapshot.evidence.termsId
                );
                const codes: string[] = requirements.missing.map(item => item.code);
                const rule = BINDING_CONSENT_REQUIREMENTS[binding.capability];
                if (rule.requiresInstitutionProfile) codes.push('INSTITUTION_PROFILE_MISSING');
                if (!BINDING_CONSENT_COLLECTION_PATHS[rule.collectionPath].implemented)
                    codes.push('COLLECTION_PATH_UNIMPLEMENTED');
                if (!evidence) codes.push('ACCEPTANCE_MISSING');
                else {
                    const current = evaluateEvidence(
                        binding,
                        requirements,
                        evidence,
                        new Date().toISOString()
                    );
                    codes.push(...current.missing.map(item => item.code));
                    if (
                        hashConsentEvidence(current.evidence) !==
                        hashConsentEvidence(snapshot.evidence)
                    )
                        codes.push('EVIDENCE_CHANGED');
                }
                if (
                    hashConsentEvidence({
                        scopes: requirements.scopes,
                        tiers: requirements.tiers,
                        plans: requirements.plans,
                    }) !== hashConsentEvidence(snapshot.requirements)
                )
                    codes.push('REQUIREMENTS_UNRESOLVED');
                if (!snapshot.satisfied)
                    codes.push(...snapshot.missing.map(item => item.code), 'PREFLIGHT_UNSATISFIED');
                if (codes.length) stale([...new Set(codes)]);
                preflightId = snapshot.preflightId;
                preflightHash = snapshot.hash;
            }
            if (binding.revision !== input.expectedRevision)
                throw new TRPCError({ code: 'CONFLICT', message: 'Binding revision is stale.' });
            if (binding.status !== 'PROPOSED' && binding.status !== 'SUSPENDED')
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Only PROPOSED or SUSPENDED bindings can be approved.',
                });
            const now = new Date().toISOString();
            const updated: BindingRecordType = {
                ...binding,
                status: 'ACTIVE',
                approvedBy: actorProfileId,
                approvedAt: now,
                updatedAt: now,
                revision: binding.revision + 2,
                revisions: {
                    ...binding.revisions,
                    bindingRevision: binding.revisions.bindingRevision + 2,
                },
            };
            await tx.run(
                `MATCH (b:Binding {bindingId: $bindingId}) SET b += $patch REMOVE b.suspensionReason
                 WITH b OPTIONAL MATCH (s:BindingConsentPreflight {preflightId: $preflightId})
                 FOREACH (snapshot IN CASE WHEN s IS NULL THEN [] ELSE [s] END |
                     SET snapshot.consumedAt = $now
                     CREATE (b)-[:APPROVED_WITH]->(snapshot))
                 CREATE (:InstallIntentAuditEvent {id: $auditId, action: 'BINDING_APPROVED',
                     ecosystemId: b.ecosystemId, bindingId: b.bindingId, actorProfileId: $actorProfileId,
                     actorDid: $actorDid, timestamp: $now, beforeSummary: $beforeSummary,
                     afterSummary: $approvalSummary, preflightId: $preflightId, preflightHash: $preflightHash})
                 CREATE (:InstallIntentAuditEvent {id: $activationAuditId, action: 'BINDING_ACTIVATED',
                     ecosystemId: b.ecosystemId, bindingId: b.bindingId, actorProfileId: $actorProfileId,
                     actorDid: $actorDid, timestamp: $now, afterSummary: $activationSummary})`,
                {
                    bindingId: binding.bindingId,
                    patch: serializeBindingRecord(updated),
                    now,
                    preflightId,
                    preflightHash,
                    actorProfileId,
                    actorDid: actorDid ?? null,
                    auditId: `install_intent_audit_${randomUUID()}`,
                    activationAuditId: `install_intent_audit_${randomUUID()}`,
                    beforeSummary: JSON.stringify({
                        status: binding.status,
                        revision: binding.revision,
                    }),
                    approvalSummary: JSON.stringify({
                        status: 'APPROVED',
                        revision: binding.revision + 1,
                        preflightId,
                        preflightHash,
                    }),
                    activationSummary: JSON.stringify({
                        status: updated.status,
                        revision: updated.revision,
                    }),
                }
            );
            return updated;
        });
    } finally {
        await session.close();
    }
};
