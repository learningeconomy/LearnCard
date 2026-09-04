/**
 * Runs the code from docs/quick-start/your-first-integration.md against the local
 * brain-service and asserts the output the page promises.
 *
 * The Markdown embeds docs/snippets/quickstart/* verbatim (enforced in CI by
 * scripts/check-docs-snippets.mjs). The snippets are copied into tests/e2e so they
 * resolve @learncard/init from this package's node_modules; the only edit made is
 * swapping the production network host for localhost.
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, resolve } from 'node:path';

import { getLearnCardForUser } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

const CLI = resolve(__dirname, '../../../packages/learn-card-cli/dist/index.js');

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/quickstart');
const LOCAL_NETWORK = 'http://localhost:4000/trpc';
const LOCAL_API = 'http://localhost:4000';
const RUN_DIR = mkdtempSync(join(resolve(__dirname, '..'), '.docs-quickstart-'));

const localize = (name: string) => {
    const source = readFileSync(join(SNIPPETS, name), 'utf8');
    const swaps: Array<[string, string]> = [
        ['network: true', `network: '${LOCAL_NETWORK}'`],
        ['https://network.learncard.com', LOCAL_API],
    ];
    let out = source;
    let swapped = 0;
    for (const [from, to] of swaps) {
        if (out.includes(from)) {
            out = out.split(from).join(to);
            swapped++;
        }
    }
    // If a snippet stops referencing production, this test would silently run against
    // production instead of localhost. Fail loudly.
    expect(swapped, `${name} must reference the production network`).toBeGreaterThan(0);
    const dest = join(RUN_DIR, name);
    writeFileSync(dest, out);
    return dest;
};

const run = (file: string, args: string[], env: Record<string, string>) =>
    execFileSync(process.execPath, [file, ...args], {
        cwd: RUN_DIR,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 90_000,
    });

const freshEnv = () => ({
    SECURE_SEED: randomBytes(32).toString('hex'),
    PROFILE_ID: `quickstart-${randomBytes(4).toString('hex')}`,
});

const freshEmail = (tag: string) => `quickstart-${tag}-${randomBytes(4).toString('hex')}@test.com`;

const lastDelivery = async () => (await fetch(`${LOCAL_API}/api/test/last-delivery`)).json();

describe('Docs: Quickstart — Send a Credential', () => {
    let sendMjs: string;
    let apiTokenMjs: string;
    let sendSh: string;
    let sendFromTemplateSh: string;

    beforeAll(() => {
        sendMjs = localize('send.mjs');
        apiTokenMjs = localize('api-token.mjs');
        sendSh = localize('send.sh');
        sendFromTemplateSh = localize('send-from-template.sh');
    });

    afterAll(() => rmSync(RUN_DIR, { recursive: true, force: true }));

    test('send.mjs: a new recipient gets "Sent." plus the same claim link that went out by email', async () => {
        const env = freshEnv();
        const recipient = freshEmail('new');

        const output = run(sendMjs, [recipient], env);
        expect(output).toMatch(
            new RegExp(`^Sent\\. ${recipient} will get an email with this claim link:\\n\\S+`, 'm')
        );

        const printedUrl = output.split('\n')[1];
        const delivery = await lastDelivery();
        expect(delivery?.templateModel?.claimUrl).toBe(printedUrl);
    });

    test('send.mjs: running it a second time is safe (profile only created once)', async () => {
        const env = freshEnv();
        const recipient = freshEmail('again');

        expect(run(sendMjs, [recipient], env)).toMatch(/^Sent\./m);
        expect(run(sendMjs, [recipient], env)).toMatch(/^Sent\./m);
    });

    test('send.mjs: a recipient with a verified email gets "Delivered." and the badge in-wallet', async () => {
        const c = await getLearnCardForUser('c');
        const email = freshEmail('verified');
        await c.invoke.addContactMethod({ type: 'email', value: email });
        const verificationToken = (await lastDelivery())?.templateModel?.verificationToken;
        await c.invoke.verifyContactMethod(verificationToken);

        const output = run(sendMjs, [email], freshEnv());
        expect(output).toContain(
            `Delivered. ${email} already uses LearnCard — the credential is in their wallet.`
        );
        expect(output).toMatch(/^Reusable template for this badge: \S+$/m);

        const incoming = await c.invoke.getIncomingCredentials();
        expect(incoming.length).toBeGreaterThan(0);
        const credential = await c.read.get(incoming[0]!.uri);
        expect(credential).toMatchObject({ name: 'Quickstart Complete' });
    });

    test('api-token.mjs + send.sh: the raw-HTTP path issues through the API', async () => {
        const env = freshEnv();
        const recipient = freshEmail('http');
        run(sendMjs, [recipient], env);

        const output = run(apiTokenMjs, [recipient], env);
        const token = output.match(/^export TOKEN=(\S+)/m)?.[1];
        expect(token, 'api-token.mjs must print `export TOKEN=...`').toBeTruthy();
        expect(existsSync(join(RUN_DIR, 'request.json'))).toBe(true);

        const response = execFileSync('sh', [sendSh], {
            cwd: RUN_DIR,
            env: { ...process.env, TOKEN: token! },
            encoding: 'utf8',
            timeout: 30_000,
        });
        expect(JSON.parse(response)).toMatchObject({
            type: 'boost',
            uri: expect.any(String),
            inbox: {
                issuanceId: expect.any(String),
                status: expect.stringMatching(/PENDING|ISSUED/),
            },
        });
    });
    test('send-from-template.sh: the no-keys path signs server-side from a template', async () => {
        const issuer = await getLearnCardForUser('a');
        const sa = await issuer.invoke.createSigningAuthority('quickstart-sa');
        if (!sa) throw new Error('signing authority creation failed');
        await issuer.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
        await issuer.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);
        const templateUri = await issuer.invoke.createBoost(testUnsignedBoost, {
            name: 'Quickstart Complete',
            type: 'achievement',
            category: 'Achievement',
        });
        const grantId = await issuer.invoke.addAuthGrant({
            name: 'quickstart-http',
            scope: 'boosts:write',
        });
        const token = await issuer.invoke.getAPITokenForAuthGrant(grantId);
        const recipient = freshEmail('template');

        const response = execFileSync('sh', [sendFromTemplateSh], {
            cwd: RUN_DIR,
            env: {
                ...process.env,
                TOKEN: token,
                TEMPLATE_URI: templateUri,
                RECIPIENT_EMAIL: recipient,
            },
            encoding: 'utf8',
            timeout: 30_000,
        });
        expect(JSON.parse(response)).toMatchObject({
            type: 'boost',
            uri: templateUri,
            inbox: {
                issuanceId: expect.any(String),
                status: 'PENDING',
                claimUrl: expect.stringMatching(/^https?:\/\//),
            },
        });
    });

    test('npx @learncard/cli send: one command creates .env, sends, and writes send.mjs', async () => {
        if (!existsSync(CLI))
            throw new Error('build @learncard/cli first: bunx nx build learn-card-cli');
        const cliDir = join(RUN_DIR, 'cli');
        execFileSync('mkdir', ['-p', cliDir]);
        writeFileSync(join(cliDir, '.gitignore'), 'node_modules\n');
        const recipient = freshEmail('cli');

        const output = execFileSync(
            process.execPath,
            [
                CLI,
                'send',
                recipient,
                '--yes',
                '--name',
                'Quickstart Org',
                '--network',
                LOCAL_NETWORK,
            ],
            { cwd: cliDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 }
        );

        expect(output).toMatch(/^Sent\. /m);
        expect(readFileSync(join(cliDir, '.env'), 'utf8')).toMatch(/^SECURE_SEED=[0-9a-f]{64}$/m);
        expect(readFileSync(join(cliDir, '.env'), 'utf8')).toMatch(
            /^PROFILE_ID=quickstart-org-[a-z0-9]{4}$/m
        );
        expect(readFileSync(join(cliDir, '.gitignore'), 'utf8')).toMatch(/^\.env$/m);
        expect(readFileSync(join(cliDir, 'send.mjs'), 'utf8')).toContain(
            'displayName: "Quickstart Org"'
        );

        expect(
            execFileSync(
                process.execPath,
                [CLI, 'send', recipient, '--yes', '--network', LOCAL_NETWORK],
                {
                    cwd: cliDir,
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'pipe'],
                    timeout: 120_000,
                }
            )
        ).toMatch(/^Sent\. /m);
    });
});
