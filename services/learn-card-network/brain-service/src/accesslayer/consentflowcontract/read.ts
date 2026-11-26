import { neogma } from '@instance';
import { inviteViewerWhere } from '@accesslayer/contract-request-invite/read';
import { QueryBuilder, BindParam } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import { ConsentFlowContract, ConsentFlowInstance, Profile } from '@models';
import { DbContractType, DbContractValidator } from 'types/consentflowcontract';
import { inflateObject } from '@helpers/objects.helpers';
import type { ContractRequestFields } from '@learncard/types';
import { ProfileType } from 'types/profile';

export const getContractById = async (id: string): Promise<DbContractType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id:$id})
         OPTIONAL MATCH (contract)-[:HAS_VERSION]->(version:ConsentFlowContractVersion)
         WITH contract, version ORDER BY version.version DESC
         WITH contract, collect(version)[0] AS latest
         RETURN properties(contract) AS contract, properties(latest) AS latest`,
        { id }
    );
    const record = result.records[0];
    if (!record) return null;
    const contract = DbContractValidator.parse(inflateObject(record.get('contract')));
    const latest = record.get('latest') as Record<string, unknown> | null;
    contract.currentVersion = Number(contract.currentVersion ?? latest?.version ?? 1);
    contract.version = Number(latest?.version ?? contract.currentVersion);
    return contract;
};

export const getContractByUri = async (uri: string): Promise<DbContractType | null> => {
    return getContractById(getIdFromUri(uri));
};

export const getConsentFlowContractById = async (
    id: string
): Promise<ConsentFlowInstance | null> => {
    const result = await new QueryBuilder()
        .match({ model: ConsentFlowContract, where: { id }, identifier: 'contract' })
        .return('contract')
        .limit(1)
        .run();

    const record = result.records[0];
    if (!record) return null;

    return record.toObject().contract;
};

const requestFields = (properties: ContractRequestFields): ContractRequestFields => ({
    ...(properties.requestId ? { requestId: properties.requestId } : {}),
    ...(properties.requestedBy ? { requestedBy: properties.requestedBy } : {}),
    ...(properties.externalReferenceId
        ? { externalReferenceId: properties.externalReferenceId }
        : {}),
    ...(properties.requestedAt ? { requestedAt: properties.requestedAt } : {}),
    ...(properties.message ? { message: properties.message } : {}),
});

/**
 * The status a request shows. An email-addressed request whose invite expiry has passed reads as
 * expired until it is accepted, before the daily job marks it, so the answer does not depend on
 * whether the invite reached an account.
 */
export const effectiveRequestStatus = <S extends string | null | undefined>(
    status: S,
    request: { addressedByEmail?: boolean; expiresAt?: string | null }
): S | 'expired' =>
    request.addressedByEmail === true &&
    status === 'pending' &&
    typeof request.expiresAt === 'string' &&
    request.expiresAt <= new Date().toISOString()
        ? 'expired'
        : status;

/** Referral management is distinct from permission to receive consented data. */
export const getContractRequestAccess = async (
    contractId: string,
    profileId: string
): Promise<{ isOwner: boolean; isManager: boolean; isRecipient: boolean }> => {
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id:$contractId})
         RETURN EXISTS {
             MATCH (contract)-[:CREATED_BY]->(:Profile {profileId:$profileId})
         } AS isOwner, EXISTS {
             MATCH (contract)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId:$profileId})
         } AS isManager, EXISTS {
             MATCH (contract)-[:CREATED_BY|SHARES_DATA_WITH]->(:Profile {profileId:$profileId})
         } AS isRecipient`,
        { contractId, profileId }
    );
    const access = result.records[0];
    return {
        isOwner: access?.get('isOwner') === true,
        isManager: access?.get('isManager') === true,
        isRecipient: access?.get('isRecipient') === true,
    };
};

