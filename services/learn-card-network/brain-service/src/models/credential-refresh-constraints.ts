import { neogma } from '@instance';

const CREDENTIAL_REFRESH_CONSTRAINT_QUERIES = [
    'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE',
    'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE',
    'CREATE CONSTRAINT credential_refresh_idempotency_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshIdempotencyKey) IS UNIQUE',
];

type Neo4jSchemaError = {
    code?: string;
};

const isEquivalentSchemaRuleRace = (error: unknown): boolean =>
    (error as Neo4jSchemaError | undefined)?.code ===
    'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists';

const createCredentialRefreshConstraints = async (): Promise<void> => {
    for (const query of CREDENTIAL_REFRESH_CONSTRAINT_QUERIES) {
        try {
            await neogma.queryRunner.run(query);
        } catch (error) {
            // Concurrent service starts can both observe a missing rule before one wins
            // creation. The losing CREATE is equivalent to the desired ready state.
            if (!isEquivalentSchemaRuleRace(error)) throw error;
        }
    }
};

let constraintReadiness: Promise<void> | undefined;

/**
 * Ensures the uniqueness rules required for atomic credential-refresh publication.
 * Concurrent callers share one attempt; a failed attempt is cleared so a later request
 * can retry instead of leaving the issuer API permanently unavailable.
 */
export const ensureCredentialRefreshConstraints = (): Promise<void> => {
    if (!constraintReadiness) {
        const pendingReadiness = createCredentialRefreshConstraints();
        constraintReadiness = pendingReadiness;

        void pendingReadiness.catch(() => {
            if (constraintReadiness === pendingReadiness) constraintReadiness = undefined;
        });
    }

    return constraintReadiness;
};
