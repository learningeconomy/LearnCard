import { Boost, Credential, Profile } from '@models';
import { createContractCredentialRelationships } from '@accesslayer/credential/relationships/create';
import type { DbTermsType } from 'types/consentflowcontract';
import type { ProfileType } from 'types/profile';
import { minimalContract, minimalTerms } from './helpers/contract';
import { getUser } from './helpers/getClient';
import {
    getContractTermsByUri,
    getTransactionsForTerms,
} from '@accesslayer/consentflowcontract/relationships/read';
import {
    getConsentFlowContractVersionRecord,
    updateConsentFlowContractVersion,
} from '@accesslayer/consentflowcontract/versions';
import { getIdFromUri } from '@helpers/uri.helpers';
import { afterEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { neogma } from '@instance';
import {
    claimAutoBoostTransaction,
    completeAutoBoostTransaction,
} from '@accesslayer/consentflowcontract/relationships/update';
describe('consent autoboost transaction claims', () => {
    const fixtureMarkers: string[] = [];
    const contractIds: string[] = [];
    const profileIds: string[] = [];
    const termsIds: string[] = [];

    afterEach(async () => {
        await neogma.queryRunner.run(
            `MATCH (node) WHERE node.lcConsentTest IN $markers DETACH DELETE node`,
            { markers: fixtureMarkers.splice(0) }
        );
        await neogma.queryRunner.run(
            `MATCH (claim:ConsentFlowAutoBoostClaim) WHERE claim.termsId IN $ids DETACH DELETE claim`,
            { ids: termsIds }
        );
        const ids = contractIds.splice(0);
        await neogma.queryRunner.run(
            `MATCH (event:ConsentFlowEvent) WHERE event.contractId IN $ids DETACH DELETE event`,
            { ids }
        );
        await neogma.queryRunner.run(
            `MATCH (contract:ConsentFlowContract) WHERE contract.id IN $ids
             OPTIONAL MATCH (terms:ConsentFlowTerms)-[:CONSENTS_TO]->(contract)
             OPTIONAL MATCH (terms)<-[:IS_FOR]-(transaction:ConsentFlowTransaction)
             DETACH DELETE transaction, terms, contract`,
            { ids }
        );
        termsIds.splice(0);
        await neogma.queryRunner.run(
            `MATCH (profile:Profile) WHERE profile.profileId IN $ids DETACH DELETE profile`,
            { ids: profileIds.splice(0) }
        );
        await neogma.queryRunner.run(
            `MATCH (boost:Boost {id:'boost-identity'})
             OPTIONAL MATCH (credential:Credential)-[:INSTANCE_OF]->(boost)
             DETACH DELETE credential, boost`,
            {}
        );
    });

    const createConsent = async (
        status: string,
        version: number,
        consentedVersion: number,
        oneTime = false
    ) => {
        const contractId = randomUUID();
        const termsId = randomUUID();
        contractIds.push(contractId);
        termsIds.push(termsId);
        await neogma.queryRunner.run(
            `CREATE (contract:ConsentFlowContract {id:$contractId, currentVersion:$version})
             CREATE (terms:ConsentFlowTerms {id:$termsId, status:$status, consentedVersion:$consentedVersion, oneTime:$oneTime})
             CREATE (terms)-[:CONSENTS_TO]->(contract)`,
            { contractId, termsId, status, version, consentedVersion, oneTime }
        );
        return { contractId, termsId };
    };

    it('claims a terms/boost identity once under concurrency and records a write only after send', async () => {
        const { contractId, termsId } = await createConsent('live', 1, 1);
        const claims = await Promise.all(
            Array.from({ length: 8 }, () =>
                claimAutoBoostTransaction(contractId, termsId, 'boost-identity')
            )
        );
        expect(claims.filter(Boolean)).toHaveLength(1);
        const claimId = claims.find(Boolean)!;

        const beforeCompletion = await neogma.queryRunner.run(
            `MATCH (:ConsentFlowTerms {id:$termsId})<-[:IS_FOR]-(transaction:ConsentFlowTransaction)
             RETURN count(transaction) AS count`,
            { termsId }
        );
        expect(Number(beforeCompletion.records[0]?.get('count'))).toBe(0);
        await neogma.queryRunner.run(
            `CREATE (boost:Boost {id:'boost-identity'})
             CREATE (credential:Credential {id:$credentialId, credential:'{}'})
             CREATE (transaction:ConsentFlowTransaction {id:$transactionId, action:'write', date:'2026-01-01T00:00:00.000Z'})
             WITH boost, credential, transaction
             MATCH (terms:ConsentFlowTerms {id:$termsId})
             CREATE (transaction)-[:IS_FOR]->(terms)
             CREATE (credential)-[:ISSUED_VIA_TRANSACTION]->(transaction)
             CREATE (credential)-[:INSTANCE_OF]->(boost)`,
            { termsId, credentialId: randomUUID(), transactionId: randomUUID() }
        );

        await completeAutoBoostTransaction(claimId, termsId, 'boost-identity');
        expect(await claimAutoBoostTransaction(contractId, termsId, 'boost-identity')).toBeNull();
        const afterCompletion = await neogma.queryRunner.run(
            `MATCH (:ConsentFlowTerms {id:$termsId})<-[:IS_FOR]-(transaction:ConsentFlowTransaction {boostId:'boost-identity'})
             RETURN count(transaction) AS count`,
            { termsId }
        );
        expect(Number(afterCompletion.records[0]?.get('count'))).toBe(1);
    });

    it.each(['needs_reconsent', 'suspended', 'consumed'] as const)(
        'does not claim autoboosts for %s consent',
        async status => {
            const { contractId, termsId } = await createConsent(status, 2, 1);
            await expect(
                claimAutoBoostTransaction(contractId, termsId, 'boost-identity')
            ).resolves.toBeNull();
        }
    );
    it('allows an initial consumed one-time consent to claim an autoboost', async () => {
        const { contractId, termsId } = await createConsent('consumed', 1, 1, true);
        await expect(
            claimAutoBoostTransaction(contractId, termsId, 'boost-identity', true)
        ).resolves.toBeTruthy();
    });

    it('does not deliver a credential signed for v1 after consent becomes pending at v2', async () => {
        const marker = randomUUID();
        fixtureMarkers.push(marker);
        const contractId = randomUUID();
        const termsId = randomUUID();
        const ownerId = randomUUID();
        const recipientId = randomUUID();
        const credentialId = randomUUID();
        const boostId = randomUUID();
        contractIds.push(contractId);
        termsIds.push(termsId);

        await neogma.queryRunner.run(
            `CREATE (owner:Profile {profileId:$ownerId, lcConsentTest:$marker})
             CREATE (recipient:Profile {profileId:$recipientId, lcConsentTest:$marker})
             CREATE (contract:ConsentFlowContract {
                id:$contractId, currentVersion:2, status:'active', lcConsentTest:$marker
             })
             CREATE (terms:ConsentFlowTerms {
                id:$termsId, status:'needs_reconsent', consentedVersion:1,
                expiresAt:'', \`terms.deniedWriters\`:[], lcConsentTest:$marker
             })
             CREATE (credential:Credential {id:$credentialId, credential:'{}', lcConsentTest:$marker})
             CREATE (boost:Boost {id:$boostId, category:null, lcConsentTest:$marker})
             CREATE (contract)-[:CREATED_BY]->(owner)
             CREATE (contract)-[:CAN_WRITE]->(owner)
             CREATE (recipient)-[:CREATED_BY]->(terms)
             CREATE (terms)-[:CONSENTS_TO]->(contract)`,
            { marker, contractId, termsId, ownerId, recipientId, credentialId, boostId }
        );

        const [owner, recipient, credential, boost] = await Promise.all([
            Profile.findOne({ where: { profileId: ownerId } }),
            Profile.findOne({ where: { profileId: recipientId } }),
            Credential.findOne({ where: { id: credentialId } }),
            Boost.findOne({ where: { id: boostId } }),
        ]);
        if (!owner || !recipient || !credential || !boost) {
            throw new Error('Could not load persisted contract delivery fixtures');
        }

        await expect(
            createContractCredentialRelationships({
                // The fixture profile nodes only supply fields used by this helper.
                issuer: { type: 'profile', profile: owner.dataValues as unknown as ProfileType },
                writerProfileId: ownerId,
                recipient: recipient.dataValues as unknown as ProfileType,
                credential,
                boost,
                terms: { id: termsId, consentedVersion: 1 } as unknown as DbTermsType,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });

        const result = await neogma.queryRunner.run(
            `MATCH (credential:Credential {id:$credentialId})
             OPTIONAL MATCH (owner:Profile)-[sent:CREDENTIAL_SENT]->(credential)
             OPTIONAL MATCH (credential)-[:INSTANCE_OF]->(boost:Boost)
             OPTIONAL MATCH (credential)-[:ISSUED_VIA_TRANSACTION]->(transaction:ConsentFlowTransaction)
             RETURN count(DISTINCT sent) AS sent, count(DISTINCT boost) AS instances,
                    count(DISTINCT transaction) AS transactions`,
            { credentialId }
        );
        expect(Number(result.records[0]?.get('sent'))).toBe(0);
        expect(Number(result.records[0]?.get('instances'))).toBe(0);
        expect(Number(result.records[0]?.get('transactions'))).toBe(0);
        await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms {id:$termsId})
             SET terms.status = 'live', terms.consentedVersion = 2`,
            { termsId }
        );
        await createContractCredentialRelationships({
            issuer: { type: 'profile', profile: owner.dataValues as unknown as ProfileType },
            writerProfileId: ownerId,
            recipient: recipient.dataValues as unknown as ProfileType,
            credential,
            boost,
            terms: { id: termsId, consentedVersion: 2 } as unknown as DbTermsType,
        });
        const delivered = await neogma.queryRunner.run(
            `MATCH (:Profile {profileId:$ownerId})-[sent:CREDENTIAL_SENT]->(credential:Credential {id:$credentialId})
             MATCH (credential)-[:INSTANCE_OF]->(:Boost {id:$boostId})
             MATCH (credential)-[:ISSUED_VIA_TRANSACTION]->(transaction:ConsentFlowTransaction {action:'write'})
             RETURN count(sent) AS deliveries, count(transaction) AS writes`,
            { ownerId, credentialId, boostId }
        );
        expect(Number(delivered.records[0]?.get('deliveries'))).toBe(1);
        expect(Number(delivered.records[0]?.get('writes'))).toBe(1);
    });
    it('advances guardian approval only for a quiet live migration and preserves its history', async () => {
        const actor = await getUser(randomUUID().replaceAll('-', '').repeat(2));
        const holder = await getUser(randomUUID().replaceAll('-', '').repeat(2));
        const ownerProfileId = randomUUID();
        const holderProfileId = randomUUID();
        profileIds.push(ownerProfileId, holderProfileId);
        await actor.clients.fullAuth.profile.createProfile({ profileId: ownerProfileId });
        await holder.clients.fullAuth.profile.createProfile({ profileId: holderProfileId });
        const uri = await actor.clients.fullAuth.contracts.createConsentFlowContract({
            contract: minimalContract,
            name: 'Guardian quiet migration regression',
        });
        const contractId = getIdFromUri(uri);
        contractIds.push(contractId);
        const { termsUri } = await holder.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: minimalTerms,
        });
        const relationship = await getContractTermsByUri(termsUri);
        if (!relationship) throw new Error('Could not load persisted consent fixture');
        const termsId = relationship.terms.id;
        termsIds.push(termsId);
        const version1 = await getConsentFlowContractVersionRecord(contractId, 1);
        if (!version1) throw new Error('Could not load initial contract version');
        const approval = {
            guardianProfileId: randomUUID(),
            guardianDid: `did:example:${randomUUID()}`,
            approvedAt: new Date().toISOString(),
            contractUpdatedAt: version1.createdAt,
        };
        await neogma.queryRunner.run(
            `MATCH (terms:ConsentFlowTerms {id:$termsId})
             SET terms['guardianApproval.guardianProfileId']=$guardianProfileId,
                 terms['guardianApproval.guardianDid']=$guardianDid,
                 terms['guardianApproval.approvedAt']=$approvedAt,
                 terms['guardianApproval.contractUpdatedAt']=$contractUpdatedAt
             WITH terms
             MATCH (transaction:ConsentFlowTransaction)-[:IS_FOR]->(terms)
             WHERE transaction.action='consent'
             SET transaction['guardianApproval.guardianProfileId']=$guardianProfileId,
                 transaction['guardianApproval.guardianDid']=$guardianDid,
                 transaction['guardianApproval.approvedAt']=$approvedAt,
                 transaction['guardianApproval.contractUpdatedAt']=$contractUpdatedAt`,
            { termsId, ...approval }
        );
        const optionalCategoryContract = {
            ...minimalContract,
            write: {
                ...minimalContract.write,
                credentials: {
                    ...minimalContract.write.credentials,
                    categories: { OptionalAddition: { required: false } },
                },
            },
        };
        const updated = await updateConsentFlowContractVersion(
            { uri, changes: { contract: optionalCategoryContract } },
            ownerProfileId,
            'localhost'
        );
        expect(updated).toMatchObject({ version: 2, kind: 'expanded_optional' });
        const version2 = await getConsentFlowContractVersionRecord(contractId, 2);
        const after = await getContractTermsByUri(termsUri);
        expect(after?.terms.status).toBe('live');
        expect(after?.terms.guardianApproval).toEqual({
            ...approval,
            contractUpdatedAt: version2?.createdAt,
        });
        const history = await getTransactionsForTerms(termsId, { limit: 10 });
        expect(
            history.find(transaction => transaction.action === 'consent')?.guardianApproval
        ).toEqual(approval);
        expect(history.some(transaction => transaction.action === 'update')).toBe(true);
    });
});
