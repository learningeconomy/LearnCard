import { neogma } from '@instance';

const CREDENTIAL_REFRESH_CONSTRAINT_QUERIES = [
    'CREATE CONSTRAINT inbox_refresh_issue_key_unique IF NOT EXISTS FOR (i:InboxCredential) REQUIRE (i.refreshIssueKey) IS UNIQUE',
    'CREATE CONSTRAINT inbox_refresh_publication_key_unique IF NOT EXISTS FOR (p:InboxRefreshPublication) REQUIRE (p.refreshIdempotencyKey) IS UNIQUE',
    'CREATE CONSTRAINT inbox_refresh_version_key_unique IF NOT EXISTS FOR (p:InboxRefreshPublication) REQUIRE (p.refreshVersionKey) IS UNIQUE',
    'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE',
    'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE',
    'CREATE CONSTRAINT credential_refresh_idempotency_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshIdempotencyKey) IS UNIQUE',
    'CREATE CONSTRAINT credential_refresh_email_delivery_key_unique IF NOT EXISTS FOR (d:CredentialRefreshEmailDelivery) REQUIRE (d.deliveryKey) IS UNIQUE',
    'CREATE CONSTRAINT refresh_send_intent_key_unique IF NOT EXISTS FOR (i:RefreshSendIntent) REQUIRE (i.intentKey) IS UNIQUE',
];

type Neo4jSchemaError = {
    code?: string;
    retriable?: boolean;
};

const MAX_ATTEMPTS = 5;

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const isEquivalentSchemaRuleRace = (error: unknown): boolean =>
    (error as Neo4jSchemaError | undefined)?.code ===
    'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists';

// Same retry rule as the index setup in models/index.ts: transient errors and deadlocks
// (schema locks contended by other cold starts) are retried with a short backoff.
const isRetriable = (error: unknown): boolean => {
    const neo4jError = error as Neo4jSchemaError | undefined;

    return (
        neo4jError?.retriable === true ||
        neo4jError?.code === 'Neo.TransientError.Transaction.DeadlockDetected'
    );
};

const runConstraintQuery = async (query: string): Promise<void> => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await neogma.queryRunner.run(query);
            return;
        } catch (error) {
            // Concurrent service starts can both observe a missing rule before one wins
            // creation. The losing CREATE is equivalent to the desired ready state.
            if (isEquivalentSchemaRuleRace(error)) return;
            if (!isRetriable(error) || attempt === MAX_ATTEMPTS) throw error;

            await wait(100 * attempt);
        }
    }
};

const createCredentialRefreshConstraints = async (): Promise<void> => {
    for (const query of CREDENTIAL_REFRESH_CONSTRAINT_QUERIES) {
        await runConstraintQuery(query);
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
