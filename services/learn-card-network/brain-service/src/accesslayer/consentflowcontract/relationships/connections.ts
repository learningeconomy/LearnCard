import { int } from 'neo4j-driver';
import {
    ContractConnectionStatusValidator,
    type ContractConnection,
    type PaginatedContractConnections,
} from '@learncard/types';

import { neogma } from '@instance';
import { constructUri } from '@helpers/uri.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import {
    decodeContractConnectionsCursor,
    encodeContractConnectionsCursor,
} from '@helpers/contract-connections-cursor.helpers';
import { ACCEPTED_VERSION_PREDICATE, isConsentUnexpired } from '@helpers/consent-expiry.helpers';

const optionalString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

/**
 * Current connections of a contract: one row per consenter whose terms are `live`,
 * `needs_reconsent` or `suspended` and not expired. Expiry follows the same rule as the
 * consented-data reads (data-for-did): the terms' own `expiresAt` and the `expiresAt` of the
 * contract version the consenter accepted, not the contract node's. A retired contract has
 * none. Rows are ordered by terms id, so pages stay stable while states change. Identifiers
 * only; no shared credentials or personal fields.
 *
 * `externalReferenceId` is returned only to a contract manager (owner or writer) or to the
 * profile recorded as the requester on that referral, the same rule as integration events.
 * The caller's right to read the contract's data is checked by the route.
 */
export const getContractConnections = async (
    contractId: string,
    callerProfileId: string,
    { limit, cursor, domain }: { limit: number; cursor?: string; domain: string }
): Promise<PaginatedContractConnections> => {
    const now = Date.now();
    const access = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id: $contractId})
         RETURN coalesce(contract.status, 'active') AS status,
             EXISTS {
                 MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId: $callerProfileId})
             } AS isManager`,
        { contractId, callerProfileId }
    );
    const contract = access.records[0];

    if (!contract || contract.get('status') === 'retired') {
        return { records: [], hasMore: false };
    }

    const isManager = contract.get('isManager') === true;
    const records: ContractConnection[] = [];
    const termsIds: string[] = [];
    // One extra row tells whether another page exists.
    const wanted = limit + 1;
    let after = cursor ? decodeContractConnectionsCursor(cursor) : '';

    // Expiry is checked after reading, in bounded batches, so a stored date that cannot be
    // parsed never fails the query and expired terms cannot shorten a page.
    while (records.length < wanted) {
        const result = await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract {id: $contractId})<-[:CONSENTS_TO]-(terms:ConsentFlowTerms)<-[:CREATED_BY]-(consenter:Profile)
             WHERE terms.status IN ['live', 'needs_reconsent', 'suspended'] AND terms.id > $after
             WITH contract, terms, consenter ORDER BY terms.id LIMIT $limit
             OPTIONAL MATCH (contract)-[:HAS_VERSION]->(accepted:ConsentFlowContractVersion)
             WHERE ${ACCEPTED_VERSION_PREDICATE}
             WITH terms, consenter, head(collect(accepted)) AS accepted
             OPTIONAL MATCH (transaction:ConsentFlowTransaction)-[:IS_FOR]->(terms)
             WITH terms, consenter, accepted, max(transaction.date) AS lastTransactionAt
             RETURN terms.id AS termsId, terms.status AS status, terms.expiresAt AS expiresAt,
                 accepted IS NOT NULL AS hasAcceptedVersion,
                 accepted.expiresAt AS acceptedVersionExpiresAt,
                 coalesce(terms.updatedAt, lastTransactionAt, terms.createdAt, '') AS updatedAt,
                 terms.\`referral.requestId\` AS requestId,
                 terms.\`referral.requestedBy\` AS requestedBy,
                 terms.\`referral.externalReferenceId\` AS externalReferenceId,
                 consenter.profileId AS profileId, consenter.did AS didKey
             ORDER BY termsId`,
            { contractId, after, limit: int(wanted) }
        );

        for (const row of result.records) {
            const termsId: string = row.get('termsId');
            const status = ContractConnectionStatusValidator.safeParse(row.get('status'));
            const profileId = optionalString(row.get('profileId'));
            const didKey = optionalString(row.get('didKey'));

            after = termsId;

            if (!status.success || !profileId || !didKey) continue;
            if (
                !isConsentUnexpired(
                    {
                        termsExpiresAt: row.get('expiresAt'),
                        hasAcceptedVersion: row.get('hasAcceptedVersion') === true,
                        acceptedVersionExpiresAt: row.get('acceptedVersionExpiresAt'),
                    },
                    now
                )
            ) {
                continue;
            }

            const requestId = optionalString(row.get('requestId'));
            const externalReferenceId = optionalString(row.get('externalReferenceId'));
            const seesReference = isManager || row.get('requestedBy') === callerProfileId;

            termsIds.push(termsId);
            records.push({
                profileId,
                did: getDidWeb(domain, profileId),
                didKey,
                termsUri: constructUri('terms', termsId, domain),
                status: status.data,
                ...(requestId ? { requestId } : {}),
                ...(seesReference && externalReferenceId ? { externalReferenceId } : {}),
                updatedAt: String(row.get('updatedAt') ?? ''),
            });

            if (records.length === wanted) break;
        }

        if (result.records.length < wanted) break;
    }

    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    const lastTermsId = termsIds[page.length - 1];

    return {
        records: page,
        hasMore,
        ...(hasMore && lastTermsId ? { cursor: encodeContractConnectionsCursor(lastTermsId) } : {}),
    };
};
