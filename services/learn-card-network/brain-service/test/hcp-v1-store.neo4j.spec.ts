import { neogma } from '@instance';

import { createNeo4jHcpV1Store, HCP_V1_LABELS } from '../src/hcp/v1/store/neo4j';
import { describeHcpV1StoreContract } from '../src/hcp/v1/store/store.contract';

const store = createNeo4jHcpV1Store();

describeHcpV1StoreContract('neo4j', () => ({
    store,
    reset: async () => {
        await neogma.queryRunner.run(
            'MATCH (n) WHERE any(label IN labels(n) WHERE label IN $labels) DETACH DELETE n',
            { labels: [...HCP_V1_LABELS] }
        );
    },
}));
