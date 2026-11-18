import { randomUUID } from 'crypto';
import { neogma } from '@instance';
import { ConsentFlowTerms, ConsentFlowTransaction, Credential } from '@models';

/**
 * LC-2423: the holder dismisses a credential a contract app suggested. Records a
 * 'dismiss' transaction on the same terms and marks the delivery dismissed so it
 * leaves the holder's incoming list. Idempotent; false when the credential is not a
 * pending suggestion on terms this profile owns.
 */
export const dismissContractSuggestion = async (
    profileId: string,
    credentialId: string
): Promise<boolean> => {
    const isFor = ConsentFlowTransaction.getRelationshipByAlias('isFor').name;
    const issuedVia = Credential.getRelationshipByAlias('issuedViaTransaction').name;
    const createdBy = ConsentFlowTerms.getRelationshipByAlias('createdBy').name;
    const received = Credential.getRelationshipByAlias('credentialReceived').name;
    const now = new Date().toISOString();

    const result = await neogma.queryRunner.run(
        `MATCH (:Profile {profileId: $profileId})-[:${createdBy}]-(terms:ConsentFlowTerms)
               <-[:${isFor}]-(suggestion:ConsentFlowTransaction {action: 'suggest'})
               <-[:${issuedVia}]-(credential:Credential {id: $credentialId})
         WHERE NOT (credential)-[:${received}]->()
         WITH terms, suggestion, credential LIMIT 1
         OPTIONAL MATCH (credential)-[:${issuedVia}]->(existing:ConsentFlowTransaction {action: 'dismiss'})
         WITH terms, suggestion, credential, count(existing) AS dismissed
         FOREACH (_ IN CASE WHEN dismissed = 0 THEN [1] ELSE [] END |
             CREATE (dismissal:ConsentFlowTransaction {id: $transactionId, action: 'dismiss', date: $now, boostId: suggestion.boostId})
                 -[:${isFor}]->(terms)
             CREATE (credential)-[:${issuedVia} {date: $now}]->(dismissal)
         )
         WITH credential
         OPTIONAL MATCH ()-[sent:CREDENTIAL_SENT {to: $profileId}]->(credential)
         FOREACH (rel IN CASE WHEN sent IS NULL THEN [] ELSE [sent] END |
             SET rel.status = 'dismissed')
         RETURN credential.id AS id`,
        { profileId, credentialId, transactionId: randomUUID(), now }
    );

    return result.records.length > 0;
};
