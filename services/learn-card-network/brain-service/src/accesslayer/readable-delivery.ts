import { randomUUID } from 'node:crypto';
import { neogma } from '@instance';
import type { DeliveryRecord } from 'types/readable-delivery';
import { TRPCError } from '@trpc/server';
import { runAudienceMutation } from './consentflowcontract/relationships/recipients';

let constraints: Promise<unknown> | undefined;
const ensureConstraints = (): Promise<unknown> =>
    (constraints ??= neogma.queryRunner
        .run(
            'CREATE CONSTRAINT readable_delivery_provision_unique IF NOT EXISTS FOR (d:ReadableDelivery) REQUIRE d.provisionId IS UNIQUE'
        )
        .then(() =>
            neogma.queryRunner.run(
                'CREATE CONSTRAINT readable_delivery_recipient_unique IF NOT EXISTS FOR (d:ReadableDelivery) REQUIRE (d.profileId, d.domain) IS UNIQUE'
            )
        )
        .catch(error => {
            constraints = undefined;
            throw error;
        }));

export const getDeliveryProvision = async (
    provisionId: string
): Promise<DeliveryRecord | undefined> => {
    const result = await neogma.queryRunner.run(
        'MATCH (d:ReadableDelivery {provisionId:$provisionId}) RETURN properties(d) AS delivery',
        { provisionId }
    );
    return result.records[0]?.get('delivery') as DeliveryRecord | undefined;
};

/** Separate nodes prevent secret envelopes leaking through public Profile projections. */
export const getDeliveryRecord = async (
    profileId: string,
    domain: string
): Promise<DeliveryRecord | undefined> => {
    const result = await neogma.queryRunner.run(
        'MATCH (d:ReadableDelivery {profileId:$profileId, domain:$domain}) RETURN properties(d) AS delivery',
        { profileId, domain }
    );
    return result.records[0]?.get('delivery') as DeliveryRecord | undefined;
};

export const createDeliveryRecipient = async (
    record: DeliveryRecord,
    recipientDid: string,
    existing = false
): Promise<void> => {
    await ensureConstraints();
    // Existing profiles require direct management and no previous consent. Profile
    // and contract locks serialize this with audience creation and first consent.
    const result = await runAudienceMutation({
        // Retry only the rolled-back atomic graph write, keeping the same key,
        // recipient and provision identity across a deadlock with audience edits.
        run: () =>
            neogma.queryRunner.run(
                `
        MATCH (owner:Profile {profileId:$ownerProfileId})
        ${
            existing
                ? `
        MATCH (recipient:Profile {profileId:$profileId})-[:MANAGED_BY]->(owner)
        SET recipient.readableDeliveryLock = coalesce(recipient.readableDeliveryLock, 0) + 1
        WITH DISTINCT owner, recipient
        OPTIONAL MATCH (contract:ConsentFlowContract)-[:CREATED_BY|SHARES_DATA_WITH]->(recipient)
        WITH owner, recipient, collect(DISTINCT contract) AS contracts
        FOREACH (contract IN contracts | SET contract.audienceLock = coalesce(contract.audienceLock, 0) + 1)
        WITH owner, recipient, contracts
        WHERE recipient.type = 'organization' AND recipient.displayName = $displayName
          AND EXISTS { MATCH (recipient)-[:MANAGED_BY]->(owner) }
          AND NOT EXISTS { MATCH (:ReadableDelivery {profileId:$profileId, domain:$domain}) }
          AND all(contract IN contracts WHERE coalesce(contract.hasConsented, false) = false
            AND NOT EXISTS { MATCH (:ConsentFlowTerms)-[:CONSENTS_TO]->(contract) })
        SET recipient.isServiceProfile = true
        FOREACH (contract IN contracts | SET contract.audienceVersion = coalesce(contract.audienceVersion, 0) + 1)
        `
                : `CREATE (recipient:Profile {profileId:$profileId, did:$recipientDid,
            displayName:$displayName, displayNameLower:toLower($displayName),
            isServiceProfile:true, type:'organization', profileVisibility:'private'})
        CREATE (recipient)-[:MANAGED_BY]->(owner)`
        }
        CREATE (agent:Profile {profileId:$agentProfileId, did:$agentDid,
            displayName:'Delivery agent', isServiceProfile:true, profileVisibility:'private'})
        CREATE (recipient)-[:MANAGED_BY]->(agent)
        CREATE (d:ReadableDelivery)
        SET d = $record
        CREATE (d)-[:DELIVERS_FOR]->(recipient)
        CREATE (:ReadableDeliveryAudit {id:$auditId, actor:$ownerProfileId,
            recipient:$profileId, action:'provision', result:'allowed', at:$now, count:0})
        RETURN d.profileId AS id`,
                {
                    ...record,
                    record,
                    recipientDid,
                    auditId: randomUUID(),
                    now: new Date().toISOString(),
                }
            ),
    });
    if (!result.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message:
                'Use an organization you directly manage with the same name and no previous consent or delivery setup.',
        });
};

export const disableDeliveryRecipient = async (
    profileId: string,
    domain: string,
    owner: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `
        MATCH (d:ReadableDelivery {profileId:$profileId, domain:$domain, ownerProfileId:$owner})
        SET d.enabled = false
        WITH d
        MATCH (recipient:Profile {profileId:d.profileId})
        OPTIONAL MATCH (recipient)-[r:MANAGED_BY]->(:Profile {profileId:d.agentProfileId})
        DELETE r
        CREATE (:ReadableDeliveryAudit {id:$auditId, actor:$owner, recipient:$profileId,
            action:'disable', result:'allowed', at:$now, count:0})
        RETURN d.profileId AS id`,
        { profileId, domain, owner, auditId: randomUUID(), now: new Date().toISOString() }
    );
    return result.records.length > 0;
};

export const auditDeliveryRead = async (
    actor: string,
    recipient: string,
    result: 'started' | 'allowed' | 'denied',
    count = 0
): Promise<void> => {
    await neogma.queryRunner.run(
        `
        CREATE (:ReadableDeliveryAudit {id:$id, actor:$actor, recipient:$recipient,
            action:'read', result:$result, count:$count, at:$now})`,
        { id: randomUUID(), actor, recipient, result, count, now: new Date().toISOString() }
    );
};

/** Public disclosure projection deliberately selects no key material. */
export const getDeliveryDisclosures = async (
    profileIds: string[],
    domain: string
): Promise<
    {
        profileId: string;
        displayName: string;
        agentDid: string;
        enabled: boolean;
        disclosureVersion: '1';
    }[]
> => {
    const result = await neogma.queryRunner.run(
        `
        MATCH (d:ReadableDelivery {domain:$domain}) WHERE d.profileId IN $profileIds
        RETURN d.profileId AS profileId, d.displayName AS displayName, d.agentDid AS agentDid,
            d.enabled AS enabled, d.disclosureVersion AS disclosureVersion`,
        { profileIds, domain }
    );
    return result.records.map(row => ({
        profileId: row.get('profileId'),
        displayName: row.get('displayName'),
        agentDid: row.get('agentDid'),
        enabled: row.get('enabled'),
        disclosureVersion: '1',
    }));
};
