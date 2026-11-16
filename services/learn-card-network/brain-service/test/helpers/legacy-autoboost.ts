import { neogma } from '@instance';
import { getIdFromUri } from '@helpers/uri.helpers';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';

/** Persist a pre-upgrade writer-authorized setup, before any holder consents. */
export const seedLegacyAutoBoost = async (
    contractUri: string,
    config: {
        boostUri: string;
        issuerProfileId: string;
        signingAuthority: { endpoint: string; name: string };
    }
): Promise<void> => {
    const id = getIdFromUri(contractUri);
    const version = await getConsentFlowContractVersionRecord(id, 1);
    if (!version) throw new Error('Legacy fixture requires an initial contract snapshot');
    const stored = {
        id: getIdFromUri(config.boostUri),
        signingAuthorityEndpoint: config.signingAuthority.endpoint,
        signingAuthorityName: config.signingAuthority.name,
        issuer: config.issuerProfileId,
    };
    const result = await neogma.queryRunner.run(
        `MATCH (contract:ConsentFlowContract {id:$id, currentVersion:1})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version:1})
         MATCH (contract)-[:CAN_WRITE]->(:Profile {profileId:$issuer})
         MATCH (boost:Boost {id:$boostId})
         WHERE NOT EXISTS { MATCH (:ConsentFlowTerms)-[:CONSENTS_TO]->(contract) }
             AND NOT EXISTS { MATCH (contract)-[:AUTO_RECEIVE]->(boost) }
         CREATE (contract)-[:AUTO_RECEIVE {
             signingAuthorityEndpoint:$endpoint, signingAuthorityName:$name, issuer:$issuer
         }]->(boost)
         SET version.autoboosts=$autoboosts
         RETURN contract.id AS id`,
        {
            id,
            boostId: stored.id,
            issuer: stored.issuer,
            endpoint: stored.signingAuthorityEndpoint,
            name: stored.signingAuthorityName,
            autoboosts: JSON.stringify([...version.autoboosts, stored]),
        }
    );
    if (result.records.length !== 1) {
        throw new Error(
            'Legacy fixture requires an unconsented initial contract and configured writer'
        );
    }
};
