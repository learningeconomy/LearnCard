/** Runs the tutorial's verbatim snippets, changing only the network to localhost. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getLearnCard, getLearnCardForUser, USERS } from './helpers/learncard.helpers';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/consentflow');
const RUN_DIR = mkdtempSync(join(resolve(__dirname, '..'), '.docs-consentflow-'));
const files = [
    'create-contract.mjs',
    'consent-callback.mjs',
    'read-user-data.mjs',
    'issue-through-contract.mjs',
    'handle-withdrawal.mjs',
];

const run = (name: string, env: Record<string, string>): string =>
    execFileSync(process.execPath, [join(RUN_DIR, name)], {
        cwd: RUN_DIR,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        timeout: 90_000,
    });

const load = (name: string) => import(pathToFileURL(join(RUN_DIR, name)).href);

describe('Docs: ConsentFlow', () => {
    beforeAll(() => {
        for (const name of files) {
            const source = readFileSync(join(SNIPPETS, name), 'utf8');
            if (name !== 'handle-withdrawal.mjs') expect(source).toContain('network: true');
            writeFileSync(
                join(RUN_DIR, name),
                source.replaceAll('network: true', "network: 'http://localhost:4000/trpc'")
            );
        }
    });

    afterAll(() => rmSync(RUN_DIR, { recursive: true, force: true }));

    test('create, verify, read only this learner, issue, and remove access after withdrawal', async () => {
        const env = {
            SECURE_SEED: randomBytes(32).toString('hex'),
            PROFILE_ID: `consent-docs-${randomBytes(4).toString('hex')}`,
            RETURN_TO: 'https://example.com/consent-callback',
        };
        const { contractUri, consentUrl } = JSON.parse(run('create-contract.mjs', env));
        expect(contractUri).toMatch(/^lc:network:/);
        const url = new URL(consentUrl);
        expect(url.origin + url.pathname).toBe('https://learncard.app/consent-flow');
        expect(url.searchParams.get('uri')).toBe(contractUri);
        expect(url.searchParams.get('returnTo')).toBe(env.RETURN_TO);

        const learnCard = await getLearnCard(env.SECURE_SEED);
        const b = await getLearnCardForUser('b');
        const c = await getLearnCardForUser('c');
        const terms = {
            read: {
                personal: {},
                credentials: { shareAll: false, sharing: false, categories: {} },
            },
            write: { personal: {}, credentials: { categories: { Achievement: true } } },
        };
        // A different learner with a name must never be selected for B's nameless record.
        await c.invoke.consentToContract(contractUri, {
            terms: { ...terms, read: { ...terms.read, personal: { name: 'Not User B' } } },
        });
        const { termsUri } = await b.invoke.consentToContract(contractUri, { terms });
        const otherContractUri = await learnCard.invoke.createContract({
            name: 'Unrelated contract',
            contract: (await learnCard.invoke.getContract(contractUri)).contract,
        });
        await b.invoke.consentToContract(otherContractUri, {
            terms: { ...terms, read: { ...terms.read, personal: { name: 'Wrong contract' } } },
        });

        const makeVp = async (uri: string): Promise<string> => {
            const presentation = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: b.id.did(),
                contractUri: uri,
            };
            const vp: unknown = await b.invoke.issuePresentation(presentation, {
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
            });
            if (typeof vp !== 'string') throw new Error('Expected JWT presentation');
            return vp;
        };
        const vp = await makeVp(contractUri);
        const { verifyConsentRedirect, createConsentCallback } = await load('consent-callback.mjs');
        expect(await verifyConsentRedirect(learnCard, vp, contractUri)).toEqual({
            status: 'verified',
            userDid: b.id.did(),
        });
        expect(await verifyConsentRedirect(learnCard, null, contractUri)).toEqual({
            status: 'denied-or-abandoned',
        });
        const segments = vp.split('.');
        const payload = JSON.parse(Buffer.from(segments[1]!, 'base64url').toString('utf8'));
        expect(payload.vp).toMatchObject({ holder: b.id.did(), contractUri });
        payload.vp.holder = c.id.did();
        segments[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
        await expect(
            verifyConsentRedirect(learnCard, segments.join('.'), contractUri)
        ).rejects.toThrow();
        await expect(
            verifyConsentRedirect(learnCard, await makeVp(otherContractUri), contractUri)
        ).rejects.toThrow('Wrong consent contract');
        await expect(verifyConsentRedirect(learnCard, 'not-a-jwt', contractUri)).rejects.toThrow();

        const { readUserData } = await load('read-user-data.mjs');
        const records = await readUserData(learnCard, b.id.did(), contractUri);
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({ contractUri, personal: {}, credentials: [] });

        const server = createServer(createConsentCallback(learnCard, contractUri));
        await new Promise<void>(resolveListening =>
            server.listen(0, '127.0.0.1', resolveListening)
        );
        try {
            const address = server.address();
            if (!address || typeof address === 'string') throw new Error('Expected TCP address');
            const callback = new URL(`http://127.0.0.1:${address.port}/consent-callback`);
            callback.searchParams.set('did', c.id.did());
            expect((await fetch(callback)).status).toBe(400);
            callback.searchParams.set('vp', vp);
            const response = await fetch(callback);
            expect(response.status).toBe(200);
            expect(await response.text()).toBe('Consent verified. Active access confirmed.');
            expect(response.headers.get('cache-control')).toBe('no-store');
        } finally {
            await new Promise<void>((resolveClosed, reject) =>
                server.close(error => (error ? reject(error) : resolveClosed()))
            );
        }

        const consentEnv = { ...env, CONTRACT_URI: contractUri, CONSENT_VP: vp };
        expect(run('read-user-data.mjs', consentEnv)).toContain('Active consent: 1 record(s).');
        const output = run('issue-through-contract.mjs', consentEnv);
        expect(output).toMatch(/^Issued: lc:network:/m);
        const credentials = await b.invoke.getCredentialsForContract(termsUri);
        expect(credentials.records).toHaveLength(1);
        expect(credentials.records[0]!.category).toBe('Achievement');

        const { refreshAccess, consentCache } = await load('handle-withdrawal.mjs');
        const cacheKey = JSON.stringify([contractUri, b.id.did()]);
        expect(await refreshAccess(learnCard, b.id.did(), contractUri)).toBe(true);
        expect(consentCache.has(cacheKey)).toBe(true);
        await b.invoke.withdrawConsent(termsUri);
        expect(await learnCard.invoke.verifyConsent(contractUri, USERS.b.profileId)).toBe(false);
        expect(await readUserData(learnCard, b.id.did(), contractUri)).toEqual([]);
        expect(run('read-user-data.mjs', consentEnv)).toContain('No active consent.');
        const { issueThroughContract } = await load('issue-through-contract.mjs');
        await expect(issueThroughContract(learnCard, b.id.did(), contractUri)).rejects.toThrow(
            'No active consent'
        );
        expect(await refreshAccess(learnCard, b.id.did(), contractUri)).toBe(false);
        expect(consentCache.has(cacheKey)).toBe(false);
        const withdrawnServer = createServer(createConsentCallback(learnCard, contractUri));
        await new Promise<void>(resolveListening =>
            withdrawnServer.listen(0, '127.0.0.1', resolveListening)
        );
        try {
            const address = withdrawnServer.address();
            if (!address || typeof address === 'string') throw new Error('Expected TCP address');
            const callback = new URL(`http://127.0.0.1:${address.port}/consent-callback`);
            callback.searchParams.set('vp', vp);
            expect((await fetch(callback)).status).toBe(403);
        } finally {
            await new Promise<void>((resolveClosed, reject) =>
                withdrawnServer.close(error => (error ? reject(error) : resolveClosed()))
            );
        }
    }, 180_000);
});
