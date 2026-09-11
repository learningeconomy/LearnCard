/** Execute the embedded Understand snippets with local network/cloud/API endpoints. */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { getLearnCard, getLearnCardForUser } from './helpers/learncard.helpers';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets/understand');
const files = [
    'dids.mjs',
    'uris.mjs',
    'issue-on-consent.mjs',
    'read-verifiable-data.mjs',
    'compose-plugins.mjs',
    'add-plugin.mjs',
    'export-import-bundle.mjs',
];
let runDir: string;

const environment = (): Record<string, string> => ({
    SECURE_SEED: randomBytes(32).toString('hex'),
    PROFILE_ID: `understand-${randomBytes(6).toString('hex')}`,
    LCA_API_URL: 'http://localhost:5200/trpc',
});

const run = (name: string, env: Record<string, string>): string =>
    execFileSync(process.execPath, [join(runDir, name)], {
        cwd: runDir,
        env: { ...process.env, ...env },
        encoding: 'utf8',
        timeout: 120_000,
    }).trim();

beforeAll(async () => {
    runDir = mkdtempSync(join(tmpdir(), 'docs-understand-'));
    // Keep runtime files outside the checkout while resolving workspace packages.
    symlinkSync(resolve(__dirname, '../../../node_modules'), join(runDir, 'node_modules'), 'dir');
    for (const name of files) {
        const source = readFileSync(join(SNIPPETS, name), 'utf8');
        if (!['compose-plugins.mjs', 'add-plugin.mjs'].includes(name)) {
            expect(source).toContain('network: true');
        }
        writeFileSync(
            join(runDir, name),
            source.replaceAll(
                'network: true',
                "network: 'http://localhost:4000/trpc', cloud: { url: 'http://localhost:4100/trpc' }"
            )
        );
    }
    await getLearnCardForUser('b');
}, 60_000);

afterAll(() => {
    if (runDir) rmSync(runDir, { recursive: true, force: true });
});

describe('Understand: dids.mjs', () => {
    test('prints the profile DID, seed DID, and public key metadata', async () => {
        const env = environment();
        const before = await getLearnCard(env.SECURE_SEED);
        await before.invoke.getProfile();
        expect(before.id.did()).toBe(before.id.did('key'));
        const output = run('dids.mjs', env);
        expect(output).toMatch(/^profile: did:web:/m);
        expect(output).toContain(`key: ${before.id.did('key')}`);
        expect(output).toMatch(/^keypair: OKP Ed25519$/m);
        const after = await getLearnCard(env.SECURE_SEED);
        await after.invoke.getProfile();
        expect(output).toContain(`profile: ${after.id.did()}`);
    }, 150_000);
});

describe('Understand: uris.mjs', () => {
    test('round-trips an OBv3 credential through LearnCloud', () => {
        expect(run('uris.mjs', environment())).toBe('prefix: lc:cloud:\nequal: true');
    }, 150_000);
});

describe('Understand: issue-on-consent.mjs', () => {
    test('creates a contract and automatically issues to the consenting learner', async () => {
        const output = run('issue-on-consent.mjs', environment());
        expect(output).toMatch(/^contract: lc:network:/);
        const contractUri = output.slice('contract: '.length);
        const b = await getLearnCardForUser('b');
        const { termsUri } = await b.invoke.consentToContract(contractUri, {
            terms: {
                read: {
                    personal: {},
                    credentials: {
                        shareAll: false,
                        sharing: true,
                        categories: { Achievement: { sharing: true, shared: [] } },
                    },
                },
                write: { personal: {}, credentials: { categories: { Achievement: true } } },
            },
        });
        const credentials = await b.invoke.getCredentialsForContract(termsUri);
        expect(credentials.records).toHaveLength(1);
        expect(credentials.records[0]?.category).toBe('Achievement');
        const transactions = await b.invoke.getConsentFlowTransactions(termsUri);
        expect(transactions.records.some(transaction => transaction.action === 'write')).toBe(true);
    }, 180_000);
});

