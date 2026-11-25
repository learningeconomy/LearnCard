import neo4j from 'neo4j-driver';

/** Seed pre-upgrade state that the owner-only publication API deliberately cannot create. */
export const seedLegacyAutoBoost = async (
    contractUri: string,
    config: {
        boostUri: string;
        issuerProfileId: string;
        signingAuthority: { endpoint: string; name: string };
    }
): Promise<void> => {
    const driver = neo4j.driver('bolt://localhost:7687');
    const session = driver.session();
    const id = contractUri.split(':').pop();
    const stored = {
        id: config.boostUri.split(':').pop(),
        issuer: config.issuerProfileId,
        signingAuthorityEndpoint: config.signingAuthority.endpoint,
        signingAuthorityName: config.signingAuthority.name,
    };
    try {
        await session.executeWrite(async tx => {
            const result = await tx.run(
                `MATCH (contract:ConsentFlowContract {id:$id, currentVersion:1})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version:1})
                 MATCH (contract)-[:CAN_WRITE]->(:Profile {profileId:$issuer})
                 MATCH (boost:Boost {id:$boostId})
                 WHERE NOT EXISTS { MATCH (:ConsentFlowTerms)-[:CONSENTS_TO]->(contract) }
                     AND NOT EXISTS { MATCH (contract)-[:AUTO_RECEIVE]->(boost) }
                 RETURN version.autoboosts AS autoboosts`,
                { id, issuer: stored.issuer, boostId: stored.id }
            );
            if (result.records.length !== 1) {
                throw new Error(
                    'Legacy fixture requires an unconsented initial request and configured writer'
                );
            }
            const previous: unknown[] = JSON.parse(result.records[0].get('autoboosts') ?? '[]');
            await tx.run(
                `MATCH (contract:ConsentFlowContract {id:$id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion {version:1})
                 MATCH (boost:Boost {id:$boostId})
                 CREATE (contract)-[:AUTO_RECEIVE {
                     issuer:$issuer, signingAuthorityEndpoint:$endpoint, signingAuthorityName:$name
                 }]->(boost)
                 SET version.autoboosts=$autoboosts`,
                {
                    id,
                    boostId: stored.id,
                    issuer: stored.issuer,
                    endpoint: stored.signingAuthorityEndpoint,
                    name: stored.signingAuthorityName,
                    autoboosts: JSON.stringify([...previous, stored]),
                }
            );
        });
    } finally {
        await session.close();
        await driver.close();
    }
};
