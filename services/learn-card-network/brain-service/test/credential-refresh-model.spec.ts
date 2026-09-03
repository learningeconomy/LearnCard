import { neogma } from '@instance';

import { Profile, CredentialRefresh } from '@models';
import { storeCredential } from '@accesslayer/credential/create';
import {
    generateRefreshId,
    createCredentialRefresh,
    getCredentialRefresh,
    getCredentialRefreshHead,
    getCredentialRefreshVersions,
    advanceCredentialRefreshHead,
    setCredentialRefreshState,
} from '@accesslayer/credential-refresh';

const ISSUER_PROFILE_ID = 'refresh-issuer';
const ISSUER_DID = 'did:key:refresh-issuer';
const HOLDER_PROFILE_ID = 'refresh-holder';
const HOLDER_DID = 'did:key:refresh-holder';
const CREDENTIAL_ID = 'urn:uuid:stable-credential-id';

/** Holder-encrypted JWE JSON — the only payload shape version nodes may persist */
const jweFor = (tag: string): string =>
    JSON.stringify({ protected: 'eyJlbmMiOiJYQzIwUCJ9', ciphertext: `encrypted-${tag}` });

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

const toNum = (value: unknown): number =>
    value && typeof (value as { toNumber?: () => number }).toNumber === 'function'
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value ?? 0);

const countVersionNodes = async (refreshId: string): Promise<number> => {
    const result = await runQuery(
        'MATCH (c:Credential {refreshId: $refreshId}) RETURN count(c) AS count',
        { refreshId }
    );
    return toNum(result.records[0]?.get('count'));
};

const relationshipExists = async (cypher: string, params: Record<string, unknown>) => {
    const result = await runQuery(cypher, params);
    return toNum(result.records[0]?.get('count')) === 1;
};

const setupAggregate = async () => {
    await Profile.createOne({ profileId: ISSUER_PROFILE_ID, did: ISSUER_DID });
    await Profile.createOne({ profileId: HOLDER_PROFILE_ID, did: HOLDER_DID });

    const root = await storeCredential(JSON.parse(jweFor('v1')));

    const record = await createCredentialRefresh({
        issuerProfileId: ISSUER_PROFILE_ID,
        issuerDid: ISSUER_DID,
        holderProfileId: HOLDER_PROFILE_ID,
        holderDid: HOLDER_DID,
        credentialId: CREDENTIAL_ID,
        rootCredentialNodeId: root.id,
        etag: 'etag-v1',
        materialDigest: 'digest-v1',
        signingMode: 'issuer-signed',
    });

    return { root, record };
};

