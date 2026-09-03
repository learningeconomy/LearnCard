import Fastify, { FastifyInstance } from 'fastify';
import { vi } from 'vitest';
import { UnsignedVC, VC } from '@learncard/types';

import { neogma } from '@instance';

import { getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { getCredentialRefresh, setCredentialRefreshState } from '@accesslayer/credential-refresh';
import { revokeCredentialReceived } from '@accesslayer/credential/relationships/update';
import { credentialRefreshFastifyPlugin } from '../src/credential-refresh';

/**
 * Claim/revocation lifecycle coupling for managed credential refresh
 * (LC-2117 / LC-2135 / LC-2136, plan Task 8).
 *
 * The aggregate lifecycle is coupled to the canonical credential relationships:
 * acceptance activates an `awaiting_claim` aggregate idempotently, revocation of the
 * sent credential stops current and historical serving, and the endpoint never serves
 * solely because the aggregate claims `active` — it cross-checks the canonical
 * CREDENTIAL_SENT/CREDENTIAL_RECEIVED state and lazily repairs stale aggregate state.
 */

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;

const ISSUER_PROFILE_ID = 'refresh-lc-issuer';
const HOLDER_PROFILE_ID = 'refresh-lc-holder';
const CREDENTIAL_ID = 'urn:uuid:refreshable-credential-lifecycle';

type AllocationResult = {
    refreshId: string;
    refreshService: { id: string; type: string; authorization?: { type: string } };
};

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

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
        name: 'Provisional Transcript',
        credentialSubject: { id: holder.learnCard.id.did() },
        refreshService: allocation.refreshService,
        ...overrides,
    } as UnsignedVC);

/** Allocates, signs, and sends the original credential (version 1, awaiting_claim). */
const sendOriginal = async (): Promise<{
    allocation: AllocationResult;
    credential: VC;
    uri: string;
}> => {
    const allocation = await allocate();
    const credential = await issuer.learnCard.invoke.issueCredential(
        buildUnsignedCredential(allocation)
    );

    const uri = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
        refreshId: allocation.refreshId,
        credential,
    });

    return { allocation, credential, uri };
};

/** Publishes a materially changed second version (issuer-signed mode). */
const publishSecondVersion = async (allocation: AllocationResult): Promise<VC> => {
    const updated = await issuer.learnCard.invoke.issueCredential(
        buildUnsignedCredential(allocation, {
            validFrom: '2026-02-01T00:00:00Z',
            name: 'Final Transcript',
        })
    );

    await issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
        mode: 'issuer-signed',
        refreshId: allocation.refreshId,
        signedCredential: updated,
    });

    return updated;
};

/** The bound root credential node id for an aggregate. */
const getRootCredentialNodeId = async (refreshId: string): Promise<string> => {
    const result = await runQuery(
        `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
         RETURN root.id AS id`,
        { refreshId }
    );

    return result.records[0]?.get('id');
};

