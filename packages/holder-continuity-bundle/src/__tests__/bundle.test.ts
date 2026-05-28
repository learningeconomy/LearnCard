import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { webcrypto } from 'node:crypto';
import JSZip from 'jszip';

import { beforeAll, describe, expect, it } from 'vitest';

import { createLearnCardBundle } from '../exportBundle';
import { importLearnCardBundle, readLearnCardBundleData } from '../importBundle';
import { computePayloadSha256 } from '../manifest';
import type { JsonValue, LearnCardBundleWallet } from '../types';

const vc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:credential-1',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2024-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:holder' },
    proof: { type: 'Ed25519Signature2018', jws: 'test' },
};

const vp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:presentation-1',
    type: ['VerifiablePresentation'],
    holder: 'did:example:holder',
    verifiableCredential: [vc],
};

const createWallet = (): LearnCardBundleWallet & {
    stored: JsonValue[];
    added: Array<Record<string, unknown>>;
} => {
    const stored: JsonValue[] = [];
    const added: Array<Record<string, unknown>> = [];
    const payloads: Record<string, JsonValue | undefined> = {
        'lc:cloud:https%3A%2F%2Fcloud.example:credentials:1': vc,
        'lc:cloud:https%3A%2F%2Fcloud.example:presentations:1': vp,
        'lc:cloud:https%3A%2F%2Fcloud.example:missing:1': undefined,
    };

    return {
        stored,
        added,
        id: {
            did: method => (method ? `did:${method}:holder` : 'did:key:holder'),
            keypair: (algorithm = 'ed25519') => ({
                kty: 'OKP',
                crv: algorithm,
                d: `${algorithm}-private`,
            }),
        },
        invoke: {
            getKey: () => '1'.repeat(64),
            resolveDid: async did => ({ id: did, verificationMethod: [] }),
            getHolderExportMetadata: async () => ({
                consentRecords: [
                    {
                        termsUri: 'lc:consent:terms:1',
                        status: 'live',
                        contract: { id: 'contract-1' },
                        terms: { read: {} },
                        transactions: [{ id: 'transaction-1' }],
                    },
                ],
            }),
        },
        index: {
            LearnCloud: {
                get: async () => [
                    {
                        id: 'credential-record',
                        uri: 'lc:cloud:https%3A%2F%2Fcloud.example:credentials:1',
                        category: 'Achievement',
                        title: 'Credential',
                    },
                    {
                        id: 'duplicate-record',
                        uri: 'lc:cloud:https%3A%2F%2Fcloud.example:credentials:1',
                    },
                    {
                        id: 'presentation-record',
                        uri: 'lc:cloud:https%3A%2F%2Fcloud.example:presentations:1',
                    },
                    {
                        id: 'missing-record',
                        uri: 'lc:cloud:https%3A%2F%2Fcloud.example:missing:1',
                    },
                ],
                add: async record => {
                    added.push(record);

                    return true;
                },
            },
        },
        read: {
            get: async uri => payloads[uri],
        },
        store: {
            LearnCloud: {
                uploadEncrypted: async content => {
                    stored.push(content);

                    return `imported:${stored.length}`;
                },
            },
        },
    };
};

beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
});

describe('LearnCard holder continuity bundles', () => {
    it('computes deterministic manifest payload hashes', () => {
        const contents = [
            {
                id: 'b',
                type: 'credential' as const,
                path: 'credentials/b.json',
                mediaType: 'application/json',
                sha256: 'b',
                encrypted: false,
            },
            {
                id: 'a',
                type: 'credential' as const,
                path: 'credentials/a.json',
                mediaType: 'application/json',
                sha256: 'a',
                encrypted: false,
            },
        ];

        expect(computePayloadSha256(contents)).toBe(computePayloadSha256([...contents].reverse()));
    });

    it('round-trips encrypted entries through the existing password envelope', async () => {
        const bundle = await createLearnCardBundle(createWallet(), {
            password: 'correct horse battery staple',
            createdAt: '2024-01-01T00:00:00.000Z',
            fetchStatusLists: false,
        });

        expect(bundle.manifest.encryption.mode).toBe('argon2id-aes-256-gcm');
        expect(bundle.manifest.contents.some(entry => entry.encrypted)).toBe(true);

        const read = await readLearnCardBundleData(bundle.data, {
            password: 'correct horse battery staple',
        });

        expect(read.entries.some(entry => entry.content.includes('urn:uuid:credential-1'))).toBe(true);
    });

    it('exports fake wallet credentials, presentations, consent records, and missing URI warnings', async () => {
        const bundle = await createLearnCardBundle(createWallet(), {
            encrypt: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            fetchStatusLists: false,
        });
        const zip = await JSZip.loadAsync(bundle.data);
        const manifest = JSON.parse(
            await zip.file('manifest.json')!.async('string')
        ) as { contents: Array<Record<string, unknown>> };
        const credentialManifestEntry = manifest.contents.find(entry => entry.type === 'credential');


        expect(bundle.manifest.contents.filter(entry => entry.type === 'credential')).toHaveLength(1);
        expect(bundle.manifest.contents.filter(entry => entry.type === 'presentation')).toHaveLength(1);
        expect(bundle.manifest.contents.filter(entry => entry.type === 'consent-record')).toHaveLength(1);
        expect(bundle.warnings).toContain('Could not resolve wallet index URI lc:cloud:https%3A%2F%2Fcloud.example:missing:1');
        expect(credentialManifestEntry?.indexRecordRef).toBeDefined();
        expect(credentialManifestEntry).not.toHaveProperty('indexRecord');
        expect(credentialManifestEntry).not.toHaveProperty('title');
        expect(credentialManifestEntry).not.toHaveProperty('category');
        expect(JSON.stringify(manifest)).not.toContain('"credential-record"');
    });
    it('imports credentials and presentations into a fresh wallet store and index', async () => {
        const source = createWallet();
        const target = createWallet();
        const bundle = await createLearnCardBundle(source, {
            encrypt: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            fetchStatusLists: false,
        });
        const dir = await mkdtemp(join(tmpdir(), 'learncard-bundle-'));
        const path = join(dir, 'bundle.zip');

        await writeFile(path, bundle.data);

        const report = await importLearnCardBundle(path, { wallet: target });

        expect(report.errors).toEqual([]);
        expect(report.importedCredentials).toBe(1);
        expect(report.importedPresentations).toBe(1);
        expect(target.stored).toHaveLength(2);
        expect(target.added).toHaveLength(2);
        expect(target.added[0]?.sourceExport).toMatchObject({
            manifestCreatedAt: '2024-01-01T00:00:00.000Z',
            credentialId: 'urn:uuid:credential-1',
        });
    });
});
