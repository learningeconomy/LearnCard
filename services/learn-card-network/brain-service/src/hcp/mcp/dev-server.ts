/**
 * Local HCP OAuth AS + MCP tools for Claude Code / curl.
 *
 * Does not bind 4319/3319.
 *
 *   bun --conditions=development src/hcp/mcp/dev-server.ts
 *   bun --conditions=development src/hcp/mcp/dev-server.ts 18766
 *
 * Env:
 *  - HCP_MCP_DEV_STORE=neo4j: use the brain's Neo4j HCP store (same deps as the v1
 *    router), so grants the local app creates are the ones tokens bind to. Needs the
 *    brain's env (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, SEED, DOMAIN_NAME).
 *    Default: an in-memory harness seeded with one grant and one entry.
 *  - HCP_OAUTH_CONSENT_APP_URL: the LearnCard app that takes consent
 *    (default http://localhost:3000).
 *  - HCP_OAUTH_TOKEN_SECRET: HS256 secret; the brain must use the same one to verify
 *    request tickets and sign consent assertions (default: a local-dev constant).
 *  - HCP_OAUTH_ISSUER_URL: the AS's public base URL (issuer, PRM resource, client DID
 *    host); must equal the brain's HCP_OAUTH_ISSUER_URL. Default http://127.0.0.1:<port>.
 *    The server still listens on 127.0.0.1:<port>; the URL must reach it.
 *  - HCP_OAUTH_DEV_TYPED_CONSENT=1: serve the dev typed subject/grant form instead of
 *    the app handoff. No DID auth; refused when NODE_ENV is production.
 */
import { createServer } from 'node:http';

import type { HcpV1Deps } from '../v1/service/deps';
import { createGrant } from '../v1/service/grants';
import { createEntry } from '../v1/service/entries';
import {
    CLIENT_DID,
    SUBJECT_DID,
    entryInput,
    grantInput,
    makeHarness,
    subject,
} from '../v1/service/test-harness';
import { devIssuerUrl, hcpOAuthEnvironment } from '../oauth/environment';
import { createHcpMcpApp, HCP_MCP_PATH } from './app';

const DEFAULT_PORT = 8766;
const LOCAL_DEV_TOKEN_SECRET = 'local-dev-only-hcp-oauth-secret-change-me';

const portArg = process.argv[2];
const port = portArg ? Number.parseInt(portArg, 10) : DEFAULT_PORT;
if (!Number.isFinite(port) || port <= 0) {
    console.error(`Invalid port: ${portArg}`);
    process.exit(1);
}

/** In-memory harness with a grant covering every PRM scope and one entry. */
const memoryDeps = async (): Promise<{ deps: HcpV1Deps; seeded: Record<string, string> }> => {
    const harness = makeHarness();
    // The dev typed form needs a pre-issued grant covering every PRM scope.
    const grant = await createGrant(
        harness.deps,
        subject,
        grantInput({
            actions: ['read', 'write'],
            categories: ['general_preferences', 'health_context', 'education_learner_profile'],
        })
    );
    await createEntry(
        harness.deps,
        subject,
        entryInput({ value: 'Prefers concise answers and dark mode' })
    );
    return {
        deps: harness.deps,
        seeded: { subjectDid: SUBJECT_DID, clientDid: CLIENT_DID, grantId: grant.grantId },
    };
};

const neo4jDeps = async (): Promise<{ deps: HcpV1Deps; seeded: Record<string, string> }> => {
    const { createNeo4jHcpV1DepsFactory } = await import('../v1/neo4j-deps');
    return { deps: createNeo4jHcpV1DepsFactory()(), seeded: {} };
};

const main = async () => {
    const env = hcpOAuthEnvironment();
    const mode = env.HCP_MCP_DEV_STORE;
    const { deps, seeded } = mode === 'neo4j' ? await neo4jDeps() : await memoryDeps();
    const devTypedConsent = env.HCP_OAUTH_DEV_TYPED_CONSENT === '1';
    const consentAppUrl = env.HCP_OAUTH_CONSENT_APP_URL;
    // Listens on 127.0.0.1:<port>; advertises HCP_OAUTH_ISSUER_URL when set.
    const baseUrl = devIssuerUrl(env, port);
    const app = createHcpMcpApp({
        store: deps.store,
        hcp: deps,
        issuerUrl: baseUrl,
        resourceUrl: baseUrl,
        tokenSecret: env.HCP_OAUTH_TOKEN_SECRET ?? LOCAL_DEV_TOKEN_SECRET,
        now: deps.now,
        consentAppUrl,
        devTypedConsent,
    });

    const server = createServer(app);
    await new Promise<void>((resolve, reject) => {
        server.listen(port, '127.0.0.1', resolve);
        server.on('error', reject);
    });

    console.log(
        JSON.stringify(
            {
                baseUrl,
                listen: `http://127.0.0.1:${port}`,
                store: mode,
                consent: devTypedConsent ? 'dev typed form' : `${consentAppUrl}/hcp/connect`,
                prm: `${baseUrl}/.well-known/oauth-protected-resource`,
                as: `${baseUrl}/.well-known/oauth-authorization-server`,
                mcp: `${baseUrl}${HCP_MCP_PATH}`,
                probe: `${baseUrl}/hcp/oauth/v1/probe`,
                ...seeded,
                brainEnv: `HCP_OAUTH_ISSUER_URL=${baseUrl} (and the same HCP_OAUTH_TOKEN_SECRET)`,
                claudeMcpAdd: `claude mcp add --transport http hcp-local ${baseUrl}${HCP_MCP_PATH}`,
                claudeMcpLogin: 'claude mcp login hcp-local',
                consentHint: devTypedConsent
                    ? 'On the dev typed form, paste subjectDid + grantId from this JSON (local only).'
                    : 'Sign in to the LearnCard app in the browser that opens, then Allow.',
                curlPrm: `curl -s ${baseUrl}/.well-known/oauth-protected-resource | jq .`,
            },
            null,
            2
        )
    );
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
