import Fastify, { FastifyInstance } from 'fastify';
import { vi } from 'vitest';
import { JWEValidator, VC, UnsignedVC, JWE } from '@learncard/types';

import { neogma } from '@instance';
import cache from '@cache';

import { getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { setCredentialRefreshState } from '@accesslayer/credential-refresh';
import {
    credentialRefreshFastifyPlugin,
    CREDENTIAL_REFRESH_AUTH_SCHEME,
} from '../src/credential-refresh';
import { getCredentialRefreshChallengeCacheKey } from '../src/helpers/credential-refresh-auth.helpers';

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let outsider: Awaited<ReturnType<typeof getUser>>;

const ISSUER_PROFILE_ID = 'refresh-ep-issuer';
const HOLDER_PROFILE_ID = 'refresh-ep-holder';
const OUTSIDER_PROFILE_ID = 'refresh-ep-outsider';
const CREDENTIAL_ID = 'urn:uuid:refreshable-credential-endpoint';

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
        name: 'Original Transcript',
        credentialSubject: { id: holder.learnCard.id.did() },
        refreshService: allocation.refreshService,
        ...overrides,
    } as UnsignedVC);

/** Allocates, signs, and sends the original credential (version 1, awaiting_claim) */
const sendOriginal = async (): Promise<{ allocation: AllocationResult; credential: VC }> => {
    const allocation = await allocate();
    const credential = await issuer.learnCard.invoke.issueCredential(
        buildUnsignedCredential(allocation)
    );

    await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
        refreshId: allocation.refreshId,
        credential,
    });

    return { allocation, credential };
};

/** Publishes a second, materially changed version */
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

