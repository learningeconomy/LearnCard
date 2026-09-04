import { vi } from 'vitest';
import {
    JWEValidator,
    LCNNotificationTypeEnumValidator,
    VCValidator,
    VC,
    UnsignedVC,
} from '@learncard/types';

import { Profile, Credential, Boost } from '@models';
import { neogma } from '@instance';

import { getClient, getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import { getLearnCard, SeedLearnCard } from '@helpers/learnCard.helpers';
import { getCredentialByUri } from '@accesslayer/credential/read';
import { getCredentialRefresh, getCredentialRefreshHead } from '@accesslayer/credential-refresh';
import { getDidWeb } from '@helpers/did.helpers';
import { testUnsignedBoost } from './helpers/send';

const noAuthClient = getClient();

let brain: SeedLearnCard;
let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let outsider: Awaited<ReturnType<typeof getUser>>;

const ISSUER_PROFILE_ID = 'refresh-issuer';
const HOLDER_PROFILE_ID = 'refresh-holder';
const OUTSIDER_PROFILE_ID = 'refresh-outsider';
const CREDENTIAL_ID = 'urn:uuid:refreshable-credential-1';
const DOMAIN = 'localhost%3A3000';
const PREVIOUS_CREDENTIAL_REFRESH_ENABLED = process.env.CREDENTIAL_REFRESH_ENABLED;

type AllocationResult = {
    refreshId: string;
    refreshService: { id: string; type: string; authorization?: { type: string } };
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

const countSentRelationships = async (): Promise<number> =>
    toNum(
        (
            await runQuery('MATCH ()-[r:CREDENTIAL_SENT]->() RETURN count(r) AS count')
        ).records[0]?.get('count')
    );

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
        credentialSubject: { id: holder.learnCard.id.did() },
        refreshService: allocation.refreshService,
        ...overrides,
    }) as UnsignedVC;

const signAs = async (
    user: Awaited<ReturnType<typeof getUser>>,
    unsigned: UnsignedVC
): Promise<VC> => user.learnCard.invoke.issueCredential(unsigned);

const allocateAndSign = async (): Promise<{ allocation: AllocationResult; credential: VC }> => {
    const allocation = await allocate();
    const credential = await signAs(issuer, buildUnsignedCredential(allocation));

    return { allocation, credential };
};

