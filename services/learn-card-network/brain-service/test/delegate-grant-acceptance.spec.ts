// Proves delegate-bound issuance the way a real client meets it: a key that owns no profile issues
// for an organisation over the REST adapter, with a Bearer header and the real `createContext`.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi';
import { randomUUID } from 'node:crypto';
import { ACT_AS_HEADER, VCValidator } from '@learncard/types';
import { appRouter, createContext } from '../src/app';
import { DELEGATE_REQUEST_REFUSED_MESSAGE } from '../src/routes/index';
import { getUser } from './helpers/getClient';
import { sendSpy, addNotificationToQueueSpy } from './helpers/spies';
import { normalContract, normalFullTerms } from './helpers/contract';
import { testUnsignedBoost } from './helpers/send';
import {
    Profile,
    InboxCredential,
    ContactMethod,
    SigningAuthority,
    Boost,
    Credential,
} from '@models';
import cache from '@cache';
import { neogma } from '@instance';
import { setValidChallengeForDid } from '@cache/challenges';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import * as notifications from '@helpers/notifications.helpers';
import * as activity from '@helpers/activity.helpers';
import * as grantReads from '@accesslayer/delegate-auth-grant/read';
import * as signing from '@helpers/signingAuthority.helpers';
import { DELEGATE_GRANT_CHALLENGE_PREFIX } from '@helpers/delegate-auth-grant.schema';
import * as learnCards from '@helpers/learnCard.helpers';
import { getLearnCard, type SeedLearnCard } from '@helpers/learnCard.helpers';
import { getIdFromUri } from '@helpers/uri.helpers';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

vi.mock('@services/registry/registry.factory', () => ({
    getRegistryService: () => ({ isTrusted: async () => false }),
}));

type User = Awaited<ReturnType<typeof getUser>>;
type Reply<T> = { status: number; body: T };
type Grant = { grantId: string; challenge: string; audience: string };
type StoredGrant = { id: string; status: string; expiresAt: string; audience: string };
type Issued = { issuanceId: string; status: string; claimUrl?: string };
type IssueOverrides = {
    credential?: Record<string, unknown>;
    recipient?: string;
    headers?: Record<string, string>;
};

const OWNER_ID = 'acceptance-owner';
const OTHER_ID = 'acceptance-other';
const HOLDER_ID = 'acceptance-holder';
const DAY_MS = 24 * 60 * 60 * 1000;
const SIGNING_AUTHORITY = {
    endpoint: 'http://localhost:4000',
    name: 'mysa',
    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
};
const SELF_SIGNED_MESSAGE =
    "A delegate submits unsigned credential content; the organisation's signing authority signs it.";

const REFUSED = {
    status: 401,
    body: { code: 'UNAUTHORIZED', message: DELEGATE_REQUEST_REFUSED_MESSAGE },
};

