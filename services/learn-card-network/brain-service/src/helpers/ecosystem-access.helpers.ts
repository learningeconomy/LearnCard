import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { neogma } from '@instance';
import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';
import { listBindingsByEcosystem } from '@accesslayer/binding/read';
import { SERVICE_ACCOUNT_AGGREGATE_VALID } from '@accesslayer/service-account/invariants';
import {
    verifyServiceAccountToken,
    type ServiceAccountPrincipal,
} from './service-account-auth.helpers';

export const IntegrationGroupMetadata = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    parent: z.string().nullable(),
});

/** Closed Phase C classification: metadata only, NOT roster/directory subject data.
 * No capability-scoped operation is currently exposed. Adding one requires a
 * server-owned classification and an ACTIVE Binding; callers cannot classify ops.
 */
export const serviceOperationClassification = (
    resource: string,
    action: string
): 'NON_SUBJECT' | 'DENY' => (resource === 'group' && action === 'read' ? 'NON_SUBJECT' : 'DENY');

export const requireServiceAccountAccess = async (input: {
    principal?: ServiceAccountPrincipal;
    resource: string;
    action: string;
    target: string;
    /** Server-selected capability, never taken from HTTP input. */
    capability?: string;
}): Promise<z.infer<typeof IntegrationGroupMetadata>> => {
    let ecosystemId = 'unknown';
    let accountId: string | undefined;
    let allowed = false;
    try {
        if (!input.principal) throw new TRPCError({ code: 'UNAUTHORIZED' });
        // Reverify the token, rather than trusting even an in-process claims object.
        const claims = await verifyServiceAccountToken(input.principal.token);
        ecosystemId = claims.ecosystemId;
        accountId = claims.sub;
        if (serviceOperationClassification(input.resource, input.action) !== 'NON_SUBJECT')
            throw new TRPCError({ code: 'FORBIDDEN' });
        const result = await neogma.queryRunner.run(
            `MATCH (sa:ServiceAccount {id: $id, installId: $installId, ecosystemId: $ecosystemId})
             WHERE sa.status = 'ENABLED' AND sa.credentialGeneration = $gen
               AND (${SERVICE_ACCOUNT_AGGREGATE_VALID})
             MATCH (sa)-[:ACTS_FOR]->(installOwner:Ecosystem {id: $ecosystemId})
             MATCH (install:IntegrationInstall {id: $installId})-[:HAS_SERVICE_ACCOUNT]->(sa)
             MATCH (sa)-[:HAS_GRANT]->(grant:ServiceAccountGrant)
             WHERE grant.serviceAccountId = sa.id AND grant.installId = sa.installId
               AND grant.resource = $resource AND grant.action = $action
             MATCH (target:Group {id: $target})
             MATCH (owner:Ecosystem {id: target.ownerEcosystemId})
             WHERE $ecosystemId IN owner.pathIds
               AND ((grant.selectorKind = 'tree' AND grant.selectorValue IN owner.pathIds)
                 OR (grant.selectorKind = 'id' AND grant.selectorValue = target.id))
             RETURN DISTINCT target.id AS id, target.name AS name, target.type AS type,
                 target.parentGroupId AS parent`,
            {
                id: claims.sub,
                installId: claims.installId,
                ecosystemId: claims.ecosystemId,
                gen: claims.gen,
                resource: input.resource,
                action: input.action,
                target: input.target,
            }
        );
        if (result.records.length !== 1) throw new TRPCError({ code: 'FORBIDDEN' });
        if (input.capability) {
            const bindings = await listBindingsByEcosystem(claims.ecosystemId);
            if (
                !bindings.some(
                    binding =>
                        binding.status === 'ACTIVE' &&
                        binding.capability === input.capability &&
                        (binding.provider.resourceId === claims.installId ||
                            binding.consumer.resourceId === claims.installId)
                )
            )
                throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const row = result.records[0]!;
        const metadata = IntegrationGroupMetadata.parse({
            id: row.get('id'),
            name: row.get('name'),
            type: row.get('type'),
            parent: row.get('parent'),
        });
        allowed = true;
        return metadata;
    } finally {
        // Audit is awaited: audit failure prevents a release. No token, verifier,
        // secret, profile, member list or caller-supplied ecosystem is recorded.
        await createInstallIntentAuditEvent({
            action: allowed ? 'SERVICE_ACCOUNT_ACCESS_ALLOW' : 'SERVICE_ACCOUNT_ACCESS_DENY',
            ecosystemId,
            afterSummary: {
                serviceAccountId: accountId,
                resource: input.resource,
                action: input.action,
                target: input.target,
            },
        });
    }
};
