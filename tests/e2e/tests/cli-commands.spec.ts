/**
 * Every `npx @learncard/cli` command, run in ONE folder against the local network,
 * the way the Build docs promise: each command reuses the .env the previous one wrote.
 *
 * One test on purpose: the e2e harness wipes every database afterEach, and this
 * suite is about state carrying over from one command to the next.
 */
import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

import { initLearnCard } from '@learncard/init';
import { getLearnCardForUser } from './helpers/learncard.helpers';

const CLI = resolve(__dirname, '../../../packages/learn-card-cli/dist/index.js');
const NETWORK = 'http://localhost:4000/trpc';
const REST = 'http://localhost:4000';
const LCA_API_URL = 'http://localhost:5200/api';
const WEBHOOK_PORT = 8791;
/** The brain container reaches the host through this name in Docker Desktop. */
const WEBHOOK_URL = `http://host.docker.internal:${WEBHOOK_PORT}`;

let dir: string;

const env = (): Record<string, string> => {
    const text = readFileSync(join(dir, '.env'), 'utf8');
    return Object.fromEntries(
        text
            .split('\n')
            .filter(l => /^\w+=/.test(l))
            .map(l => {
                const [k, ...v] = l.split('=');
                return [k, v.join('=').replace(/^"|"$/g, '')];
            })
    );
};

const cliRaw = (...args: string[]) =>
    execFileSync(process.execPath, [CLI, ...args], {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 120_000,
        env: { ...process.env, LCA_API_URL },
    });

const cli = (...args: string[]) =>
    execFileSync(process.execPath, [CLI, ...args, '-y', '--network', NETWORK], {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 120_000,
        env: { ...process.env, LCA_API_URL },
    });

const claimFromEmail = async (email: string) => {
    for (let i = 0; i < 40; i++) {
        const d = await (await fetch(`${REST}/api/test/last-delivery`)).json();
        if (d?.contactMethod?.value === email) {
            const m = d.templateModel.claimUrl.match(
                /\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)/
            );
            const url = `${REST}/api/workflows/${m[1]}/exchanges/${m[2]}`;
            const b = await initLearnCard({
                seed: randomBytes(32).toString('hex'),
                network: NETWORK,
            });
            const { verifiablePresentationRequest: vpr } = await (
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}',
                })
            ).json();
            const vp = await b.invoke.getDidAuthVp({
                challenge: vpr.challenge,
                domain: vpr.domain,
            });
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verifiablePresentation: vp }),
            });
            return res.status;
        }
        await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`no delivery to ${email}`);
};

