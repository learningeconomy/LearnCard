import { describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initLearnCard } from '@learncard/init';

import { createOwnedServiceFetch } from './cli-verify-fetch';
import { DIDKIT_WASM_PATH, stackEndpoints } from './constants';
import { runLearnCardCli } from './learncard-cli';

describe('CLI verification fetch confinement', () => {
    it('allows owned responses but refuses other origins and redirects before contacting them', async () => {
        let foreignRequests = 0;
        const foreign = Bun.serve({
            hostname: '127.0.0.1',
            port: 0,
            fetch: () => {
                foreignRequests += 1;
                return new Response('not owned');
            },
        });
        const owned = Bun.serve({
            hostname: '127.0.0.1',
            port: 0,
            fetch: request =>
                new URL(request.url).pathname === '/redirect'
                    ? Response.redirect(foreign.url, 302)
                    : new Response('owned document'),
        });
        const violations: string[] = [];
        const fetchOwned = createOwnedServiceFetch([owned.url.href], message =>
            violations.push(message)
        );
        try {
            expect(await (await fetchOwned(owned.url)).text()).toBe('owned document');
            await expect(fetchOwned(foreign.url)).rejects.toThrow('non-owned origin');
            await expect(fetchOwned(new Request(foreign.url))).rejects.toThrow('non-owned origin');
            await expect(
                fetchOwned(new URL('/redirect', owned.url), { redirect: 'follow' })
            ).rejects.toThrow('refused redirect');
            expect(foreignRequests).toBe(0);
            expect(violations).toHaveLength(3);
        } finally {
            await owned.stop(true);
            await foreign.stop(true);
        }
    });

    it('runs real CLI/WASM verification and rejects foreign issuer/context documents without fetching', async () => {
        let foreignRequests = 0;
        const foreign = Bun.serve({
            hostname: 'localhost',
            port: 0,
            fetch: () => {
                foreignRequests += 1;
                return Response.json({});
            },
        });
        const workdir = await mkdtemp(join(tmpdir(), 'lc-cli-verify-policy-'));
        const stack = stackEndpoints({
            app: 33001,
            brain: foreign.port === 33002 ? 34002 : 33002,
            cloud: foreign.port === 33003 ? 34003 : 33003,
            api: foreign.port === 33004 ? 34004 : 33004,
            neo4j: 33005,
            mongo: 33006,
            partner: 33007,
        });
        try {
            const learnCard = await initLearnCard({
                seed: '1'.repeat(64),
                didkit: readFile(DIDKIT_WASM_PATH),
            });
            const credential = learnCard.invoke.newCredential({ type: 'achievement' });
            credential.issuer = learnCard.id.did();
            const signed = await learnCard.invoke.issueCredential(credential);
            const file = join(workdir, 'credential.json');
            await writeFile(file, JSON.stringify(signed));
            const valid = await runLearnCardCli(
                ['verify', file, '--json'],
                workdir,
                undefined,
                stack
            );
            expect(valid.exitCode).toBe(0);
            expect(valid.json).toMatchObject({
                errors: [],
                checks: expect.arrayContaining(['proof']),
            });

            const remoteDid = `did:web:localhost%3A${foreign.port}`;
            const remoteIssuer = {
                ...signed,
                issuer: remoteDid,
                proof: {
                    ...(Array.isArray(signed.proof) ? signed.proof[0] : signed.proof),
                    verificationMethod: `${remoteDid}#key-1`,
                },
            };
            await writeFile(file, JSON.stringify(remoteIssuer));
            const issuerResult = await runLearnCardCli(
                ['verify', file, '--json'],
                workdir,
                undefined,
                stack
            );
            expect(issuerResult.exitCode).not.toBe(0);
            expect(issuerResult.stderr).toContain('CLI verification network policy');

            const contexts = Array.isArray(signed['@context'])
                ? signed['@context']
                : [signed['@context']];
            await writeFile(
                file,
                JSON.stringify({
                    ...signed,
                    '@context': [...contexts, new URL('/context.json', foreign.url).href],
                })
            );
            const contextResult = await runLearnCardCli(
                ['verify', file, '--json'],
                workdir,
                undefined,
                stack
            );
            expect(contextResult.exitCode).not.toBe(0);
            expect(foreignRequests).toBe(0);
        } finally {
            await foreign.stop(true);
            await rm(workdir, { recursive: true, force: true });
        }
    }, 180_000);
});
