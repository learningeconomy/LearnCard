import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { gzipSync, gunzipSync } from 'node:zlib';

import { beforeEach, describe, expect, test } from 'vitest';
import { initLearnCard } from '@learncard/init';
import type { UnsignedVC, VC } from '@learncard/types';
import {
    getBitstringStatusListBit,
    getBitstringStatusListEntries,
    getBitstringStatusListEntryForPurpose,
    setBitstringStatusListBit,
} from '@learncard/helpers';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';

const MIN_BITSTRING_LENGTH = 131_072;
const REVOKED_INDEX = 7;
const UNREVOKED_INDEX = 10;

const require = createRequire(import.meta.url);
const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

const getLocalLearnCard = (seed: string) =>
    initLearnCard({
        seed,
        didkit,
        network: 'http://localhost:4000/trpc',
        cloud: { url: 'http://localhost:4100/trpc' },
    });
type LocalLearnCard = Awaited<ReturnType<typeof getLocalLearnCard>>;

const base64Url = (bytes: Buffer): string =>
    bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');

const encodeBitstringStatusList = (setIndexes: number[]): string => {
    const bytes = Buffer.alloc(MIN_BITSTRING_LENGTH / 8);

    for (const index of setIndexes) {
        setBitstringStatusListBit(bytes, index, true);
    }

    return `u${base64Url(gzipSync(bytes))}`;
};

const decodeBitstringStatusList = (
    encodedList: string,
    expectedBits = MIN_BITSTRING_LENGTH
): Buffer => {
    if (!encodedList.startsWith('u')) {
        throw new Error('Bitstring status list must use multibase base64url encoding');
    }

    const encoded = encodedList.slice(1).replace(/-/g, '+').replace(/_/g, '/');
    const compressed = Buffer.from(
        encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='),
        'base64'
    );
    const decoded = gunzipSync(compressed);
    const expectedBytes = Math.ceil(expectedBits / 8);

    if (decoded.length >= expectedBytes) return decoded;

    const padded = Buffer.alloc(expectedBytes);
    decoded.copy(padded);

    return padded;
};

const startStatusCredentialServer = async (getCredential: () => VC | undefined) => {
    let requestCount = 0;

    const server = createServer((req, res) => {
        if (req.url !== '/status-list.json') {
            res.writeHead(404).end();
            return;
        }

        const credential = getCredential();

        if (!credential) {
            res.writeHead(503).end();
            return;
        }

        requestCount += 1;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(credential));
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });

    const address = server.address() as AddressInfo;

    return {
        url: `http://127.0.0.1:${address.port}/status-list.json`,
        get requestCount() {
            return requestCount;
        },
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close(error => (error ? reject(error) : resolve()));
            }),
    };
};

const issueStatusListCredential = async (
    issuer: LocalLearnCard,
    statusListUrl: string,
    revokedIndexes: number[]
): Promise<VC> => {
    const unsignedStatusListCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: statusListUrl,
        type: ['VerifiableCredential', 'BitstringStatusListCredential'],
        issuer: issuer.id.did(),
        validFrom: new Date().toISOString(),
        credentialSubject: {
            type: 'BitstringStatusList',
            statusPurpose: 'revocation',
            encodedList: encodeBitstringStatusList(revokedIndexes),
        },
    } as unknown as UnsignedVC;

    return issuer.invoke.issueCredential(unsignedStatusListCredential);
};

const issueCredentialWithStatus = async (
    issuer: LocalLearnCard,
    subjectDid: string,
    statusListUrl: string,
    statusListIndex: number
): Promise<VC> => {
    const unsignedCredential = {
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: `urn:uuid:bitstring-status-list-e2e-${statusListIndex}`,
        type: ['VerifiableCredential', 'BitstringStatusListE2ECredential'],
        issuer: issuer.id.did(),
        validFrom: new Date().toISOString(),
        credentialStatus: {
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: statusListIndex.toString(),
            statusListCredential: statusListUrl,
        },
        credentialSubject: {
            id: subjectDid,
            name: `Bitstring Status List E2E ${statusListIndex}`,
        },
    } as unknown as UnsignedVC;

    return issuer.invoke.issueCredential(unsignedCredential);
};