const requestManagerWhere = `EXISTS {
    MATCH (c)-[:CREATED_BY|CAN_WRITE]->(:Profile {profileId:$viewerProfileId})
}`;
const requestingRecipientWhere = `r.requestedBy = $viewerProfileId AND EXISTS {
    MATCH (c)-[:SHARES_DATA_WITH]->(:Profile {profileId:$viewerProfileId})
}`;

// The unattached-invite projection follows contractRequestFromInvite, with the same pending expiry.
export const getRequestedForList = async (id: string, viewerProfileId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $id})
         CALL {
             WITH c
             MATCH (c)-[r:REQUESTED_FOR|PREVIOUS_VISIBLE_REQUEST|PENDING_EMAIL_REQUEST|CANCELLED_DIRECT_REQUEST]->(p:Profile)
             WHERE NOT coalesce(r.requestHistoryOnly, false)
                 AND (${requestManagerWhere} OR (${requestingRecipientWhere}))
             OPTIONAL MATCH (c)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
                 WHERE invite.id = r.requestId
             RETURN properties(r) AS request, properties(p) AS profile,
                 invite.email AS email, invite.expiresAt AS expiresAt
             UNION ALL
             WITH c
             MATCH (c)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
             WHERE invite.attachedProfileId IS NULL AND ${inviteViewerWhere}
             RETURN invite{.requestedBy, .externalReferenceId, .message, .requestedAt,
                 requestId: invite.id, addressedByEmail: true,
                 status: CASE WHEN invite.status IN ['denied', 'cancelled', 'expired']
                     THEN invite.status ELSE 'pending' END} AS request,
                 null AS profile, invite.email AS email, invite.expiresAt AS expiresAt
         }
         RETURN request, profile, email, expiresAt`,
        { id, viewerProfileId }
    );

    return result.records.map(rec => {
        const request = rec.get('request');
        const email: string | null = rec.get('email');
        const expiresAt: string | null = request?.expiresAt ?? rec.get('expiresAt');

        return {
            ...requestFields(request),
            profile: (rec.get('profile') as ProfileType | null) ?? undefined,
            status: effectiveRequestStatus(
                (request?.status ?? null) as NonNullable<StoredContractRequest['status']> | null,
                { addressedByEmail: request?.addressedByEmail === true, expiresAt }
            ),
            readStatus: (request?.readStatus ?? null) as NonNullable<
                StoredContractRequest['readStatus']
            > | null,
            addressedByEmail: request?.addressedByEmail === true,
            ...(email ? { email } : {}),
            ...(expiresAt ? { expiresAt } : {}),
        };
    });
};

export const getSharedInsightsRequestsForTargetProfile = async (
    targetProfileId: string
): Promise<
    {
        profile: ProfileType;
        status: 'pending' | 'accepted';
        readStatus: 'unseen' | 'seen' | null;
        contractId: string;
    }[]
> => {
    const incomingRequestsResult = await new QueryBuilder(new BindParam({ targetProfileId }))
        .match({ model: ConsentFlowContract, identifier: 'c' })
        .match('(c)-[r:REQUESTED_FOR]->(target:Profile)')
        .where('target.profileId = $targetProfileId')
        .match({
            related: [
                { identifier: 'c', model: ConsentFlowContract },
                `-[:${ConsentFlowContract.getRelationshipByAlias('createdBy').name}|:${
                    ConsentFlowContract.getRelationshipByAlias('canWrite').name
                }]-`,
                { identifier: 'writer', model: Profile },
            ],
        })
        .where(
            "writer.profileId <> $targetProfileId AND r.requestId IS NULL AND r.status IN ['pending', 'accepted']"
        )
        .return(['writer', 'r', 'c'])
        .run();

    const mappedResults = incomingRequestsResult.records.map(rec => {
        const { writer, r, c } = rec.toObject();

        return {
            profile: inflateObject<ProfileType>(writer.properties),
            status: r.properties?.status as 'pending' | 'accepted',
            readStatus: (r.properties?.readStatus ?? null) as 'unseen' | 'seen' | null,
            contractId: c.properties.id as string,
        };
    });

    const dedupedByProfileId = new Map<string, (typeof mappedResults)[number]>();

    mappedResults.forEach(request => {
        const existing = dedupedByProfileId.get(request.profile.profileId);

        if (!existing || existing.status !== 'accepted') {
            dedupedByProfileId.set(request.profile.profileId, request);
        }
    });

    return Array.from(dedupedByProfileId.values());
};

export const getRequestedForByStatus = async (
    id: string,
    status: 'pending' | 'accepted' | 'denied'
) => {
    const result = await new QueryBuilder()
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
            where: { id },
        })
        .match('(c)-[r:REQUESTED_FOR]->(p:Profile)')
        .where(`r.status = '${status}'`)
        .return(['p', 'r'])
        .run();

    return result.records.map(rec => {
        const { p, r } = rec.toObject();

        return {
            ...requestFields(r.properties),
            profile: p.properties,
            status: r.properties?.status ?? null,
            readStatus: r.properties?.readStatus ?? null,
        };
    });
};

export const getRequestedForForUser = async (
    contractId: string,
    requesterProfileId: string,
    viewerProfileId: string,
    requestId?: string
) => {
    const query = new QueryBuilder(
        new BindParam({ requesterProfileId, viewerProfileId, requestId: requestId ?? null })
    )
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
            where: { id: contractId },
        })
        .match('(c)-[current:REQUESTED_FOR]->(p:Profile {profileId: $requesterProfileId})')
        .raw(
            `OPTIONAL MATCH (c)-[previous:PREVIOUS_VISIBLE_REQUEST]->(p)
              OPTIONAL MATCH (c)-[parked:PENDING_EMAIL_REQUEST|CANCELLED_DIRECT_REQUEST]->(p)
                  WHERE p.profileId = $viewerProfileId AND parked.requestId = $requestId
              WITH c, p, CASE
                  WHEN p.profileId <> $viewerProfileId AND current.addressedByEmail = true
                      AND current.status <> 'accepted' THEN previous
                  WHEN p.profileId = $viewerProfileId AND previous.requestId = $requestId THEN previous
                  ELSE coalesce(parked, current) END AS r`
        )
        .where(
            `r IS NOT NULL AND NOT coalesce(r.requestHistoryOnly, false) AND
             ($requestId IS NULL OR r.requestId = $requestId) AND
             (p.profileId = $viewerProfileId OR ${requestManagerWhere} OR (${requestingRecipientWhere}))`
        );
    const result = await query.return(['p', 'r']).run();

    return result.records.map(rec => {
        const { p, r } = rec.toObject();

        return {
            ...requestFields(r.properties),
            profile: p.properties,
            status: effectiveRequestStatus(r.properties?.status ?? null, r.properties ?? {}),
            readStatus: r.properties?.readStatus ?? null,
            addressedByEmail: r.properties?.addressedByEmail === true,
        };
    });
};

export const getAllRequestsForTargetProfile = async (targetProfileId: string) => {
    const result = await new QueryBuilder(
        new BindParam({ targetProfileId, now: new Date().toISOString() })
    )
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
        })
        .match('(c)-[r:REQUESTED_FOR|PENDING_EMAIL_REQUEST]->(p:Profile)')
        .where(
            `p.profileId = $targetProfileId AND NOT coalesce(r.requestHistoryOnly, false)
             AND coalesce(r.status, '') <> 'expired' AND
             NOT (r.status = 'pending' AND r.expiresAt IS NOT NULL AND r.expiresAt <= $now)`
        )
        .return(['c', 'p', 'r'])
        .run();

    return result.records.map(rec => {
        const { c, p, r } = rec.toObject();

        return {
            contract: c.properties,
            ...requestFields(r.properties),
            profile: p.properties,
            status: r.properties?.status ?? null,
            readStatus: r.properties?.readStatus ?? null,
        };
    });
};

export type StoredContractRequestById = {
    requestId: string;
    status: 'pending' | 'accepted' | 'denied' | 'cancelled' | 'expired';
    externalReferenceId?: string;
    requestedAt?: string;
    expiresAt?: string;
    addressedByEmail: boolean;
    email?: string;
    profile: ProfileType;
};

/** Reads one attributed request by its ID. Visible to contract managers and to its sender. */
export const getContractRequestById = async (
    contractId: string,
    requestId: string,
    viewerProfileId: string
): Promise<StoredContractRequestById | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})-[r:REQUESTED_FOR|PREVIOUS_VISIBLE_REQUEST|PENDING_EMAIL_REQUEST|CANCELLED_DIRECT_REQUEST]->(p:Profile)
         WHERE r.requestId = $requestId AND (${requestManagerWhere} OR (${requestingRecipientWhere}))
         OPTIONAL MATCH (c)-[:HAS_REQUEST_INVITE]->(invite:ContractRequestInvite)
             WHERE invite.id = r.requestId
         RETURN r, p, invite.email AS email, invite.expiresAt AS expiresAt`,
        { contractId, requestId, viewerProfileId }
    );
    const record = result.records[0];
    if (!record) return null;
    const request = record.get('r').properties;
    const expiresAt: string | null = request.expiresAt ?? record.get('expiresAt');
    return {
        requestId: request.requestId,
        status: effectiveRequestStatus(request.status, {
            addressedByEmail: request.addressedByEmail === true,
            expiresAt,
        }),
        ...(request.externalReferenceId
            ? { externalReferenceId: request.externalReferenceId }
            : {}),
        ...(request.requestedAt ? { requestedAt: request.requestedAt } : {}),
        ...(expiresAt ? { expiresAt } : {}),
        addressedByEmail: request.addressedByEmail === true,
        ...(record.get('email') ? { email: record.get('email') } : {}),
        profile: record.get('p').properties,
    };
};

