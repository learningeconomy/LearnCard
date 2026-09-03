import { vi } from 'vitest';
import { JWEValidator, VCValidator, VC, UnsignedVC, JWE } from '@learncard/types';

import { neogma } from '@instance';

import { getClient, getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import {
    getCredentialRefresh,
    getCredentialRefreshHead,
    setCredentialRefreshState,
} from '@accesslayer/credential-refresh';

const noAuthClient = getClient();

let brain: SeedLearnCard;
let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let outsider: Awaited<ReturnType<typeof getUser>>;

const ISSUER_PROFILE_ID = 'refresh-pub-issuer';
const HOLDER_PROFILE_ID = 'refresh-pub-holder';
const OUTSIDER_PROFILE_ID = 'refresh-pub-outsider';
const CREDENTIAL_ID = 'urn:uuid:refreshable-credential-pub';
const SA_ENDPOINT = 'https://sa.example.com';
const SA_NAME = 'refresh-sa';

type AllocationResult = {
    refreshId: string;
    refreshService: { id: string; type: string; authorization?: { type: string } };
};

type PublishResult = {
    refreshId: string;
    version: number;
    publishedAt: string;
    notification: 'queued' | 'suppressed' | 'not-applicable';
};

const toNum = (value: unknown): number =>
    value && typeof (value as { toNumber?: () => number }).toNumber === 'function'
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value ?? 0);

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

const countCredentialNodes = async (): Promise<number> =>
    toNum(
        (await runQuery('MATCH (c:Credential) RETURN count(c) AS count')).records[0]?.get('count')
    );

const countStatusLists = async (): Promise<number> =>
    toNum(
        (await runQuery('MATCH (l:BitstringStatusList) RETURN count(l) AS count')).records[0]?.get(
            'count'
        )
    );

/** Fetches a single immutable version node (including its encrypted payload) by version */
const getVersionNode = async (
    refreshId: string,
    version: number
): Promise<{ id: string; credential: string; version: number; publishedAt?: string } | null> => {
    const result = await runQuery(
        `MATCH (c:Credential {refreshVersionKey: $key})
         RETURN c.id AS id, c.credential AS credential, c.version AS version, c.publishedAt AS publishedAt
         LIMIT 1`,
        { key: `${refreshId}:${version}` }
    );

    const record = result.records[0];

    if (!record) return null;

    return {
        id: record.get('id'),
        credential: record.get('credential'),
        version: toNum(record.get('version')),
        publishedAt: record.get('publishedAt') ?? undefined,
    };
};

const allocate = async (): Promise<AllocationResult> =>
    issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
        holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
        credentialId: CREDENTIAL_ID,
    });

const buildUnsignedCredential = (
    allocation: AllocationResult,
    overrides: Record<string, unknown> = {}
): UnsignedVC =>
    ({
        // The 1EdTech refresh service type is not defined by the VCDM 1.1/2.0 or OBv3
        // contexts, so issuers define the term inline (JSON-LD data-loss detection
        // otherwise refuses to sign).
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            {
                '1EdTechCredentialRefresh':
                    'https://purl.imsglobal.org/spec/ob/v3p0#1EdTechCredentialRefresh',
                authorization: {
                    '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                    '@context': {
                        LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth',
                    },
                },
            },
        ],
        id: CREDENTIAL_ID,
        type: ['VerifiableCredential'],
        issuer: issuer.learnCard.id.did(),
        validFrom: '2026-01-01T00:00:00Z',
        name: 'Original Transcript',
        credentialSubject: { id: holder.learnCard.id.did() },
        refreshService: allocation.refreshService,
        ...overrides,
    } as UnsignedVC);

/** An updated credential body: material change (name) and a newer effective time */
const buildUpdatedUnsignedCredential = (
    allocation: AllocationResult,
    overrides: Record<string, unknown> = {}
): UnsignedVC =>
    buildUnsignedCredential(allocation, {
        validFrom: '2026-02-01T00:00:00Z',
        name: 'Final Transcript',
        ...overrides,
    });

