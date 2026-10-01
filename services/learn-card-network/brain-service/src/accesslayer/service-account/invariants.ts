/** Constant Cypher predicate, evaluated in the same statement as access/enablement.
 * `sa` is the already bound ServiceAccount. No caller text is interpolated.
 */
export const SERVICE_ACCOUNT_AGGREGATE_VALID = `
    sa.activeInstallId = sa.installId
    AND COUNT { MATCH (sa)-[:ACTS_FOR]->() } = 1
    AND EXISTS { MATCH (sa)-[:ACTS_FOR]->(eco:Ecosystem) WHERE eco.id = sa.ecosystemId }
    AND COUNT { MATCH ()-[:HAS_SERVICE_ACCOUNT]->(sa) } = 1
    AND EXISTS { MATCH (install:IntegrationInstall)-[:HAS_SERVICE_ACCOUNT]->(sa) WHERE install.id = sa.installId AND install.ecosystemId = sa.ecosystemId }
    AND COUNT { MATCH (other:ServiceAccount) WHERE other.installId = sa.installId AND other.status <> 'REVOKED' } = 1
    AND COUNT { MATCH ()-[edge:INSTALLS]->() WHERE edge.installId = sa.installId } = 1
    AND EXISTS { MATCH (eco:Ecosystem)-[edge:INSTALLS]->(listing:AppStoreListing)
        MATCH (install:IntegrationInstall)-[:HAS_SERVICE_ACCOUNT]->(sa)
        WHERE edge.installId = sa.installId AND edge.serviceAccountId = sa.id
          AND eco.id = sa.ecosystemId AND listing.listing_id = install.listingId }
`;
