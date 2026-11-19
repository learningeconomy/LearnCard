/**
 * Local HCP OAuth AS + MCP tools for Claude Code / curl.
 *
 * Does not bind 4319/3319. Seeds a memory grant (all PRM scopes) + one entry; prints ids.
 *
 *   bun --conditions=development src/hcp/mcp/dev-server.ts
 *   bun --conditions=development src/hcp/mcp/dev-server.ts 18766
 */
import { createServer } from 'node:http';

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
import { createHcpMcpApp, HCP_MCP_PATH } from './app';

const DEFAULT_PORT = 8766;
const LOCAL_DEV_TOKEN_SECRET = 'local-dev-only-hcp-oauth-secret-change-me';

const portArg = process.argv[2];
const port = portArg ? Number.parseInt(portArg, 10) : DEFAULT_PORT;
if (!Number.isFinite(port) || port <= 0) {
    console.error(`Invalid port: ${portArg}`);
    process.exit(1);
}

const main = async () => {
    const harness = makeHarness();
    // Claude Code requests every PRM scope on login; seed must cover them all.
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
    const baseUrl = `http://127.0.0.1:${port}`;
    const app = createHcpMcpApp({
        store: harness.store,
        hcp: harness.deps,
        issuerUrl: baseUrl,
        resourceUrl: baseUrl,
        tokenSecret: LOCAL_DEV_TOKEN_SECRET,
        now: harness.deps.now,
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
                prm: `${baseUrl}/.well-known/oauth-protected-resource`,
                as: `${baseUrl}/.well-known/oauth-authorization-server`,
                mcp: `${baseUrl}${HCP_MCP_PATH}`,
                probe: `${baseUrl}/hcp/oauth/v1/probe`,
                subjectDid: SUBJECT_DID,
                clientDid: CLIENT_DID,
                grantId: grant.grantId,
                claudeMcpAdd: `claude mcp add --transport http hcp-local ${baseUrl}${HCP_MCP_PATH}`,
                claudeMcpLogin: 'claude mcp login hcp-local',
                consentHint:
                    'On the local consent HTML, paste subjectDid + grantId from this JSON (local only).',
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
