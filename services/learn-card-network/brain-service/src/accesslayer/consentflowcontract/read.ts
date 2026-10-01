import { neogma } from '@instance';
import { QueryBuilder, BindParam } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import { ConsentFlowContract, ConsentFlowInstance, Profile } from '@models';
import { DbContractType } from 'types/consentflowcontract';
import { inflateObject } from '@helpers/objects.helpers';
import type { ContractRequestFields } from '@learncard/types';
import { ProfileType } from 'types/profile';

export const getContractById = async (id: string): Promise<DbContractType | null> => {
    return inflateObject<DbContractType>(
        (
            await new QueryBuilder()
                .match({ model: ConsentFlowContract, where: { id }, identifier: 'contract' })
                .return('contract')
                .limit(1)
                .run()
        ).records[0]?.toObject().contract.properties
    );
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

export const getRequestedForList = async (id: string, viewerProfileId: string) => {
    const query = new QueryBuilder(new BindParam({ viewerProfileId }))
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
            where: { id },
        })
        .match('(c)-[r:REQUESTED_FOR]->(p:Profile)')
        .where(`${requestManagerWhere} OR (${requestingRecipientWhere})`);
    const result = await query.return(['p', 'r']).run();

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
    viewerProfileId: string
) => {
    const query = new QueryBuilder(new BindParam({ requesterProfileId, viewerProfileId }))
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
            where: { id: contractId },
        })
        .match('(c)-[r:REQUESTED_FOR]->(p:Profile)')
        .where(
            `p.profileId = $requesterProfileId AND
             (p.profileId = $viewerProfileId OR ${requestManagerWhere} OR (${requestingRecipientWhere}))`
        );
    const result = await query.return(['p', 'r']).run();

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

export const getAllRequestsForTargetProfile = async (targetProfileId: string) => {
    const result = await new QueryBuilder(new BindParam({ targetProfileId }))
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
        })
        .match('(c)-[r:REQUESTED_FOR]->(p:Profile)')
        .where('p.profileId = $targetProfileId')
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

export type StoredContractRequest = ContractRequestFields & {
    status?: 'pending' | 'accepted' | 'denied' | 'cancelled' | null;
    readStatus?: 'unseen' | 'seen' | null;
};

export const getStoredContractRequest = async (
    contractId: string,
    targetProfileId: string
): Promise<StoredContractRequest | null> => {
    const result = await neogma.queryRunner.run(
        `
        MATCH (:ConsentFlowContract {id: $contractId})-[request:REQUESTED_FOR]->(:Profile {profileId: $targetProfileId})
        RETURN request
    `,
        { contractId, targetProfileId }
    );
    return result.records[0]?.get('request').properties ?? null;
};
