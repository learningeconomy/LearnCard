/**
 * The v1 deps the brain runs with: the Neo4j store and the brain's ports. The router
 * and the local HCP MCP dev server (`HCP_MCP_DEV_STORE=neo4j`) both build from here.
 */
import { randomUUID } from 'node:crypto';

import { contracts, providerId } from './ports';
import type { HcpV1Deps } from './service/deps';
import { createStoreActivitySink, grantWritePolicy } from './service/seams';
import { createNeo4jHcpV1Store } from './store/neo4j';

/** One store per call site; deps are cheap to rebuild per request. */
export const createNeo4jHcpV1DepsFactory = (): (() => HcpV1Deps) => {
    const store = createNeo4jHcpV1Store();
    const activity = createStoreActivitySink(store);
    return () => ({
        store,
        contracts,
        activity,
        writePolicy: grantWritePolicy,
        providerId: providerId(),
        now: () => new Date(),
        newId: randomUUID,
    });
};