const signAs = async (
    user: Awaited<ReturnType<typeof getUser>>,
    unsigned: UnsignedVC
): Promise<VC> => user.learnCard.invoke.issueCredential(unsigned);

/** Allocates, signs, and sends the original credential (version 1) */
const sendOriginal = async (): Promise<{ allocation: AllocationResult; credential: VC }> => {
    const allocation = await allocate();
    const credential = await signAs(issuer, buildUnsignedCredential(allocation));

    await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
        refreshId: allocation.refreshId,
        credential,
    });

    return { allocation, credential };
};

const publishIssuerSigned = async (
    refreshId: string,
    credential: VC,
    extras: Record<string, unknown> = {}
): Promise<PublishResult> =>
    issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
        mode: 'issuer-signed',
        refreshId,
        signedCredential: credential,
        ...extras,
    } as Parameters<typeof issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh>[0]);

/** Decrypts the stored head/version payload as the holder */
const decryptVersionAsHolder = async (refreshId: string, version: number): Promise<VC> => {
    const node = await getVersionNode(refreshId, version);

    expect(node).toBeTruthy();

    const parsed = JSON.parse(node!.credential);

    expect(JWEValidator.safeParse(parsed).success).toBe(true);
    expect(VCValidator.safeParse(parsed).success).toBe(false);

    return holder.learnCard.invoke.decryptDagJwe(parsed as JWE);
};

