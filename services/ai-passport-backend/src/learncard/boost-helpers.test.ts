import type { BoostPermissions, JWE, UnsignedVC, VC } from '@learncard/types';
import { beforeEach, expect, mock, test } from 'bun:test';

type Artifact = {
    operationId: string;
    kind: string;
    credentialId: string;
    status: 'reserved' | 'complete' | 'failed' | 'unknown';
    uris: string[];
};
const ledger = new Map<string, Artifact>();
let erased = false;
let reservationUnavailable = false;
let responseLost = false;
let eraseDuringCreation = false;
let remoteCreations = 0;
const remoteBoosts: Array<{ template: UnsignedVC; metadata: Metadata }> = [];
const issuedPayloads: Array<{ signedVc: VC; recipients: string[] }> = [];
const remoteCredentials: JWE[] = [];
const readableCredentials = new Map<string, VC>();
type Metadata = {
    name: string;
    allowAnyoneToCreateChildren: boolean;
    defaultPermissions: BoostPermissions;
    claimPermissions: BoostPermissions;
};
const assertActive = async () => {
    if (erased) throw new Error('Owner erased');
};
const db = {
    getExternalArtifacts: async () => [...ledger.values()],
    reserveExternalArtifact: async (_did: string, artifact: Omit<Artifact, 'status' | 'uris'>) => {
        await assertActive();
        if (reservationUnavailable) throw new Error('Ledger unavailable');
        ledger.set(artifact.operationId, {
            ...artifact,
            status: 'reserved',
            uris: [],
        });
    },
    completeExternalArtifact: async (
        _did: string,
        id: string,
        result: Pick<Artifact, 'uris' | 'status'>
    ) => {
        const reserved = ledger.get(id);
        if (!reserved) throw new Error('Missing reservation');
        ledger.set(id, { ...reserved, ...result });
    },
};
mock.module('../db', () => ({ db }));
mock.module('../services/dataErasure', () => ({
    assertOwnerOperationActive: assertActive,
    withOwnerOperation: async <T>(
        _did: string,
        callback: (signal: AbortSignal) => Promise<T>
    ): Promise<T> => {
        await assertActive();
        const value = await callback(new AbortController().signal);
        await assertActive();
        return value;
    },
}));
const createRemoteBoost = async (vc: UnsignedVC, kind: string, metadata: Metadata) => {
    const reservation = [...ledger.values()].find(
        entry => entry.status === 'reserved' && entry.kind === kind
    );
    if (reservation?.status !== 'reserved')
        throw new Error('Creation reached remote before durable reservation');
    remoteCreations += 1;
    remoteBoosts.push({ template: vc, metadata });
    if (eraseDuringCreation) erased = true;
    if (responseLost) throw new Error('Response lost after remote creation');
    return `lc:boost:${remoteCreations}`;
};
const learnCard = {
    id: { did: () => 'did:example:issuer' },
    read: { get: async (uri: string) => readableCredentials.get(uri) },
    invoke: {
        createBoost: async (vc: UnsignedVC, metadata: Metadata) =>
            createRemoteBoost(vc, 'boost', metadata),
        createChildBoost: async (_parent: string, vc: UnsignedVC, metadata: Metadata) =>
            createRemoteBoost(vc, 'child-boost', metadata),
        issueCredential: async (vc: UnsignedVC) => ({
            ...vc,
            proof: {
                type: 'Ed25519Signature2020',
                created: '2026-01-01T00:00:00Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:example:issuer#key-1',
                proofValue: 'synthetic-proof',
            },
        }),
        createDagJwe: async (signedVc: VC, recipients: string[]): Promise<JWE> => {
            issuedPayloads.push({ signedVc, recipients });
            return {
                protected: 'protected',
                iv: 'iv',
                ciphertext: 'opaque',
                tag: 'tag',
            };
        },
        writeCredentialToContract: async (_did: string, _contract: string, credential: JWE) => {
            if (
                ![...ledger.values()].some(
                    entry => entry.kind === 'contract-credential' && entry.status === 'reserved'
                )
            )
                throw new Error('Contract write reached remote before reservation');
            remoteCredentials.push(credential);
            const uri = `lc:contract:credential:${remoteCredentials.length}`;
            const payload = issuedPayloads.at(-1);
            if (!payload) throw new Error('Unencrypted issuance');
            readableCredentials.set(uri, payload.signedVc);
            return uri;
        },
    },
};
mock.module('./index', () => ({ getLearnCard: async () => learnCard }));
mock.module('./constants', () => ({ contractUri: 'lc:contract:test' }));
// Import after installing boundary doubles so module initialization cannot load a real wallet or database.
const { createAndPublishBoostCredential } = await import('./boost-helpers');
const { readOwnedBoostCredential } = await import('./external-artifacts');

const publish = (parentBoostUri?: string) =>
    createAndPublishBoostCredential({
        unsignedVc: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: 'http://example.org/credentials/3731',
            type: ['VerifiableCredential'],
            issuer: 'did:web:test:issuer',
            issuanceDate: '2026-09-10T00:00:00.000Z',
            credentialSubject: {
                id: 'did:web:test:subject',
                learningSummary: 'Sensitive learner history',
            },
        },
        did: 'did:web:test:subject',
        boostOptions: { status: 'LIVE', category: 'test' },
        parentBoostUri,
    });