describe('Understand: read-verifiable-data.mjs', () => {
    test('reads only the consented Pay Rate payload and rejects withdrawn consent', async () => {
        const env = environment();
        const a = await getLearnCard(env.SECURE_SEED);
        await a.invoke.createProfile({
            profileId: env.PROFILE_ID!,
            displayName: 'Pay Rate Reader',
            bio: '',
            shortBio: '',
        });
        const b = await getLearnCardForUser('b');
        const dataPayload = { salary: '85000', salaryType: 'per_year' };
        const credential = await b.invoke.issueCredential({
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                {
                    VerifiableData:
                        'https://docs.learncard.com/schemas/credentials/verifiable-data#VerifiableData',
                    dataKey:
                        'https://docs.learncard.com/schemas/credentials/verifiable-data#dataKey',
                    dataPayload: {
                        '@id': 'https://docs.learncard.com/schemas/credentials/verifiable-data#dataPayload',
                        '@type': '@json',
                    },
                },
            ],
            type: ['VerifiableCredential', 'VerifiableData'],
            issuer: b.id.did(),
            validFrom: new Date().toISOString(),
            credentialSubject: { id: b.id.did(), dataKey: 'skill-profile-salary', dataPayload },
        });
        if (!b.store.LearnCloud.uploadEncrypted)
            throw new Error('LearnCloud encryption unavailable');
        const uri = await b.store.LearnCloud.uploadEncrypted(credential, {
            recipients: [a.id.did()],
        });
        const contract = {
            read: {
                personal: {},
                credentials: { categories: { 'Pay Rate': { required: false } } },
            },
            write: { personal: {}, credentials: { categories: {} } },
        };
        const contractUri = await a.invoke.createContract({ name: 'Pay Rate Example', contract });
        const { termsUri } = await b.invoke.consentToContract(contractUri, {
            terms: {
                read: {
                    personal: {},
                    credentials: {
                        shareAll: false,
                        sharing: true,
                        categories: {
                            'Pay Rate': { shareAll: false, sharing: true, shared: [uri] },
                        },
                    },
                },
                write: { personal: {}, credentials: { categories: {} } },
            },
        });
        const readerEnv = { ...env, CONTRACT_URI: contractUri, USER_DID: b.id.did() };
        expect(run('read-verifiable-data.mjs', readerEnv)).toBe(JSON.stringify(dataPayload));
        const unrelated = await a.invoke.createContract({ name: 'Not consented', contract });
        expect(() =>
            run('read-verifiable-data.mjs', { ...readerEnv, CONTRACT_URI: unrelated })
        ).toThrow();
        await b.invoke.withdrawConsent(termsUri);
        expect(() => run('read-verifiable-data.mjs', readerEnv)).toThrow();
    }, 180_000);
});

describe('Understand: compose-plugins.mjs', () => {
    test('composes DIDKit and DID Key with a 64-hex seed', async () => {
        const env = environment();
        const wallet = await getLearnCard(env.SECURE_SEED);
        expect(run('compose-plugins.mjs', env)).toBe(wallet.id.did('key'));
    }, 150_000);
});

describe('Understand: add-plugin.mjs', () => {
    test('exposes a custom method', () => {
        expect(run('add-plugin.mjs', environment())).toBe('world');
    }, 150_000);
});

describe('Understand: export-import-bundle.mjs', () => {
    test('exports, imports, and restores the original identity', async () => {
        const env = environment();
        const wallet = await getLearnCard(env.SECURE_SEED);
        await wallet.invoke.createProfile({
            profileId: env.PROFILE_ID!,
            displayName: 'Bundle Holder',
            bio: '',
            shortBio: '',
        });
        const vc = await wallet.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: wallet.id.did('key'),
            credentialSubject: { id: wallet.id.did('key') },
            validFrom: new Date().toISOString(),
        });
        if (!wallet.store.LearnCloud.uploadEncrypted)
            throw new Error('LearnCloud encryption unavailable');
        const uri = await wallet.store.LearnCloud.uploadEncrypted(vc);
        await wallet.index.LearnCloud.add({ id: 'bundle-example', uri });
        expect(run('export-import-bundle.mjs', env)).toBe('imported: 1\nrestored: true');
    }, 150_000);
});
