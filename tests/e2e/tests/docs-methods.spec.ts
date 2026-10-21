/** Run the published Methods examples against the local network and LearnCloud. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { getLearnCard, getLearnCardForUser, USERS } from './helpers/learncard.helpers';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/methods');
const files = [
    'identity.mjs',
    'issue-verify.mjs',
    'store-read-index.mjs',
    'profiles.mjs',
    'connections.mjs',
    'send-accept.mjs',
    'templates.mjs',
    'did-metadata.mjs',
    'auth-grants.mjs',
];
let runDir: string;

const environment = (): Record<string, string> => ({
    SECURE_SEED: randomBytes(32).toString('hex'),
    PROFILE_ID: `methods-${randomBytes(6).toString('hex')}`,
    OTHER_PROFILE_ID: USERS.b.profileId,
});

const run = (name: string, env: Record<string, string>): string =>
    execFileSync(process.execPath, [join(runDir, name)], {
        cwd: runDir,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        timeout: 120_000,
    }).trim();

const createIssuer = async () => {
    const env = environment();
    const wallet = await getLearnCard(env.SECURE_SEED);
    await wallet.invoke.createServiceProfile({
        profileId: env.PROFILE_ID!,
        displayName: 'Methods Issuer',
        bio: '',
        shortBio: '',
    });
    return { env, wallet };
};

beforeAll(() => {
    runDir = mkdtempSync(join(tmpdir(), 'docs-methods-'));
    symlinkSync(resolve(__dirname, '../../../node_modules'), join(runDir, 'node_modules'), 'dir');
    for (const name of files) {
        const source = readFileSync(join(SNIPPETS, name), 'utf8');
        expect(source).toContain('network: true');
        writeFileSync(
            join(runDir, name),
            source.replaceAll(
                'network: true',
                "network: 'http://localhost:4000/trpc', cloud: { url: 'http://localhost:4100/trpc' }"
            )
        );
    }
});

afterAll(() => {
    if (runDir) rmSync(runDir, { recursive: true, force: true });
});

describe('Methods: identity.mjs', () => {
    test('prints only public identity metadata', () => {
        expect(run('identity.mjs', environment())).toBe('did: did:key\nkeypair: OKP Ed25519');
    }, 150_000);
});

describe('Methods: issue-verify.mjs', () => {
    test('verifies an OBv3 template and rejects tampering', () => {
        expect(run('issue-verify.mjs', environment())).toBe('valid\ninvalid');
    }, 150_000);
});

describe('Methods: store-read-index.mjs', () => {
    test('indexes and reads back an encrypted credential', () => {
        expect(run('store-read-index.mjs', environment())).toBe('indexed: true\nequal: true');
    }, 150_000);
});

describe('Methods: profiles.mjs', () => {
    test('creates, updates, and searches a service profile', () => {
        expect(run('profiles.mjs', environment())).toBe(
            'profile: found\nupdated: true\nsearch: found'
        );
    }, 150_000);
});

describe('Methods: connections.mjs', () => {
    test('requests a connection that the other profile can accept', async () => {
        const { env, wallet } = await createIssuer();
        const b = await getLearnCardForUser('b');
        expect(run('connections.mjs', env)).toBe('request: sent');
        const pending = await b.invoke.getPaginatedConnectionRequests({ limit: 100 });
        expect(pending.records.some(profile => profile.profileId === env.PROFILE_ID)).toBe(true);
        expect(await b.invoke.acceptConnectionRequest(env.PROFILE_ID!)).toBe(true);
        const connected = await wallet.invoke.getPaginatedConnections({ limit: 100 });
        expect(connected.records.some(profile => profile.profileId === USERS.b.profileId)).toBe(
            true
        );
        await wallet.invoke.disconnectWith(USERS.b.profileId);
    }, 150_000);
});

describe('Methods: send-accept.mjs', () => {
    test('sends a signed credential and lets the recipient accept it', async () => {
        const { env, wallet } = await createIssuer();
        const b = await getLearnCardForUser('b');
        expect(run('send-accept.mjs', env)).toBe('sent: true');
        const incoming = await b.invoke.getIncomingCredentials(env.PROFILE_ID);
        expect(incoming).toHaveLength(1);
        const uri = incoming[0]!.uri;
        expect(
            (await wallet.invoke.getSentCredentials(USERS.b.profileId)).some(
                record => record.uri === uri
            )
        ).toBe(true);
        expect(await b.invoke.acceptCredential(uri)).toBe(true);
        const received = await b.invoke.getReceivedCredentials(env.PROFILE_ID);
        expect(received.some(record => record.uri === uri)).toBe(true);
    }, 150_000);
});

describe('Methods: templates.mjs', () => {
    test('publishes a draft and includes the pending recipient', async () => {
        const { env } = await createIssuer();
        const b = await getLearnCardForUser('b');
        expect(run('templates.mjs', env)).toBe('draft: true\nlive: true\nrecipient: found');
        expect(await b.invoke.getIncomingCredentials(env.PROFILE_ID)).toHaveLength(1);
    }, 150_000);
});

describe('Methods: did-metadata.mjs', () => {
    test('retrieves and deletes the metadata record using its returned ID', async () => {
        const { env } = await createIssuer();
        expect(run('did-metadata.mjs', env)).toBe('metadata: found\ndeleted: true');
    }, 150_000);
});

describe('Methods: auth-grants.mjs', () => {
    test('creates a scoped token without logging it and revokes its grant', async () => {
        const { env } = await createIssuer();
        expect(run('auth-grants.mjs', env)).toBe(
            'token: created\nscope: boosts:read\nrevoked: true'
        );
    }, 150_000);
});
