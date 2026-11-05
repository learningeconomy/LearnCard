import { vi } from 'vitest';
import type { HolderEncryptedHandoff, JWE, UnsignedVC, VC } from '@learncard/types';
import { JWEValidator, VCValidator } from '@learncard/types';

import { neogma } from '@instance';

import { getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import { getCredentialByUri } from '@accesslayer/credential/read';
import {
    getCredentialRefresh,
    getCredentialRefreshHead,
    setCredentialRefreshState,
} from '@accesslayer/credential-refresh';

/**
 * Server-side holder-mode (student-only encrypted) managed sends (LC-2345, A3 steps
 * 6, 9, 10, 11). The server never decrypts: every check here is structural (public
 * handoff fields vs. the allocation) or a JWE recipient-set comparison. Proof,
 * `refreshService` equality and claim content are the receiving device's
 * responsibility (`ingestManagedCredential`), not this server's.
 */

const ISSUER_PROFILE_ID = 'holder-mode-issuer';
const HOLDER_PROFILE_ID = 'holder-mode-holder';
const MANAGER_PROFILE_ID = 'holder-mode-manager';
const MANAGER2_PROFILE_ID = 'holder-mode-manager-2';
const OUTSIDER_PROFILE_ID = 'holder-mode-outsider';
const SENTINEL_CLAIM = 'HOLDER-MODE-SENTINEL-CLAIM-f3c9a7';

let brain: SeedLearnCard;
let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let manager: Awaited<ReturnType<typeof getUser>>;
let manager2: Awaited<ReturnType<typeof getUser>>;
let outsider: Awaited<ReturnType<typeof getUser>>;

type PreparedHolderSend = {
    refreshId: string;
    credentialId: string;
    holderDid: string;
    boostUri: string;
    refreshService: { id: string; type: string; authorization?: { type: string } };
    statusEntries?: Record<string, unknown>[];
    recipientKeyIds?: string[];
};

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

const toNum = (value: unknown): number =>
    value && typeof (value as { toNumber?: () => number }).toNumber === 'function'
        ? (value as { toNumber: () => number }).toNumber()
        : Number(value ?? 0);

const linkManager = async (managerProfileId: string) =>
    runQuery(
        `MATCH (child:Profile {profileId: $childId})
         MATCH (mgr:Profile {profileId: $mgrId})
         MERGE (child)-[:MANAGED_BY]->(mgr)`,
        { childId: HOLDER_PROFILE_ID, mgrId: managerProfileId }
    );

/** Every property value of every node carrying the given label, flattened to text. */
const dumpNodeText = async (label: string): Promise<string> => {
    const result = await runQuery(`MATCH (n:${label}) RETURN properties(n) AS props`);

    return JSON.stringify(result.records.map(record => record.get('props')));
};

const assertNoSentinelLeak = async (): Promise<void> => {
    expect(await dumpNodeText('Boost')).not.toContain(SENTINEL_CLAIM);
    expect(await dumpNodeText('CredentialRefresh')).not.toContain(SENTINEL_CLAIM);
    expect(JSON.stringify(addNotificationToQueueSpy.mock.calls)).not.toContain(SENTINEL_CLAIM);
};

const prepareHolderSend = async (
    overrides: Record<string, unknown> = {}
): Promise<PreparedHolderSend> =>
    issuer.clients.fullAuth.boost.prepareRefreshableSend({
        recipient: HOLDER_PROFILE_ID,
        display: { name: 'Official Transcript', category: 'Learning History' },
        encryption: 'holder',
        ...overrides,
    } as Parameters<
        typeof issuer.clients.fullAuth.boost.prepareRefreshableSend
    >[0]) as Promise<PreparedHolderSend>;

const MANAGED_REFRESH_CONTEXT_FRAGMENT = {
    LearnCardCredentialRefresh2026: 'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
    authorization: {
        '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
        '@context': {
            LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth',
        },
    },
};

/** Signs a holder-mode-shaped credential; `overrides` replace fields directly. */
const signHolderCredential = async (
    prepared: PreparedHolderSend,
    overrides: Record<string, unknown> = {}
): Promise<VC> => {
    const unsigned = {
        '@context': ['https://www.w3.org/ns/credentials/v2', MANAGED_REFRESH_CONTEXT_FRAGMENT],
        id: prepared.credentialId,
        type: ['VerifiableCredential'],
        issuer: issuer.learnCard.id.did(),
        validFrom: '2026-01-01T00:00:00Z',
        // `description` is a standard VCDM v2 term (unlike a custom subject claim) so
        // it carries the sentinel without needing its own JSON-LD context fragment.
        description: SENTINEL_CLAIM,
        credentialSubject: { id: prepared.holderDid },
        refreshService: prepared.refreshService,
        ...(prepared.statusEntries?.[0] ? { credentialStatus: prepared.statusEntries[0] } : {}),
        ...overrides,
    } as UnsignedVC;

    return issuer.learnCard.invoke.issueCredential(unsigned);
};

const DEFAULT_RECIPIENTS = (): string[] => [holder.learnCard.id.did(), manager.learnCard.id.did()];

const buildHandoff = async (
    prepared: PreparedHolderSend,
    params: {
        credential?: VC;
        jwe?: JWE;
        recipients?: string[];
        credentialId?: string;
        holderDid?: string;
        issuerDid?: string;
        credentialStatus?: unknown;
    } = {}
): Promise<{ handoff: HolderEncryptedHandoff; credential: VC }> => {
    const credential = params.credential ?? (await signHolderCredential(prepared));
    const jwe =
        params.jwe ??
        (await issuer.learnCard.invoke.createDagJweExact(
            credential,
            params.recipients ?? DEFAULT_RECIPIENTS()
        ));
    const issuerId: string =
        typeof credential.issuer === 'string'
            ? credential.issuer
            : (credential.issuer.id ?? issuer.learnCard.id.did());

    return {
        credential,
        handoff: {
            refreshId: prepared.refreshId,
            credentialId: params.credentialId ?? credential.id!,
            holderDid: params.holderDid ?? prepared.holderDid,
            issuerDid: params.issuerDid ?? issuerId,
            credentialStatus: (params.credentialStatus ??
                credential.credentialStatus) as HolderEncryptedHandoff['credentialStatus'],
            jwe,
        },
    };
};

const sendHandoff = async (handoff: HolderEncryptedHandoff): Promise<string> => {
    const { uri, activityId } =
        await issuer.clients.fullAuth.credentialRefresh.sendHolderEncryptedRefreshable({
            handoff,
        });
    expect(activityId).toEqual(expect.any(String));
    expect(activityId.length).toBeGreaterThan(0);
    return uri;
};

describe('Holder-mode managed sends (LC-2345)', () => {
    beforeAll(async () => {
        brain = await getLearnCard();
        issuer = await getUser('12'.repeat(32));
        holder = await getUser('34'.repeat(32));
        manager = await getUser('56'.repeat(32));
        manager2 = await getUser('78'.repeat(32));
        outsider = await getUser('9a'.repeat(32));

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
        await runQuery('MATCH (b:Boost) DETACH DELETE b');
        await runQuery('MATCH (i:RefreshSendIntent) DETACH DELETE i');
        await runQuery('MATCH (l:BitstringStatusList) DETACH DELETE l');
        await runQuery('MATCH (bind:CredentialStatusBinding) DETACH DELETE bind');
        await runQuery('MATCH (p:Profile) DETACH DELETE p');

        await issuer.clients.fullAuth.profile.createProfile({ profileId: ISSUER_PROFILE_ID });
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_PROFILE_ID });
        await manager.clients.fullAuth.profile.createProfile({ profileId: MANAGER_PROFILE_ID });
        await manager2.clients.fullAuth.profile.createProfile({ profileId: MANAGER2_PROFILE_ID });
        await outsider.clients.fullAuth.profile.createProfile({ profileId: OUTSIDER_PROFILE_ID });

        await linkManager(MANAGER_PROFILE_ID);

        addNotificationToQueueSpy.mockReset();
    });

    describe('sendHolderEncryptedRefreshable: success', () => {
        it('stores only the JWE, matches the published recipient set, and leaks no claim', async () => {
            const prepared = await prepareHolderSend();

            expect(prepared.recipientKeyIds).toBeDefined();
            expect(prepared.recipientKeyIds).toHaveLength(2);
            expect((await getCredentialRefresh(prepared.refreshId))?.encryptionMode).toBe('holder');

            const { credential, handoff } = await buildHandoff(prepared);
            const kids = handoff.jwe.recipients!.map(recipient => recipient.header.kid);
            expect(new Set(kids)).toEqual(new Set(prepared.recipientKeyIds));

            const uri = await sendHandoff(handoff);
            expect(uri).toContain(':credential:');

            const stored = await getCredentialByUri(uri);
            expect(stored).toBeTruthy();
            const parsed = JSON.parse(stored!.credential);
            expect(JWEValidator.safeParse(parsed).success).toBe(true);
            expect(VCValidator.safeParse(parsed).success).toBe(false);
            expect(stored!.credential).not.toContain(SENTINEL_CLAIM);

            const decrypted = await holder.learnCard.invoke.decryptDagJwe(parsed);
            expect(decrypted).toEqual(credential);
            const decryptedByManager = await manager.learnCard.invoke.decryptDagJwe(parsed);
            expect(decryptedByManager).toEqual(credential);
            const issuerAttempt = await issuer.learnCard.invoke
                .decryptDagJwe(parsed)
                .catch(() => null);
            expect(issuerAttempt).not.toEqual(credential);
            const brainAttempt = await brain.invoke.decryptDagJwe(parsed).catch(() => null);
            expect(brainAttempt).not.toEqual(credential);

            const sentCount = toNum(
                (
                    await runQuery(
                        `MATCH (:Profile {profileId: $issuerProfileId})-[:CREDENTIAL_SENT]->(c:Credential {id: $id})
                         RETURN count(c) AS count`,
                        { issuerProfileId: ISSUER_PROFILE_ID, id: stored!.id }
                    )
                ).records[0]?.get('count')
            );
            expect(sentCount).toEqual(1);

            const head = await getCredentialRefreshHead(prepared.refreshId);
            expect(head?.version).toEqual(1);

            await assertNoSentinelLeak();
        });
    });

    describe('sendHolderEncryptedRefreshable: structural rejections', () => {
        it('rejects a JWE encrypted to the wrong recipient entirely', async () => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared, {
                recipients: [outsider.learnCard.id.did()],
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({
                code: 'CONFLICT',
                message: 'RECIPIENTS_CHANGED',
            });
        });

        it('rejects an extra recipient beyond holder + managers', async () => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared, {
                recipients: [...DEFAULT_RECIPIENTS(), outsider.learnCard.id.did()],
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({
                code: 'CONFLICT',
                message: 'RECIPIENTS_CHANGED',
            });
        });

        it('rejects a missing manager recipient', async () => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared, {
                recipients: [holder.learnCard.id.did()],
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({
                code: 'CONFLICT',
                message: 'RECIPIENTS_CHANGED',
            });
        });

        it('rejects a credentialId that does not match the allocated refresh', async () => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared, {
                credentialId: 'urn:uuid:not-the-allocated-credential',
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a holderDid that does not match the intended holder', async () => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared, {
                holderDid: outsider.learnCard.id.did(),
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a credentialStatus that does not match the bound entries', async () => {
            // Both entries are validly owned/purposed/in-bounds on their own, so
            // supplying only one is a pure coordinate-set mismatch against what was
            // bound at prepare time, not an owner/purpose/bounds failure.
            const prepared = await prepareHolderSend({ statusPurposes: ['suspension'] });
            expect(prepared.statusEntries).toHaveLength(2);

            const { handoff } = await buildHandoff(prepared, {
                credentialStatus: [prepared.statusEntries![0]!],
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects an issuerDid the sending profile does not control', async () => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared, {
                issuerDid: outsider.learnCard.id.did(),
            });

            await expect(sendHandoff(handoff)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('holder mode is incompatible with inbox recipients and plaintext sends', () => {
        it('rejects an email recipient at prepare time', async () => {
            await expect(
                prepareHolderSend({ recipient: 'student@example.com' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('rejects a phone recipient at prepare time', async () => {
            await expect(prepareHolderSend({ recipient: '+15555550123' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('rejects mixing modes: a plaintext send against a holder-mode aggregate', async () => {
            const prepared = await prepareHolderSend();
            const plaintext = await signHolderCredential(prepared);

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: prepared.refreshId,
                    credential: plaintext,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('rejects mixing modes: a holder-mode handoff against a network-mode aggregate', async () => {
            const networkAllocation =
                await issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId: 'urn:uuid:network-mode-aggregate',
                });
            const credential = await issuer.learnCard.invoke.issueCredential({
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    MANAGED_REFRESH_CONTEXT_FRAGMENT,
                ],
                id: 'urn:uuid:network-mode-aggregate',
                type: ['VerifiableCredential'],
                issuer: issuer.learnCard.id.did(),
                validFrom: '2026-01-01T00:00:00Z',
                credentialSubject: { id: holder.learnCard.id.did() },
                refreshService: networkAllocation.refreshService,
            } as UnsignedVC);
            const jwe = await issuer.learnCard.invoke.createDagJweExact(
                credential,
                DEFAULT_RECIPIENTS()
            );

            await expect(
                sendHandoff({
                    refreshId: networkAllocation.refreshId,
                    credentialId: credential.id!,
                    holderDid: holder.learnCard.id.did(),
                    issuerDid: issuer.learnCard.id.did(),
                    // The handoff schema requires a credentialStatus; its value is
                    // irrelevant here since the mode check rejects before any
                    // status comparison runs.
                    credentialStatus: {
                        id: 'https://localhost%3A3000/status/dummy#0',
                        type: 'BitstringStatusListEntry',
                        statusPurpose: 'revocation',
                        statusListIndex: '0',
                        statusListCredential: 'https://localhost%3A3000/status/dummy',
                    },
                    jwe,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });
    });

    describe('manager change after prepare', () => {
        it('rejects a stale recipient set with RECIPIENTS_CHANGED, then succeeds after getEncryptionRecipients + re-encrypt', async () => {
            const prepared = await prepareHolderSend();
            expect(prepared.recipientKeyIds).toHaveLength(2);

            // A manager is added after prepare: the previously-prepared set is now stale.
            await linkManager(MANAGER2_PROFILE_ID);

            const credential = await signHolderCredential(prepared);
            const staleJwe = await issuer.learnCard.invoke.createDagJweExact(
                credential,
                DEFAULT_RECIPIENTS()
            );
            const { handoff: staleHandoff } = await buildHandoff(prepared, {
                credential,
                jwe: staleJwe,
            });

            await expect(sendHandoff(staleHandoff)).rejects.toMatchObject({
                code: 'CONFLICT',
                message: 'RECIPIENTS_CHANGED',
            });

            const current = await issuer.clients.fullAuth.credentialRefresh.getEncryptionRecipients(
                {
                    refreshId: prepared.refreshId,
                }
            );
            expect(current.recipientKeyIds).toHaveLength(3);

            // Only the issuer who allocated this refresh may see its recipients.
            await expect(
                outsider.clients.fullAuth.credentialRefresh.getEncryptionRecipients({
                    refreshId: prepared.refreshId,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const retryJwe = await issuer.learnCard.invoke.createDagJweExact(credential, [
                holder.learnCard.id.did(),
                manager.learnCard.id.did(),
                manager2.learnCard.id.did(),
            ]);
            const { handoff: retryHandoff } = await buildHandoff(prepared, {
                credential,
                jwe: retryJwe,
            });

            const uri = await sendHandoff(retryHandoff);
            expect(uri).toContain(':credential:');
            await assertNoSentinelLeak();
        });
    });

    describe('publishHolderEncryptedRefreshable', () => {
        const sendAndActivate = async (): Promise<PreparedHolderSend> => {
            const prepared = await prepareHolderSend();
            const { handoff } = await buildHandoff(prepared);
            await sendHandoff(handoff);
            await setCredentialRefreshState(prepared.refreshId, 'active');
            // Isolate publish-triggered notifications from the initial-send one.
            addNotificationToQueueSpy.mockClear();
            return prepared;
        };

        it('notify: true queues a notification; notify: false suppresses it', async () => {
            const prepared = await sendAndActivate();

            const { handoff: v2 } = await buildHandoff(prepared, {
                credential: await signHolderCredential(prepared, {
                    validFrom: '2026-02-01T00:00:00Z',
                }),
            });
            const published =
                await issuer.clients.fullAuth.credentialRefresh.publishHolderEncryptedRefreshable({
                    handoff: v2,
                    notify: true,
                });
            expect(published.version).toEqual(2);
            expect(published.notification).toEqual('queued');
            expect(addNotificationToQueueSpy).toHaveBeenCalledTimes(1);

            addNotificationToQueueSpy.mockClear();

            const { handoff: v3 } = await buildHandoff(prepared, {
                credential: await signHolderCredential(prepared, {
                    validFrom: '2026-03-01T00:00:00Z',
                }),
            });
            const publishedSuppressed =
                await issuer.clients.fullAuth.credentialRefresh.publishHolderEncryptedRefreshable({
                    handoff: v3,
                    notify: false,
                });
            expect(publishedSuppressed.version).toEqual(3);
            expect(publishedSuppressed.notification).toEqual('suppressed');
            expect(addNotificationToQueueSpy).not.toHaveBeenCalled();

            const head = await getCredentialRefreshHead(prepared.refreshId);
            expect(head?.version).toEqual(3);
            await assertNoSentinelLeak();
        });

        it('rejects signing-authority publication for a holder-mode aggregate', async () => {
            const prepared = await sendAndActivate();

            await expect(
                issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                    mode: 'signing-authority',
                    refreshId: prepared.refreshId,
                    credential: {
                        '@context': [
                            'https://www.w3.org/ns/credentials/v2',
                            MANAGED_REFRESH_CONTEXT_FRAGMENT,
                        ],
                        type: ['VerifiableCredential'],
                        issuer: issuer.learnCard.id.did(),
                        validFrom: '2026-02-01T00:00:00Z',
                        credentialSubject: { id: prepared.holderDid },
                        refreshService: prepared.refreshService,
                    } as UnsignedVC,
                    signingAuthority: {
                        type: 'SigningAuthority',
                        name: 'unregistered',
                        endpoint: 'https://sa.example.com',
                    },
                } as Parameters<
                    typeof issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh
                >[0])
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('rejects a handoff whose issuer differs from version 1', async () => {
            const prepared = await sendAndActivate();
            const { handoff } = await buildHandoff(prepared, {
                issuerDid: outsider.learnCard.id.did(),
            });

            await expect(
                issuer.clients.fullAuth.credentialRefresh.publishHolderEncryptedRefreshable({
                    handoff,
                    notify: false,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });
});