describe('CredentialRefresh model', () => {
    beforeAll(async () => {
        // Constraints live in models/index.ts for deployed environments, but that
        // module creates them asynchronously. Ensure them synchronously here so the
        // uniqueness assertions below are deterministic.
        await runQuery(
            'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE'
        );
        await runQuery(
            'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE'
        );
    });

    beforeEach(async () => {
        await runQuery('MATCH (r:CredentialRefresh) DETACH DELETE r');
        await runQuery('MATCH (c:Credential) DETACH DELETE c');
        await runQuery('MATCH (p:Profile) DETACH DELETE p');
    });

    describe('generateRefreshId', () => {
        it('generates cryptographically random, unique, unguessable ids', () => {
            const ids = new Set(Array.from({ length: 256 }, () => generateRefreshId()));

            expect(ids.size).toBe(256);

            for (const id of ids) {
                // 32 bytes of secure randomness, base64url encoded (43 chars)
                expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/);
            }
        });
    });

    describe('createCredentialRefresh', () => {
        it('requires an existing issuer profile', async () => {
            await Profile.createOne({ profileId: HOLDER_PROFILE_ID, did: HOLDER_DID });
            const root = await storeCredential(JSON.parse(jweFor('v1')));

            await expect(
                createCredentialRefresh({
                    issuerProfileId: 'missing-issuer',
                    issuerDid: ISSUER_DID,
                    holderProfileId: HOLDER_PROFILE_ID,
                    holderDid: HOLDER_DID,
                    credentialId: CREDENTIAL_ID,
                    rootCredentialNodeId: root.id,
                })
            ).rejects.toThrow();
        });

        it('requires an existing holder profile when holderProfileId is given', async () => {
            await Profile.createOne({ profileId: ISSUER_PROFILE_ID, did: ISSUER_DID });
            const root = await storeCredential(JSON.parse(jweFor('v1')));

            await expect(
                createCredentialRefresh({
                    issuerProfileId: ISSUER_PROFILE_ID,
                    issuerDid: ISSUER_DID,
                    holderProfileId: 'missing-holder',
                    holderDid: HOLDER_DID,
                    credentialId: CREDENTIAL_ID,
                    rootCredentialNodeId: root.id,
                })
            ).rejects.toThrow();
        });

        it('requires an existing root credential node', async () => {
            await Profile.createOne({ profileId: ISSUER_PROFILE_ID, did: ISSUER_DID });

            await expect(
                createCredentialRefresh({
                    issuerProfileId: ISSUER_PROFILE_ID,
                    issuerDid: ISSUER_DID,
                    holderDid: HOLDER_DID,
                    credentialId: CREDENTIAL_ID,
                    rootCredentialNodeId: 'missing-credential-node',
                })
            ).rejects.toThrow();
        });

        it('creates the aggregate with issuer/holder relationships and root=head at version 1', async () => {
            const { root, record } = await setupAggregate();

            expect(record.refreshId).toMatch(/^[A-Za-z0-9_-]{43}$/);
            expect(record.credentialId).toBe(CREDENTIAL_ID);
            expect(record.currentVersion).toBe(1);
            expect(record.state).toBe('awaiting_claim');
            expect(record.issuerProfileId).toBe(ISSUER_PROFILE_ID);
            expect(record.issuerDid).toBe(ISSUER_DID);
            expect(record.holderProfileId).toBe(HOLDER_PROFILE_ID);
            expect(record.holderDid).toBe(HOLDER_DID);
            expect(record.etag).toBe('etag-v1');
            expect(record.materialDigest).toBe('digest-v1');

            expect(
                await relationshipExists(
                    `MATCH (p:Profile {profileId: $profileId})-[:ISSUED_REFRESH]->(r:CredentialRefresh {refreshId: $refreshId})
                     RETURN count(*) AS count`,
                    { profileId: ISSUER_PROFILE_ID, refreshId: record.refreshId }
                )
            ).toBe(true);

            expect(
                await relationshipExists(
                    `MATCH (p:Profile {profileId: $profileId})-[:HELD_REFRESH]->(r:CredentialRefresh {refreshId: $refreshId})
                     RETURN count(*) AS count`,
                    { profileId: HOLDER_PROFILE_ID, refreshId: record.refreshId }
                )
            ).toBe(true);

            expect(
                await relationshipExists(
                    `MATCH (r:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(c:Credential {id: $rootId})
                     RETURN count(*) AS count`,
                    { refreshId: record.refreshId, rootId: root.id }
                )
            ).toBe(true);

            // Root and head start as the same immutable node at version 1
            expect(
                await relationshipExists(
                    `MATCH (r:CredentialRefresh {refreshId: $refreshId})-[:HEAD]->(c:Credential {id: $rootId})
                     RETURN count(*) AS count`,
                    { refreshId: record.refreshId, rootId: root.id }
                )
            ).toBe(true);
        });

        it('supports a holder that only has a DID (no profile yet)', async () => {
            await Profile.createOne({ profileId: ISSUER_PROFILE_ID, did: ISSUER_DID });
            const root = await storeCredential(JSON.parse(jweFor('v1')));

            const record = await createCredentialRefresh({
                issuerProfileId: ISSUER_PROFILE_ID,
                issuerDid: ISSUER_DID,
                holderDid: HOLDER_DID,
                credentialId: CREDENTIAL_ID,
                rootCredentialNodeId: root.id,
            });

            expect(record.holderProfileId).toBeUndefined();
            expect(record.holderDid).toBe(HOLDER_DID);
        });

        it('rejects duplicate refreshIds', async () => {
            const { record } = await setupAggregate();

            await expect(
                CredentialRefresh.createOne({
                    refreshId: record.refreshId,
                    issuerProfileId: 'other-issuer',
                    issuerDid: 'did:key:other',
                    holderDid: 'did:key:other-holder',
                    credentialId: 'urn:uuid:other',
                    state: 'awaiting_claim',
                    currentVersion: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
            ).rejects.toThrow();
        });

        it('keeps the credential id stable on the aggregate', async () => {
            const { record } = await setupAggregate();

            const fetched = await getCredentialRefresh(record.refreshId);

            expect(fetched?.credentialId).toBe(CREDENTIAL_ID);
            expect(fetched?.credentialId.length).toBeGreaterThan(0);
        });
    });

    describe('advanceCredentialRefreshHead', () => {
        it('creates an immutable version node, REFRESHED_TO edge, and moves HEAD', async () => {
            const { root, record } = await setupAggregate();

            const result = await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-1',
                etag: 'etag-v2',
                materialDigest: 'digest-v2',
                updateSummary: 'Transcript finalized',
                effectiveAt: '2026-09-01T00:00:00.000Z',
            });

            expect(result.status).toBe('advanced');
            expect(result.version).toBe(2);
            expect(result.publishedAt).toBeTruthy();

            const updated = await getCredentialRefresh(record.refreshId);
            expect(updated?.currentVersion).toBe(2);
            expect(updated?.etag).toBe('etag-v2');
            expect(updated?.materialDigest).toBe('digest-v2');
            expect(updated?.updateSummary).toBe('Transcript finalized');
            expect(updated?.idempotencyKey).toBe('pub-1');
            expect(updated?.credentialId).toBe(CREDENTIAL_ID);
            expect(updated?.lastPublishedAt).toBe(result.publishedAt);

            // HEAD moved to the new version, ROOT still points at the original
            const head = await getCredentialRefreshHead(record.refreshId);
            expect(head).not.toBeNull();
            expect(head?.id).not.toBe(root.id);
            expect(head?.version).toBe(2);
            expect(head?.credential).toBe(jweFor('v2'));
            expect(head?.signingMode).toBe('issuer-signed');
            expect(head?.updateSummary).toBe('Transcript finalized');
            expect(head?.effectiveAt).toBe('2026-09-01T00:00:00.000Z');
            expect(head?.etag).toBe('etag-v2');

            expect(
                await relationshipExists(
                    `MATCH (r:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(c:Credential {id: $rootId})
                     RETURN count(*) AS count`,
                    { refreshId: record.refreshId, rootId: root.id }
                )
            ).toBe(true);

            expect(
                await relationshipExists(
                    `MATCH (:Credential {id: $rootId})-[:REFRESHED_TO]->(next:Credential {id: $headId})
                     RETURN count(*) AS count`,
                    { rootId: root.id, headId: head!.id }
                )
            ).toBe(true);
        });

        it('never mutates previously published version nodes', async () => {
            const { root, record } = await setupAggregate();

            await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-1',
            });

            await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 2,
                encryptedCredential: jweFor('v3'),
                signingMode: 'signing-authority',
                idempotencyKey: 'pub-2',
            });

            const versions = await runQuery(
                `MATCH (c:Credential {refreshId: $refreshId}) RETURN c ORDER BY c.version ASC`,
                { refreshId: record.refreshId }
            );

            const nodes = versions.records.map(recordRow => {
                const properties = recordRow.get('c').properties;
                return { ...properties, version: toNum(properties.version) };
            });

            expect(nodes).toHaveLength(3);

            // Root (v1) still holds its original encrypted payload and is untouched
            const v1 = nodes.find(node => node.id === root.id);
            expect(v1?.credential).toBe(jweFor('v1'));
            expect(v1?.version).toBe(1);

            const v2 = nodes.find(node => node.version === 2);
            expect(v2?.credential).toBe(jweFor('v2'));
            expect(v2?.signingMode).toBe('issuer-signed');

            // v2 was not modified by the v3 publication
            const head = await getCredentialRefreshHead(record.refreshId);
            expect(head?.version).toBe(3);
            expect(head?.credential).toBe(jweFor('v3'));
        });

        it('rejects a stale expectedVersion without creating a node or moving HEAD', async () => {
            const { record } = await setupAggregate();

            await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-1',
            });

            const stale = await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('stale'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-stale',
            });

            expect(stale.status).toBe('conflict');

            const updated = await getCredentialRefresh(record.refreshId);
            expect(updated?.currentVersion).toBe(2);
            expect(await countVersionNodes(record.refreshId)).toBe(2);

            const head = await getCredentialRefreshHead(record.refreshId);
            expect(head?.credential).toBe(jweFor('v2'));
        });

        it('returns the prior successful result when the idempotency key is retried', async () => {
            const { record } = await setupAggregate();

            const first = await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-1',
            });

            const retry = await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-1',
            });

            expect(first.status).toBe('advanced');
            expect(retry.status).toBe('replay');
            expect(retry.version).toBe(first.version);
            expect(retry.publishedAt).toBe(first.publishedAt);
            expect(await countVersionNodes(record.refreshId)).toBe(2);
        });

        it('permits exactly one writer under concurrent compare-and-advance', async () => {
            const { record } = await setupAggregate();

            const results = await Promise.all(
                Array.from({ length: 5 }, (_, index) =>
                    advanceCredentialRefreshHead({
                        refreshId: record.refreshId,
                        expectedVersion: 1,
                        encryptedCredential: jweFor(`race-${index}`),
                        signingMode: 'issuer-signed',
                        idempotencyKey: `race-${index}`,
                    })
                )
            );

            const advanced = results.filter(result => result.status === 'advanced');
            const conflicts = results.filter(result => result.status === 'conflict');

            expect(advanced).toHaveLength(1);
            expect(conflicts).toHaveLength(4);

            const updated = await getCredentialRefresh(record.refreshId);
            expect(updated?.currentVersion).toBe(2);
            expect(await countVersionNodes(record.refreshId)).toBe(2);
        });

        it('collapses concurrent retries of the same idempotency key to one version', async () => {
            const { record } = await setupAggregate();

            const results = await Promise.all(
                Array.from({ length: 3 }, () =>
                    advanceCredentialRefreshHead({
                        refreshId: record.refreshId,
                        expectedVersion: 1,
                        encryptedCredential: jweFor('v2'),
                        signingMode: 'issuer-signed',
                        idempotencyKey: 'pub-same',
                    })
                )
            );

            expect(results.filter(result => result.status === 'advanced')).toHaveLength(1);
            expect(results.filter(result => result.status === 'replay')).toHaveLength(2);
            expect(results.every(result => result.version === 2)).toBe(true);
            expect(await countVersionNodes(record.refreshId)).toBe(2);
        });

        it('returns conflict for an unknown refreshId', async () => {
            const result = await advanceCredentialRefreshHead({
                refreshId: 'missing',
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
            });

            expect(result.status).toBe('conflict');
        });
    });

    describe('getCredentialRefreshVersions', () => {
        it('returns metadata-only history in descending version order with cursor pagination', async () => {
            const { record } = await setupAggregate();

            await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 1,
                encryptedCredential: jweFor('v2'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-1',
                updateSummary: 'Second version',
            });

            await advanceCredentialRefreshHead({
                refreshId: record.refreshId,
                expectedVersion: 2,
                encryptedCredential: jweFor('v3'),
                signingMode: 'issuer-signed',
                idempotencyKey: 'pub-2',
            });

            const page1 = await getCredentialRefreshVersions(record.refreshId, { limit: 2 });

            expect(page1.records).toHaveLength(2);
            expect(page1.records.map(r => r.version)).toEqual([3, 2]);
            expect(page1.hasMore).toBe(true);
            expect(page1.cursor).toBeTruthy();

            // Metadata only — never the encrypted payload or credential body
            for (const metadata of page1.records) {
                expect(metadata).not.toHaveProperty('credential');
                expect(metadata.publishedAt).toBeTruthy();
            }
            expect(page1.records[1]?.updateSummary).toBe('Second version');

            const page2 = await getCredentialRefreshVersions(record.refreshId, {
                limit: 2,
                cursor: page1.cursor,
            });

            expect(page2.records).toHaveLength(1);
            expect(page2.records[0]?.version).toBe(1);
            expect(page2.hasMore).toBe(false);
        });
    });

    describe('setCredentialRefreshState', () => {
        it('transitions awaiting_claim → active → revoked', async () => {
            const { record } = await setupAggregate();

            expect((await getCredentialRefresh(record.refreshId))?.state).toBe('awaiting_claim');

            const active = await setCredentialRefreshState(record.refreshId, 'active');
            expect(active?.state).toBe('active');
            expect((await getCredentialRefresh(record.refreshId))?.state).toBe('active');

            const revoked = await setCredentialRefreshState(record.refreshId, 'revoked');
            expect(revoked?.state).toBe('revoked');
            expect((await getCredentialRefresh(record.refreshId))?.state).toBe('revoked');
        });

        it('returns null for an unknown refreshId', async () => {
            expect(await setCredentialRefreshState('missing', 'active')).toBeNull();
        });
    });
});
