/**
 * HCP (Human Context Protocol) API, versioned by folder. Each version owns its
 * router, schemas, service, store and Neo4j labels. Add a version as a sibling
 * folder plus one line here; shed one by deleting its folder and its line.
 */
import { t } from '@routes';

import { hcpV1Router } from './v1/router';

export const hcpRouter = t.router({
    v1: hcpV1Router,
});

export type HcpRouter = typeof hcpRouter;