describe('Credential Refresh Publication', () => {
    beforeAll(async () => {
        brain = await getLearnCard();
        issuer = await getUser('d'.repeat(64));
        holder = await getUser('b'.repeat(64));
        outsider = await getUser('c'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );

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

        await issuer.clients.fullAuth.profile.createProfile({ profileId: ISSUER_PROFILE_ID });
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_PROFILE_ID });
        await outsider.clients.fullAuth.profile.createProfile({ profileId: OUTSIDER_PROFILE_ID });

        addNotificationToQueueSpy.mockReset();
    });

    describe('publishCredentialRefresh (issuer-signed mode)', () => {
        it('requires an authenticated issuer', async () => {
            const { allocation } = await sendOriginal();
            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            await expect(
                noAuthClient.credentialRefresh.publishCredentialRefresh({
                    mode: 'issuer-signed',
                    refreshId: allocation.refreshId,
                    signedCredential: updated,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                issuer.clients.partialAuth.credentialRefresh.publishCredentialRefresh({
                    mode: 'issuer-signed',
                    refreshId: allocation.refreshId,
                    signedCredential: updated,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('rejects an unknown refreshId', async () => {
            const { allocation } = await sendOriginal();
            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            await expect(
                publishIssuerSigned('not-a-real-refresh-id', updated)
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('rejects a caller that is not the allocating issuer', async () => {
            const { allocation } = await sendOriginal();
            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            for (const client of [holder.clients.fullAuth, outsider.clients.fullAuth]) {
                await expect(
                    client.credentialRefresh.publishCredentialRefresh({
                        mode: 'issuer-signed',
                        refreshId: allocation.refreshId,
                        signedCredential: updated,
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            }

            expect(await countCredentialNodes()).toEqual(1);
        });

        it('rejects publication before the original credential is bound', async () => {
            const allocation = await allocate();
            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            await expect(publishIssuerSigned(allocation.refreshId, updated)).rejects.toMatchObject({
                code: 'CONFLICT',
            });

            expect(await countCredentialNodes()).toEqual(0);
        });

        it('rejects a credential whose proof does not verify', async () => {
            const { allocation } = await sendOriginal();
            const signed = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            const tampered = {
                ...signed,
                name: 'tampered-after-signing',
            } as VC;

            await expect(publishIssuerSigned(allocation.refreshId, tampered)).rejects.toMatchObject(
                { code: 'BAD_REQUEST' }
            );

            expect(await countCredentialNodes()).toEqual(1);
        });

        it('rejects a credential with a different credential ID', async () => {
            const { allocation } = await sendOriginal();
            const updated = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { id: 'urn:uuid:different-credential' })
            );

            await expect(publishIssuerSigned(allocation.refreshId, updated)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('rejects a credential issued by a different issuer', async () => {
            const { allocation } = await sendOriginal();
            const updated = await signAs(
                outsider,
                buildUpdatedUnsignedCredential(allocation, {
                    issuer: outsider.learnCard.id.did(),
                })
            );

            await expect(publishIssuerSigned(allocation.refreshId, updated)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('rejects a credential for a different holder', async () => {
            const { allocation } = await sendOriginal();
            const updated = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, {
                    credentialSubject: { id: outsider.learnCard.id.did() },
                })
            );

            await expect(publishIssuerSigned(allocation.refreshId, updated)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('rejects a credential missing the allocated refreshService', async () => {
            const { allocation } = await sendOriginal();
            const unsigned = buildUpdatedUnsignedCredential(allocation);
            delete (unsigned as Record<string, unknown>).refreshService;
            const updated = await signAs(issuer, unsigned);

            await expect(publishIssuerSigned(allocation.refreshId, updated)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('publishes a new immutable holder-encrypted version and advances the head', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            const result = await publishIssuerSigned(allocation.refreshId, updated, {
                updateSummary: 'Final grades posted',
            });

            expect(result.refreshId).toEqual(allocation.refreshId);
            expect(result.version).toEqual(2);
            expect(typeof result.publishedAt).toEqual('string');
            expect(result.notification).toEqual('queued');

            // Aggregate advanced
            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.currentVersion).toEqual(2);
            expect(aggregate?.etag).toBeTruthy();
            expect(aggregate?.materialDigest).toBeTruthy();
            expect(aggregate?.signingMode).toEqual('issuer-signed');
            expect(aggregate?.updateSummary).toEqual('Final grades posted');
            expect(aggregate?.lastPublishedAt).toEqual(result.publishedAt);

            // Head is the new version; holder can decrypt the exact signed credential
            const head = await getCredentialRefreshHead(allocation.refreshId);
            expect(head?.version).toEqual(2);
            expect(head?.signingMode).toEqual('issuer-signed');
            expect(head?.updateSummary).toEqual('Final grades posted');
            expect(head?.etag).toEqual(aggregate?.etag);

            const decrypted = await decryptVersionAsHolder(allocation.refreshId, 2);
            expect(decrypted).toEqual(updated);

            // Payload is encrypted to the holder only
            const node = await getVersionNode(allocation.refreshId, 2);
            const parsed = JSON.parse(node!.credential);
            const recipientKids = parsed.recipients.map(
                (recipient: { header?: { kid?: string } }) => recipient.header?.kid ?? ''
            );
            expect(recipientKids).toHaveLength(1);
            expect(recipientKids[0]).toContain(holder.learnCard.id.did());
            expect(recipientKids[0]).not.toContain(issuer.learnCard.id.did());
            expect(recipientKids[0]).not.toContain(brain.id.did());
        });

        it('keeps the old head immutable and links the version chain', async () => {
            const { allocation } = await sendOriginal();

            const v1Before = await getVersionNode(allocation.refreshId, 1);
            expect(v1Before).toBeTruthy();

            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));
            await publishIssuerSigned(allocation.refreshId, updated);

            // Version 1 payload untouched
            const v1After = await getVersionNode(allocation.refreshId, 1);
            expect(v1After).toBeTruthy();
            expect(v1After!.credential).toEqual(v1Before!.credential);
            expect(v1After!.id).toEqual(v1Before!.id);

            // Chain: v1 -[:REFRESHED_TO]-> v2; ROOT stays at v1, HEAD moves to v2
            const chain = await runQuery(
                `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
                 MATCH (refresh)-[:ROOT]->(root:Credential)
                 MATCH (refresh)-[:HEAD]->(head:Credential)
                 OPTIONAL MATCH (v1:Credential {refreshVersionKey: $v1Key})-[edge:REFRESHED_TO]->(v2:Credential)
                 RETURN root.id AS rootId, head.id AS headId, v2.refreshVersionKey AS nextKey, count(edge) AS edges`,
                { refreshId: allocation.refreshId, v1Key: `${allocation.refreshId}:1` }
            );

            expect(chain.records[0]?.get('rootId')).toEqual(v1Before!.id);
            expect(chain.records[0]?.get('headId')).not.toEqual(v1Before!.id);
            expect(chain.records[0]?.get('nextKey')).toEqual(`${allocation.refreshId}:2`);
            expect(toNum(chain.records[0]?.get('edges'))).toEqual(1);
        });

        it('advances the managed version monotonically across publications', async () => {
            const { allocation } = await sendOriginal();

            const v2 = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));
            const first = await publishIssuerSigned(allocation.refreshId, v2);
            expect(first.version).toEqual(2);

            const v3 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, {
                    validFrom: '2026-03-01T00:00:00Z',
                    name: 'Final Transcript (Amended)',
                })
            );
            const second = await publishIssuerSigned(allocation.refreshId, v3);
            expect(second.version).toEqual(3);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.currentVersion).toEqual(3);

            const decrypted = await decryptVersionAsHolder(allocation.refreshId, 3);
            expect(decrypted).toEqual(v3);
        });

        it('returns the prior result for an idempotent retry without creating a version', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            const first = await publishIssuerSigned(allocation.refreshId, updated, {
                idempotencyKey: 'publish-retry-1',
            });
            expect(first.version).toEqual(2);
            expect(first.notification).toEqual('queued');

            const retry = await publishIssuerSigned(allocation.refreshId, updated, {
                idempotencyKey: 'publish-retry-1',
            });

            expect(retry).toEqual(first);
            expect(await countCredentialNodes()).toEqual(2);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.currentVersion).toEqual(2);
        });

        it('serializes concurrent publications to a single writer', async () => {
            const { allocation } = await sendOriginal();

            const updateA = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { name: 'Update A' })
            );
            const updateB = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { name: 'Update B' })
            );

            const results = await Promise.allSettled([
                publishIssuerSigned(allocation.refreshId, updateA),
                publishIssuerSigned(allocation.refreshId, updateB),
            ]);

            const fulfilled = results.filter(r => r.status === 'fulfilled');
            const rejected = results.filter(r => r.status === 'rejected');

            expect(fulfilled).toHaveLength(1);
            expect(rejected).toHaveLength(1);
            expect((fulfilled[0] as PromiseFulfilledResult<PublishResult>).value.version).toEqual(
                2
            );
            expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
                code: 'CONFLICT',
            });

            // Exactly one new immutable version exists and the head moved exactly once
            expect(await countCredentialNodes()).toEqual(2);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.currentVersion).toEqual(2);
        });

        it('rejects a strictly older effective time', async () => {
            const { allocation } = await sendOriginal();

            const v2 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { validFrom: '2026-02-01T00:00:00Z' })
            );
            await publishIssuerSigned(allocation.refreshId, v2);

            const rollback = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, {
                    validFrom: '2026-01-15T00:00:00Z',
                    name: 'Backdated Update',
                })
            );

            await expect(publishIssuerSigned(allocation.refreshId, rollback)).rejects.toMatchObject(
                { code: 'BAD_REQUEST' }
            );

            expect(await countCredentialNodes()).toEqual(2);
        });

        it('accepts an equal effective time with changed content', async () => {
            const { allocation } = await sendOriginal();

            const v2 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { validFrom: '2026-02-01T00:00:00Z' })
            );
            await publishIssuerSigned(allocation.refreshId, v2);

            // Some interoperable issuers reuse timestamp values; managed version
            // ordering remains authoritative.
            const v3 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, {
                    validFrom: '2026-02-01T00:00:00Z',
                    name: 'Same-Timestamp Amendment',
                })
            );

            const result = await publishIssuerSigned(allocation.refreshId, v3);
            expect(result.version).toEqual(3);
        });

        it('accepts a missing effective timestamp', async () => {
            const { allocation } = await sendOriginal();

            const unsigned = buildUpdatedUnsignedCredential(allocation, {
                name: 'Undated Update',
            });
            delete (unsigned as Record<string, unknown>).validFrom;
            const updated = await signAs(issuer, unsigned);

            const result = await publishIssuerSigned(allocation.refreshId, updated);
            expect(result.version).toEqual(2);

            const head = await getCredentialRefreshHead(allocation.refreshId);
            expect(head?.effectiveAt).toBeUndefined();
        });

        it('rejects publication to a revoked aggregate', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'revoked');

            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));

            await expect(publishIssuerSigned(allocation.refreshId, updated)).rejects.toMatchObject({
                code: 'CONFLICT',
            });

            expect(await countCredentialNodes()).toEqual(1);
        });

        it('reports not-applicable notification while awaiting claim', async () => {
            const { allocation } = await sendOriginal();

            const updated = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));
            const result = await publishIssuerSigned(allocation.refreshId, updated);

            // Pre-claim publications are stored but do not notify the intended holder.
            expect(result.version).toEqual(2);
            expect(result.notification).toEqual('not-applicable');
        });

        it('suppresses notification for non-material changes when notifyHolder is unset', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            // First material publish establishes the comparison digest.
            const v2 = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));
            const first = await publishIssuerSigned(allocation.refreshId, v2);
            expect(first.notification).toEqual('queued');

            // Identical user-visible content with only a newer validFrom is not material.
            const v3 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { validFrom: '2026-03-01T00:00:00Z' })
            );
            const second = await publishIssuerSigned(allocation.refreshId, v3);

            expect(second.version).toEqual(3);
            expect(second.notification).toEqual('suppressed');
        });

        it('honors explicit notifyHolder overrides', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            // notifyHolder: false suppresses even a material change
            const v2 = await signAs(issuer, buildUpdatedUnsignedCredential(allocation));
            const suppressed = await publishIssuerSigned(allocation.refreshId, v2, {
                notifyHolder: false,
            });
            expect(suppressed.notification).toEqual('suppressed');

            // notifyHolder: true forces notification even for a non-material change
            const v3 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, { validFrom: '2026-03-01T00:00:00Z' })
            );
            const forced = await publishIssuerSigned(allocation.refreshId, v3, {
                notifyHolder: true,
            });
            expect(forced.notification).toEqual('queued');
        });
    });

    describe('getCredentialRefreshHistory', () => {
        it('requires an authenticated issuer', async () => {
            const { allocation } = await sendOriginal();

            await expect(
                noAuthClient.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: allocation.refreshId,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                issuer.clients.partialAuth.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: allocation.refreshId,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('rejects unknown refreshIds and non-issuer callers', async () => {
            const { allocation } = await sendOriginal();

            await expect(
                issuer.clients.fullAuth.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: 'not-a-real-refresh-id',
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            for (const client of [holder.clients.fullAuth, outsider.clients.fullAuth]) {
                await expect(
                    client.credentialRefresh.getCredentialRefreshHistory({
                        refreshId: allocation.refreshId,
                    })
                ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            }
        });

        it('returns metadata-only version history, newest first', async () => {
            const { allocation } = await sendOriginal();

            const v2 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, {
                    validFrom: '2026-02-01T00:00:00Z',
                    name: 'Second Version',
                })
            );
            await publishIssuerSigned(allocation.refreshId, v2, {
                updateSummary: 'Second summary',
            });

            const v3 = await signAs(
                issuer,
                buildUpdatedUnsignedCredential(allocation, {
                    validFrom: '2026-03-01T00:00:00Z',
                    name: 'Third Version',
                })
            );
            await publishIssuerSigned(allocation.refreshId, v3);

            const history =
                await issuer.clients.fullAuth.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: allocation.refreshId,
                });

            expect(history.hasMore).toBe(false);
            expect(history.records.map(record => record.version)).toEqual([3, 2, 1]);

            const v3Record = history.records[0]!;
            expect(v3Record.signingMode).toEqual('issuer-signed');
            expect(v3Record.effectiveAt).toEqual('2026-03-01T00:00:00.000Z');
            expect(v3Record.publishedAt).toBeTruthy();
            expect(v3Record.etag).toBeTruthy();

            const v2Record = history.records[1]!;
            expect(v2Record.updateSummary).toEqual('Second summary');

            // Metadata only: no encrypted payload or subject/body fields may leak.
            for (const record of history.records) {
                expect(record).toMatchObject({
                    version: expect.any(Number),
                    publishedAt: expect.any(String),
                });
                const leaked = Object.keys(record).filter(key =>
                    [
                        'credential',
                        'jwe',
                        'credentialSubject',
                        'proof',
                        'refreshVersionKey',
                        'id',
                    ].includes(key)
                );
                expect(leaked).toEqual([]);
            }
        });

        it('paginates with an opaque cursor', async () => {
            const { allocation } = await sendOriginal();

            for (const [index, name] of ['Page Two', 'Page Three', 'Page Four'].entries()) {
                const updated = await signAs(
                    issuer,
                    buildUpdatedUnsignedCredential(allocation, {
                        validFrom: `2026-0${index + 2}-01T00:00:00Z`,
                        name,
                    })
                );
                await publishIssuerSigned(allocation.refreshId, updated);
            }

            const firstPage =
                await issuer.clients.fullAuth.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: allocation.refreshId,
                    limit: 2,
                });

            expect(firstPage.records.map(record => record.version)).toEqual([4, 3]);
            expect(firstPage.hasMore).toBe(true);
            expect(firstPage.cursor).toBeTruthy();

            const secondPage =
                await issuer.clients.fullAuth.credentialRefresh.getCredentialRefreshHistory({
                    refreshId: allocation.refreshId,
                    limit: 2,
                    cursor: firstPage.cursor,
                });

            expect(secondPage.records.map(record => record.version)).toEqual([2, 1]);
            expect(secondPage.hasMore).toBe(false);
        });
    });

    describe('publishCredentialRefresh (signing-authority mode)', () => {
        const registerIssuerSigningAuthority = async () => {
            await issuer.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: SA_ENDPOINT,
                name: SA_NAME,
                did: issuer.learnCard.id.did(),
            });
        };

        const publishSigningAuthority = async (
            refreshId: string,
            credential: UnsignedVC,
            signingAuthority: Record<string, unknown> = {
                type: 'SigningAuthority',
                name: SA_NAME,
                endpoint: SA_ENDPOINT,
            },
            extras: Record<string, unknown> = {}
        ): Promise<PublishResult> =>
            issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                mode: 'signing-authority',
                refreshId,
                credential,
                signingAuthority,
                ...extras,
            } as Parameters<typeof issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh>[0]);

        it('signs an unsigned body through an owned signing authority', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');
            await registerIssuerSigningAuthority();

            const unsigned = buildUpdatedUnsignedCredential(allocation);

            const result = await publishSigningAuthority(allocation.refreshId, unsigned, {
                type: 'SigningAuthority',
                name: SA_NAME,
                endpoint: SA_ENDPOINT,
            });

            expect(result.version).toEqual(2);
            expect(result.notification).toEqual('queued');

            const head = await getCredentialRefreshHead(allocation.refreshId);
            expect(head?.signingMode).toEqual('signing-authority');

            // The completed credential passes the same invariants as issuer-signed input:
            // same credential ID, same holder subject, allocated refresh service, valid proof.
            const decrypted = await decryptVersionAsHolder(allocation.refreshId, 2);

            expect(decrypted.id).toEqual(CREDENTIAL_ID);
            expect(decrypted.credentialSubject).toMatchObject({ id: holder.learnCard.id.did() });
            expect((decrypted as Record<string, unknown>).refreshService).toEqual(
                allocation.refreshService
            );
            expect(decrypted.proof).toBeTruthy();

            const verification = await brain.invoke.verifyCredential(decrypted);
            expect(verification.errors).toEqual([]);
            expect(verification.checks).toContain('proof');
        });

        it('rejects a signing authority the issuer does not own', async () => {
            const { allocation } = await sendOriginal();

            // Registered to the outsider, not the issuer.
            await outsider.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: SA_ENDPOINT,
                name: SA_NAME,
                did: outsider.learnCard.id.did(),
            });

            const unsigned = buildUpdatedUnsignedCredential(allocation);

            await expect(
                publishSigningAuthority(allocation.refreshId, unsigned)
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            // Never registered at all.
            await expect(
                publishSigningAuthority(allocation.refreshId, unsigned, {
                    type: 'SigningAuthority',
                    name: 'unknown-sa',
                    endpoint: SA_ENDPOINT,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(await countCredentialNodes()).toEqual(1);
        });

        it('preserves an existing credentialStatus and allocates no new status-list entry', async () => {
            const { allocation } = await sendOriginal();
            await registerIssuerSigningAuthority();

            const credentialStatus = {
                id: 'https://status.example.com/lists/42#7',
                type: 'BitstringStatusListEntry',
                statusPurpose: 'revocation',
                statusListIndex: '7',
                statusListCredential: 'https://status.example.com/lists/42',
            };

            const unsigned = buildUpdatedUnsignedCredential(allocation, { credentialStatus });

            const result = await publishSigningAuthority(allocation.refreshId, unsigned);
            expect(result.version).toEqual(2);

            const decrypted = await decryptVersionAsHolder(allocation.refreshId, 2);
            expect((decrypted as Record<string, unknown>).credentialStatus).toEqual(
                credentialStatus
            );

            // No status list was created or allocated for the refresh version.
            expect(await countStatusLists()).toEqual(0);
        });

        it('does not add a credentialStatus when the body has none', async () => {
            const { allocation } = await sendOriginal();
            await registerIssuerSigningAuthority();

            const unsigned = buildUpdatedUnsignedCredential(allocation);

            await publishSigningAuthority(allocation.refreshId, unsigned);

            const decrypted = await decryptVersionAsHolder(allocation.refreshId, 2);
            expect((decrypted as Record<string, unknown>).credentialStatus).toBeUndefined();
            expect(await countStatusLists()).toEqual(0);
        });

        it('enforces the same invariants as issuer-signed input', async () => {
            const { allocation } = await sendOriginal();
            await registerIssuerSigningAuthority();

            // Wrong credential ID
            await expect(
                publishSigningAuthority(
                    allocation.refreshId,
                    buildUpdatedUnsignedCredential(allocation, { id: 'urn:uuid:other' })
                )
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            // Wrong holder
            await expect(
                publishSigningAuthority(
                    allocation.refreshId,
                    buildUpdatedUnsignedCredential(allocation, {
                        credentialSubject: { id: outsider.learnCard.id.did() },
                    })
                )
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            // Wrong issuer on the unsigned body
            await expect(
                publishSigningAuthority(
                    allocation.refreshId,
                    buildUpdatedUnsignedCredential(allocation, {
                        issuer: outsider.learnCard.id.did(),
                    })
                )
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            // Missing allocated refreshService
            const noService = buildUpdatedUnsignedCredential(allocation);
            delete (noService as Record<string, unknown>).refreshService;
            await expect(
                publishSigningAuthority(allocation.refreshId, noService)
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            expect(await countCredentialNodes()).toEqual(1);
        });
    });
});
