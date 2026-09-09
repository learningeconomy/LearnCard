import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { IssueInboxCredentialType, UnsignedVC, VC } from '@learncard/types';

import { appRouter, createContext } from '../src/app';
import { neogma } from '@instance';
import cache from '@cache';
import { setValidChallengeForDid } from '@cache/challenges';
import { Profile, SigningAuthority } from '@models';
import { getUser, getVerifiedContactMethodClient } from './helpers/getClient';
import { createIntegration } from '@accesslayer/integration/create';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { getInboxCredentialById } from '@accesslayer/inbox-credential/read';
import {
    finalizeAndWipeInboxCredential,
    updateInboxCredential,
} from '@accesslayer/inbox-credential/update';
import {
    migrateLegacyInboxCredentials,
    runInboxMaintenance,
} from '@helpers/inbox-maintenance.helpers';
import * as encryption from '@helpers/inbox-encryption.helpers';
import * as notifications from '@helpers/notifications.helpers';
import * as activity from '@helpers/activity.helpers';
import { clrMinimal } from '../../../../packages/credential-library/src/fixtures/clr/minimal';

// HTTP requests exercise the production routers, JWT auth, real crypto, Neo4j and Redis.
// NODE_ENV=test uses the existing local signing-authority adapter and captures delivery.
describe('Universal Inbox escrow (HTTP + isolated Neo4j/Redis)', () => {
    let server: FastifyInstance;
    let baseUrl: string;
    let issuer: Awaited<ReturnType<typeof getUser>>;
    let recipient: Awaited<ReturnType<typeof getUser>>;
    const marker = 'private-learner-transcript-98b98e72';

    const post = async (path: string, body: unknown, user?: typeof issuer): Promise<Response> =>
        fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(user ? { Authorization: `Bearer ${await createToken(user)}` } : {}),
            },
            body: JSON.stringify(body),
        });

    const createToken = async (user: typeof issuer): Promise<string> => {
        const challenge = randomUUID();
        await setValidChallengeForDid(user.learnCard.id.did(), challenge);
        return (await user.learnCard.invoke.getDidAuthVp({
            proofFormat: 'jwt',
            challenge,
        })) as string;
    };

    const issue = async (input: IssueInboxCredentialType) => {
        const response = await post('/api/inbox/issue', input, issuer);
        const body = await response.json();
        expect(response.status, JSON.stringify(body)).toBe(200);
        return body as Awaited<ReturnType<typeof issuer.clients.fullAuth.inbox.issue>>;
    };

    const getRecord = async (id: string): Promise<Record<string, unknown> | undefined> => {
        const result = await neogma.queryRunner.run(
            'MATCH (n:InboxCredential {id: $id}) RETURN properties(n) AS record',
            { id }
        );
        return result.records[0]?.get('record');
    };

    const expectNoPlaintext = async (): Promise<void> => {
        const nodes = await neogma.queryRunner.run('MATCH (n) RETURN properties(n) AS properties');
        expect(JSON.stringify(nodes.records.map(record => record.get('properties')))).not.toContain(
            marker
        );
        // Inspect the actual Redis values, including queues and hashes; no cache mocks.
        const redis = cache.redis!;
        expect(redis).toBeDefined();
        const keys = await redis.keys('*');
        expect(keys.length).toBeGreaterThan(0);
        for (const key of keys) {
            const type = await redis.type(key);
            let value: unknown;
            switch (type) {
                case 'string':
                    value = await redis.get(key);
                    break;
                case 'list':
                    value = await redis.lrange(key, 0, -1);
                    break;
                case 'hash':
                    value = await redis.hgetall(key);
                    break;
                case 'set':
                    value = await redis.smembers(key);
                    break;
                case 'zset':
                    value = await redis.zrange(key, 0, -1, 'WITHSCORES');
                    break;
                case 'stream':
                    value = await redis.xrange(key, '-', '+');
                    break;
                case 'none':
                    continue;
                default:
                    throw new Error(`Uninspected Redis type: ${type}`);
            }
            expect(JSON.stringify({ key, value })).not.toContain(marker);
        }
    };

    const claim = async (claimUrl: string): Promise<VC[]> => {
        const exchangeId = new URL(claimUrl).pathname.split('/').at(-1)!;
        const path = `/api/workflows/inbox-claim/exchanges/${exchangeId}`;
        const initiation = await post(path, {});
        expect(initiation.status).toBe(200);
        const { verifiablePresentationRequest: request } = await initiation.json();
        const vp = await recipient.learnCard.invoke.getDidAuthVp({
            challenge: request.challenge,
            domain: request.domain,
        });
        const response = await post(path, { verifiablePresentation: vp });
        const body = await response.json();
        expect(response.status, JSON.stringify(body)).toBe(200);
        return body.verifiablePresentation.verifiableCredential;
    };

    const signedCredential = async (): Promise<VC> => {
        const unsigned = await issuer.learnCard.invoke.getTestVc();
        unsigned.credentialSubject = { ...unsigned.credentialSubject, name: marker };
        unsigned['@context'] = [...unsigned['@context'], { name: 'https://schema.org/name' }];
        return issuer.learnCard.invoke.issueCredential(unsigned);
    };

    const verifyRecipientContact = async (email: string): Promise<void> => {
        await recipient.clients.fullAuth.contactMethods.addContactMethod({
            type: 'email',
            value: email,
        });
        const delivery = JSON.parse((await cache.redis!.get('e2e:last-delivery'))!);
        await recipient.clients.fullAuth.contactMethods.verifyContactMethod({
            token: delivery.templateModel.verificationToken,
        });
    };

    beforeAll(async () => {
        server = Fastify({ routerOptions: { maxParamLength: 5000 } });
        await server.register(fastifyTRPCOpenApiPlugin, {
            basePath: '/api',
            router: appRouter,
            createContext,
        });
        baseUrl = await server.listen({ port: 0, host: '127.0.0.1' });
    });

    beforeEach(async () => {
        vi.restoreAllMocks();
        await neogma.queryRunner.run('MATCH (n) DETACH DELETE n');
        await cache.redis!.flushdb();
        issuer = await getUser('a'.repeat(64));
        recipient = await getUser('b'.repeat(64));
        await issuer.clients.fullAuth.profile.createProfile({ profileId: 'escrow-issuer' });
        await recipient.clients.fullAuth.profile.createProfile({ profileId: 'escrow-recipient' });
    });

    afterAll(async () => {
        vi.restoreAllMocks();
        await server?.close();
        await cache.redis?.quit();
        await neogma.driver.close();
    });

    it('encrypts before persistence, claims over HTTP, wipes, and preserves webhook metadata', async () => {
        const credential = await signedCredential();
        const issued = await issue({
            credential,
            recipient: { type: 'email', value: 'learner@example.test' },
            configuration: { expiresInDays: 2, webhookUrl: 'https://issuer.example/webhook' },
        });
        const before = (await getRecord(issued.issuanceId))!;
        expect(before.credential).toMatch(/^lc-inbox-jwe:v1:/);
        expect(
            JSON.parse(await encryption.decryptInboxCredential(before.credential as string))
        ).toEqual(credential);
        const jwe = JSON.parse(
            (before.credential as string).slice(encryption.INBOX_JWE_PREFIX.length)
        );
        const unauthorized = await recipient.learnCard.invoke.decryptDagJwe(jwe).catch(() => null);
        expect(unauthorized || null).toBeNull();
        jwe.ciphertext = (jwe.ciphertext.startsWith('a') ? 'b' : 'a') + jwe.ciphertext.slice(1);
        await expect(
            encryption.decryptInboxCredential(encryption.INBOX_JWE_PREFIX + JSON.stringify(jwe))
        ).rejects.toBeDefined();
        expect(
            Date.parse(before.expiresAt as string) - Date.parse(before.createdAt as string)
        ).toBeCloseTo(2 * 86400000, -3);
        await expectNoPlaintext();

        expect(await claim(issued.claimUrl!)).toEqual([credential]);
        const after = (await getRecord(issued.issuanceId))!;
        expect(after).toMatchObject({
            currentStatus: 'ISSUED',
            isAccepted: true,
            finalizedAt: expect.any(String),
        });
        expect(after).not.toHaveProperty('credential');
        expect(after).not.toHaveProperty('credentialName');
        await expectNoPlaintext();
        const keys = await cache.redis!.keys('e2e:notification-queue:*');
        const messages = (await cache.redis!.mget(...keys)).map(value => JSON.parse(value!));
        expect(messages).toContainEqual(
            expect.objectContaining({
                webhookUrl: 'https://issuer.example/webhook',
                data: expect.objectContaining({
                    inbox: expect.objectContaining({
                        issuanceId: issued.issuanceId,
                        status: 'ISSUED',
                    }),
                }),
            })
        );
        const exchangeId = new URL(issued.claimUrl!).pathname.split('/').at(-1)!;
        expect((await post(`/api/workflows/inbox-claim/exchanges/${exchangeId}`, {})).status).toBe(
            404
        );
    });

    it('decrypts an unsigned CLR only at finalize and wipes after signing', async () => {
        await SigningAuthority.createOne({ endpoint: 'https://signer.example' });
        await Profile.relateTo({
            alias: 'usesSigningAuthority',
            where: {
                source: { profileId: 'escrow-issuer' },
                target: { endpoint: 'https://signer.example' },
            },
            properties: { name: 'escrow', did: issuer.learnCard.id.did() },
        });
        const credential = structuredClone(clrMinimal.credential) as UnsignedVC;
        const subject = credential.credentialSubject as Record<string, unknown>;
        delete subject.id;
        (subject.achievement as Array<Record<string, unknown>>)[0]!.description = marker;
        credential.issuer = issuer.learnCard.id.did();
        const issued = await issue({
            credential,
            recipient: { type: 'email', value: 'clr@example.test' },
            configuration: {
                expiresInDays: 1,
                signingAuthority: { endpoint: 'https://signer.example', name: 'escrow' },
            },
        });
        await expectNoPlaintext();
        await updateInboxCredential(issued.issuanceId, { isAccepted: true });
        await verifyRecipientContact('clr@example.test');
        const response = await post('/api/inbox/finalize', {}, recipient);
        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result).toMatchObject({ claimed: 1, errors: 0 });
        expect(result.verifiableCredentials[0]).toMatchObject({
            type: ['VerifiableCredential', 'ClrCredential'],
            proof: expect.anything(),
            credentialSubject: {
                id: recipient.learnCard.id.did(),
                achievement: [expect.objectContaining({ description: marker })],
            },
        });
        expect(await getRecord(issued.issuanceId)).not.toHaveProperty('credential');
        await expectNoPlaintext();
        expect(await (await post('/api/inbox/finalize', {}, recipient)).json()).toMatchObject({
            claimed: 0,
            errors: 0,
        });
    });

    it('does not lose the claim response when webhook enqueueing or activity logging fails', async () => {
        const credential = await signedCredential();
        const issued = await issue({
            credential,
            recipient: { type: 'email', value: 'failure@example.test' },
            configuration: { webhookUrl: 'https://issuer.example/webhook' },
        });
        vi.spyOn(notifications, 'addNotificationToQueue').mockRejectedValue(
            new Error('queue unavailable')
        );
        vi.spyOn(activity, 'logCredentialClaimed').mockRejectedValue(
            new Error('activity unavailable')
        );
        expect(await claim(issued.claimUrl!)).toEqual([credential]);
        expect(await getRecord(issued.issuanceId)).not.toHaveProperty('credential');
    });

    it('leaves escrow retryable after decryption failure', async () => {
        const issued = await issue({
            credential: await signedCredential(),
            recipient: { type: 'email', value: 'retry@example.test' },
        });
        const decrypt = vi
            .spyOn(encryption, 'decryptInboxCredential')
            .mockRejectedValueOnce(new Error('key unavailable'));
        expect(await claim(issued.claimUrl!)).toEqual([]);
        expect(await getRecord(issued.issuanceId)).toMatchObject({
            currentStatus: 'PENDING',
            credential: expect.stringMatching(/^lc-inbox-jwe:v1:/),
        });
        decrypt.mockRestore();
        expect(await claim(issued.claimUrl!)).toHaveLength(1);
    });

    it('fails closed before persistence when encryption is unavailable', async () => {
        vi.spyOn(encryption, 'encryptInboxCredential').mockRejectedValueOnce(
            new Error('key unavailable')
        );
        const response = await post(
            '/api/inbox/issue',
            {
                credential: await signedCredential(),
                recipient: { type: 'email', value: 'unavailable@example.test' },
            },
            issuer
        );
        expect(response.status).toBe(500);
        const result = await neogma.queryRunner.run(
            'MATCH (n:InboxCredential) RETURN count(n) AS count'
        );
        expect(result.records[0]!.get('count').toNumber()).toBe(0);
    });

    it('encrypts ordinary credential storage on auto-delivery and wipes escrow', async () => {
        await verifyRecipientContact('existing@example.test');
        const credential = await signedCredential();
        const issued = await issue({
            credential,
            recipient: { type: 'email', value: 'existing@example.test' },
        });
        expect(issued.status).toBe('ISSUED');
        expect(await getRecord(issued.issuanceId)).toMatchObject({
            isAccepted: false,
            currentStatus: 'ISSUED',
        });
        expect(await getRecord(issued.issuanceId)).not.toHaveProperty('credential');
        const deliveries = await neogma.queryRunner.run(
            'MATCH (n:Credential) RETURN n.credential AS payload'
        );
        expect(deliveries.records).toHaveLength(1);
        const stored = JSON.parse(deliveries.records[0]!.get('payload'));
        expect(await recipient.learnCard.invoke.decryptDagJwe(stored)).toEqual(credential);
        await expectNoPlaintext();
    });

    it('supports shorter embed TTLs and delivers verified-user embeds before wiping', async () => {
        const integration = await createIntegration({
            name: 'Escrow test',
            whitelistedDomains: ['localhost:3000'],
        });
        await associateIntegrationWithProfile(integration.id, 'escrow-issuer');
        await SigningAuthority.createOne({ endpoint: 'https://signer.example' });
        await Profile.relateTo({
            alias: 'usesSigningAuthority',
            where: {
                source: { profileId: 'escrow-issuer' },
                target: { endpoint: 'https://signer.example' },
            },
            properties: { name: 'escrow', did: issuer.learnCard.id.did(), isPrimary: true },
        });
        const contactMethod = await createContactMethod({
            type: 'email',
            value: 'embed@example.test',
            isVerified: true,
        });
        const client = getVerifiedContactMethodClient({ contactMethod });
        const credential = await signedCredential();
        const claimed = await client.inbox.claim({
            credential,
            configuration: { publishableKey: integration.publishableKey!, expiresInDays: 3 },
        });
        const record = (await getRecord(claimed.inboxCredential.id))!;
        expect(claimed.status).toBe('PENDING');
        expect(
            Date.parse(record.expiresAt as string) - Date.parse(record.createdAt as string)
        ).toBeCloseTo(3 * 86400000, -3);
        const defaultClaim = await client.inbox.claim({
            credential,
            configuration: { publishableKey: integration.publishableKey! },
        });
        expect(
            Date.parse(defaultClaim.inboxCredential.expiresAt) -
                Date.parse(defaultClaim.inboxCredential.createdAt)
        ).toBeCloseTo(720 * 86400000, -3);
        await expect(
            client.inbox.claim({
                credential,
                configuration: { publishableKey: integration.publishableKey!, expiresInDays: 0 },
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

        await verifyRecipientContact('existing-embed@example.test');
        const contact = await recipient.clients.fullAuth.contactMethods.getMyContactMethods();
        const verifiedClient = getVerifiedContactMethodClient({
            contactMethod: contact.find(cm => cm.value === 'existing-embed@example.test')!,
        });
        const delivered = await verifiedClient.inbox.claim({
            credential,
            configuration: { publishableKey: integration.publishableKey!, expiresInDays: 2 },
        });
        expect(delivered.status).toBe('ISSUED');
        expect(delivered.inboxCredential).not.toHaveProperty('credential');
        const stored = await neogma.queryRunner.run(
            'MATCH (n:Credential) RETURN n.credential AS payload'
        );
        expect(stored.records).toHaveLength(1);
        expect(
            await recipient.learnCard.invoke.decryptDagJwe(
                JSON.parse(stored.records[0]!.get('payload'))
            )
        ).toEqual(credential);
        await expectNoPlaintext();
    });

    it.each([0, -1, 1.5, 366])(
        'rejects invalid issuance TTL %s before creating escrow',
        async expiresInDays => {
            const response = await post(
                '/api/inbox/issue',
                {
                    credential: await signedCredential(),
                    recipient: { type: 'email', value: 'ttl@example.test' },
                    configuration: { expiresInDays },
                },
                issuer
            );
            expect(response.status).toBe(400);
            const result = await neogma.queryRunner.run(
                'MATCH (n:InboxCredential) RETURN count(n) AS count'
            );
            expect(result.records[0]!.get('count').toNumber()).toBe(0);
        }
    );

    it('migrates multiple batches, wipes terminal payloads, and enforces retention on related nodes', async () => {
        const now = new Date();
        const daysAgo = (days: number): string =>
            new Date(now.getTime() - days * 86400000).toISOString();
        const future = new Date(now.getTime() + 86400000).toISOString();
        const credential = JSON.stringify(await signedCredential());
        // Legacy records are seeded directly, bypassing today's encrypted write boundary.
        const records = Array.from({ length: 101 }, (_, index) => ({
            id: `legacy-${index}`,
            currentStatus: 'PENDING',
            expiresAt: future,
            credential,
        }));
        records.push(
            { id: 'past-due', currentStatus: 'PENDING', expiresAt: daysAgo(1), credential },
            { id: 'issued', currentStatus: 'ISSUED', expiresAt: future, credential },
            { id: 'old-expired', currentStatus: 'EXPIRED', expiresAt: daysAgo(100), credential }
        );
        await neogma.queryRunner.run(
            'UNWIND $records AS record CREATE (n:InboxCredential) SET n = record CREATE (cm:ContactMethod {id: record.id}) CREATE (n)-[:ADDRESSED_TO]->(cm)',
            { records }
        );
        const counts = await runInboxMaintenance();
        expect(counts).toEqual({ migrated: 101, wiped: 1, expired: 1, deleted: 1 });
        expect(await getRecord('old-expired')).toBeUndefined();
        expect(await getRecord('past-due')).toMatchObject({
            currentStatus: 'EXPIRED',
            expiredAt: expect.any(String),
        });
        expect(await getRecord('past-due')).not.toHaveProperty('credential');
        expect(await getRecord('issued')).not.toHaveProperty('credential');
        expect(
            JSON.parse(
                await encryption.decryptInboxCredential(
                    (await getRecord('legacy-100'))!.credential as string
                )
            )
        ).toEqual(JSON.parse(credential));
        expect(await runInboxMaintenance()).toEqual({
            migrated: 0,
            wiped: 0,
            expired: 0,
            deleted: 0,
        });
        await neogma.queryRunner.run(
            'MATCH (n:InboxCredential {id: "past-due"}) SET n.expiredAt = $expiredAt',
            { expiredAt: daysAgo(91) }
        );
        expect((await runInboxMaintenance()).deleted).toBe(1);
    });

    it('cannot restore escrow if a legacy claim finishes while migration encrypts it', async () => {
        const issued = await issue({
            credential: await signedCredential(),
            recipient: { type: 'email', value: 'race@example.test' },
        });
        const plaintext = JSON.stringify(await signedCredential());
        await neogma.queryRunner.run(
            'MATCH (n:InboxCredential {id: $id}) SET n.credential = $plaintext',
            { id: issued.issuanceId, plaintext }
        );
        const encrypt = encryption.encryptInboxCredential;
        vi.spyOn(encryption, 'encryptInboxCredential').mockImplementationOnce(async value => {
            expect(await finalizeAndWipeInboxCredential(issued.issuanceId)).not.toBeNull();
            return encrypt(value);
        });
        expect(await migrateLegacyInboxCredentials()).toMatchObject({ encrypted: 0, scanned: 1 });
        expect(await getRecord(issued.issuanceId)).toMatchObject({ currentStatus: 'ISSUED' });
        expect(await getRecord(issued.issuanceId)).not.toHaveProperty('credential');
    });

    it('allows only one concurrent finalizer and rejects expired records', async () => {
        const issued = await issue({
            credential: await signedCredential(),
            recipient: { type: 'email', value: 'concurrent@example.test' },
        });
        const results = await Promise.all(
            Array.from({ length: 8 }, () => finalizeAndWipeInboxCredential(issued.issuanceId))
        );
        expect(results.filter(Boolean)).toHaveLength(1);
        const expired = await issue({
            credential: await signedCredential(),
            recipient: { type: 'email', value: 'expired@example.test' },
        });
        await updateInboxCredential(expired.issuanceId, { expiresAt: '2020-01-01T00:00:00.000Z' });
        expect(await finalizeAndWipeInboxCredential(expired.issuanceId)).toBeNull();
        await runInboxMaintenance();
        expect(await getInboxCredentialById(expired.issuanceId)).toMatchObject({
            currentStatus: 'EXPIRED',
        });
    });

    it('wires the maintenance worker to an enabled daily schedule', async () => {
        const config = await readFile(new URL('../serverless.yml', import.meta.url), 'utf8');
        expect(config).toMatch(
            /inboxMaintenance:\s+handler: lambda\.inboxMaintenanceHandler[\s\S]*?rate: rate\(1 day\)\s+enabled: true/
        );
        const handler = await readFile(new URL('../lambda.ts', import.meta.url), 'utf8');
        expect(handler).toMatch(/inboxMaintenanceHandler[\s\S]*?await runInboxMaintenance\(\)/);
    });
});