beforeEach(() => {
    ledger.clear();
    erased = false;
    reservationUnavailable = false;
    responseLost = false;
    eraseDuringCreation = false;
    remoteCreations = 0;
    remoteBoosts.length = 0;
    issuedPayloads.length = 0;
    remoteCredentials.length = 0;
    readableCredentials.clear();
});

test('publication records genuine remote results with unique credential correlation IDs', async () => {
    const parent = await publish();
    const child = await publish(parent.boostUri);
    expect(parent.signedVc.id).not.toBe(child.signedVc.id);
    expect(parent.signedVc.id).toMatch(/^urn:uuid:/);
    expect(
        [...ledger.values()].map(({ kind, status, uris }) => ({
            kind,
            status,
            uris,
        }))
    ).toEqual([
        { kind: 'boost', status: 'complete', uris: [parent.boostUri] },
        {
            kind: 'contract-credential',
            status: 'complete',
            uris: [parent.contractCredentialUri],
        },
        { kind: 'child-boost', status: 'complete', uris: [child.boostUri] },
        {
            kind: 'contract-credential',
            status: 'complete',
            uris: [child.contractCredentialUri],
        },
    ]);
});

test('a failed reservation prevents any remote creation', async () => {
    reservationUnavailable = true;
    await expect(publish()).rejects.toThrow('Ledger unavailable');
    expect(remoteCreations).toBe(0);
    expect(ledger.size).toBe(0);
});

test('a lost response remains an unknown external effect rather than a false failure', async () => {
    responseLost = true;
    await expect(publish()).rejects.toThrow('Response lost');
    expect([...ledger.values()]).toMatchObject([
        {
            kind: 'boost',
            status: 'unknown',
            uris: [],
            credentialId: expect.stringMatching(/^urn:uuid:/),
        },
    ]);
    expect(remoteCreations).toBe(1);
});

test('an in-flight result survives owner erasure without starting another remote creation', async () => {
    eraseDuringCreation = true;
    await expect(publish()).rejects.toThrow('Owner erased');
    expect([...ledger.values()]).toMatchObject([
        { kind: 'boost', status: 'complete', uris: ['lc:boost:1'] },
    ]);
    expect(ledger.size).toBe(1);
    expect(remoteCreations).toBe(1);
});

test('public creation windows contain no learner data and contract writes contain only ciphertext', async () => {
    const parent = await publish();
    await publish(parent.boostUri);
    for (const { template, metadata } of remoteBoosts) {
        expect(template.credentialSubject).toEqual({});
        expect(template.id).toBeUndefined();
        expect(JSON.stringify({ template, metadata })).not.toContain('Sensitive learner history');
        expect(JSON.stringify({ template, metadata })).not.toContain('did:web:test:subject');
        expect(metadata.defaultPermissions.canView).toBe(false);
        expect(metadata.defaultPermissions.canIssue).toBe(false);
        expect(metadata.claimPermissions.canView).toBe(false);
        expect(metadata.allowAnyoneToCreateChildren).toBe(false);
    }
    expect(parent.signedVc.credentialSubject).toEqual({
        id: 'did:web:test:subject',
        learningSummary: 'Sensitive learner history',
    });
    expect(issuedPayloads[0]).toEqual({
        signedVc: parent.signedVc,
        recipients: ['did:web:test:subject', 'did:example:issuer'],
    });
    expect(remoteCredentials[0]).toEqual({
        protected: 'protected',
        iv: 'iv',
        ciphertext: 'opaque',
        tag: 'tag',
    });
});

test("private resume reads the full owner's issued credential rather than the generic template", async () => {
    const published = await publish();
    expect(await readOwnedBoostCredential('did:web:test:subject', published.boostUri)).toEqual(
        published.signedVc
    );
    await expect(
        readOwnedBoostCredential('did:web:test:other', published.boostUri)
    ).rejects.toThrow();
    await expect(
        readOwnedBoostCredential('did:web:test:subject', 'lc:boost:unowned')
    ).rejects.toThrow();
});

test('private resume rejects mismatched boost IDs but recovers validated legacy URI associations', async () => {
    const published = await publish();
    readableCredentials.set(published.contractCredentialUri, {
        ...published.signedVc,
        boostId: 'lc:boost:another',
    });
    await expect(
        readOwnedBoostCredential('did:web:test:subject', published.boostUri)
    ).rejects.toThrow();
    readableCredentials.set(published.contractCredentialUri, published.signedVc);
    for (const entry of ledger.values()) {
        entry.status = 'unknown';
        entry.credentialId = `legacy:${entry.kind}`;
    }
    expect(await readOwnedBoostCredential('did:web:test:subject', published.boostUri)).toEqual(
        published.signedVc
    );
    readableCredentials.clear();
    await expect(
        readOwnedBoostCredential('did:web:test:subject', published.boostUri)
    ).rejects.toThrow();
});
