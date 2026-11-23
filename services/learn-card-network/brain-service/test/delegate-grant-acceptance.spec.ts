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
import * as signing from '@helpers/signingAuthority.helpers';
import { DELEGATE_GRANT_CHALLENGE_PREFIX } from '@helpers/delegate-auth-grant.schema';
import { getLearnCard, type SeedLearnCard } from '@helpers/learnCard.helpers';

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
type Issued = { issuanceId: string; status: string };
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

    const jwt = async (
        wallet: SeedLearnCard,
        options: { challenge?: string; domain?: string }
    ): Promise<string> => {
        const token = await wallet.invoke.getDidAuthVp({ ...options, proofFormat: 'jwt' });

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

    /** Signs the way a delegate does: the grant's challenge for the grant's audience. */
    const delegateToken = (grant: Grant, signer: SeedLearnCard = delegate): Promise<string> =>
        jwt(signer, { challenge: grant.challenge, domain: grant.audience });

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
            'MATCH (n) WHERE n:AuthGrant OR n:DelegateAuthGrant OR n:DelegateGrantAudit OR n:BitstringStatusList OR n:CredentialStatusBinding DETACH DELETE n'
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
        expect(await denialStages()).toEqual(['policy']);
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
        const token = await jwt(delegate, {
            challenge: grant.challenge,
            domain: 'did:web:elsewhere.example.com',
        });

        expect(await issueAs(token)).toMatchObject(REFUSED);
        expect(await denialStages()).toEqual(['policy']);
    });

    it('refused: a token signed without an audience', async () => {
        const { grant } = await workingGrant();
        const token = await jwt(delegate, { challenge: grant.challenge });

        expect(await issueAs(token)).toMatchObject(REFUSED);
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
        const unknownToken = await jwt(delegate, {
            challenge: unknownChallenge,
            domain: grant.audience,
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
});