describe('Credential Refresh Allocation', () => {
    beforeAll(async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';

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

    afterAll(() => {
        if (PREVIOUS_CREDENTIAL_REFRESH_ENABLED === undefined) {
            delete process.env.CREDENTIAL_REFRESH_ENABLED;
        } else {
            process.env.CREDENTIAL_REFRESH_ENABLED = PREVIOUS_CREDENTIAL_REFRESH_ENABLED;
        }
    });

    beforeEach(async () => {
        await runQuery('MATCH (r:CredentialRefresh) DETACH DELETE r');
        await runQuery('MATCH (c:Credential) DETACH DELETE c');
        await Boost.delete({ detach: true, where: {} });
        await runQuery('MATCH (p:Profile) DETACH DELETE p');

        await issuer.clients.fullAuth.profile.createProfile({ profileId: ISSUER_PROFILE_ID });
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_PROFILE_ID });
        await outsider.clients.fullAuth.profile.createProfile({ profileId: OUTSIDER_PROFILE_ID });

        addNotificationToQueueSpy.mockReset();
    });

    describe('allocateCredentialRefresh', () => {
        it('gates issuer allocation, send, and publication when refresh is disabled', async () => {
            const sendCandidate = await allocateAndSign();
            const publishCandidate = await allocateAndSign();

            await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                refreshId: publishCandidate.allocation.refreshId,
                credential: publishCandidate.credential,
            });

            const updatedCredential = await signAs(
                issuer,
                buildUnsignedCredential(publishCandidate.allocation, {
                    validFrom: '2026-02-01T00:00:00Z',
                    name: 'Final Transcript',
                })
            );

            process.env.CREDENTIAL_REFRESH_ENABLED = 'false';

            try {
                await expect(allocate()).rejects.toMatchObject({ code: 'NOT_FOUND' });

                await expect(
                    issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                        refreshId: sendCandidate.allocation.refreshId,
                        credential: sendCandidate.credential,
                    })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });

                await expect(
                    issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
                        mode: 'issuer-signed',
                        refreshId: publishCandidate.allocation.refreshId,
                        signedCredential: updatedCredential,
                    })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            } finally {
                process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
            }

            expect(await getCredentialRefreshHead(sendCandidate.allocation.refreshId)).toBeNull();
            expect(
                await getCredentialRefreshHead(publishCandidate.allocation.refreshId)
            ).toMatchObject({ version: 1 });
        });

        it('requires an authenticated issuer', async () => {
            await expect(
                noAuthClient.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId: CREDENTIAL_ID,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            await expect(
                issuer.clients.partialAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId: CREDENTIAL_ID,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('requires an existing recipient profile', async () => {
            await expect(
                issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: 'missing-profile', did: holder.learnCard.id.did() },
                    credentialId: CREDENTIAL_ID,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            await expect(
                issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { did: 'did:key:unregistered-holder' },
                    credentialId: CREDENTIAL_ID,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('rejects a holder DID that does not belong to the supplied profile', async () => {
            await expect(
                issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: {
                        profileId: HOLDER_PROFILE_ID,
                        did: outsider.learnCard.id.did(),
                    },
                    credentialId: CREDENTIAL_ID,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('hides a holder that has blocked the issuer', async () => {
            await holder.clients.fullAuth.profile.blockProfile({ profileId: ISSUER_PROFILE_ID });

            await expect(allocate()).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('requires a stable nonempty credential ID', async () => {
            await expect(
                issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
                    holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
                    credentialId: '',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('returns an unguessable managed service URL with the LearnCard auth descriptor', async () => {
            const allocation = await allocate();

            expect(allocation.refreshId).toMatch(/^[A-Za-z0-9_-]{43}$/);
            expect(allocation.refreshService.type).toEqual('1EdTechCredentialRefresh');
            expect(allocation.refreshService.id).toMatch(
                new RegExp(`/refresh/${allocation.refreshId}$`)
            );
            expect(allocation.refreshService.authorization).toEqual({
                type: 'LearnCardDIDAuth',
            });

            const second = await allocate();

            expect(second.refreshId).not.toEqual(allocation.refreshId);
            expect(second.refreshService.id).not.toEqual(allocation.refreshService.id);
        });

        it('creates an awaiting_claim aggregate bound to issuer and holder without a body', async () => {
            const allocation = await allocate();

            const aggregate = await getCredentialRefresh(allocation.refreshId);

            expect(aggregate).toBeTruthy();
            expect(aggregate?.state).toEqual('awaiting_claim');
            expect(aggregate?.issuerProfileId).toEqual(ISSUER_PROFILE_ID);
            expect(aggregate?.issuerDid).toEqual(getDidWeb(DOMAIN, ISSUER_PROFILE_ID));
            expect(aggregate?.holderProfileId).toEqual(HOLDER_PROFILE_ID);
            expect(aggregate?.holderDid).toEqual(holder.learnCard.id.did());
            expect(aggregate?.credentialId).toEqual(CREDENTIAL_ID);
            expect(aggregate?.currentVersion).toEqual(1);

            // Allocation happens before signing: no credential body is bound yet.
            expect(await getCredentialRefreshHead(allocation.refreshId)).toBeNull();
        });
    });

    describe('sendRefreshableCredential', () => {
        it('requires an authenticated issuer', async () => {
            const { allocation, credential } = await allocateAndSign();

            await expect(
                noAuthClient.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('rejects an unknown refreshId', async () => {
            const { credential } = await allocateAndSign();

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: 'not-a-real-refresh-id',
                    credential,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('rejects a caller that is not the allocating issuer', async () => {
            const { allocation, credential } = await allocateAndSign();

            await expect(
                outsider.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
        });

        it('refuses delivery when either profile blocks the other after allocation', async () => {
            const { allocation, credential } = await allocateAndSign();
            await holder.clients.fullAuth.profile.blockProfile({ profileId: ISSUER_PROFILE_ID });

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
        });

        it('stores only the holder-encrypted JWE and binds version 1', async () => {
            const { allocation, credential } = await allocateAndSign();

            const uri = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                refreshId: allocation.refreshId,
                credential,
            });

            expect(uri).toContain(':credential:');

            // Stored Credential JSON is a JWE, never plaintext VC JSON.
            const stored = await getCredentialByUri(uri);

            expect(stored).toBeTruthy();

            const parsed = JSON.parse(stored!.credential);

            expect(JWEValidator.safeParse(parsed).success).toBe(true);
            expect(VCValidator.safeParse(parsed).success).toBe(false);

            // The holder can decrypt and recover the exact signed credential.
            const decrypted = await holder.learnCard.invoke.decryptDagJwe(parsed);

            expect(decrypted).toEqual(credential);

            // The payload is encrypted to the holder only: exactly one recipient,
            // whose key id belongs to the holder DID — never the issuer or brain DID.
            const recipientKids = parsed.recipients.map(
                (recipient: { header?: { kid?: string } }) => recipient.header?.kid ?? ''
            );

            expect(recipientKids).toHaveLength(1);
            expect(recipientKids[0]).toContain(holder.learnCard.id.did());
            expect(recipientKids[0]).not.toContain(issuer.learnCard.id.did());
            expect(recipientKids[0]).not.toContain(brain.id.did());

            // Neither the issuer nor the brain DID can recover the plaintext.
            // (DIDKit resolves an empty string instead of throwing for
            // non-recipients, so assert on the outcome rather than the error.)
            const issuerAttempt = await issuer.learnCard.invoke
                .decryptDagJwe(parsed)
                .catch(() => null);
            const brainAttempt = await brain.invoke.decryptDagJwe(parsed).catch(() => null);

            expect(issuerAttempt).not.toEqual(credential);
            expect(brainAttempt).not.toEqual(credential);

            // The normal sent relationship exists alongside the aggregate bindings.
            const sentCount = await runQuery(
                `MATCH (issuer:Profile {profileId: $issuerProfileId})-[:CREDENTIAL_SENT]->(c:Credential {id: $id})
                 RETURN count(c) AS count`,
                { issuerProfileId: ISSUER_PROFILE_ID, id: stored!.id }
            );
            expect(toNum(sentCount.records[0]?.get('count'))).toEqual(1);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.currentVersion).toEqual(1);

            const head = await getCredentialRefreshHead(allocation.refreshId);
            expect(head).toBeTruthy();
            expect(head!.id).toEqual(stored!.id);
            expect(head!.version).toEqual(1);

            const bindings = await runQuery(
                `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
                 OPTIONAL MATCH (refresh)-[:ROOT]->(root:Credential)
                 OPTIONAL MATCH (refresh)-[:HEAD]->(head:Credential)
                 RETURN root.id AS rootId, head.id AS headId`,
                { refreshId: allocation.refreshId }
            );
            expect(bindings.records[0]?.get('rootId')).toEqual(stored!.id);
            expect(bindings.records[0]?.get('headId')).toEqual(stored!.id);
        });

        it('rejects a credential missing the allocated refreshService', async () => {
            const allocation = await allocate();
            const unsigned = buildUnsignedCredential(allocation);
            delete (unsigned as Record<string, unknown>).refreshService;
            const credential = await signAs(issuer, unsigned);

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
            expect(await getCredentialRefreshHead(allocation.refreshId)).toBeNull();
        });

        it('rejects a credential with a different credential ID', async () => {
            const allocation = await allocate();
            const credential = await signAs(
                issuer,
                buildUnsignedCredential(allocation, { id: 'urn:uuid:different-credential' })
            );

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
        });

        it('rejects a credential issued by a different issuer', async () => {
            const allocation = await allocate();
            const credential = await signAs(
                outsider,
                buildUnsignedCredential(allocation, { issuer: outsider.learnCard.id.did() })
            );

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
        });

        it('rejects a credential for a different holder', async () => {
            const allocation = await allocate();
            const credential = await signAs(
                issuer,
                buildUnsignedCredential(allocation, {
                    credentialSubject: { id: outsider.learnCard.id.did() },
                })
            );

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
        });

        it('rejects a credential whose proof does not verify', async () => {
            const allocation = await allocate();
            const credential = await signAs(issuer, buildUnsignedCredential(allocation));

            // Tamper with the signed payload after proof creation.
            const tampered = {
                ...credential,
                credentialSubject: {
                    id: holder.learnCard.id.did(),
                    name: 'tampered-after-signing',
                },
            } as VC;

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential: tampered,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            expect(await countCredentialNodes()).toEqual(0);
            expect(await countSentRelationships()).toEqual(0);
        });

        it('returns the original URI when the same initial send is retried', async () => {
            const { allocation, credential } = await allocateAndSign();

            const first = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                }
            );

            const retry = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                }
            );

            expect(retry).toEqual(first);
            expect(await countCredentialNodes()).toEqual(1);
            expect(await countSentRelationships()).toEqual(1);
            expect(addNotificationToQueueSpy).toHaveBeenCalledTimes(1);
            expect(addNotificationToQueueSpy.mock.calls[0]?.[0]).toMatchObject({
                type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED,
                data: {
                    vcUris: [first],
                    metadata: {
                        managedCredentialRefreshInitial: true,
                        routeKey: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
                        deliveryKey: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
                    },
                },
            });
        });

        it('persists notification suppression from the first binding across retries', async () => {
            const { allocation, credential } = await allocateAndSign();

            const first = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                    skipNotification: true,
                }
            );
            const retry = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                    skipNotification: false,
                }
            );

            expect(retry).toEqual(first);
            expect(
                (await getCredentialRefresh(allocation.refreshId))?.initialNotificationSuppressed
            ).toBe(true);
            expect(addNotificationToQueueSpy).not.toHaveBeenCalled();
        });

        it('does not let a suppressing retry override the first binding notification policy', async () => {
            const { allocation, credential } = await allocateAndSign();

            const first = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                    skipNotification: false,
                }
            );
            const retry = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                    skipNotification: true,
                }
            );

            expect(retry).toEqual(first);
            expect(
                (await getCredentialRefresh(allocation.refreshId))?.initialNotificationSuppressed
            ).toBe(false);
            expect(addNotificationToQueueSpy).toHaveBeenCalledTimes(1);
        });

        it('rejects an unowned boost and cannot change the boost on a retry', async () => {
            const outsiderBoostUri = await outsider.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const { allocation, credential } = await allocateAndSign();

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                    boostUri: outsiderBoostUri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const firstBoostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const secondBoostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                refreshId: allocation.refreshId,
                credential,
                boostUri: firstBoostUri,
            });

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                    boostUri: secondBoostUri,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            const associations = await runQuery(
                `MATCH (:Credential {refreshId: $refreshId})-[:INSTANCE_OF]->(boost:Boost)
                 RETURN collect(boost.id) AS boostIds`,
                { refreshId: allocation.refreshId }
            );
            expect(associations.records[0]?.get('boostIds')).toHaveLength(1);
        });

        it('removes the losing encrypted node from concurrent identical initial sends', async () => {
            const { allocation, credential } = await allocateAndSign();

            const uris = await Promise.all([
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                }),
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential,
                }),
            ]);

            expect(new Set(uris).size).toEqual(1);
            expect(await countCredentialNodes()).toEqual(1);
        });

        it('rejects an initial-send retry whose credential material differs', async () => {
            const { allocation, credential } = await allocateAndSign();

            await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                refreshId: allocation.refreshId,
                credential,
            });

            const differentCredential = await signAs(
                issuer,
                buildUnsignedCredential(allocation, { name: 'Different Transcript' })
            );

            await expect(
                issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                    refreshId: allocation.refreshId,
                    credential: differentCredential,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            expect(await countCredentialNodes()).toEqual(1);
            expect(await countSentRelationships()).toEqual(1);
            expect(addNotificationToQueueSpy).toHaveBeenCalledTimes(1);
        });

        it('repairs a bound initial version whose sent relationship was not completed', async () => {
            const { allocation, credential } = await allocateAndSign();

            const uri = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                refreshId: allocation.refreshId,
                credential,
            });

            await runQuery(
                `MATCH (:Profile {profileId: $issuerProfileId})-[sent:CREDENTIAL_SENT]->
                       (:Credential {refreshVersionKey: $versionKey})
                 DELETE sent`,
                {
                    issuerProfileId: ISSUER_PROFILE_ID,
                    versionKey: `${allocation.refreshId}:1`,
                }
            );
            expect(await countSentRelationships()).toEqual(0);

            const retry = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential(
                {
                    refreshId: allocation.refreshId,
                    credential,
                }
            );

            expect(retry).toEqual(uri);
            expect(await countCredentialNodes()).toEqual(1);
            expect(await countSentRelationships()).toEqual(1);
            expect(addNotificationToQueueSpy).toHaveBeenCalledTimes(1);
        });
    });
});