describe('Credential Refresh Lifecycle', () => {
    let app: FastifyInstance;

    const authedGet = async (user: Awaited<ReturnType<typeof getUser>>, path: string) => {
        const challengeRes = await app.inject({ method: 'GET', url: path });

        expect(challengeRes.statusCode).toBe(401);

        const challengeBody = challengeRes.json();

        const vp = (await user.learnCard.invoke.getDidAuthVp({
            proofFormat: 'jwt',
            challenge: challengeBody.challenge,
            domain: challengeBody.domain,
        })) as string;

        return app.inject({
            method: 'GET',
            url: path,
            headers: { authorization: `Bearer ${vp}` },
        });
    };

    beforeAll(async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';
        process.env.SEED ??= 'a'.repeat(64);

        await getLearnCard();
        issuer = await getUser('d'.repeat(64));
        holder = await getUser('b'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );

        await runQuery(
            'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE'
        );
        await runQuery(
            'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE'
        );

        app = Fastify();
        await app.register(credentialRefreshFastifyPlugin);
    });

    afterAll(async () => {
        await app.close();
        delete process.env.CREDENTIAL_REFRESH_ENABLED;
    });

    beforeEach(async () => {
        await runQuery('MATCH (r:CredentialRefresh) DETACH DELETE r');
        await runQuery('MATCH (c:Credential) DETACH DELETE c');
        await runQuery('MATCH (p:Profile) DETACH DELETE p');

        await issuer.clients.fullAuth.profile.createProfile({ profileId: ISSUER_PROFILE_ID });
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_PROFILE_ID });

        addNotificationToQueueSpy.mockReset();
    });

    describe('claim activation', () => {
        it('does not serve an awaiting-claim aggregate, even after publication', async () => {
            const { allocation } = await sendOriginal();

            await publishSecondVersion(allocation);

            // Published but unclaimed: current and history stay non-disclosing.
            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(403);

            const history = await authedGet(holder, `/refresh/${allocation.refreshId}/history`);
            expect(history.statusCode).toBe(403);
        });

        it('activates the aggregate on acceptance and then serves the latest head', async () => {
            const { allocation, uri } = await sendOriginal();

            await publishSecondVersion(allocation);

            await expect(
                holder.clients.fullAuth.credential.acceptCredential({ uri })
            ).resolves.toBe(true);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.state).toBe('active');

            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(200);
        });

        it('activates by holder profile when the public DID differs from its controller DID', async () => {
            const { allocation, uri } = await sendOriginal();

            // Network clients address the holder by public did:web, while the
            // authenticated Profile node retains its controller did:key.
            await runQuery(
                `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
                 SET refresh.holderDid = $publicHolderDid`,
                {
                    refreshId: allocation.refreshId,
                    publicHolderDid: `did:web:localhost%3A3000:users:${HOLDER_PROFILE_ID}`,
                }
            );

            await holder.clients.fullAuth.credential.acceptCredential({ uri });

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.state).toBe('active');
        });

        it('is idempotent across repeated acceptance', async () => {
            const { allocation, uri } = await sendOriginal();

            await holder.clients.fullAuth.credential.acceptCredential({ uri });
            await expect(
                holder.clients.fullAuth.credential.acceptCredential({ uri })
            ).resolves.toBe(true);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.state).toBe('active');

            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(200);
        });

        it('lazily repairs stale awaiting_claim state from the canonical received relationship', async () => {
            const { allocation, uri } = await sendOriginal();

            await holder.clients.fullAuth.credential.acceptCredential({ uri });

            // Simulate a lost activation write: the aggregate still says awaiting_claim
            // even though the canonical CREDENTIAL_RECEIVED relationship exists.
            await setCredentialRefreshState(allocation.refreshId, 'awaiting_claim');

            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(200);

            const repaired = await getCredentialRefresh(allocation.refreshId);
            expect(repaired?.state).toBe('active');
        });
    });

    describe('boost revocation path', () => {
        it('revokes a boost-issued refreshable credential through the canonical boost route', async () => {
            const allocation = await allocate();

            const unsigned = buildUnsignedCredential(allocation);

            // The boost anchors recipient management (list/revoke) for the issued
            // credential; its template is the same unsigned credential body.
            const boostUri = await issuer.clients.fullAuth.boost.createBoost({
                credential: unsigned,
                name: 'Refreshable Transcript Boost',
            });

            const credential = await issuer.learnCard.invoke.issueCredential(unsigned);

            const uri = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
                refreshId: allocation.refreshId,
                credential,
                boostUri,
            });

            await holder.clients.fullAuth.credential.acceptCredential({ uri });

            const before = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(before.statusCode).toBe(200);

            // The credential is visible to boost recipient management and revocable
            // through the canonical revocation route.
            await expect(
                issuer.clients.fullAuth.boost.revokeBoostRecipient({
                    boostUri,
                    recipientProfileId: HOLDER_PROFILE_ID,
                })
            ).resolves.toBe(true);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.state).toBe('revoked');

            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(410);
        });
    });

    describe('revocation coupling', () => {
        it('stops serving current, history, and versions after canonical revocation', async () => {
            const { allocation, uri } = await sendOriginal();

            await holder.clients.fullAuth.credential.acceptCredential({ uri });

            const before = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(before.statusCode).toBe(200);

            const rootId = await getRootCredentialNodeId(allocation.refreshId);

            const revoked = await revokeCredentialReceived(rootId, HOLDER_PROFILE_ID);
            expect(revoked).toBe(true);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.state).toBe('revoked');

            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(410);
            expect(current.json().code).toBe('CREDENTIAL_REVOKED');

            const history = await authedGet(holder, `/refresh/${allocation.refreshId}/history`);
            expect(history.statusCode).toBe(410);

            const version = await authedGet(holder, `/refresh/${allocation.refreshId}/versions/1`);
            expect(version.statusCode).toBe(410);
        });

        it('refuses serving on canonical revocation even when the aggregate still says active', async () => {
            const { allocation, uri } = await sendOriginal();

            await holder.clients.fullAuth.credential.acceptCredential({ uri });

            const rootId = await getRootCredentialNodeId(allocation.refreshId);
            await revokeCredentialReceived(rootId, HOLDER_PROFILE_ID);

            // Simulate a lost revocation write: the aggregate still says active.
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const current = await authedGet(holder, `/refresh/${allocation.refreshId}`);
            expect(current.statusCode).toBe(410);

            const repaired = await getCredentialRefresh(allocation.refreshId);
            expect(repaired?.state).toBe('revoked');
        });

        it('keeps already-revoked retries safe and retains stored payloads', async () => {
            const { allocation, uri } = await sendOriginal();

            await holder.clients.fullAuth.credential.acceptCredential({ uri });

            const rootId = await getRootCredentialNodeId(allocation.refreshId);

            await revokeCredentialReceived(rootId, HOLDER_PROFILE_ID);

            // A repeated revocation attempt is a safe no-op for the aggregate.
            await expect(revokeCredentialReceived(rootId, HOLDER_PROFILE_ID)).resolves.toBe(true);

            const aggregate = await getCredentialRefresh(allocation.refreshId);
            expect(aggregate?.state).toBe('revoked');

            // Revocation never deletes stored encrypted payloads (issuer audit retention).
            const payload = await runQuery(
                `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:HEAD]->(head:Credential)
                 RETURN head.credential AS credential`,
                { refreshId: allocation.refreshId }
            );
            expect(payload.records[0]?.get('credential')).toBeTruthy();
        });
    });
});
