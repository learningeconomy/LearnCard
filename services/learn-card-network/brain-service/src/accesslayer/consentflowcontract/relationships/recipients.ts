import { BindParam, QueryBuilder } from 'neogma';
import { TRPCError } from '@trpc/server';
import { ConsentFlowContract, Profile } from '@models';
import { ProfileType } from 'types/profile';

/** Lock the contract before checking its audience, in the same database statement. */
export const lockContractAudience = (query: QueryBuilder, contractId: string): QueryBuilder =>
    query
        .match({ model: ConsentFlowContract, identifier: 'contract', where: { id: contractId } })
        .set('contract.audienceLock = coalesce(contract.audienceLock, 0) + 1')
        .with('contract');

/** Retry only rolled-back transient transactions, before any notifications or issuance. */
export const runAudienceMutation = async (query: QueryBuilder): ReturnType<QueryBuilder['run']> => {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await query.run();
        } catch (error) {
            if (
                attempt >= 8 ||
                !error ||
                typeof error !== 'object' ||
                !('code' in error) ||
                error.code !== 'Neo.TransientError.Transaction.DeadlockDetected'
            )
                throw error;
            await new Promise(resolve =>
                setTimeout(resolve, Math.min(1000, 25 * 2 ** attempt) + Math.random() * 25)
            );
        }
    }
};

export const audienceVersionWhere = `
(($audienceVersion IS NULL AND coalesce(contract.audienceVersion, 0) = 0)
 OR coalesce(contract.audienceVersion, 0) = $audienceVersion)
`;

/** Checked under the contract lock; a referral accepts only the invitation the learner reviewed. */
export const consentMutationWhere = `
(CASE WHEN contract.expiresAt IS NULL OR trim(contract.expiresAt) = '' THEN true
 ELSE datetime(contract.expiresAt) > datetime.realtime() END)
AND ($expectedRequestId IS NULL OR EXISTS {
    MATCH (contract)-[request:REQUESTED_FOR]->(:Profile {profileId: $consenterProfileId})
    WHERE request.requestId = $expectedRequestId AND request.status = 'pending'
})
`;

export const assertAudienceMutation = (count: number): void => {
    if (!count)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'The sharing audience or consent changed. Review the contract and try again.',
        });
};

export const getRecipientsForContract = async (contractId: string): Promise<ProfileType[]> => {
    const result = await new QueryBuilder()
        .match({
            related: [
                { model: ConsentFlowContract, where: { id: contractId } },
                ConsentFlowContract.getRelationshipByAlias('sharesDataWith'),
                { model: Profile, identifier: 'recipient' },
            ],
        })
        .return('DISTINCT recipient')
        .run();
    return result.records.map(record => record.get('recipient').properties);
};

export const canReadContractData = async (
    contractId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ contractId, profileId }))
        .match(
            '(contract:ConsentFlowContract {id: $contractId})-[:CREATED_BY|SHARES_DATA_WITH]->(profile:Profile {profileId: $profileId})'
        )
        .return('count(profile) AS count')
        .run();
    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

/** Additions freeze after first consent; removals never restore that permission. */
export const addRecipientToContract = async (
    contractId: string,
    profileId: string
): Promise<boolean> => {
    const query = lockContractAudience(new QueryBuilder(new BindParam({ profileId })), contractId)
        .match('(recipient:Profile {profileId: $profileId})')
        .where(
            `NOT EXISTS { MATCH (contract)-[:CREATED_BY]->(recipient) }
            AND (EXISTS { MATCH (contract)-[:SHARES_DATA_WITH]->(recipient) }
                OR (coalesce(contract.hasConsented, false) = false
                    AND NOT EXISTS { MATCH (:ConsentFlowTerms)-[:CONSENTS_TO]->(contract) }
                    AND size([(contract)-[:SHARES_DATA_WITH]->(existing:Profile) | existing]) < 50))`
        )
        .merge('(contract)-[audience:SHARES_DATA_WITH]->(recipient)')
        .raw(
            'ON CREATE SET contract.audienceVersion = coalesce(contract.audienceVersion, 0) + 1, audience.addedAt = $addedAt'
        );
    query.getBindParam().add({ addedAt: new Date().toISOString() });
    const result = await runAudienceMutation(query.return('count(audience) AS count'));
    if (!Number(result.records[0]?.get('count') ?? 0))
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Recipients can only be added before first consent, and the owner is already in the audience.',
        });
    return true;
};

export const removeRecipientFromContract = async (
    contractId: string,
    profileId: string
): Promise<boolean> => {
    const result = await runAudienceMutation(
        lockContractAudience(new QueryBuilder(new BindParam({ profileId })), contractId)
            .match('(contract)-[audience:SHARES_DATA_WITH]->(:Profile {profileId: $profileId})')
            .delete('audience')
            .set('contract.audienceVersion = coalesce(contract.audienceVersion, 0) + 1')
            .return('count(contract) AS count')
    );
    return Number(result.records[0]?.get('count') ?? 0) > 0;
};