export type StoredContractRequest = ContractRequestFields & {
    status?: 'pending' | 'accepted' | 'denied' | 'cancelled' | 'expired' | null;
    readStatus?: 'unseen' | 'seen' | null;
    addressedByEmail?: boolean;
    /** Copied from the invite when an email-addressed request attaches. */
    expiresAt?: string;
};

/** Read the active request by default, or the visible request for a public operation. */
export const getStoredContractRequest = async (
    contractId: string,
    targetProfileId: string,
    options?: { viewerProfileId?: string; requestId?: string }
): Promise<StoredContractRequest | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id: $contractId})-[current:REQUESTED_FOR]->(target:Profile {profileId: $targetProfileId})
         OPTIONAL MATCH (contract)-[previous:PREVIOUS_VISIBLE_REQUEST]->(target)
         OPTIONAL MATCH (contract)-[parked:PENDING_EMAIL_REQUEST|CANCELLED_DIRECT_REQUEST]->(target)
             WHERE parked.requestId = $requestId
         WITH CASE
             WHEN parked IS NOT NULL AND ($viewerProfileId IS NULL OR $viewerProfileId = $targetProfileId) THEN parked
             WHEN $requestId IS NOT NULL AND previous.requestId = $requestId THEN previous
             WHEN $viewerProfileId IS NOT NULL AND $viewerProfileId <> $targetProfileId
                  AND current.addressedByEmail = true AND current.status <> 'accepted' THEN previous
             ELSE current END AS request
         WHERE request IS NOT NULL AND NOT coalesce(request.requestHistoryOnly, false)
         RETURN request`,
        {
            contractId,
            targetProfileId,
            requestId: options?.requestId ?? null,
            viewerProfileId: options?.viewerProfileId ?? null,
        }
    );
    return result.records[0]?.get('request')?.properties ?? null;
};
