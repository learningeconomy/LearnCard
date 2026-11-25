import neo4j from 'neo4j-driver';

/** Read-only, counts-only inventory. Pass the deployment timestamp as the sole argument. */
const main = async (): Promise<void> => {
    const cutoff = process.argv[2];
    if (!cutoff || !Number.isFinite(Date.parse(cutoff))) {
        throw new Error('A valid deployment timestamp is required');
    }
    const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
    if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
        throw new Error('Explicit Neo4j connection environment is required');
    }
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
        const result = await session.executeRead(tx =>
            tx.run(
                `MATCH (b:Boost)-[created:CREATED_BY]->()
             WHERE created.date < $cutoff
             WITH DISTINCT b
             WITH b, EXISTS { MATCH (r:CredentialRefresh) WHERE r.boostId = b.id }
                OR EXISTS { MATCH (i:RefreshSendIntent) WHERE i.boostUri ENDS WITH ':' + b.id } AS managed,
                EXISTS { MATCH (a:CredentialActivity) WHERE a.source = 'send' AND a.boostUri ENDS WITH ':' + b.id } AS sent
             RETURN count(CASE WHEN managed THEN b END) AS managed,
                    count(CASE WHEN sent AND NOT managed THEN b END) AS unclassifiedSendCandidates`,
                { cutoff: new Date(cutoff).toISOString() }
            )
        );
        // Signed-only sends historically had no distinguishing marker. Candidates are
        // an upper bound, not a claim that every counted Boost contains private data.
        const row = result.records[0];
        console.log(
            JSON.stringify({
                managed: Number(row?.get('managed') ?? 0),
                unclassifiedSendCandidates: Number(row?.get('unclassifiedSendCandidates') ?? 0),
            })
        );
    } finally {
        await session.close();
        await driver.close();
    }
};

main().catch(() => {
    console.error('SEND_TEMPLATE_INVENTORY_FAILED');
    process.exitCode = 1;
});
