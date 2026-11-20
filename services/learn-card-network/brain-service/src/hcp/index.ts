/**
 * HCP (Human Context Protocol) API, versioned by folder. Each version owns its
 * router, schemas, service, store and Neo4j labels. Add a version as a sibling
 * folder plus one line here; shed one by deleting its folder and its line.
 */
import { t } from '@routes';

import { hcpV1Router } from './v1/router';
import { createNeo4jHcpV1Store } from './v1/store/neo4j';

export const hcpRouter = t.router({
    v1: hcpV1Router,
});

export type HcpRouter = typeof hcpRouter;

/**
 * Deletes everything HCP holds for a Context Subject (their profile DID): entries,
 * versions, grants, refs and audit events. Called when the profile is deleted.
 * Throws if it fails, so the caller can stop before deleting the profile.
 * Every version folder must be added here.
 */
export const deleteHcpDataForSubject = async (subjectDid: string): Promise<void> => {
    await createNeo4jHcpV1Store().deleteSubjectData(subjectDid);
};