describe('Bitstring Status List', () => {
    test('verifies VC 2.0 credentials against a W3C BitstringStatusListCredential', async () => {
        const issuer = await getLocalLearnCard('9'.repeat(64));
        const verifier = await getLocalLearnCard('8'.repeat(64));
        let statusListCredential: VC | undefined;

        const statusServer = await startStatusCredentialServer(() => statusListCredential);

        try {
            statusListCredential = await issueStatusListCredential(issuer, statusServer.url, [
                REVOKED_INDEX,
            ]);

            const unrevokedCredential = await issueCredentialWithStatus(
                issuer,
                verifier.id.did(),
                statusServer.url,
                UNREVOKED_INDEX
            );
            const unrevokedVerification = await verifier.invoke.verifyCredential(
                unrevokedCredential
            );

            expect(unrevokedVerification.warnings).toHaveLength(0);
            expect(unrevokedVerification.errors).toHaveLength(0);
            expect(unrevokedVerification.checks).toContain('proof');
            expect(unrevokedVerification.checks).toContain('status');

            // Structured status field (added by ssi PR
            // `lc-status-array-and-structured-result`). The unrevoked
            // credential should produce exactly one StatusCheckEntry
            // with isSet=false so consumers can affirmatively render
            // "active" rather than inferring it from the absence of
            // an error.
            expect(unrevokedVerification.status).toHaveLength(1);
            expect(unrevokedVerification.status?.[0]).toMatchObject({
                entryType: 'BitstringStatusListEntry',
                statusPurpose: 'revocation',
                isSet: false,
            });

            const revokedCredential = await issueCredentialWithStatus(
                issuer,
                verifier.id.did(),
                statusServer.url,
                REVOKED_INDEX
            );
            const revokedVerification = await verifier.invoke.verifyCredential(revokedCredential);

            // Backwards-compatible error string preserved for
            // consumers that read the `errors` array.
            expect(revokedVerification.errors.join('\n')).toMatch(/revoked/i);

            // Structured outcome — the new preferred surface.
            // `isSet: true` + `statusPurpose: 'revocation'`
            // unambiguously means "revoked" without string parsing.
            expect(revokedVerification.status).toHaveLength(1);
            expect(revokedVerification.status?.[0]).toMatchObject({
                entryType: 'BitstringStatusListEntry',
                statusPurpose: 'revocation',
                isSet: true,
            });

            expect(statusServer.requestCount).toBeGreaterThanOrEqual(2);
        } finally {
            await statusServer.close();
        }
    }, 60_000);
});

const networkBoostTemplate = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00.000Z',
    name: 'Network Bitstring Status List Boost',
    credentialSubject: {
        id: 'did:example:subject',
    },
} as UnsignedVC;

const suspensionBoostTemplate = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2024-01-01T00:00:00.000Z',
    name: 'Network Bitstring Suspension Credential',
    credentialSubject: {
        id: 'did:example:subject',
    },
} as UnsignedVC;

const getRequiredStatusEntry = (
    credential: unknown,
    statusPurpose: 'revocation' | 'suspension'
) => {
    const entry = getBitstringStatusListEntryForPurpose(credential, statusPurpose);

    if (!entry) throw new Error(`Missing ${statusPurpose} status entry`);

    return entry;
};

const fetchStatusBit = async (
    entry: ReturnType<typeof getRequiredStatusEntry>
): Promise<boolean> => {
    const response = await fetch(entry.statusListCredential);
    expect(response.status).toBe(200);

    const statusListCredential = await response.json();
    const encodedList = statusListCredential.credentialSubject.encodedList;
    const bitstring = decodeBitstringStatusList(encodedList);

    return getBitstringStatusListBit(bitstring, Number(entry.statusListIndex));
};

const expectStatusCheckEntry = (
    verificationResult: {
        status?: {
            entryType: string;
            statusPurpose: string;
            isSet: boolean;
            statusListCredential?: string;
            statusListIndex?: string;
        }[];
    },
    entry: ReturnType<typeof getRequiredStatusEntry>,
    isSet: boolean
) => {
    expect(verificationResult.status).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                entryType: 'BitstringStatusListEntry',
                statusPurpose: entry.statusPurpose,
                isSet,
                statusListCredential: entry.statusListCredential,
                statusListIndex: entry.statusListIndex,
            }),
        ])
    );
};

