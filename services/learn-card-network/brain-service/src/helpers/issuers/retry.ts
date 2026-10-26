import {
    BindingEndpointValidator,
    RecordProvisioningBindingMetadataValidator,
} from '@learncard/types';
import { neogma } from '@instance';
import { resolveIssuerAdapter } from './registry';
import type { IssuanceOutcome } from './types';

/**
 * Operator/sweeper entry point for PENDING or ISSUE_FAILED records. Uses the Binding's current
 * declaration and its consumer's issuer, which re-runs every issuer check; adapters reconcile
 * an already-delivered record instead of issuing it twice.
 */
export const retryRecordIssuance = async (
    recordId: string,
    domain: string
): Promise<IssuanceOutcome | null> => {
    const found = await neogma.queryRunner.run(
        `MATCH (r:ProvisionedRecord {id: $recordId})
         WHERE r.issuanceStatus IN ['PENDING', 'ISSUE_FAILED']
         MATCH (b:Binding {bindingId: r.bindingId}) WHERE b.status = 'ACTIVE'
         RETURN r.bindingId AS bindingId, r.ecosystemId AS ecosystemId,
                r.subjectProfileId AS subjectProfileId, r.fields AS fields,
                b.capabilityMetadata AS metadata, b.consumer AS consumer`,
        { recordId }
    );
    const row = found.records[0];
    if (!row) return null;

    const metadata = RecordProvisioningBindingMetadataValidator.safeParse(
        JSON.parse(String(row.get('metadata') ?? 'null'))
    );
    const consumer = BindingEndpointValidator.safeParse(
        JSON.parse(String(row.get('consumer') ?? 'null'))
    );
    const fields: unknown = JSON.parse(String(row.get('fields')));
    const issuer = consumer.success ? resolveIssuerAdapter(consumer.data) : null;
    if (
        !metadata.success ||
        !issuer ||
        !issuer.canIssue(metadata.data) ||
        !fields ||
        typeof fields !== 'object'
    ) {
        return null;
    }

    return issuer.issue(
        {
            recordId,
            bindingId: String(row.get('bindingId')),
            ecosystemId: String(row.get('ecosystemId')),
            subjectProfileId: String(row.get('subjectProfileId')),
            fields: Object.fromEntries(
                Object.entries(fields).filter(
                    (entry): entry is [string, string] => typeof entry[1] === 'string'
                )
            ),
            domain,
        },
        metadata.data
    );
};
