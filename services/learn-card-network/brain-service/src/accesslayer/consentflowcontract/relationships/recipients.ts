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
export const runAudienceMutation = async (
    query: Pick<QueryBuilder, 'run'>
): ReturnType<QueryBuilder['run']> => {
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

/**
 * Who may read the connections snapshot: the owner, a writer or a data recipient. These are the
 * profiles whose integrations receive the consent events the snapshot recovers from. Kept
 * separate from `canReadContractData`, which must not admit writers.
 */
export const canReadContractConnections = async (
    contractId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ contractId, profileId }))
        .match(
            '(contract:ConsentFlowContract {id: $contractId})-[:CREATED_BY|CAN_WRITE|SHARES_DATA_WITH]->(profile:Profile {profileId: $profileId})'
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
        .set('recipient.readableDeliveryLock = coalesce(recipient.readableDeliveryLock, 0) + 1')
        .with('contract, recipient')
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

/** Replace an owned referral program's recipient set only before its first consent.
 * The preview reads the identical state without taking a write lock.
 */
export const reconcileReferralAudience = async (
    contractId: string,
    owner: string,
    recipients: string[],
    dryRun: boolean,
    expectedRecipients?: string[]
) => {
    const query = new QueryBuilder(
        new BindParam({
            contractId,
            owner,
            recipients: [...new Set(recipients)],
            expectedRecipients: expectedRecipients ? [...new Set(expectedRecipients)] : null,
        })
    );
    query.raw(
        `MATCH (contract:ConsentFlowContract {id: $contractId})-[:CREATED_BY]->(:Profile {profileId: $owner})`
    );
    if (!dryRun)
        query.raw(`
            FOREACH (_ IN CASE WHEN contract.referralProgram IS NOT NULL THEN [1] ELSE [] END |
                SET contract.audienceLock = coalesce(contract.audienceLock, 0) + 1)
        `);
    query.raw(`
        WITH contract, contract.referralProgram IS NOT NULL AS referral,
             coalesce(contract.status, 'active') <> 'retired' AS active,
             EXISTS { MATCH (:AppStoreListing)-[:HAS_CONSENT_CONTRACT]->(contract) } AS listing,
             (coalesce(contract.hasConsented, false) OR EXISTS { MATCH (:ConsentFlowTerms)-[:CONSENTS_TO]->(contract) }) AS frozen,
             [(contract)-[:CAN_WRITE]->(writer:Profile) | writer.profileId] AS writers
        OPTIONAL MATCH (contract)-[edge:SHARES_DATA_WITH]->(current:Profile)
        WITH contract, referral, active, listing, frozen, writers,
             collect(CASE WHEN NOT (current.profileId IN $recipients) THEN edge END) AS removedEdges,
             collect(current.profileId) AS currentIds
        OPTIONAL MATCH (wanted:Profile) WHERE wanted.profileId IN $recipients
        WITH contract, referral, active, listing, frozen, writers, removedEdges, currentIds, collect(wanted) AS targets
        WITH *, size(targets) = size($recipients) AND NOT ($owner IN $recipients) AS valid,
             ($expectedRecipients IS NULL OR (size(currentIds) = size($expectedRecipients)
                 AND all(id IN currentIds WHERE id IN $expectedRecipients))) AS audienceMatches,
             (size(currentIds) <> size($recipients) OR any(id IN currentIds WHERE NOT (id IN $recipients))) AS changed
    `);
    if (!dryRun)
        query.raw(`
        FOREACH (_ IN CASE WHEN referral AND active AND audienceMatches AND valid AND changed AND NOT listing AND NOT frozen THEN [1] ELSE [] END |
            FOREACH (edge IN removedEdges | DELETE edge)
            FOREACH (target IN [p IN targets WHERE NOT (p.profileId IN currentIds)] |
                MERGE (contract)-[added:SHARES_DATA_WITH]->(target)
                ON CREATE SET added.addedAt = toString(datetime()))
            SET contract.audienceVersion = coalesce(contract.audienceVersion, 0) + 1)
    `);
    const result = await runAudienceMutation(
        query.return('listing, referral, active, audienceMatches, valid, changed, frozen, writers')
    );
    const row = result.records[0];
    if (!row)
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Owned referral contract not found' });
    if (row.get('listing'))
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'An App Store listing contract cannot be used for a referral program.',
        });
    if (!row.get('referral'))
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Owned referral contract not found' });
    if (!row.get('active'))
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Retired contracts cannot be updated' });
    if (!row.get('audienceMatches'))
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Referral audience changed since preview. Review the contract and try again.',
        });
    if (recipients.includes(owner) || (!dryRun && !row.get('valid')))
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Recipients must be existing profiles distinct from the owner.',
        });
    const changed = Boolean(row.get('changed'));
    const frozen = Boolean(row.get('frozen'));
    if (changed && frozen && !dryRun)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Recipients are frozen after first consent. This needs a new contract.',
        });
    return { changed, frozen, writers: row.get('writers') as string[] };
};