describe('Network Bitstring Status Lists', () => {
    let a: LearnCard;
    let b: LearnCard;
    let c: LearnCard;

    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
        c = await getLearnCardForUser('c');
    });

    test('adds revocation status to issued boosts and flips the bit when revoked', async () => {
        const boostUri = await a.invoke.createBoost(networkBoostTemplate);
        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
        });

        await b.invoke.acceptCredential(credentialUri);
        const credential = (await b.read.get(credentialUri)) as VC;
        const revocationEntry = getRequiredStatusEntry(credential, 'revocation');

        expect(revocationEntry.statusListCredential).toContain(
            'http://localhost:4000/status-lists/'
        );
        expect(await fetchStatusBit(revocationEntry)).toBe(false);

        const verificationResult1 = await b.invoke.verifyCredential(credential);

        expect(verificationResult1.errors).toHaveLength(0);
        expect(verificationResult1.checks).toContain('status');
        expectStatusCheckEntry(verificationResult1, revocationEntry, false);

        await a.invoke.revokeBoostRecipient(boostUri, USERS.b.profileId);

        expect(await fetchStatusBit(revocationEntry)).toBe(true);

        const verificationResult2 = await b.invoke.verifyCredential(credential);

        expect(verificationResult2.errors).not.toHaveLength(0);
        expect(verificationResult2.checks).not.toContain('status');
        expectStatusCheckEntry(verificationResult2, revocationEntry, true);
    }, 60_000);

    test('can suspend and unsuspend a credential with a suspension status entry', async () => {
        const boostUri = await a.invoke.createBoost(suspensionBoostTemplate);
        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
            statusPurposes: ['suspension'],
        });

        await b.invoke.acceptCredential(credentialUri);
        const credential = (await b.read.get(credentialUri)) as VC;
        const suspensionEntry = getRequiredStatusEntry(credential, 'suspension');

        expect(await fetchStatusBit(suspensionEntry)).toBe(false);

        const verificationResult1 = await b.invoke.verifyCredential(credential);

        expect(verificationResult1.errors).toHaveLength(0);
        expect(verificationResult1.checks).toContain('status');
        expectStatusCheckEntry(verificationResult1, suspensionEntry, false);

        await a.invoke.suspendBoostRecipient(boostUri, USERS.b.profileId);
        expect(await fetchStatusBit(suspensionEntry)).toBe(true);

        const verificationResult2 = await b.invoke.verifyCredential(credential);

        expect(verificationResult2.errors).not.toHaveLength(0);
        expect(verificationResult2.checks).not.toContain('status');
        expectStatusCheckEntry(verificationResult2, suspensionEntry, true);

        await a.invoke.unsuspendBoostRecipient(boostUri, USERS.b.profileId);
        expect(await fetchStatusBit(suspensionEntry)).toBe(false);

        const verificationResult3 = await b.invoke.verifyCredential(credential);

        expect(verificationResult3.errors).toHaveLength(0);
        expect(verificationResult3.checks).toContain('status');
        expectStatusCheckEntry(verificationResult3, suspensionEntry, false);
    }, 60_000);

    test('supports revocation and suspension status entries on the same credential', async () => {
        const boostUri = await a.invoke.createBoost(networkBoostTemplate);
        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
            statusPurposes: ['revocation', 'suspension'],
        });

        await b.invoke.acceptCredential(credentialUri);
        const credential = (await b.read.get(credentialUri)) as VC;
        const revocationEntry = getRequiredStatusEntry(credential, 'revocation');
        const suspensionEntry = getRequiredStatusEntry(credential, 'suspension');
        const statusPurposes = getBitstringStatusListEntries(credential).map(
            entry => entry.statusPurpose
        );

        expect(statusPurposes).toEqual(expect.arrayContaining(['revocation', 'suspension']));
        expect(revocationEntry.statusListCredential).not.toBe(suspensionEntry.statusListCredential);
        expect(await fetchStatusBit(revocationEntry)).toBe(false);
        expect(await fetchStatusBit(suspensionEntry)).toBe(false);

        const verificationResult1 = await b.invoke.verifyCredential(credential);

        expect(verificationResult1.errors).toHaveLength(0);
        expect(verificationResult1.checks).toContain('status');
        expectStatusCheckEntry(verificationResult1, revocationEntry, false);
        expectStatusCheckEntry(verificationResult1, suspensionEntry, false);

        await a.invoke.suspendBoostRecipient(boostUri, USERS.b.profileId);

        expect(await fetchStatusBit(revocationEntry)).toBe(false);
        expect(await fetchStatusBit(suspensionEntry)).toBe(true);

        const verificationResult2 = await b.invoke.verifyCredential(credential);

        expect(verificationResult2.errors).not.toHaveLength(0);
        expect(verificationResult2.checks).not.toContain('status');
        expectStatusCheckEntry(verificationResult2, revocationEntry, false);
        expectStatusCheckEntry(verificationResult2, suspensionEntry, true);

        await a.invoke.unsuspendBoostRecipient(boostUri, USERS.b.profileId);

        expect(await fetchStatusBit(revocationEntry)).toBe(false);
        expect(await fetchStatusBit(suspensionEntry)).toBe(false);

        const verificationResult3 = await b.invoke.verifyCredential(credential);

        expect(verificationResult3.errors).toHaveLength(0);
        expect(verificationResult3.checks).toContain('status');
        expectStatusCheckEntry(verificationResult3, revocationEntry, false);
        expectStatusCheckEntry(verificationResult3, suspensionEntry, false);

        await a.invoke.revokeBoostRecipient(boostUri, USERS.b.profileId);

        expect(await fetchStatusBit(revocationEntry)).toBe(true);
        expect(await fetchStatusBit(suspensionEntry)).toBe(false);

        const verificationResult4 = await b.invoke.verifyCredential(credential);

        expect(verificationResult4.errors).not.toHaveLength(0);
        expect(verificationResult4.checks).not.toContain('status');
        expectStatusCheckEntry(verificationResult4, revocationEntry, true);
    }, 60_000);

    test('can suspend and unsuspend a pending credential without marking it received', async () => {
        const boostUri = await a.invoke.createBoost(suspensionBoostTemplate);
        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
            statusPurposes: ['suspension'],
        });
        const credential = (await b.read.get(credentialUri)) as VC;
        const suspensionEntry = getRequiredStatusEntry(credential, 'suspension');

        await a.invoke.suspendBoostRecipient(boostUri, USERS.b.profileId);

        expect((await b.invoke.getIncomingCredentials()).map(record => record.uri)).toContain(
            credentialUri
        );
        expect((await b.invoke.getReceivedCredentials()).map(record => record.uri)).not.toContain(
            credentialUri
        );
        expect(await fetchStatusBit(suspensionEntry)).toBe(true);
        await expect(b.invoke.acceptCredential(credentialUri)).rejects.toThrow(/suspended/i);

        await a.invoke.unsuspendBoostRecipient(boostUri, USERS.b.profileId);

        expect((await b.invoke.getIncomingCredentials()).map(record => record.uri)).toContain(
            credentialUri
        );
        expect(await fetchStatusBit(suspensionEntry)).toBe(false);

        await b.invoke.acceptCredential(credentialUri);
        expect((await b.invoke.getReceivedCredentials()).map(record => record.uri)).toContain(
            credentialUri
        );
    }, 60_000);

    test('revokes a pending credential from the sent relationship', async () => {
        const boostUri = await a.invoke.createBoost(networkBoostTemplate);
        const credentialUri = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            encrypt: false,
        });
        const credential = (await b.read.get(credentialUri)) as VC;
        const revocationEntry = getRequiredStatusEntry(credential, 'revocation');

        await a.invoke.revokeBoostRecipient(boostUri, USERS.b.profileId);

        expect((await b.invoke.getIncomingCredentials()).map(record => record.uri)).not.toContain(
            credentialUri
        );
        expect((await b.invoke.getReceivedCredentials()).map(record => record.uri)).not.toContain(
            credentialUri
        );
        expect(await b.invoke.getRevokedCredentials()).toContain(credentialUri);
        expect(await fetchStatusBit(revocationEntry)).toBe(true);
        await expect(b.invoke.acceptCredential(credentialUri)).rejects.toThrow(/revoked/i);
    }, 60_000);

    test('does not let direct revoke permission on one boost revoke another boost', async () => {
        const managedBoostUri = await a.invoke.createBoost(networkBoostTemplate);
        const unrelatedBoostUri = await a.invoke.createBoost(networkBoostTemplate);

        await a.invoke.addBoostAdmin(managedBoostUri, USERS.b.profileId);

        const managedCredentialUri = await a.invoke.sendBoost(USERS.c.profileId, managedBoostUri, {
            encrypt: false,
        });
        const unrelatedCredentialUri = await a.invoke.sendBoost(
            USERS.c.profileId,
            unrelatedBoostUri,
            {
                encrypt: false,
            }
        );
        const managedCredential = (await c.read.get(managedCredentialUri)) as VC;
        const unrelatedCredential = (await c.read.get(unrelatedCredentialUri)) as VC;
        const managedRevocationEntry = getRequiredStatusEntry(managedCredential, 'revocation');
        const unrelatedRevocationEntry = getRequiredStatusEntry(unrelatedCredential, 'revocation');

        await expect(
            b.invoke.revokeBoostRecipient(unrelatedBoostUri, USERS.c.profileId)
        ).rejects.toThrow(/permission|unauthorized|rights/i);

        expect(await fetchStatusBit(unrelatedRevocationEntry)).toBe(false);
        expect(await c.invoke.getRevokedCredentials()).not.toContain(unrelatedCredentialUri);

        await b.invoke.revokeBoostRecipient(managedBoostUri, USERS.c.profileId);

        expect(await fetchStatusBit(managedRevocationEntry)).toBe(true);
        expect(await c.invoke.getRevokedCredentials()).toContain(managedCredentialUri);
    }, 60_000);

    test('allows parent canRevokeChildren only for descendant boosts', async () => {
        const parentBoostUri = await a.invoke.createBoost(networkBoostTemplate);
        const childBoostUri = await a.invoke.createChildBoost(parentBoostUri, networkBoostTemplate);
        const unrelatedParentBoostUri = await a.invoke.createBoost(networkBoostTemplate);
        const unrelatedChildBoostUri = await a.invoke.createChildBoost(
            unrelatedParentBoostUri,
            networkBoostTemplate
        );

        await a.invoke.addBoostAdmin(parentBoostUri, USERS.b.profileId);

        const childCredentialUri = await a.invoke.sendBoost(USERS.c.profileId, childBoostUri, {
            encrypt: false,
        });
        const unrelatedChildCredentialUri = await a.invoke.sendBoost(
            USERS.c.profileId,
            unrelatedChildBoostUri,
            {
                encrypt: false,
            }
        );
        const childCredential = (await c.read.get(childCredentialUri)) as VC;
        const unrelatedChildCredential = (await c.read.get(unrelatedChildCredentialUri)) as VC;
        const childRevocationEntry = getRequiredStatusEntry(childCredential, 'revocation');
        const unrelatedChildRevocationEntry = getRequiredStatusEntry(
            unrelatedChildCredential,
            'revocation'
        );

        await b.invoke.revokeBoostRecipient(childBoostUri, USERS.c.profileId);

        expect(await fetchStatusBit(childRevocationEntry)).toBe(true);
        expect(await c.invoke.getRevokedCredentials()).toContain(childCredentialUri);

        await expect(
            b.invoke.revokeBoostRecipient(unrelatedChildBoostUri, USERS.c.profileId)
        ).rejects.toThrow(/permission|unauthorized|rights/i);

        expect(await fetchStatusBit(unrelatedChildRevocationEntry)).toBe(false);
        expect(await c.invoke.getRevokedCredentials()).not.toContain(unrelatedChildCredentialUri);
    }, 60_000);
});
