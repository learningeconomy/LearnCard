import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { ManagedTransaction } from 'neo4j-driver';
import {
    BINDING_CONSENT_REQUIREMENTS,
    BINDING_CONSENT_COLLECTION_PATHS,
    BindingConsentPreflightValidator,
    EducationOsConsentGrantValidator,
    InstallIntentPlanValidator,
    InstallIntentApprovalValidator,
    type BindingConsentPreflight,
    type BindingConsentPreflightReasonCode,
    type EducationOsConsentGrant,
} from '@learncard/types';
import { neogma } from '@instance';
import {
    readGovernedConsentEvidence,
    type GovernedConsentEvidence,
} from '@accesslayer/consentflowcontract/governance';
import { requireEcosystemRole } from '@helpers/install-intent.helpers';
import {
    hashBindingConsentPreflight,
    hashEducationOsGrant,
} from '@helpers/consent-preflight-hash.helpers';
import type { BindingRecordType } from 'types/binding';
import { requireBindingRecord } from './shared';
import { resolveRecordLaneGaps } from './record-lane';

type Missing = BindingConsentPreflight['missing'];
type PlanDependency = {
    intentId: string;
    planJson: string;
    approvalJson: string;
    targetId: string;
    targetType: string;
};
type Requirements = BindingConsentPreflight['requirements'] & {
    missing: Missing;
    dependencies: PlanDependency[];
};

const missing = (code: BindingConsentPreflightReasonCode, message: string): Missing => [
    {
        code,
        message,
        howToSatisfy:
            'An ecosystem OWNER or ADMIN must correct the governed agreement, acceptance, or approved plan and prepare a new preflight.',
    },
];

/** Resolve scope/tier requirements exclusively from server-owned approved plans. */
export const resolveRequirements = async (
    binding: BindingRecordType,
    runner: Pick<ManagedTransaction, 'run'> | typeof neogma.queryRunner = neogma.queryRunner
): Promise<Requirements> => {
    const result: Requirements = {
        scopes: [],
        plans: [],
        tiers: [...BINDING_CONSENT_REQUIREMENTS[binding.capability].minimumTiers],
        missing: [],
        dependencies: [],
    };
    // ADR-012 §3.2 and ADR-013 §3.1–3.3: record lanes are approvable only with a complete
    // Binding declaration whose class both endpoints' reviewed declarations support.
    if (BINDING_CONSENT_REQUIREMENTS[binding.capability].requiresRecordClass) {
        for (const gap of await resolveRecordLaneGaps(binding)) {
            result.missing.push(...missing('REQUIREMENTS_UNRESOLVED', gap));
        }
    }
    for (const endpoint of [binding.provider, binding.consumer]) {
        if (endpoint.ecosystemId !== binding.ecosystemId) {
            result.missing.push(
                ...missing(
                    'CROSS_ECOSYSTEM',
                    'Binding endpoints must belong to the governing ecosystem.'
                )
            );
            continue;
        }
        if (endpoint.resourceType === 'ECOSYSTEM') {
            if (endpoint.resourceId !== binding.ecosystemId) {
                result.missing.push(
                    ...missing(
                        'CROSS_ECOSYSTEM',
                        'The ecosystem endpoint does not match its owner.'
                    )
                );
            }
            continue;
        }
        const targets = await runner.run(
            `MATCH (t {id: $id, targetType: $targetType})
             RETURN t.id AS id, t.targetType AS targetType, t.intentId AS intentId,
                 t.ecosystemId AS ecosystemId`,
            { id: endpoint.resourceId, targetType: endpoint.resourceType }
        );
        const target = targets.records[0]
            ? z
                  .object({
                      id: z.string(),
                      targetType: z.string(),
                      intentId: z.string(),
                      ecosystemId: z.string(),
                  })
                  .parse(targets.records[0].toObject())
            : null;
        const stored = target
            ? await runner.run(
                  `MATCH (i:InstallIntent {intentId: $intentId})
             RETURN i.ecosystemId AS ecosystemId, i.plan AS planJson, i.approval AS approvalJson`,
                  { intentId: target.intentId }
              )
            : null;
        const raw = stored?.records[0]
            ? z
                  .object({
                      ecosystemId: z.string(),
                      planJson: z.string(),
                      approvalJson: z.string(),
                  })
                  .parse(stored.records[0].toObject())
            : null;
        const intent =
            raw && target
                ? {
                      intentId: target.intentId,
                      ecosystemId: raw.ecosystemId,
                      plan: InstallIntentPlanValidator.parse(JSON.parse(raw.planJson)),
                      approval: InstallIntentApprovalValidator.parse(JSON.parse(raw.approvalJson)),
                  }
                : null;
        if (
            !target ||
            !intent ||
            !raw ||
            target.ecosystemId !== binding.ecosystemId ||
            intent.ecosystemId !== binding.ecosystemId
        ) {
            result.missing.push(
                ...missing('REQUIREMENTS_UNRESOLVED', 'An endpoint has no local install plan.')
            );
            continue;
        }
        if (
            intent.approval.state !== 'APPROVED' ||
            intent.approval.artifact.planHash !== intent.plan.planHash ||
            intent.approval.artifact.planRevision !== intent.plan.planRevision
        ) {
            result.missing.push(
                ...missing(
                    'REQUIREMENTS_UNRESOLVED',
                    'Endpoint scope requirements must come from an approved plan.'
                )
            );
            continue;
        }
        result.scopes.push(...intent.plan.scopesRequested);
        result.dependencies.push({
            intentId: intent.intentId,
            planJson: raw.planJson,
            approvalJson: raw.approvalJson,
            targetId: target.id,
            targetType: target.targetType,
        });
        result.plans.push({
            intentId: intent.intentId,
            planHash: intent.plan.planHash,
            planRevision: intent.plan.planRevision,
        });
        result.tiers.push(...intent.plan.consentTiers);
    }
    result.scopes = [
        ...new Set(
            result.scopes.map(scope => scope.replace(/\$installEcosystemId$/, binding.ecosystemId))
        ),
    ].sort();
    result.tiers = [...new Set(result.tiers)].sort();
    if (!result.scopes.length || !result.tiers.length) {
        result.missing.push(
            ...missing(
                'REQUIREMENTS_UNRESOLVED',
                'Subject-data readiness requires explicit plan scopes and consent tiers.'
            )
        );
    }
    return result;
};

