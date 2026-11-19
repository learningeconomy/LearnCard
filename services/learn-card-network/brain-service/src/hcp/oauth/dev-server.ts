/**
 * Local HCP OAuth AS for curl / Claude Code discovery checks.
 *
 * Does not bind 4319/3319. Seeds a memory grant and prints subject/grant ids.
 *
 *   bun --conditions=development src/hcp/oauth/dev-server.ts
 *   bun --conditions=development src/hcp/oauth/dev-server.ts 18765
 */
import { createServer } from 'node:http';

import { createGrant } from '../v1/service/grants';
import {
    CLIENT_DID,
    SUBJECT_DID,
    grantInput,
    makeHarness,
    subject,
} from '../v1/service/test-harness';
import { createHcpOAuthApp } from './app';

const DEFAULT_PORT = 8765;
const LOCAL_DEV_TOKEN_SECRET = 'local-dev-only-hcp-oauth-secret-change-me';

const portArg = process.argv[2];
const port = portArg ? Number.parseInt(portArg, 10) : DEFAULT_PORT;
if (!Number.isFinite(port) || port <= 0) {
    console.error(`Invalid port: ${portArg}`);
    process.exit(1);
}

const main = async () => {
    const harness = makeHarness();
    const grant = await createGrant(harness.deps, subject, grantInput());
    const baseUrl = `http://127.0.0.1:${port}`;
    const app = createHcpOAuthApp({
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
                probe: `${baseUrl}/hcp/oauth/v1/probe`,
                subjectDid: SUBJECT_DID,
                clientDid: CLIENT_DID,
                grantId: grant.grantId,
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
