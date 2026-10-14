// @vitest-environment happy-dom

import React from 'react';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { VC } from '@learncard/types';
import { VC_TEMPLATES } from '../../../../plugins/vc-templates/src/templates';
import initDidKit, {
    generateEd25519KeyFromBytes,
    issueCredential,
    keyToDID,
    keyToVerificationMethod,
    verifyCredential,
} from '../../../../plugins/didkit/src/didkit/pkg/didkit_wasm.js';

const host = vi.hoisted(() => ({
    indexGet: vi.fn(),
    readGet: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        globalAdminId: 'Global Admin ID',
        nationalNetworkAdminId: 'National Network Admin ID',
        troopLeaderId: 'Troop Leader ID',
        scoutId: 'Scout ID',
    },
    switchedProfileStore: { use: { switchedDid: () => 'did:key:test-account' } },
    useWallet: () => ({
        initWallet: async () => ({
            index: { LearnCloud: { get: host.indexGet } },
            read: { get: host.readGet },
        }),
    }),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getIssuanceDate: (vc: VC) => vc.validFrom ?? vc.issuanceDate,
}));

import { getIDsQueryKey, useGetIDs } from './idCredentials';

const STORAGE_URI = 'lc:network:example.org/trpc:credential:membership-id';
const BOOST_URI = 'lc:network:example.org/trpc:boost:membership';
let key: string;
let did: string;
let options: string;
let direct: VC;
let legacy: VC;

const issue = async (credential: object): Promise<VC> =>
    JSON.parse(await issueCredential(JSON.stringify(credential), options, key, '{}'));

const verify = async (credential: VC) =>
    JSON.parse(await verifyCredential(JSON.stringify(credential), '{}', '{}'));

const loadCredential = async (credential: VC, client = new QueryClient()) => {
    host.indexGet.mockImplementation(async ({ category }) =>
        category === 'Global Admin ID' ? [{ uri: STORAGE_URI }] : []
    );
    host.readGet.mockResolvedValue(credential);
    const { result } = renderHook(() => useGetIDs(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    return result.current.data![0];
};

beforeAll(async () => {
    await initDidKit({
        module_or_path: new Uint8Array(
            await readFile(
                resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    '../../../../plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm'
                )
            )
        ),
    });
    key = generateEd25519KeyFromBytes(new Uint8Array(32).fill(7));
    did = keyToDID('key', key);
    options = JSON.stringify({
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-rdfc-2022',
        verificationMethod: await keyToVerificationMethod('key', key),
        proofPurpose: 'assertionMethod',
    });
    const unsigned = VC_TEMPLATES.boostID(
        {
            did,
            subject: did,
            boostName: 'World Scouting',
            achievementType: 'ext:GlobalID',
            display: { displayType: 'id' },
            boostID: { idDescription: 'World Scouting membership' },
        },
        crypto
    );
    direct = await issue({ ...unsigned, boostId: BOOST_URI });
    legacy = await issue({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://ctx.learncard.com/boosts/1.0.3.json',
        ],
        type: ['VerifiableCredential', 'CertifiedBoostCredential'],
        issuer: did,
        validFrom: '2020-08-19T21:41:50Z',
        credentialSubject: { id: did },
        boostId: BOOST_URI,
        boostCredential: direct,
    });
});

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('membership IDs keep storage metadata outside signed JSON', () => {
    it.each(['direct', 'legacy'] as const)('preserves and verifies a %s signed ID', async kind => {
        const original = kind === 'direct' ? direct : legacy;
        const originalJson = JSON.stringify(original);
        const record = await loadCredential(original);

        expect(record.uri).toBe(STORAGE_URI);
        expect(record.vc).toBe(original);
        expect(record.vc).not.toHaveProperty('uri');
        expect(JSON.stringify(record.vc)).toBe(originalJson);
        const verification = await verify(record.vc);
        expect(verification.errors).toEqual([]);
        expect(verification.checks).toContain('proof');
    });

    it('reproduces the production failure when a storage URI is spread onto a direct ID', async () => {
        const enriched = { ...direct, uri: STORAGE_URI };
        expect((await verify(enriched)).errors).toContain(
            'DATA_LOSS_DETECTION_ERROR: undefined JSON-LD term'
        );
        const record = await loadCredential(direct);
        expect((await verify(record.vc)).errors).toEqual([]);
    });

    it('preserves a legitimate signed uri claim instead of stripping arbitrary VC fields', async () => {
        const unsigned = { ...direct, proof: undefined };
        const signed = await issue({
            ...unsigned,
            '@context': [
                ...unsigned['@context'],
                { uri: { '@id': 'https://example.org/credential-reference', '@type': '@id' } },
            ],
            uri: 'https://example.org/signed-reference',
        });
        const record = await loadCredential(signed);
        expect(record.uri).toBe(STORAGE_URI);
        expect(record.vc.uri).toBe('https://example.org/signed-reference');
        expect((await verify(record.vc)).errors).toEqual([]);
    });

    it('continues rejecting a tampered credential', async () => {
        const record = await loadCredential({ ...direct, name: 'Altered membership' });
        expect((await verify(record.vc)).errors.length).toBeGreaterThan(0);
    });

    it('does not hydrate old persisted flat VC+uri cache entries', async () => {
        const client = new QueryClient();
        client.setQueryData(
            ['useGetIDs', 'did:key:test-account'],
            [{ ...direct, uri: STORAGE_URI }]
        );
        const record = await loadCredential(direct, client);
        expect(record.vc).toBe(direct);
        expect(client.getQueryData(getIDsQueryKey('did:key:test-account'))).toEqual([record]);
        expect(host.readGet).toHaveBeenCalledWith(STORAGE_URI);
    });

    it('keeps newest-first ordering and omits unresolved index records', async () => {
        const unsigned = { ...direct, proof: undefined };
        const newer = await issue({ ...unsigned, validFrom: '2026-09-15T00:00:00Z' });
        const newerUri = `${STORAGE_URI}-newer`;
        host.indexGet.mockImplementation(async ({ category }) =>
            category === 'Global Admin ID'
                ? [{ uri: STORAGE_URI }, { uri: 'urn:missing' }, { uri: newerUri }]
                : []
        );
        host.readGet.mockImplementation(async (uri: string) => {
            if (uri === STORAGE_URI) return direct;
            if (uri === newerUri) return newer;
            return undefined;
        });
        const client = new QueryClient();
        const { result } = renderHook(() => useGetIDs(), {
            wrapper: ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={client}>{children}</QueryClientProvider>
            ),
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([
            { vc: newer, uri: newerUri },
            { vc: direct, uri: STORAGE_URI },
        ]);
    });
});
