import { QueryBuilder, BindParam } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import { ConsentFlowContract, ConsentFlowInstance, Profile } from '@models';
import { DbContractType } from 'types/consentflowcontract';
import { inflateObject } from '@helpers/objects.helpers';
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

export const getRequestedForList = async (id: string) => {
    const result = await new QueryBuilder()
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
            where: { id },
        })
        .match('(c)-[r:REQUESTED_FOR]->(p:Profile)')
        .return(['p', 'r'])
        .run();

    return result.records.map(rec => {
        const { p, r } = rec.toObject();

        return {
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
        .where("writer.profileId <> $targetProfileId AND r.status IN ['pending', 'accepted']")
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
            profile: p.properties,
            status: r.properties?.status ?? null,
            readStatus: r.properties?.readStatus ?? null,
        };
    });
};

export const getRequestedForForUser = async (contractId: string, requesterProfileId: string) => {
    const result = await new QueryBuilder(new BindParam({ requesterProfileId }))
        .match({
            model: ConsentFlowContract,
            identifier: 'c',
            where: { id: contractId },
        })
        .match('(c)-[r:REQUESTED_FOR]->(p:Profile)')
        .where('p.profileId = $requesterProfileId')
        .return(['p', 'r'])
        .run();

    return result.records.map(rec => {
        const { p, r } = rec.toObject();

        return {
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
            profile: p.properties,
            status: r.properties?.status ?? null,
            readStatus: r.properties?.readStatus ?? null,
        };
    });
};
