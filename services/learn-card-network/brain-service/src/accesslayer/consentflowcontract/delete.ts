import { neogma } from '@instance';
import { DbContractType } from 'types/consentflowcontract';
import { TRPCError } from '@trpc/server';
import { ConsentFlowContractValidator } from '@learncard/types';
import { diffContractChange, buildContractUpdatePreview } from '@learncard/helpers';
import { getConsentFlowContractVersionRecord } from './versions';
import { tryDispatchContractEvent } from '@helpers/contract-events.helpers';
import { constructUri } from '@helpers/uri.helpers';
import { environment } from '@environment';
import { v4 as uuid } from 'uuid';

/** Retire in place so terms and transaction history remain exportable. */
export const deleteConsentFlowContract = async (
    contract: DbContractType,
    domain = environment.DOMAIN_NAME ?? 'network.learncard.com',
    appBaseUrl = domain
): Promise<number> => {
    const contractId = contract.id;
    const currentVersion = contract.currentVersion ?? contract.version ?? 1;
    const snapshot = await getConsentFlowContractVersionRecord(contractId, currentVersion);
    if (!snapshot)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Contract version snapshot is missing',
        });

    const diff = diffContractChange(snapshot, {
        ...snapshot,
        contract: ConsentFlowContractValidator.parse({}),
    });
    const kind = 'relaxed' as const;
    const preview = buildContractUpdatePreview({ name: snapshot.name, kind, diff });
    const createdAt = new Date().toISOString();
    const nextVersion = currentVersion + 1;
    const reviewUrl = `${appBaseUrl.replace(/\/+$/, '')}/consent-flow/review?uri=${encodeURIComponent(constructUri('contract', contractId, domain))}`;
    const eventId = `${contractId}:version:${nextVersion}`;
    const notificationData = {
        contractUri: constructUri('contract', contractId, domain),
        contractName: snapshot.name,
        fromVersion: currentVersion,
        toVersion: nextVersion,
        kind,
        diff,
        reviewUrl,
        preview,
    };
    const result = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id:$id})
         WHERE coalesce(c.status,'active') <> 'retired'
         SET c._contractVersionLock=coalesce(c._contractVersionLock,0)+1
         WITH c
         WHERE coalesce(c.currentVersion,1)=$currentVersion
         OPTIONAL MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(c)
         WHERE terms.status IN ['live','needs_reconsent','suspended','consumed']
         WITH c, collect(DISTINCT terms) AS terms
         MATCH (c)-[:CREATED_BY]->(owner:Profile)
         WITH c, terms, collect(DISTINCT owner.profileId)[0] AS ownerProfileId
         UNWIND CASE WHEN size(terms)=0 THEN [null] ELSE terms END AS term
         OPTIONAL MATCH (term)<-[:CREATED_BY]-(consenter:Profile)
         WITH c, terms, ownerProfileId, collect(DISTINCT consenter.profileId) AS recipientProfileIds
         CREATE (version:ConsentFlowContractVersion {
             id:$versionId, version:$nextVersion, contract:$contractSnapshot,
             autoboosts:$autoboostSnapshot, writers:$writerSnapshot,
             name:$name, subtitle:$subtitle, description:$description,
             reasonForAccessing:$reasonForAccessing, image:$image,
             needsGuardianConsent:$needsGuardianConsent, redirectUrl:$redirectUrl,
             frontDoorBoostUri:$frontDoorBoostUri, expiresAt:$expiresAt,
             kind:$kind, createdAt:$createdAt
         })
         CREATE (c)-[:HAS_VERSION]->(version)
         SET c.currentVersion=$nextVersion, c.status='retired', c.updatedAt=$createdAt,
             c.latestUpdate=$latestUpdate
         REMOVE c._contractVersionLock
         FOREACH (term IN terms |
             SET term.status='withdrawn', term.mutationVersion=coalesce(term.mutationVersion,0)+1, term.updatedAt=$createdAt
             CREATE (transaction:ConsentFlowTransaction {id:randomUUID(), action:'withdraw', date:$createdAt})-[:IS_FOR]->(term))
         CREATE (event:ConsentFlowEvent {
             id:$eventId, contractId:c.id, fromId:ownerProfileId, ownerId:ownerProfileId,
             domain:$eventDomain, kind:'contract_updated', payload:$eventPayload,
             cleanupPending:true, createdAt:$createdAt
         })
         FOREACH (recipientId IN [id IN recipientProfileIds WHERE id IS NOT NULL AND id <> ownerProfileId] |
             CREATE (event)-[:HAS_DELIVERY]->(:ConsentFlowEventDelivery {
                 id:event.id + ':' + recipientId, toId:recipientId, state:'pending',
                 nextAttemptAt:$createdAt, eventCreatedAt:$createdAt, attempts:0, role:'target'
             }))
         RETURN count(DISTINCT c) AS count`,
        {
            id: contractId,
            currentVersion,
            eventId,
            eventDomain: domain,
            eventPayload: JSON.stringify(notificationData),
            nextVersion,
            versionId: uuid(),
            contractSnapshot: JSON.stringify(snapshot.contract),
            autoboostSnapshot: JSON.stringify(snapshot.autoboosts),
            writerSnapshot: JSON.stringify(snapshot.writers),
            name: snapshot.name,
            subtitle: snapshot.subtitle ?? null,
            description: snapshot.description ?? null,
            reasonForAccessing: snapshot.reasonForAccessing ?? null,
            image: snapshot.image ?? null,
            needsGuardianConsent: snapshot.needsGuardianConsent ?? false,
            redirectUrl: snapshot.redirectUrl ?? null,
            frontDoorBoostUri: snapshot.frontDoorBoostUri ?? null,
            expiresAt: snapshot.expiresAt ?? null,
            kind,
            createdAt,
            latestUpdate: JSON.stringify({
                fromVersion: currentVersion,
                toVersion: nextVersion,
                kind,
                diff,
                createdAt,
                preview,
            }),
        }
    );
    const record = result.records[0];
    if (!record || Number(record.get('count') ?? 0) === 0) return 0;
    await tryDispatchContractEvent(eventId);
    return Number(record.get('count'));
};