describe('Credential Refresh Endpoint', () => {
    let app: FastifyInstance;

    const getChallenge = async (
        path: string
    ): Promise<{ challenge: string; domain: string; expiresAt: string }> => {
        const res = await app.inject({ method: 'GET', url: path });

        expect(res.statusCode).toBe(401);

        return res.json();
    };

    const getAuthHeaders = async (
        user: Awaited<ReturnType<typeof getUser>>,
        path: string,
        options: { challenge?: string; domain?: string } = {}
    ): Promise<Record<string, string>> => {
        const challengeBody = await getChallenge(path);

        const vp = (await user.learnCard.invoke.getDidAuthVp({
            proofFormat: 'jwt',
            challenge: options.challenge ?? challengeBody.challenge,
            domain: options.domain ?? challengeBody.domain,
        })) as string;

        return { authorization: `Bearer ${vp}` };
    };

    const authedGet = async (
        user: Awaited<ReturnType<typeof getUser>>,
        path: string,
        headers: Record<string, string> = {},
        authOptions: { challenge?: string; domain?: string } = {}
    ) => {
        const authHeaders = await getAuthHeaders(user, path, authOptions);

        return app.inject({ method: 'GET', url: path, headers: { ...authHeaders, ...headers } });
    };

    beforeAll(async () => {
        process.env.CREDENTIAL_REFRESH_ENABLED = 'true';

        await getLearnCard();
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
        await outsider.clients.fullAuth.profile.createProfile({ profileId: OUTSIDER_PROFILE_ID });

        addNotificationToQueueSpy.mockReset();
    });

    describe('authentication and privacy', () => {
        it('returns a fresh single-use challenge without revealing whether the ID exists', async () => {
            for (const path of ['/refresh/does-not-exist', '/refresh/does-not-exist/history']) {
                const res = await app.inject({ method: 'GET', url: path });

                expect(res.statusCode).toBe(401);
                expect(res.headers['www-authenticate']).toContain(CREDENTIAL_REFRESH_AUTH_SCHEME);
                expect(res.headers['cache-control']).toContain('no-store');

                const body = res.json();

                expect(typeof body.challenge).toBe('string');
                expect(body.challenge.length).toBeGreaterThan(0);
                expect(typeof body.expiresAt).toBe('string');
                expect(body.scheme).toBe(CREDENTIAL_REFRESH_AUTH_SCHEME);

                // No holder, issuer, credential, or lifecycle information
                expect(body.holder).toBeUndefined();
                expect(body.holderDid).toBeUndefined();
                expect(body.issuer).toBeUndefined();
                expect(body.issuerDid).toBeUndefined();
                expect(body.credential).toBeUndefined();
                expect(body.jwe).toBeUndefined();
                expect(body.state).toBeUndefined();
                expect(body.found).toBeUndefined();
            }
        });

        it('issues a distinct challenge per request', async () => {
            const first = await getChallenge('/refresh/some-id');
            const second = await getChallenge('/refresh/some-id');

            expect(first.challenge).not.toEqual(second.challenge);
        });

        it('rejects a malformed bearer token with a fresh challenge', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/refresh/some-id',
                headers: { authorization: 'Bearer not-a-jwt' },
            });

            expect(res.statusCode).toBe(401);
            expect(res.headers['www-authenticate']).toContain(CREDENTIAL_REFRESH_AUTH_SCHEME);
            expect(typeof res.json().challenge).toBe('string');
        });

        it('rejects an expired challenge', async () => {
            const path = '/refresh/some-id';
            const { challenge, domain } = await getChallenge(path);

            // Force expiry by evicting the challenge from the cache
            await cache.delete([getCredentialRefreshChallengeCacheKey('some-id', challenge)]);

            const vp = (await holder.learnCard.invoke.getDidAuthVp({
                proofFormat: 'jwt',
                challenge,
                domain,
            })) as string;

            const res = await app.inject({
                method: 'GET',
                url: path,
                headers: { authorization: `Bearer ${vp}` },
            });

            expect(res.statusCode).toBe(401);
        });

        it('rejects a VP signed for the wrong domain', async () => {
            const { allocation } = await sendOriginal();
            const path = `/refresh/${allocation.refreshId}`;

            const res = await authedGet(holder, path, {}, { domain: 'evil.example.com' });

            expect(res.statusCode).toBe(401);
        });

        it('rejects a VP signed for a different challenge', async () => {
            const { allocation } = await sendOriginal();
            const path = `/refresh/${allocation.refreshId}`;

            const res = await authedGet(
                holder,
                path,
                {},
                { challenge: 'not-the-issued-challenge' }
            );

            expect(res.statusCode).toBe(401);
        });

        it('rejects a replayed challenge', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');
            const path = `/refresh/${allocation.refreshId}`;

            const headers = await getAuthHeaders(holder, path);

            const first = await app.inject({ method: 'GET', url: path, headers });
            expect(first.statusCode).toBe(200);

            const replay = await app.inject({ method: 'GET', url: path, headers });
            expect(replay.statusCode).toBe(401);
        });

        it('rejects a valid VP from the wrong holder without disclosing state', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');
            const path = `/refresh/${allocation.refreshId}`;

            const res = await authedGet(outsider, path);

            expect(res.statusCode).toBe(403);
            expect(res.json().jwe).toBeUndefined();
            expect(res.json().credential).toBeUndefined();
        });

        it('authenticates before ETag, revocation, or not-found distinctions', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'revoked');

            // Revoked aggregate: unauthenticated requests still get a challenge, not 410
            const revoked = await app.inject({
                method: 'GET',
                url: `/refresh/${allocation.refreshId}`,
            });
            expect(revoked.statusCode).toBe(401);

            // Conditional requests are not honored before authentication
            const conditional = await app.inject({
                method: 'GET',
                url: `/refresh/${allocation.refreshId}`,
                headers: { 'if-none-match': '"anything"' },
            });
            expect(conditional.statusCode).toBe(401);

            // Unknown IDs get a challenge, never a 404, before authentication
            const missing = await app.inject({ method: 'GET', url: '/refresh/nope' });
            expect(missing.statusCode).toBe(401);
        });
    });

    describe('responses', () => {
        it('serves the current holder-encrypted JWE with an ETag to the active holder', async () => {
            const { allocation, credential } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const res = await authedGet(holder, `/refresh/${allocation.refreshId}`);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/json');
            expect(res.headers['cache-control']).toContain('private');
            expect(res.headers['cache-control']).toContain('no-store');
            expect(res.headers['access-control-allow-origin']).toEqual('*');

            const body = res.json();

            expect(body.format).toEqual('jwe');
            expect(JWEValidator.safeParse(body.jwe).success).toBe(true);
            expect(typeof body.etag).toBe('string');
            expect(res.headers.etag).toContain(body.etag);

            // The payload is decryptable only by the holder and matches the original
            const decrypted = await holder.learnCard.invoke.decryptDagJwe(body.jwe as JWE);
            expect((decrypted as VC).id).toEqual(credential.id);
            expect((decrypted as VC).name).toEqual('Original Transcript');

            // A non-recipient cannot recover the payload (the WASM DIDKit fallback
            // resolves with an empty string rather than throwing on failure)
            const outsiderAttempt = await outsider.learnCard.invoke
                .decryptDagJwe(body.jwe as JWE)
                .catch(() => undefined);

            expect(outsiderAttempt).not.toEqual(credential);
            expect(
                outsiderAttempt === undefined ||
                    outsiderAttempt === '' ||
                    (outsiderAttempt as VC)?.id !== credential.id
            ).toBe(true);
        });

        it('returns an authenticated 304 when If-None-Match matches', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');
            const path = `/refresh/${allocation.refreshId}`;

            const first = await authedGet(holder, path);
            expect(first.statusCode).toBe(200);
            const etag = first.headers.etag as string;

            const second = await authedGet(holder, path, { 'if-none-match': etag });

            expect(second.statusCode).toBe(304);
            expect(second.body).toEqual('');
            expect(second.headers.etag).toEqual(etag);
        });

        it('serves the new version when If-None-Match is stale', async () => {
            const { allocation } = await sendOriginal();
            await publishSecondVersion(allocation);
            await setCredentialRefreshState(allocation.refreshId, 'active');
            const path = `/refresh/${allocation.refreshId}`;

            const res = await authedGet(holder, path, { 'if-none-match': '"stale-etag"' });

            expect(res.statusCode).toBe(200);

            const decrypted = await holder.learnCard.invoke.decryptDagJwe(res.json().jwe as JWE);
            expect((decrypted as VC).name).toEqual('Final Transcript');
        });

        it('serves authenticated metadata-only history', async () => {
            const { allocation } = await sendOriginal();
            await publishSecondVersion(allocation);
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const res = await authedGet(holder, `/refresh/${allocation.refreshId}/history`);

            expect(res.statusCode).toBe(200);

            const body = res.json();

            expect(body.records).toHaveLength(2);
            expect(body.records[0].version).toEqual(2);
            expect(body.records[1].version).toEqual(1);

            for (const record of body.records) {
                expect(typeof record.publishedAt).toBe('string');
                // Metadata only: never credential bodies
                expect(record.credential).toBeUndefined();
                expect(record.jwe).toBeUndefined();
            }
        });

        it('serves a historical holder-encrypted JWE by version', async () => {
            const { allocation } = await sendOriginal();
            await publishSecondVersion(allocation);
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const res = await authedGet(holder, `/refresh/${allocation.refreshId}/versions/1`);

            expect(res.statusCode).toBe(200);
            expect(res.json().format).toEqual('jwe');

            const decrypted = await holder.learnCard.invoke.decryptDagJwe(res.json().jwe as JWE);
            expect((decrypted as VC).name).toEqual('Original Transcript');
        });

        it('returns 404 after authentication for unknown versions', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const res = await authedGet(holder, `/refresh/${allocation.refreshId}/versions/99`);

            expect(res.statusCode).toBe(404);
            expect(res.json().jwe).toBeUndefined();
        });

        it('returns an authenticated 410 when revoked, including history and versions', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'revoked');

            for (const path of [
                `/refresh/${allocation.refreshId}`,
                `/refresh/${allocation.refreshId}/history`,
                `/refresh/${allocation.refreshId}/versions/1`,
            ]) {
                const res = await authedGet(holder, path);

                expect(res.statusCode).toBe(410);
                expect(res.json().code).toEqual('CREDENTIAL_REVOKED');
                expect(res.json().jwe).toBeUndefined();
                expect(res.json().credential).toBeUndefined();
            }
        });

        it('never serves an awaiting-claim aggregate', async () => {
            const { allocation } = await sendOriginal();
            // Deliberately NOT activating: state remains awaiting_claim

            const res = await authedGet(holder, `/refresh/${allocation.refreshId}`);

            expect(res.statusCode).toBe(403);
            expect(res.json().jwe).toBeUndefined();
        });

        it('returns 404 after authentication for unknown refresh IDs', async () => {
            const res = await authedGet(holder, '/refresh/definitely-not-real');

            expect(res.statusCode).toBe(404);
        });

        it('rejects a non-numeric version', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const res = await authedGet(holder, `/refresh/${allocation.refreshId}/versions/abc`);

            expect(res.statusCode).toBe(400);
        });

        it('answers OPTIONS preflight for every route', async () => {
            for (const path of [
                '/refresh/some-id',
                '/refresh/some-id/history',
                '/refresh/some-id/versions/1',
            ]) {
                const res = await app.inject({ method: 'OPTIONS', url: path });

                expect(res.statusCode).toBeLessThan(300);
                expect(res.headers['access-control-allow-origin']).toEqual('*');
                expect(res.headers['access-control-allow-methods']).toContain('GET');
            }
        });

        it('omits the aggregate from the holder history of other holders', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');

            const res = await authedGet(outsider, `/refresh/${allocation.refreshId}/history`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe('rate limits', () => {
        let preAuthLimitedApp: FastifyInstance;
        let holderLimitedApp: FastifyInstance;

        beforeAll(async () => {
            preAuthLimitedApp = Fastify();
            await preAuthLimitedApp.register(credentialRefreshFastifyPlugin, {
                preAuthRateLimit: 2,
            });

            holderLimitedApp = Fastify();
            await holderLimitedApp.register(credentialRefreshFastifyPlugin, {
                preAuthRateLimit: 1000,
                holderRateLimit: 2,
            });
        });

        afterAll(async () => {
            await preAuthLimitedApp.close();
            await holderLimitedApp.close();
        });

        it('applies a coarse pre-auth limit per source IP and refresh ID', async () => {
            const path = '/refresh/rate-limited-pre-auth';

            const first = await preAuthLimitedApp.inject({ method: 'GET', url: path });
            expect(first.statusCode).toBe(401);

            const second = await preAuthLimitedApp.inject({ method: 'GET', url: path });
            expect(second.statusCode).toBe(401);

            const limited = await preAuthLimitedApp.inject({ method: 'GET', url: path });
            expect(limited.statusCode).toBe(429);
            expect(limited.json().jwe).toBeUndefined();
        });

        it('applies a holder-DID limit after authentication', async () => {
            const { allocation } = await sendOriginal();
            await setCredentialRefreshState(allocation.refreshId, 'active');
            const path = `/refresh/${allocation.refreshId}`;

            const authedGetLimited = async () => {
                const challengeRes = await holderLimitedApp.inject({ method: 'GET', url: path });
                expect(challengeRes.statusCode).toBe(401);

                const { challenge, domain } = challengeRes.json();
                const vp = (await holder.learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge,
                    domain,
                })) as string;

                return holderLimitedApp.inject({
                    method: 'GET',
                    url: path,
                    headers: { authorization: `Bearer ${vp}` },
                });
            };

            expect((await authedGetLimited()).statusCode).toBe(200);
            expect((await authedGetLimited()).statusCode).toBe(200);

            const limited = await authedGetLimited();
            expect(limited.statusCode).toBe(429);
            expect(limited.json().jwe).toBeUndefined();
        });
    });
});
