import neo4j from 'neo4j-driver';
import { reconcileClaimLinkRequestForOperator } from '../src/accesslayer/claim-link-request-fence';

const main = async (): Promise<void> => {
    // Explicitly separate maintenance from ordinary request recovery. Do not run this
    // against live claim/status handlers or a deployment containing pre-fence writers.
    if (process.argv[2] !== '--handlers-quiesced') {
        throw new Error('Read the claim-link recovery runbook and quiesce handlers first');
    }
    const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, CLAIM_RECEIPT_ID, CLAIM_OWNER_TOKEN } =
        process.env;
    if (
        !NEO4J_URI ||
        !NEO4J_USERNAME ||
        !NEO4J_PASSWORD ||
        !CLAIM_RECEIPT_ID ||
        !CLAIM_OWNER_TOKEN
    ) {
        throw new Error(
            'Explicit database environment, receipt ID and expected owner are required'
        );
    }
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    const session = driver.session();
    try {
        const outcome = await session.executeWrite(tx =>
            reconcileClaimLinkRequestForOperator(tx, CLAIM_RECEIPT_ID, CLAIM_OWNER_TOKEN)
        );
        console.log(JSON.stringify({ outcome }));
    } finally {
        await session.close();
        await driver.close();
    }
};

main().catch(() => {
    console.error('CLAIM_LINK_RECONCILIATION_FAILED');
    process.exitCode = 1;
});