const parseGrant = (json: string | null): EducationOsConsentGrant | null => {
    if (!json) return null;
    try {
        const parsed = EducationOsConsentGrantValidator.safeParse(JSON.parse(json));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
};

const isExpired = (date: string | null, now: string): boolean =>
    date !== null && (!Number.isFinite(Date.parse(date)) || Date.parse(date) <= Date.parse(now));

export const evaluateEvidence = (
    binding: BindingRecordType,
    requirements: Requirements,
    row: GovernedConsentEvidence,
    evaluatedAt: string
): Pick<BindingConsentPreflight, 'evidence' | 'missing' | 'supportedTiers'> => {
    const evidence: BindingConsentPreflight['evidence'] = { governanceContractId: row.contractId };
    const fail = (
        code: BindingConsentPreflightReasonCode,
        message: string
    ): ReturnType<typeof evaluateEvidence> => ({
        evidence,
        missing: missing(code, message),
        supportedTiers: [],
    });
    const requirement = BINDING_CONSENT_REQUIREMENTS[binding.capability];
    const implementedTiers = new Set<string>(
        BINDING_CONSENT_COLLECTION_PATHS[requirement.collectionPath].supportedTiers
    );
    if (requirements.tiers.some(tier => !implementedTiers.has(tier))) {
        return fail(
            'TIER_UNSUPPORTED',
            'The implemented collection path does not support every required tier and actor policy.'
        );
    }
    if (
        row.governingEcosystemIds.length !== 1 ||
        row.governingEcosystemIds[0] !== binding.ecosystemId
    ) {
        return fail('CROSS_ECOSYSTEM', 'Contract governance is not exclusive to this ecosystem.');
    }
    if (isExpired(row.contractExpiresAt, evaluatedAt))
        return fail('CONTRACT_NOT_LIVE', 'The governance contract has expired.');
    if (!row.termsId || !row.acceptedGrantJson || !row.acceptedAt)
        return fail('ACCEPTANCE_MISSING', 'No revisioned governance acceptance exists.');
    evidence.termsId = row.termsId;
    if (row.status !== 'live' || isExpired(row.expiresAt, evaluatedAt))
        return fail('CONTRACT_NOT_LIVE', 'Governance acceptance is withdrawn, stale, or expired.');
    if (
        !row.profileId ||
        row.acceptedProfileId !== row.profileId ||
        (row.role !== 'ADMIN' && row.role !== 'OWNER') ||
        (row.acceptedRole !== 'ADMIN' && row.acceptedRole !== 'OWNER')
    ) {
        return fail(
            'ACCEPTOR_NOT_AUTHORIZED',
            'The representative must be authorized both at acceptance and now.'
        );
    }
    // Any later Terms mutation (personal re-consent, update, withdrawal) supersedes the
    // governance acceptance; it can only be renewed by a fresh governance acceptance.
    if (row.acceptedMutationVersion !== row.termsMutationVersion)
        return fail(
            'ACCEPTANCE_MISSING',
            'The governance acceptance was superseded by a later Terms change; it must be re-accepted.'
        );
    evidence.acceptedBy = { profileId: row.profileId, role: row.acceptedRole };
    evidence.acceptedAt = row.acceptedAt;
    const currentGrant = parseGrant(row.grantJson);
    const acceptedGrant = parseGrant(row.acceptedGrantJson);
    if (
        !currentGrant ||
        !acceptedGrant ||
        hashEducationOsGrant(currentGrant) !== row.grantHash ||
        hashEducationOsGrant(acceptedGrant) !== row.acceptedGrantHash ||
        row.acceptedRevision !== row.contractRevision ||
        row.acceptedGrantHash !== row.grantHash
    ) {
        return fail('ACCEPTANCE_MISSING', 'The current grant revision has not been accepted.');
    }
    evidence.contractRevision = row.contractRevision ?? undefined;
    evidence.acceptedGrantHash = row.acceptedGrantHash ?? undefined;
    const grants = acceptedGrant.grants.filter(
        grant =>
            grant.capability === binding.capability && grant.operation === requirement.operation
    );
    if (row.agreement !== requirement.agreement || !grants.length)
        return fail(
            'GRANT_DOES_NOT_COVER_CAPABILITY',
            'Agreement kind and operation must cover this capability.'
        );
    const scopeGrants = grants.filter(grant =>
        requirements.scopes.every(scope => grant.scopes.includes(scope))
    );
    if (!scopeGrants.length)
        return fail('SCOPE_NOT_COVERED', 'No single accepted grant covers every requested scope.');
    const tierGrants = scopeGrants.filter(grant =>
        requirements.tiers.every(tier => grant.tiers.includes(tier))
    );
    if (!tierGrants.length)
        return fail(
            'TIER_UNSUPPORTED',
            'The accepted grant does not support every required consent tier.'
        );
    const selectorGrants = tierGrants.filter(
        grant =>
            !grant.selectors ||
            (!grant.selectors.groupIds &&
                !grant.selectors.profileIds &&
                grant.selectors.ecosystemIds?.includes(binding.ecosystemId))
    );
    if (!selectorGrants.length)
        return fail(
            'SELECTOR_NOT_COVERED',
            'The binding population cannot be proven to fit the accepted selectors.'
        );
    const fieldGrants = selectorGrants.filter(grant => !grant.fields);
    if (!fieldGrants.length)
        return fail(
            'FIELD_NOT_COVERED',
            'This binding has no approved field declaration for a field-restricted grant.'
        );
    const grant = fieldGrants.find(candidate => !candidate.permissionRequirements?.length);
    if (!grant)
        return fail(
            'PERMISSION_REQUIREMENT_UNSATISFIED',
            'Additional permission requirements have not been resolved.'
        );
    evidence.grant = grant;
    return {
        evidence,
        missing: [],
        supportedTiers: grant.tiers.filter(tier => implementedTiers.has(tier)),
    };
};

/** Append-only API: snapshot and audit are committed by one Cypher statement. */
export const prepareBindingConsentPreflight = async (input: {
    bindingId: string;
    actorProfileId: string;
    actorDid?: string;
}): Promise<BindingConsentPreflight> => {
    const binding = await requireBindingRecord(input.bindingId);
    await requireEcosystemRole(binding.ecosystemId, input.actorProfileId, ['OWNER', 'ADMIN']);
    const requirement = BINDING_CONSENT_REQUIREMENTS[binding.capability];
    const evaluatedAt = new Date().toISOString();
    let dependencies: PlanDependency[] = [];
    let acceptedEvidence: GovernedConsentEvidence | undefined;
    const body: Omit<BindingConsentPreflight, 'hash'> = {
        preflightId: `consent_preflight_${randomUUID()}`,
        bindingId: binding.bindingId,
        bindingRevision: binding.revision,
        ecosystemId: binding.ecosystemId,
        capability: binding.capability,
        evaluatedAt,
        evidence: {},
        requirements: { scopes: [], tiers: [], plans: [] },
        supportedTiers: [],
        // ConsentFlow Terms is implemented. Wallet choice requires dedicated wiring;
        // naming a planned collection path must never mark it implemented.
        collectionPath: {
            kind: requirement.collectionPath,
            implemented: BINDING_CONSENT_COLLECTION_PATHS[requirement.collectionPath].implemented,
        },
        satisfied: false,
        missing: [],
    };
    if (binding.capability !== 'registry-adapter') {
        const requirements = await resolveRequirements(binding);
        dependencies = requirements.dependencies;
        body.requirements = {
            scopes: requirements.scopes,
            tiers: requirements.tiers,
            plans: requirements.plans,
        };
        body.missing.push(...requirements.missing);
        const rows = await readGovernedConsentEvidence(binding.ecosystemId);
        const evaluations = rows.map(row =>
            evaluateEvidence(binding, requirements, row, evaluatedAt)
        );
        const best = evaluations.find(result => !result.missing.length) ?? evaluations[0];
        if (best) {
            acceptedEvidence = rows.find(
                row =>
                    row.contractId === best.evidence.governanceContractId &&
                    row.termsId === best.evidence.termsId
            );
            body.evidence = best.evidence;
            body.supportedTiers = best.supportedTiers;
            body.missing.push(...best.missing);
        } else {
            body.missing.push(
                ...missing(
                    'NO_GOVERNANCE_CONTRACT',
                    'No local ecosystem-governed consent contract exists.'
                )
            );
        }
        if (requirement.requiresInstitutionProfile) {
            // Until the Binding carries a pinned institution identity, do not guess
            // an issuer from an unrelated organization that happens to be a member.
            body.missing.push(
                ...missing(
                    'INSTITUTION_PROFILE_MISSING',
                    'Issuance readiness requires a binding-specific institution profile.'
                )
            );
        }
        if (!body.collectionPath.implemented) {
            body.missing.push(
                ...missing(
                    'COLLECTION_PATH_UNIMPLEMENTED',
                    'Wallet claim-choice collection is not wired to EducationOS readiness.'
                )
            );
        }
    }
    body.satisfied = body.missing.length === 0;
    const snapshot = BindingConsentPreflightValidator.parse({
        ...body,
        hash: hashBindingConsentPreflight(body),
    });
    // Lock and compare the complete dependency set before committing a satisfied
    // result. An earlier read is not authority: concurrent edits cause a retry.
    const evidenceGuard =
        snapshot.satisfied && acceptedEvidence
            ? `
         MATCH (e)-[g:GOVERNS_CONSENT_CONTRACT]->(c:ConsentFlowContract {id: $acceptedEvidence.contractId})
         MATCH (a:Profile {profileId: $acceptedEvidence.profileId})-[:CREATED_BY]->
             (t:ConsentFlowTerms {id: $acceptedEvidence.termsId})-[:CONSENTS_TO]->(c)
         OPTIONAL MATCH (a)-[am:MEMBER_OF]->(e)
         SET c.audienceLock = coalesce(c.audienceLock, 0) + 1,
             t.governanceLock = coalesce(t.governanceLock, 0) + 1,
             a.governanceLock = coalesce(a.governanceLock, 0) + 1,
             am.governanceLock = coalesce(am.governanceLock, 0) + 1,
             g.governanceLock = coalesce(g.governanceLock, 0) + 1
         WITH b, e, p, c, t, a, am, g
         WHERE (e.ownerProfileId = a.profileId OR am.role IN ['OWNER', 'ADMIN'])
             AND c.educationOsGrantRevision = $acceptedEvidence.contractRevision
             AND c.educationOsGrantHash = $acceptedEvidence.grantHash
             AND c.educationOsGrant = $acceptedEvidence.grantJson
             AND g.agreement = $acceptedEvidence.agreement
             AND t.educationOsGrantRevision = $acceptedEvidence.acceptedRevision
             AND t.educationOsGrantHash = $acceptedEvidence.acceptedGrantHash
             AND t.educationOsGrant = $acceptedEvidence.acceptedGrantJson
             AND t.educationOsAcceptedAt = $acceptedEvidence.acceptedAt
             AND t.educationOsAcceptedRole = $acceptedEvidence.acceptedRole
             AND t.educationOsAcceptedProfileId = $acceptedEvidence.profileId
             AND coalesce(t.mutationVersion, 0) = $acceptedEvidence.termsMutationVersion
             AND t.status = 'live'
             AND coalesce(t.expiresAt, '') = coalesce($acceptedEvidence.expiresAt, '')
             AND coalesce(c.expiresAt, '') = coalesce($acceptedEvidence.contractExpiresAt, '')
             AND (c.expiresAt IS NULL OR datetime(c.expiresAt) > datetime())
             AND (t.expiresAt IS NULL OR datetime(t.expiresAt) > datetime())
             AND NOT EXISTS { MATCH (other:Ecosystem)-[:GOVERNS_CONSENT_CONTRACT]->(c) WHERE other <> e }
         WITH DISTINCT b, e, p
    `
            : '';
    const result = await neogma.queryRunner.run(
        `MATCH (b:Binding {bindingId: $bindingId, ecosystemId: $ecosystemId})
         MATCH (e:Ecosystem {id: $ecosystemId}), (p:Profile {profileId: $actorProfileId})
         OPTIONAL MATCH (p)-[callerMembership:MEMBER_OF]->(e)
         SET b.consentPreflightLock = coalesce(b.consentPreflightLock, 0) + 1,
             e.governanceLock = coalesce(e.governanceLock, 0) + 1,
             p.governanceLock = coalesce(p.governanceLock, 0) + 1,
             callerMembership.governanceLock = coalesce(callerMembership.governanceLock, 0) + 1
         WITH b, e, p, callerMembership
         WHERE b.revision = $bindingRevision AND
             (e.ownerProfileId = p.profileId OR callerMembership.role IN ['OWNER', 'ADMIN'])
         WITH DISTINCT b, e, p
         CALL {
             WITH e
             UNWIND $dependencies AS dependency
             MATCH (i:InstallIntent {intentId: dependency.intentId})
             MATCH (target {id: dependency.targetId, intentId: dependency.intentId})
             SET i.consentPreflightLock = coalesce(i.consentPreflightLock, 0) + 1,
                 target.consentPreflightLock = coalesce(target.consentPreflightLock, 0) + 1
             WITH e, i, target, dependency
             WHERE i.ecosystemId = e.id AND target.ecosystemId = e.id
                 AND target.targetType = dependency.targetType
                 AND i.plan = dependency.planJson AND i.approval = dependency.approvalJson
             RETURN count(i) AS checkedPlans
         }
         WITH b, e, p, checkedPlans WHERE checkedPlans = size($dependencies)
         ${evidenceGuard}
         CREATE (s:BindingConsentPreflight {preflightId: $preflightId, bindingId: $bindingId,
             ecosystemId: $ecosystemId, hash: $hash, snapshot: $snapshot, evaluatedAt: $evaluatedAt})
         CREATE (b)-[:HAS_CONSENT_PREFLIGHT]->(s)
         CREATE (:InstallIntentAuditEvent {id: $auditId, action: 'CONSENT_PREFLIGHT_RESOLVED',
             ecosystemId: $ecosystemId, bindingId: $bindingId, actorProfileId: $actorProfileId,
             actorDid: $actorDid, timestamp: $evaluatedAt, afterSummary: $afterSummary})
         RETURN s.preflightId AS id`,
        {
            ...snapshot,
            dependencies: snapshot.satisfied ? dependencies : [],
            acceptedEvidence: acceptedEvidence ?? null,
            snapshot: JSON.stringify(snapshot),
            actorProfileId: input.actorProfileId,
            actorDid: input.actorDid ?? null,
            auditId: `install_intent_audit_${randomUUID()}`,
            afterSummary: JSON.stringify({
                preflightId: snapshot.preflightId,
                hash: snapshot.hash,
                satisfied: snapshot.satisfied,
            }),
        }
    );
    if (!result.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Binding revision or operator authority changed; prepare again.',
        });
    return snapshot;
};

export const readBindingConsentPreflight = async (
    preflightId: string
): Promise<BindingConsentPreflight | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (s:BindingConsentPreflight {preflightId: $preflightId}) RETURN s.snapshot AS snapshot',
        { preflightId }
    );
    const row = result.records[0];
    if (!row) return null;
    const snapshot = BindingConsentPreflightValidator.parse(JSON.parse(row.get('snapshot')));
    if (snapshot.hash !== hashBindingConsentPreflight(snapshot)) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Consent preflight integrity check failed.',
        });
    }
    return snapshot;
};
