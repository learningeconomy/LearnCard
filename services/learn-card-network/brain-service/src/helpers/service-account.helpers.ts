import { createHash } from 'node:crypto';
import {
    ServiceAccountGrantValidator,
    type ServiceAccountGrant,
    type InstallTargetSpec,
} from '@learncard/types';
import type { InstallIntentRecordType } from 'types/install-intent';
import { buildPlanFromMaterialization } from './install-intent.helpers';

export class ServiceAccountProvisioningError extends Error {}

// ADR-007 §3.4: purpose-specific verbs, not generic CRUD or wildcard matching.
const SAFE_VERBS = new Set([
    'profile:read',
    'group:sync',
    'group:read',
    'boost:read',
    'boost:issue',
    'registry:read',
    'consentflow:create',
    'completion:ingest',
]);

export const serviceAccountId = (intentId: string, targetId: string, generation: number): string =>
    `sa_${createHash('sha256')
        .update(JSON.stringify([intentId, targetId, generation]))
        .digest('hex')}`;

export const assertSafeServiceAccountGrant = (value: unknown): ServiceAccountGrant => {
    const parsed = ServiceAccountGrantValidator.safeParse(value);
    if (!parsed.success)
        throw new ServiceAccountProvisioningError(
            'Invalid or unresolved ServiceAccount grant selector.'
        );
    if (!SAFE_VERBS.has(`${parsed.data.resource}:${parsed.data.action}`)) {
        throw new ServiceAccountProvisioningError(
            `Unknown integration verb ${parsed.data.resource}:${parsed.data.action}.`
        );
    }
    return parsed.data;
};

/** Recompute the approval hash from the stored spec; never reread partner manifest scopes. */
export const approvedServiceAccountGrants = (
    intent: InstallIntentRecordType,
    target: InstallTargetSpec,
    installId: string
): ServiceAccountGrant[] => {
    if (!intent.spec || intent.approval.state !== 'APPROVED') {
        throw new ServiceAccountProvisioningError(
            'ServiceAccount requires an approved install plan.'
        );
    }
    const plan = buildPlanFromMaterialization({
        scopeSummary: intent.plan.authorityChanges.summary,
        planRevision: intent.plan.planRevision,
        targets: intent.spec.targets,
        bindings: intent.spec.bindings,
        infrastructureEffects: intent.plan.infrastructureEffects,
        dispositionPolicy: intent.plan.dispositionPolicy,
    });
    if (
        plan.planHash !== intent.plan.planHash ||
        plan.planHash !== intent.approval.artifact.planHash ||
        intent.plan.planRevision !== intent.approval.artifact.planRevision ||
        JSON.stringify(plan.scopesRequested) !== JSON.stringify(intent.plan.scopesRequested)
    ) {
        throw new ServiceAccountProvisioningError(
            'ServiceAccount authority does not match the approved plan hash.'
        );
    }
    const accountId = serviceAccountId(intent.intentId, installId, intent.specRevision);
    return [...new Set(target.scopes)].sort().map(scope => {
        const match = /^([^:]+):([^:]+):(tree|id):(.+)$/.exec(scope);
        if (!match || !intent.plan.scopesRequested.includes(scope)) {
            throw new ServiceAccountProvisioningError(
                `Invalid approved integration scope: ${scope}.`
            );
        }
        let resource: string;
        let action: string;
        try {
            resource = decodeURIComponent(match[1]!);
            action = decodeURIComponent(match[2]!);
        } catch {
            throw new ServiceAccountProvisioningError(`Invalid scope encoding: ${scope}.`);
        }
        const selectorValue = match[4] === '$installEcosystemId' ? intent.ecosystemId : match[4];
        const id = `sag_${createHash('sha256')
            .update(JSON.stringify([accountId, scope]))
            .digest('hex')}`;
        return assertSafeServiceAccountGrant({
            id,
            serviceAccountId: accountId,
            installId,
            resource,
            action,
            selectorKind: match[3],
            selectorValue,
        });
    });
};