describe('Delegate-bound issuance over HTTP', () => {
    let owner: User;
    let delegate: SeedLearnCard;
    let server: FastifyInstance;

    /** A DID-auth presentation made with `getDidAuthVp`, which cannot write a time bound. */
    const jwt = async (
        wallet: SeedLearnCard,
        options: { challenge?: string; domain?: string }
    ): Promise<string> => {
        const token = await wallet.invoke.getDidAuthVp({ ...options, proofFormat: 'jwt' });

        if (typeof token !== 'string') throw new Error('Expected the presentation as a JWT');

        return token;
    };

    /**
     * What a delegate sends: a DID-auth presentation over challenge and audience, as a JWT whose
     * signed payload says until when it is valid. Passing `validUntil: undefined` leaves the
     * bound out.
     */
    const delegateJwt = async (
        wallet: SeedLearnCard,
        options: { challenge: string; audience?: string; validUntil?: string }
    ): Promise<string> => {
        const validUntil =
            'validUntil' in options
                ? options.validUntil
                : new Date(Date.now() + 60_000).toISOString();

        const token: unknown = await wallet.invoke.issuePresentation(
            {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiablePresentation'],
                holder: wallet.id.did(),
                ...(validUntil === undefined ? {} : { validUntil }),
            },
            {
                proofPurpose: 'authentication',
                challenge: options.challenge,
                domain: options.audience,
                proofFormat: 'jwt',
            }
        );

        if (typeof token !== 'string') throw new Error('Expected the presentation as a JWT');

        return token;
    };

    /** A normal session token: a cached challenge signed by the profile's own key. */
    const sessionToken = async (user: User): Promise<string> => {
        const challenge = randomUUID();
        await setValidChallengeForDid(user.learnCard.id.did(), challenge);

        return jwt(user.learnCard, { challenge });
    };

    const request = async <T>(
        method: 'GET' | 'POST',
        path: string,
        token: string,
        payload?: Record<string, unknown>,
        headers: Record<string, string> = {}
    ): Promise<Reply<T>> => {
        const response = await server.inject({
            method,
            url: `/api${path}`,
            headers: { authorization: `Bearer ${token}`, ...headers },
            ...(payload ? { payload } : {}),
        });

        return { status: response.statusCode, body: response.json<T>() };
    };

    const grantInput = (scope: string) => ({
        name: 'acceptance grant',
        delegateDid: delegate.id.did(),
        scope,
        expiresAt: new Date(Date.now() + 3 * DAY_MS).toISOString(),
    });

    const createGrant = async (scope = 'inbox:write'): Promise<Grant> => {
        const reply = await request<Grant>(
            'POST',
            '/delegate-grant/create',
            await sessionToken(owner),
            grantInput(scope)
        );
        expect(reply.status, JSON.stringify(reply.body)).toBe(200);

        return reply.body;
    };

    const ownerReads = async (grant: Grant): Promise<Reply<StoredGrant>> =>
        request<StoredGrant>('GET', `/delegate-grant/${grant.grantId}`, await sessionToken(owner));

    const revokeGrant = async (grant: Grant): Promise<void> => {
        const reply = await request<boolean>(
            'POST',
            `/delegate-grant/${grant.grantId}/revoke`,
            await sessionToken(owner),
            {}
        );
        expect(reply, JSON.stringify(reply.body)).toEqual({ status: 200, body: true });
    };

    /**
     * Signs the way a delegate does: the grant's challenge for the grant's audience, valid for
     * one minute.
     */
    const delegateToken = (grant: Grant, signer: SeedLearnCard = delegate): Promise<string> =>
        delegateJwt(signer, { challenge: grant.challenge, audience: grant.audience });

    /** Unsigned content naming the organisation, as a delegate submits it. */
    const unsigned = () => owner.learnCard.invoke.getTestVc();

    const issueAs = async (token: string, overrides: IssueOverrides = {}): Promise<Reply<Issued>> =>
        request<Issued>(
            'POST',
            '/inbox/issue',
            token,
            {
                credential: overrides.credential ?? (await unsigned()),
                recipient: {
                    type: 'email',
                    value: overrides.recipient ?? `${randomUUID()}@test.com`,
                },
            },
            overrides.headers
        );

    /** A grant whose token has just issued, so that a later refusal is not a broken fixture. */
    const workingGrant = async (): Promise<{ grant: Grant; token: string; issued: Issued }> => {
        const grant = await createGrant();
        const token = await delegateToken(grant);
        const reply = await issueAs(token);
        expect(reply.status, JSON.stringify(reply.body)).toBe(200);

        return { grant, token, issued: reply.body };
    };

    const issuerProfilesOf = async (issuanceId: string): Promise<string[]> => {
        const result = await neogma.queryRunner.run(
            'MATCH (p:Profile)-[:CREATED_INBOX_CREDENTIAL]->(:InboxCredential {id: $issuanceId}) RETURN p.profileId AS profileId',
            { issuanceId }
        );

        return result.records.map(record => record.get('profileId'));
    };

    const storedIssuanceIds = async (): Promise<string[]> => {
        const result = await neogma.queryRunner.run('MATCH (i:InboxCredential) RETURN i.id AS id');

        return result.records.map(record => record.get('id'));
    };

    const audits = async (): Promise<Record<string, unknown>[]> => {
        const result = await neogma.queryRunner.run(
            'MATCH (a:DelegateGrantAudit) RETURN properties(a) AS audit'
        );

        return result.records.map(record => record.get('audit'));
    };

    /** Which barrier refused: a refusal by the wrong one would hide a broken fixture. */
    const denialStages = async (): Promise<unknown[]> =>
        (await audits()).filter(audit => audit.decision === 'denied').map(audit => audit.stage);

    const wipe = async () => {
        for (const model of [
            Profile,
            InboxCredential,
            ContactMethod,
            SigningAuthority,
            Boost,
            Credential,
        ]) {
            await model.delete({ detach: true, where: {} });
        }
        await neogma.queryRunner.run(
            'MATCH (n) WHERE n:AuthGrant OR n:DelegateAuthGrant OR n:DelegateGrantAudit OR n:BitstringStatusList OR n:CredentialStatusBinding OR n:ConsentFlowContract OR n:ConsentFlowContractVersion OR n:ConsentFlowTerms OR n:ConsentFlowTransaction OR n:Role DETACH DELETE n'
        );
    };

    beforeAll(async () => {
        owner = await getUser('c1'.repeat(32));
        delegate = await getLearnCard('d1'.repeat(32));
        server = Fastify({ routerOptions: { maxParamLength: 5000 } });
        await server.register(fastifyTRPCOpenApiPlugin, {
            basePath: '/api',
            router: appRouter,
            createContext,
        });
    });

    beforeEach(async () => {
        vi.restoreAllMocks();
        sendSpy.mockClear();
        addNotificationToQueueSpy.mockClear();
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );
        await wipe();
        await owner.clients.fullAuth.profile.createProfile({ profileId: OWNER_ID });
        await owner.clients.fullAuth.profile.registerSigningAuthority(SIGNING_AUTHORITY);
    });

    afterAll(async () => {
        vi.restoreAllMocks();
        await wipe();
        await server?.close();
        await cache.redis?.quit();
        await neogma.driver.close();
    });

    it('the same delegate token issues twice through POST /api/inbox/issue', async () => {
        const token = await delegateToken(await createGrant());

        const first = await issueAs(token, { recipient: 'first@test.com' });
        const second = await issueAs(token, { recipient: 'second@test.com' });

        expect(first.status, JSON.stringify(first.body)).toBe(200);
        expect(second.status, JSON.stringify(second.body)).toBe(200);
        expect(first.body.issuanceId).not.toBe(second.body.issuanceId);

        for (const { issuanceId } of [first.body, second.body]) {
            const stored = await getInboxCredentialById(issuanceId);

            expect(stored?.issuerDid).toBe(owner.learnCard.id.did());
            expect(await issuerProfilesOf(issuanceId)).toEqual([OWNER_ID]);
        }
    });

    it('the delivered credential is signed for the owner, not for the delegate', async () => {
        const holder = await getUser('c3'.repeat(32));
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_ID });
        const contact = await createContactMethod({
            type: 'email',
            value: 'holder@test.com',
            isVerified: true,
        });
        await createProfileContactMethodRelationship(HOLDER_ID, contact.id);
        const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
        const token = await delegateToken(await createGrant());

        const reply = await issueAs(token, { recipient: 'holder@test.com' });

        expect(reply.status, JSON.stringify(reply.body)).toBe(200);
        expect(sign).toHaveBeenCalledTimes(1);
        expect(sign.mock.calls[0]?.[0]).toMatchObject({
            type: 'profile',
            profile: { profileId: OWNER_ID },
        });
        expect(sign.mock.calls[0]?.[2]).toMatchObject({
            relationship: { name: SIGNING_AUTHORITY.name, did: SIGNING_AUTHORITY.did },
            signingAuthority: { endpoint: SIGNING_AUTHORITY.endpoint },
        });

        const sent = await neogma.queryRunner.run(
            'MATCH (from:Profile)-[:CREDENTIAL_SENT]->(c:Credential) RETURN from.profileId AS from, c.credential AS credential'
        );
        expect(sent.records.map(record => record.get('from'))).toEqual([OWNER_ID]);

        const delivered = VCValidator.parse(
            await holder.learnCard.invoke.decryptDagJwe(
                JSON.parse(sent.records[0]?.get('credential'))
            )
        );
        const verification = await holder.learnCard.invoke.verifyCredential(delivered);

        // In the test environment the signing authority is a stand-in that signs with the
        // service's own key, so the issuer is that key and not the owner's did:web. The status
        // list it points to is served by no listening server here, so only the proof is judged.
        const standIn = await getLearnCard();
        expect(verification.checks).toContain('proof');
        expect(
            verification.errors.filter(error => !error.includes('status list credential'))
        ).toEqual([]);
        expect(delivered.issuer).toBe(standIn.id.did());
        expect(JSON.stringify(delivered.proof)).toContain(standIn.id.did());
        expect(JSON.stringify(delivered)).not.toContain(delegate.id.did());

        const stored = await getInboxCredentialById(reply.body.issuanceId);
        expect(stored).toMatchObject({ issuerDid: owner.learnCard.id.did(), isSigned: true });
        expect(JSON.stringify(stored)).not.toContain(delegate.id.did());
        expect(await issuerProfilesOf(reply.body.issuanceId)).toEqual([OWNER_ID]);
    });

    it('after the owner revokes over HTTP, the same token is refused on the next request', async () => {
        const { grant, token } = await workingGrant();

        await revokeGrant(grant);

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await denialStages()).toEqual(['policy']);
        expect((await ownerReads(grant)).body.status).toBe('revoked');
    });

    it('refused: another key signing the same challenge and audience', async () => {
        const { grant } = await workingGrant();
        const otherKey = await getLearnCard('d2'.repeat(32));

        expect(await issueAs(await delegateToken(grant, otherKey))).toMatchObject(REFUSED);
        // The challenge is not a secret, so a key the grant does not name leaves no record.
        expect(await denialStages()).toEqual([]);
    });

    it('refused: another key on a closed route leaves no record', async () => {
        const { grant, token } = await workingGrant();
        const otherKey = await getLearnCard('d2'.repeat(32));
        const finalizeAs = (bearer: string) =>
            request<unknown>('POST', '/inbox/finalize', bearer, {});

        expect(await finalizeAs(await delegateToken(grant, otherKey))).toMatchObject(REFUSED);
        expect(await denialStages()).toEqual([]);

        // The same request signed by the grant's own key is recorded: the key is the difference.
        expect(await finalizeAs(token)).toMatchObject(REFUSED);
        expect(await denialStages()).toEqual(['route']);
    });

    it('refused: a route outside the allowlist with the same token', async () => {
        const { grant, token } = await workingGrant();
        const item = {
            recipient: { type: 'email', value: 'closed@test.com' },
            credential: await unsigned(),
        };

        const closed = [
            await request<unknown>('POST', '/inbox/finalize', token, {}),
            await request<unknown>('POST', '/inbox/issue-batch', token, { items: [item] }),
            await request<unknown>('POST', '/delegate-grant/list', token, {}),
            await request<unknown>('GET', `/delegate-grant/${grant.grantId}`, token),
            await request<unknown>('POST', `/delegate-grant/${grant.grantId}/revoke`, token, {}),
            await request<unknown>('POST', '/profile/auth-grants', token, {}),
        ];

        for (const reply of closed) expect(reply).toMatchObject(REFUSED);
        expect((await ownerReads(grant)).body.status).toBe('active');
        expect((await issueAs(token)).status).toBe(200);
    });

    it('refused: a grant that holds only contracts-data:write cannot use inbox.issue', async () => {
        await workingGrant();
        const contractsOnly = await createGrant('contracts-data:write');

        expect(await issueAs(await delegateToken(contractsOnly))).toMatchObject(REFUSED);
        expect(await audits()).toContainEqual(
            expect.objectContaining({
                grantId: contractsOnly.grantId,
                decision: 'denied',
                stage: 'policy',
            })
        );
    });

    it('refused: a grant whose stored expiry has passed', async () => {
        const { grant, token } = await workingGrant();
        const expiredAt = new Date(Date.now() - DAY_MS).toISOString();

        const moved = await neogma.queryRunner.run(
            'MATCH (g:DelegateAuthGrant {id: $id}) SET g.createdAt = $createdAt, g.expiresAt = $expiresAt RETURN g.id AS id',
            {
                id: grant.grantId,
                createdAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
                expiresAt: expiredAt,
            }
        );
        expect(moved.records).toHaveLength(1);

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await ownerReads(grant)).toMatchObject({
            status: 200,
            body: { status: 'active', expiresAt: expiredAt },
        });
        expect(await denialStages()).toEqual(['policy']);
    });

    it('refused: a token signed for another audience', async () => {
        const { grant } = await workingGrant();
        const token = await delegateJwt(delegate, {
            challenge: grant.challenge,
            audience: 'did:web:elsewhere.example.com',
        });

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await denialStages()).toEqual(['policy']);
    });

    it('refused: a token signed without an audience', async () => {
        const { grant } = await workingGrant();
        const token = await delegateJwt(delegate, { challenge: grant.challenge });

        expect(await issueAs(token)).toMatchObject(REFUSED);
    });

    it('refused: a delegate token without a time bound', async () => {
        const { grant, issued } = await workingGrant();
        // Signed by the right key over the grant's challenge and audience, the way a delegate
        // signed before the bound was required.
        const token = await jwt(delegate, { challenge: grant.challenge, domain: grant.audience });

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await storedIssuanceIds()).toEqual([issued.issuanceId]);
        // Refused before any grant is read: a token without a presentation leaves no record.
        expect(await denialStages()).toEqual([]);
    });

    it('refused: a delegate token that has expired', async () => {
        const { grant, issued } = await workingGrant();
        const token = await delegateJwt(delegate, {
            challenge: grant.challenge,
            audience: grant.audience,
            validUntil: new Date(Date.now() - 1_000).toISOString(),
        });

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await storedIssuanceIds()).toEqual([issued.issuanceId]);
        expect(await denialStages()).toEqual([]);
    });

    it('refused: the act-as header naming another profile changes nothing', async () => {
        const other = await getUser('c2'.repeat(32));
        await other.clients.fullAuth.profile.createProfile({ profileId: OTHER_ID });
        const { token } = await workingGrant();

        const reply = await issueAs(token, { headers: { [ACT_AS_HEADER]: OTHER_ID } });

        expect(reply.status, JSON.stringify(reply.body)).toBe(200);
        const stored = await getInboxCredentialById(reply.body.issuanceId);
        expect(stored?.issuerDid).toBe(owner.learnCard.id.did());
        expect(stored?.issuerDid).not.toBe(other.learnCard.id.did());
        expect(await issuerProfilesOf(reply.body.issuanceId)).toEqual([OWNER_ID]);
    });

    it('refused: a credential the delegate signed itself', async () => {
        const { token, issued } = await workingGrant();
        const selfSigned = await delegate.invoke.issueCredential(await delegate.invoke.getTestVc());

        const reply = await issueAs(token, { credential: selfSigned });

        expect(reply).toMatchObject({
            status: 400,
            body: { code: 'BAD_REQUEST', message: SELF_SIGNED_MESSAGE },
        });
        expect(await storedIssuanceIds()).toEqual([issued.issuanceId]);
    });

    it('no fallback: a legacy AuthGrant node with the same challenge linked to the owner does not make a refused delegate token pass', async () => {
        const { grant, token, issued } = await workingGrant();
        await revokeGrant(grant);
        expect(await issueAs(token)).toMatchObject(REFUSED);

        const legacy = await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $profileId})
             CREATE (p)-[:AUTHORIZES_AUTH_GRANT]->(g:AuthGrant {
                 id: $id, name: 'legacy', challenge: $challenge, status: 'active',
                 scope: 'inbox:write', createdAt: $createdAt
             })
             RETURN g.id AS id`,
            {
                profileId: OWNER_ID,
                id: randomUUID(),
                challenge: grant.challenge,
                createdAt: new Date().toISOString(),
            }
        );
        expect(legacy.records).toHaveLength(1);

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await storedIssuanceIds()).toEqual([issued.issuanceId]);
    });

    it('audit: an allowed request leaves one record, completed as succeeded with the issuance id; the request after revocation leaves one denied record with stage policy; a closed route leaves one denied record with stage route; a token whose challenge names no grant leaves none', async () => {
        const { grant, token, issued } = await workingGrant();
        const attributed = {
            actorDid: delegate.id.did(),
            grantId: grant.grantId,
            ownerProfileId: OWNER_ID,
        };

        expect(await audits()).toEqual([
            expect.objectContaining({
                ...attributed,
                decision: 'allowed',
                outcome: 'succeeded',
                resultRef: issued.issuanceId,
                route: 'inbox.issue',
                requiredScope: 'inbox:write',
            }),
        ]);

        expect(await request<unknown>('POST', '/inbox/finalize', token, {})).toMatchObject(REFUSED);
        const afterClosedRoute = await audits();
        expect(afterClosedRoute).toHaveLength(2);
        expect(afterClosedRoute).toContainEqual(
            expect.objectContaining({
                ...attributed,
                decision: 'denied',
                stage: 'route',
                route: 'inbox.finalize',
            })
        );

        await revokeGrant(grant);
        expect(await issueAs(token)).toMatchObject(REFUSED);
        const afterRevocation = await audits();
        expect(afterRevocation).toHaveLength(3);
        expect(afterRevocation).toContainEqual(
            expect.objectContaining({
                ...attributed,
                decision: 'denied',
                stage: 'policy',
                route: 'inbox.issue',
            })
        );

        const unknownChallenge = `${DELEGATE_GRANT_CHALLENGE_PREFIX}${randomUUID()}`;
        const unknownToken = await delegateJwt(delegate, {
            challenge: unknownChallenge,
            audience: grant.audience,
        });
        expect(await issueAs(unknownToken)).toMatchObject(REFUSED);

        const recorded = JSON.stringify(await audits());
        expect(await audits()).toHaveLength(3);
        for (const secret of [token, grant.challenge, unknownToken, unknownChallenge]) {
            expect(recorded).not.toContain(secret);
        }
    });

    it('owner routes over HTTP: create refuses a caller-supplied audience', async () => {
        const accepted = await createGrant();

        const reply = await request<{ code: string }>(
            'POST',
            '/delegate-grant/create',
            await sessionToken(owner),
            { ...grantInput('inbox:write'), audience: 'did:web:elsewhere.example.com' }
        );

        expect(reply.status, JSON.stringify(reply.body)).toBe(400);
        expect(reply.body.code).toBe('BAD_REQUEST');
        expect(JSON.stringify(reply.body)).toContain('audience');

        const listed = await request<StoredGrant[]>(
            'POST',
            '/delegate-grant/list',
            await sessionToken(owner),
            {}
        );
        expect(listed.status, JSON.stringify(listed.body)).toBe(200);
        expect(listed.body.map(grant => grant.id)).toEqual([accepted.grantId]);
        expect(listed.body[0]?.audience).toBe(accepted.audience);
    });

    // An unsigned credential for a recipient without a profile is signed only at the claim,
    // which may be long after the request was admitted.
    describe('the grant is checked again when the recipient claims', () => {
        let holder: User;

        beforeEach(async () => {
            holder = await getUser('c3'.repeat(32));
            await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_ID });
        });

        const pendingIssuance = async (token?: string) => {
            const grant = await createGrant();
            const reply = await issueAs(token ?? (await delegateToken(grant)));

            expect(reply.status, JSON.stringify(reply.body)).toBe(200);
            expect(reply.body).toMatchObject({ status: 'PENDING', claimUrl: expect.any(String) });

            return { grant, issuanceId: reply.body.issuanceId, claimUrl: reply.body.claimUrl! };
        };

        /** The claim link's exchange, as a wallet runs it. Returns what was delivered. */
        const claim = async (claimUrl: string): Promise<unknown[]> => {
            const exchange = {
                localWorkflowId: 'inbox-claim',
                localExchangeId: new URL(claimUrl).pathname.split('/').pop()!,
            };
            const start = await holder.clients.fullAuth.workflows.participateInExchange(exchange);
            const verifiablePresentation = await holder.learnCard.invoke.getDidAuthVp({
                challenge: start.verifiablePresentationRequest?.challenge,
                domain: start.verifiablePresentationRequest?.domain,
            });
            const result = await holder.clients.fullAuth.workflows.participateInExchange({
                ...exchange,
                verifiablePresentation,
            });

            return [result.verifiablePresentation?.verifiableCredential ?? []].flat();
        };

        const storedNode = async (issuanceId: string): Promise<Record<string, unknown>> => {
            const result = await neogma.queryRunner.run(
                'MATCH (i:InboxCredential {id: $issuanceId}) RETURN properties(i) AS stored',
                { issuanceId }
            );

            return result.records[0]?.get('stored');
        };

        const changeGrant = async (cypher: string, params: Record<string, unknown>) => {
            const changed = await neogma.queryRunner.run(
                `MATCH (g:DelegateAuthGrant {id: $id}) ${cypher} RETURN count(g) AS changed`,
                params
            );
            expect(changed.records[0]?.get('changed').toNumber()).toBe(1);
        };

        const claimDenials = async () =>
            (await audits()).filter(audit => audit.decision === 'denied');

        const CHANGES: [string, string, (grant: Grant) => Promise<void>][] = [
            ['revoked', 'the grant is revoked', grant => revokeGrant(grant)],
            [
                'expired',
                'the grant has expired',
                grant =>
                    changeGrant('SET g.createdAt = $createdAt, g.expiresAt = $expiresAt', {
                        id: grant.grantId,
                        createdAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
                        expiresAt: new Date(Date.now() - DAY_MS).toISOString(),
                    }),
            ],
            [
                'moved to another delegate',
                'another delegate holds the grant',
                async grant =>
                    changeGrant('SET g.delegateDid = $did', {
                        id: grant.grantId,
                        did: (await getLearnCard('d2'.repeat(32))).id.did(),
                    }),
            ],
            [
                'deleted',
                'the grant no longer exists',
                grant =>
                    changeGrant('WITH g, 1 AS kept DETACH DELETE g WITH kept AS g', {
                        id: grant.grantId,
                    }),
            ],
        ];

        it.each(CHANGES)(
            'a grant %s between admission and claim: nothing is signed, the credential is EXPIRED, the failure names the grant and a denied record is written',
            async (_change, reason, change) => {
                const { grant, issuanceId, claimUrl } = await pendingIssuance();
                await neogma.queryRunner.run(
                    'MATCH (i:InboxCredential {id: $issuanceId}) SET i.webhookUrl = $webhookUrl',
                    { issuanceId, webhookUrl: 'https://owner.example.com/hook' }
                );
                const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
                const failed = vi.spyOn(activity, 'logCredentialFailed');

                await change(grant);

                expect(await claim(claimUrl)).toEqual([]);

                expect(sign).not.toHaveBeenCalled();
                expect(await storedNode(issuanceId)).toMatchObject({
                    currentStatus: 'EXPIRED',
                    expiredAt: expect.any(String),
                });

                const message = `Delegate grant ${grant.grantId} does not authorise this issuance any more (${reason}); the credential was not signed.`;
                expect(failed).toHaveBeenCalledTimes(1);
                expect(failed.mock.calls[0]?.[0]).toMatchObject({
                    actorProfileId: OWNER_ID,
                    metadata: { error: message },
                });
                expect(addNotificationToQueueSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'ISSUANCE_ERROR',
                        message: expect.objectContaining({ body: message }),
                        data: { inbox: expect.objectContaining({ issuanceId, status: 'EXPIRED' }) },
                    })
                );
                expect(await claimDenials()).toEqual([
                    expect.objectContaining({
                        decision: 'denied',
                        stage: 'policy',
                        route: 'inbox.issue',
                        requiredScope: 'inbox:write',
                        actorDid: delegate.id.did(),
                        grantId: grant.grantId,
                        ownerProfileId: OWNER_ID,
                    }),
                ]);
            }
        );

        it('the other signer of a pending credential, inbox.finalize, refuses a revoked grant the same way', async () => {
            const { grant, issuanceId } = await pendingIssuance();
            const accepted = await neogma.queryRunner.run(
                'MATCH (i:InboxCredential {id: $issuanceId})-[:ADDRESSED_TO]->(c:ContactMethod) SET i.isAccepted = true, c.isVerified = true RETURN c.id AS id',
                { issuanceId }
            );
            await createProfileContactMethodRelationship(HOLDER_ID, accepted.records[0]?.get('id'));
            const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');

            await revokeGrant(grant);

            expect(await holder.clients.fullAuth.inbox.finalize()).toMatchObject({
                processed: 1,
                claimed: 0,
                errors: 1,
            });
            expect(sign).not.toHaveBeenCalled();
            expect(await storedNode(issuanceId)).toMatchObject({ currentStatus: 'EXPIRED' });
            expect(await claimDenials()).toHaveLength(1);
        });

        it('a grant that cannot be read: nothing is signed, the credential stays PENDING and the failure is logged', async () => {
            const { issuanceId, claimUrl } = await pendingIssuance();
            const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
            const failed = vi.spyOn(activity, 'logCredentialFailed');
            vi.spyOn(grantReads, 'getDelegateAuthGrantForOwner').mockRejectedValue(
                new Error('neo4j unavailable')
            );

            expect(await claim(claimUrl)).toEqual([]);

            expect(sign).not.toHaveBeenCalled();
            expect(await storedNode(issuanceId)).toMatchObject({ currentStatus: 'PENDING' });
            expect(failed.mock.calls.map(([logged]) => logged.metadata)).toEqual([
                { error: 'neo4j unavailable' },
            ]);
            expect(await claimDenials()).toEqual([]);
        });

        it('an unchanged grant still signs at the claim, and what was recorded for the claim is in no public output', async () => {
            const { grant, issuanceId, claimUrl } = await pendingIssuance();
            const recorded = {
                delegateGrantId: grant.grantId,
                delegateDid: delegate.id.did(),
                delegateOwnerProfileId: OWNER_ID,
            };
            expect(await storedNode(issuanceId)).toMatchObject({ ...recorded, isSigned: false });

            const publicOutputs = JSON.stringify([
                await owner.clients.fullAuth.inbox.getMyIssuedCredentials(),
                await owner.clients.fullAuth.inbox.getInboxCredential({ credentialId: issuanceId }),
            ]);
            expect(publicOutputs).toContain(issuanceId);
            for (const value of ['delegateGrantId', ...Object.values(recorded).slice(0, 2)]) {
                expect(publicOutputs).not.toContain(value);
            }

            const delivered = await claim(claimUrl);

            expect(delivered).toEqual([expect.objectContaining({ proof: expect.anything() })]);
            expect(await storedNode(issuanceId)).toMatchObject({ currentStatus: 'ISSUED' });
            expect(await claimDenials()).toEqual([]);
        });

        it("the organisation's own pending credential carries no grant and is claimed without a grant being read", async () => {
            const { issuanceId, claimUrl } = await pendingIssuance(await sessionToken(owner));
            const read = vi.spyOn(grantReads, 'getDelegateAuthGrantForOwner');

            const stored = await storedNode(issuanceId);
            expect(stored).toMatchObject({ currentStatus: 'PENDING', isSigned: false });
            expect(Object.keys(stored).filter(key => key.startsWith('delegate'))).toEqual([]);

            expect(await claim(claimUrl)).toEqual([
                expect.objectContaining({ proof: expect.anything() }),
            ]);
            expect(read).not.toHaveBeenCalled();
            expect(await storedNode(issuanceId)).toMatchObject({ currentStatus: 'ISSUED' });
            expect(await audits()).toEqual([]);
        });
    });

    describe('contract write through the signing authority', () => {
        type Consented = {
            holder: User;
            holderDid: string;
            contractUri: string;
            boostUri: string;
            termsUri: string;
        };
        type Sent = { from: string; to: string; id: string; credential: string };

        const CONTRACT_ROUTE = 'contracts.writeCredentialToContractViaSigningAuthority';
        const CONTRACT_SCOPE = 'contracts-data:write';
        const WRITE_PATH = '/consent-flow-contract/write/via-signing-authority';

        /** The owner publishes a boost and a contract; a holder consents to the contract in full. */
        const consentedContract = async (): Promise<Consented> => {
            const holder = await getUser('c3'.repeat(32));
            await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_ID });
            const boostUri = await owner.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                category: 'Achievement',
                name: 'Acceptance boost',
            });
            const contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
                contract: normalContract,
                name: 'Acceptance contract',
            });
            const { termsUri } = await holder.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: normalFullTerms,
            });
            const profile = await holder.clients.fullAuth.profile.getProfile();
            if (!profile) throw new Error('Expected the holder to have a profile');

            return { holder, holderDid: profile.did, contractUri, boostUri, termsUri };
        };

        /** The caller names a holder, a contract, a boost and an authority: never the content. */
        const writeAs = async (
            token: string,
            target: Consented,
            signingAuthorityName: string = SIGNING_AUTHORITY.name
        ): Promise<Reply<string>> =>
            request<string>('POST', WRITE_PATH, token, {
                did: target.holderDid,
                contractUri: target.contractUri,
                boostUri: target.boostUri,
                signingAuthority: {
                    name: signingAuthorityName,
                    endpoint: SIGNING_AUTHORITY.endpoint,
                },
            });

        /** A contract grant whose token has just written, so that a later refusal is not a broken fixture. */
        const workingContractGrant = async (): Promise<{
            target: Consented;
            grant: Grant;
            token: string;
            credentialUri: string;
        }> => {
            const target = await consentedContract();
            const grant = await createGrant(CONTRACT_SCOPE);
            const token = await delegateToken(grant);
            const reply = await writeAs(token, target);
            expect(reply.status, JSON.stringify(reply.body)).toBe(200);

            return { target, grant, token, credentialUri: reply.body };
        };

        const sent = async (): Promise<Sent[]> => {
            const result = await neogma.queryRunner.run(
                'MATCH (from:Profile)-[sent:CREDENTIAL_SENT]->(c:Credential) RETURN from.profileId AS from, sent.to AS to, c.id AS id, c.credential AS credential'
            );

            return result.records.map(record => ({
                from: record.get('from'),
                to: record.get('to'),
                id: record.get('id'),
                credential: record.get('credential'),
            }));
        };

        /** What the holder is shown as written into the terms it consented to. */
        const deliveriesTo = async (target: Consented) => {
            const { records } =
                await target.holder.clients.fullAuth.contracts.getCredentialsForContract({
                    termsUri: target.termsUri,
                });

            return records.map(record => ({
                credential: getIdFromUri(record.credentialUri),
                contract: getIdFromUri(record.contractUri),
                terms: getIdFromUri(record.termsUri),
                boost: getIdFromUri(record.boostUri),
            }));
        };

        const outcomes = async (): Promise<unknown[]> =>
            (await audits()).map(audit => `${audit.decision}:${audit.outcome}`).sort();

        it('a delegate writes a credential into a consented contract as the owner', async () => {
            const target = await consentedContract();
            const seal = vi.spyOn(learnCards, 'createDagJweForRecipients');
            const token = await delegateToken(await createGrant(CONTRACT_SCOPE));

            const reply = await writeAs(token, target);

            expect(reply.status, JSON.stringify(reply.body)).toBe(200);
            expect(typeof reply.body).toBe('string');
            expect(await deliveriesTo(target)).toEqual([
                {
                    credential: getIdFromUri(reply.body),
                    contract: getIdFromUri(target.contractUri),
                    terms: getIdFromUri(target.termsUri),
                    boost: getIdFromUri(target.boostUri),
                },
            ]);

            const stored = await sent();
            expect(stored.map(({ from, to, id }) => ({ from, to, id }))).toEqual([
                { from: OWNER_ID, to: HOLDER_ID, id: getIdFromUri(reply.body) },
            ]);

            // What is stored is an envelope encrypted for did:web readers, which the holder's key
            // does not open here, so the content is read where the stand-in authority of the test
            // environment seals it. That stand-in signs with the service's own key: the issuer is
            // that key and not the owner's did:web, as in the inbox test above.
            expect(seal).toHaveBeenCalledTimes(1);
            const [content, readers] = seal.mock.calls[0] ?? [];
            const delivered = VCValidator.parse(content);
            const standIn = await getLearnCard();
            expect(stored.map(({ credential }) => JSON.parse(credential))).toEqual([
                await seal.mock.results[0]?.value,
            ]);
            expect(readers).toEqual([
                expect.stringMatching(new RegExp(`^did:web:.+:${HOLDER_ID}$`)),
                expect.stringMatching(new RegExp(`^did:web:.+:${OWNER_ID}$`)),
            ]);
            expect(delivered.issuer).toBe(standIn.id.did());
            expect(JSON.stringify(delivered.proof)).toContain(standIn.id.did());
            expect(JSON.stringify(delivered.credentialSubject)).toContain(HOLDER_ID);
            expect(JSON.stringify([delivered, readers, stored])).not.toContain(delegate.id.did());
        });

        it('the signing authority is asked for the owner profile, with the authority the owner registered', async () => {
            const target = await consentedContract();
            const sign = vi.spyOn(signing, 'issueCredentialWithSigningAuthority');
            const token = await delegateToken(await createGrant(CONTRACT_SCOPE));

            const reply = await writeAs(token, target);

            expect(reply.status, JSON.stringify(reply.body)).toBe(200);
            expect(sign).toHaveBeenCalledTimes(1);
            expect(sign.mock.calls[0]?.[0]).toMatchObject({
                type: 'profile',
                profile: { profileId: OWNER_ID },
            });
            expect(sign.mock.calls[0]?.[2]).toMatchObject({
                relationship: { name: SIGNING_AUTHORITY.name, did: SIGNING_AUTHORITY.did },
                signingAuthority: { endpoint: SIGNING_AUTHORITY.endpoint },
            });

            // The content the authority is asked to sign is built by the server from the stored
            // boost: it names the owner as issuer and the holder as subject, never the delegate.
            const asked = sign.mock.calls[0]?.[1];
            expect(asked?.issuer).toEqual({
                id: expect.stringMatching(new RegExp(`^did:web:.+:${OWNER_ID}$`)),
            });
            expect(JSON.stringify(asked?.credentialSubject)).toContain(HOLDER_ID);
            expect(JSON.stringify(asked)).not.toContain(delegate.id.did());
        });

        it('audit: the write leaves one allowed record, completed as succeeded, whose resultRef is the returned reference and whose route is the contract route with scope contracts-data:write', async () => {
            const { grant, credentialUri } = await workingContractGrant();

            expect(await audits()).toEqual([
                expect.objectContaining({
                    actorDid: delegate.id.did(),
                    grantId: grant.grantId,
                    ownerProfileId: OWNER_ID,
                    decision: 'allowed',
                    outcome: 'succeeded',
                    resultRef: credentialUri,
                    route: CONTRACT_ROUTE,
                    requiredScope: CONTRACT_SCOPE,
                }),
            ]);
        });

        it('refused: the same token on the caller-signed contract write, on contract sync, and on inbox.issue', async () => {
            const { target, grant, token, credentialUri } = await workingContractGrant();

            const closed = [
                await request<unknown>('POST', '/consent-flow-contract/write', token, {
                    did: target.holderDid,
                    contractUri: target.contractUri,
                    boostUri: target.boostUri,
                    credential: await delegate.invoke.issueCredential(
                        await delegate.invoke.getTestVc()
                    ),
                }),
                await request<unknown>('POST', '/consent-flow-contract/sync', token, {
                    termsUri: target.termsUri,
                    categories: { Achievement: [credentialUri] },
                }),
                await issueAs(token),
            ];

            for (const reply of closed) expect(reply).toMatchObject(REFUSED);
            const denied = (await audits())
                .filter(audit => audit.decision === 'denied')
                .map(({ route, stage }) => ({ route, stage }));
            expect(denied).toHaveLength(3);
            expect(denied).toEqual(
                expect.arrayContaining([
                    { route: 'contracts.writeCredentialToContract', stage: 'route' },
                    { route: 'contracts.syncCredentialsToContract', stage: 'route' },
                    { route: 'inbox.issue', stage: 'policy' },
                ])
            );
            expect((await sent()).map(({ id }) => id)).toEqual([getIdFromUri(credentialUri)]);
            expect(await storedIssuanceIds()).toEqual([]);
            expect((await ownerReads(grant)).body.status).toBe('active');
        });

        it("the route's own rules still apply to a delegate", async () => {
            const { target, token, credentialUri } = await workingContractGrant();

            const unregistered = await writeAs(token, target, 'not-registered');

            expect(unregistered).toMatchObject({
                status: 404,
                body: { code: 'NOT_FOUND', message: 'Could not find signing authority for boost' },
            });
            expect((await sent()).map(({ id }) => id)).toEqual([getIdFromUri(credentialUri)]);
            expect(await deliveriesTo(target)).toHaveLength(1);
            expect(await outcomes()).toEqual(['allowed:failed', 'allowed:succeeded']);

            await target.holder.clients.fullAuth.contracts.withdrawConsent({
                uri: target.termsUri,
            });
            const beforeRefusal = await sent();

            const withdrawn = await writeAs(token, target);

            expect(withdrawn).toMatchObject({
                status: 403,
                body: {
                    code: 'FORBIDDEN',
                    message: 'Target profile has not consented to this contract',
                },
            });
            expect(withdrawn).toEqual(await writeAs(await sessionToken(owner), target));
            expect(await sent()).toEqual(beforeRefusal);
            expect(await outcomes()).toEqual([
                'allowed:failed',
                'allowed:failed',
                'allowed:succeeded',
            ]);
        });

        it('after the owner revokes over HTTP, the same token is refused on the contract route', async () => {
            const { target, grant, token, credentialUri } = await workingContractGrant();

            await revokeGrant(grant);

            expect(await writeAs(token, target)).toMatchObject(REFUSED);
            expect(await denialStages()).toEqual(['policy']);
            expect((await ownerReads(grant)).body.status).toBe('revoked');
            expect((await sent()).map(({ id }) => id)).toEqual([getIdFromUri(credentialUri)]);
        });
    });
});