describe('CLI: one folder, every command', () => {
    beforeAll(() => {
        if (!existsSync(CLI))
            throw new Error('build @learncard/cli first: bunx nx build learn-card-cli');
        dir = mkdtempSync(join(tmpdir(), 'lc-cli-'));
        symlinkSync(resolve(__dirname, '../../../node_modules'), join(dir, 'node_modules'));
    });

    afterAll(() => {
        if (!process.env.KEEP_CLI_DIR) rmSync(dir, { recursive: true, force: true });
    });

    test('every command, one folder, one .env', async () => {
        // setup-signing creates identity + profile + primary signing authority, idempotently
        {
            const out = cli('setup-signing');
            expect(out).toContain('LearnCard will now sign credentials for');
            expect(out).toContain('setPrimaryRegisteredSigningAuthority');
            const e = env();
            expect(e.SECURE_SEED).toMatch(/^[0-9a-f]{64}$/);
            expect(e.PROFILE_ID).toBeTruthy();
            expect(e.NETWORK_URL).toBe(NETWORK);
            expect(e.SIGNING_AUTHORITY_NAME).toBe('default-issuer');

            const again = cli('setup-signing');
            expect(again).toContain('is already your primary');
            expect(env().SECURE_SEED).toBe(e.SECURE_SEED);
        }

        // send --template creates one template and reuses it; generated file runs standalone
        {
            const first = cli(
                'send',
                `cli-a-${randomBytes(3).toString('hex')}@test.com`,
                '--template'
            );
            expect(first).toMatch(/^Sent\./m);
            const templateUri = env().TEMPLATE_URI;
            expect(templateUri).toMatch(/^lc:network:.*:boost:/);

            const second = cli(
                'send',
                `cli-b-${randomBytes(3).toString('hex')}@test.com`,
                '--template'
            );
            expect(second).toContain(templateUri);
            expect(env().TEMPLATE_URI).toBe(templateUri);

            const generated = readFileSync(join(dir, 'send-from-template.mjs'), 'utf8');
            expect(generated).toContain(`network: '${NETWORK}'`);
            const run = execFileSync(
                process.execPath,
                [
                    '--env-file=.env',
                    'send-from-template.mjs',
                    `cli-c-${randomBytes(3).toString('hex')}@test.com`,
                ],
                { cwd: dir, encoding: 'utf8', timeout: 60_000 }
            );
            expect(run).toMatch(/^Sent\./m);
        }

        // token writes API_TOKEN + send.sh, and send.sh sends over HTTP
        {
            const out = cli('token');
            expect(out).toContain('Wrote API_TOKEN and API_TOKEN_SCOPE to .env');
            expect(out).toContain('Wrote ./send.sh');
            const e = env();
            expect(e.API_TOKEN!.split('.')).toHaveLength(3);
            expect(e.API_TOKEN_SCOPE).toBe('boosts:write');
            expect(e.TEMPLATE_URI).toMatch(/^lc:network:/);

            writeFileSync(
                join(dir, 'request.json'),
                JSON.stringify({
                    type: 'boost',
                    recipient: `cli-http-${randomBytes(3).toString('hex')}@test.com`,
                    templateUri: e.TEMPLATE_URI,
                })
            );
            const res = execFileSync('sh', ['./send.sh'], {
                cwd: dir,
                encoding: 'utf8',
                timeout: 60_000,
            });
            expect(JSON.parse(res.slice(res.indexOf('{')))).toMatchObject({
                type: 'boost',
                inbox: { status: 'PENDING' },
            });
        }

        // verify: valid passes, tampered fails, revoke flips status
        {
            const e = env();
            const issuer = await initLearnCard({ seed: e.SECURE_SEED!, network: NETWORK });
            const recipient = await getLearnCardForUser('b');

            const vc = await issuer.invoke.issueCredential(
                issuer.invoke.newCredential({ type: 'achievement' })
            );
            writeFileSync(join(dir, 'vc.json'), JSON.stringify(vc));
            writeFileSync(join(dir, 'bad.json'), JSON.stringify({ ...vc, name: 'tampered' }));

            expect(cliRaw('verify', 'vc.json')).toMatch(/✓ proof/);
            expect(() => cliRaw('verify', 'bad.json')).toThrow();
            expect(
                execFileSync('sh', ['-c', `cat vc.json | node ${CLI} verify -`], {
                    cwd: dir,
                    encoding: 'utf8',
                })
            ).toMatch(/✓ proof/);

            const bProfile = await recipient.invoke.getProfile();
            const sent = await issuer.invoke.send({
                type: 'boost',
                recipient: bProfile!.profileId,
                templateUri: e.TEMPLATE_URI!,
            });
            const incoming = await recipient.invoke.getIncomingCredentials();
            const mine = incoming.find(c => c.uri === sent.credentialUri) ?? incoming[0]!;
            await recipient.invoke.acceptCredential(mine.uri);
            const credentialUri = sent.credentialUri || mine.uri;

            expect(cli('revoke', credentialUri)).toContain('Revoked');

            const verifier = await initLearnCard({
                seed: randomBytes(32).toString('hex'),
                network: NETWORK,
            });
            writeFileSync(
                join(dir, 'revoked.json'),
                JSON.stringify(await verifier.read.get(credentialUri))
            );
            let status = '';
            try {
                cliRaw('verify', 'revoked.json');
            } catch (err) {
                status = String((err as { stdout?: string }).stdout ?? '');
            }
            expect(status).toMatch(/✗ status: Status: Revoked/);
        }

        // embed sets up an integration and writes claim-button.html with the key
        {
            const out = cli('embed');
            expect(out).toMatch(/Publishable key: pk_/);
            const e = env();
            expect(e.INTEGRATION_ID).toBeTruthy();
            expect(e.PUBLISHABLE_KEY).toMatch(/^pk_/);
            const html = readFileSync(join(dir, 'claim-button.html'), 'utf8');
            expect(html).toContain(e.PUBLISHABLE_KEY);
            expect(html).not.toContain('PUBLISHABLE_KEY_PLACEHOLDER');

            cli('embed');
            expect(env().INTEGRATION_ID).toBe(e.INTEGRATION_ID);
        }

        // consent-contract creates once; a consenting user is readable; callback verifies a real vp
        {
            const out = cli('consent-contract');
            expect(out).toContain('consent-flow?uri=');
            const e = env();
            expect(e.CONTRACT_URI).toMatch(/^lc:network:.*:contract:/);
            cli('consent-contract');
            expect(env().CONTRACT_URI).toBe(e.CONTRACT_URI);

            const user = await initLearnCard({
                seed: randomBytes(32).toString('hex'),
                network: NETWORK,
            });
            await user.invoke.createProfile({
                profileId: `cli-consenter-${randomBytes(3).toString('hex')}`,
                displayName: 'Consenter',
                bio: '',
                shortBio: '',
            });
            await user.invoke.consentToContract(e.CONTRACT_URI!, {
                terms: {
                    read: {
                        personal: { name: 'Casey' },
                        credentials: {
                            shareAll: false,
                            sharing: true,
                            categories: { Achievement: { sharing: true, shared: [] } },
                        },
                    },
                    write: { personal: {}, credentials: { categories: { Achievement: true } } },
                },
            });
            const presentation = {
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiablePresentation'],
                holder: user.id.did(),
                contractUri: e.CONTRACT_URI!,
            };
            const issued: unknown = await user.invoke.issuePresentation(presentation, {
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
            });
            if (typeof issued !== 'string') throw new Error('Expected JWT presentation');
            const vp = issued;

            const read = execFileSync(process.execPath, ['--env-file=.env', 'read-user-data.mjs'], {
                cwd: dir,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    USER_DID: user.id.did(),
                    CONSENT_VP: vp,
                },
                timeout: 60_000,
            });
            expect(read).toContain('Active consent: 1 record(s).');

            const server: ChildProcess = spawn(
                process.execPath,
                ['--env-file=.env', 'consent-callback.mjs'],
                {
                    cwd: dir,
                    stdio: 'ignore',
                }
            );
            try {
                await new Promise(r => setTimeout(r, 3000));
                const base = 'http://127.0.0.1:3000/consent-callback';
                const ok = await fetch(`${base}?did=${user.id.did()}&vp=${vp}`);
                expect(ok.status).toBe(200);
                expect(await ok.text()).toContain('Consent verified');
                expect((await fetch(`${base}?did=${user.id.did()}`)).status).toBe(400);
                expect((await fetch(`${base}?did=${user.id.did()}&vp=not.a.jwt`)).status).toBe(400);
            } finally {
                server.kill();
            }
        }

        // webhook receives ISSUANCE_DELIVERED, then ISSUANCE_CLAIMED after a real claim
        {
            const email = `cli-hook-${randomBytes(3).toString('hex')}@test.com`;
            let log = '';
            const proc: ChildProcess = spawn(
                process.execPath,
                [
                    CLI,
                    'webhook',
                    email,
                    '-y',
                    '--network',
                    NETWORK,
                    '--url',
                    WEBHOOK_URL,
                    '--port',
                    String(WEBHOOK_PORT),
                ],
                { cwd: dir, env: { ...process.env, LCA_API_URL } }
            );
            proc.stdout?.on('data', d => (log += d));
            proc.stderr?.on('data', d => (log += d));
            try {
                for (let i = 0; i < 60 && !/ISSUANCE_DELIVERED PENDING/.test(log); i++)
                    await new Promise(r => setTimeout(r, 500));
                expect(log).toMatch(/ISSUANCE_DELIVERED PENDING ([0-9a-f-]{36})/);
                const issuanceId = log.match(/ISSUANCE_DELIVERED PENDING ([0-9a-f-]{36})/)![1];

                expect(await claimFromEmail(email)).toBe(200);

                for (let i = 0; i < 60 && !/ISSUANCE_CLAIMED/.test(log); i++)
                    await new Promise(r => setTimeout(r, 500));
                expect(log).toMatch(new RegExp(`ISSUANCE_CLAIMED ISSUED ${issuanceId} did:`));
            } finally {
                proc.kill();
            }
        }

        // .env accumulated every key across the run
        {
            const keys = Object.keys(env());
            for (const k of [
                'SECURE_SEED',
                'PROFILE_ID',
                'NETWORK_URL',
                'SIGNING_AUTHORITY_NAME',
                'SIGNING_AUTHORITY_ENDPOINT',
                'TEMPLATE_URI',
                'API_TOKEN',
                'API_TOKEN_SCOPE',
                'INTEGRATION_ID',
                'PUBLISHABLE_KEY',
                'CONTRACT_URI',
                'RETURN_TO',
            ])
                expect(keys).toContain(k);
        }
    }, 300_000);
});
