import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, jwtVerify } from 'jose';
import axios from 'axios';
import mongodb from '@mongo';
import cache from '@cache';
import { environment } from '@environment';
import { transcriptsRouter } from '../src/routes/transcripts';
import { getClassLinkConfig, getTranscriptIssuerConfig } from '../src/helpers/classlink.config';
import {
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
    updateClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
import { getTranscriptRequestsCollection } from '../src/models/TranscriptRequest';
import { getStateStudentId, sealStateStudentId } from '../src/helpers/classlinkPii.helpers';
import type { ClassLinkConfig } from '../src/types/classlink';

const mocks = vi.hoisted(() => ({ keypair: vi.fn() }));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('@helpers/learnCard.helpers', () => ({
    getLearnCard: async () => ({ id: { keypair: mocks.keypair } }),
}));
vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(),
    getTranscriptIssuerConfig: vi.fn(),
}));
vi.mock('@cache', async () => {
    const { default: Redis } = await import('ioredis-mock');
    return { default: { node: new Redis() } };
});

const did = 'did:key:caller';
const identityKey = 'classlink:tenant-test:source-1';
const caller = (
    user: { did: string; isChallengeValid: boolean } | undefined = { did, isChallengeValid: true }
) =>
    transcriptsRouter.createCaller({
        user,
        domain: 'api.example',
        tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
    });
let publicKey: Awaited<ReturnType<typeof generateKeyPair>>['publicKey'];
let config: ClassLinkConfig;

beforeAll(async () => {
    const pair = await generateKeyPair('EdDSA', { extractable: true });
    publicKey = pair.publicKey;
    mocks.keypair.mockReturnValue(await exportJWK(pair.privateKey));
});
beforeEach(async () => {
    environment.TRANSCRIPT_ISSUER_DID = 'did:web:issuer.example';
    vi.mocked(axios.post).mockReset();
    await cache.node.flushall();
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getTranscriptRequestsCollection().deleteMany({});
    await mongodb
        .collection('userkeys')
        .insertOne({ primaryDid: did, authProviders: [{ type: 'firebase', id: 'uid-test' }] });
    await upsertClassLinkIdentity({
        identityKey,
        firebaseUid: 'uid-test',
        subject: 'subject-test',
        tenantId: 'tenant-test',
        sourcedId: 'source-1',
        sub: 'upstream-sub',
        role: 'student',
        email: 'student@example.edu',
        state: 'XX',
        sealedStateStudentId: sealStateStudentId(
            'private-student-id',
            identityKey,
            new Date(),
            86400
        ),
        lastAuthTime: new Date(),
    });
    config = {
        clientId: 'test',
        clientSecret: 'test',
        discoveryUrl: 'https://example.edu/discovery',
        redirectUris: [],
        maxAuthAgeSeconds: 86400,
        tenants: {
            'tenant-test': {
                displayName: 'Example District',
                state: 'XX',
                stateStudentIdField: 'student_id',
                allowedEmailDomains: ['example.edu'],
                transcriptEnabled: true,
            },
        },
    };
    vi.mocked(getClassLinkConfig).mockImplementation(() => config);
    vi.mocked(getTranscriptIssuerConfig).mockReturnValue({
        endpoint: 'https://issuer.example/transcripts',
        audience: 'issuer-test',
    });
    vi.mocked(axios.post).mockResolvedValue({ status: 202, data: { status: 'accepted' } });
});
afterEach(() => vi.restoreAllMocks());

describe('transcript requests', () => {
    it('exposes issuer identity and the stored request jti without a received marker', async () => {
        await caller().request({ consent: true });
        const stored = await getTranscriptRequestsCollection().findOne({});
        const status = await caller().getStatus();
        expect(status.issuerDid).toBe('did:web:issuer.example');
        expect(status.latest?.requestId).toBe(stored?.jti);
        expect(status.latest?.receivedAt).toBeUndefined();
    });
    it('prefers the district issuer override', async () => {
        config.tenants['tenant-test']!.transcriptIssuerDid = 'did:web:district.example';
        expect((await caller().getStatus()).issuerDid).toBe('did:web:district.example');
    });
    it('leaves issuer identity unset when no default or override is configured', async () => {
        environment.TRANSCRIPT_ISSUER_DID = undefined;
        expect((await caller().getStatus()).issuerDid).toBeUndefined();
    });
    it('marks an owned request received with an ISO timestamp', async () => {
        await caller().request({ consent: true });
        const { latest } = await caller().getStatus();
        expect(await caller().markReceived({ requestId: latest!.requestId })).toEqual({
            success: true,
        });
        const receivedAt = (await caller().getStatus()).latest?.receivedAt;
        expect(new Date(receivedAt!).toISOString()).toBe(receivedAt);
        expect((await getTranscriptRequestsCollection().findOne({}))?.receivedAt).toBeInstanceOf(
            Date
        );
    });
    it('preserves the first received timestamp across sequential and concurrent retries', async () => {
        await caller().request({ consent: true });
        const { latest } = await caller().getStatus();
        const input = { requestId: latest!.requestId };
        await Promise.all(Array.from({ length: 8 }, () => caller().markReceived(input)));
        const first = (await caller().getStatus()).latest?.receivedAt;
        await caller().markReceived(input);
        expect((await caller().getStatus()).latest?.receivedAt).toBe(first);
    });
    it('hides other owners requests and leaves their marker absent', async () => {
        await caller().request({ consent: true });
        const { latest } = await caller().getStatus();
        await expect(
            caller({ did: 'did:key:other', isChallengeValid: true }).markReceived({
                requestId: latest!.requestId,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect((await getTranscriptRequestsCollection().findOne({}))?.receivedAt).toBeUndefined();
    });
    it('returns NOT_FOUND for an unknown request', async () => {
        await expect(caller().markReceived({ requestId: 'unknown' })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });
    it.each(['none_yet', 'failed'] as const)('does not mark %s requests received', async status => {
        await caller().request({ consent: true });
        const { latest } = await caller().getStatus();
        await getTranscriptRequestsCollection().updateOne(
            { jti: latest!.requestId },
            { $set: { status } }
        );
        await expect(caller().markReceived({ requestId: latest!.requestId })).rejects.toMatchObject(
            { code: 'NOT_FOUND' }
        );
        expect((await getTranscriptRequestsCollection().findOne({}))?.receivedAt).toBeUndefined();
    });
    it.each([200, 202])(
        'signs a verifiable assertion and persists consent before HTTP %s',
        async httpStatus => {
            vi.mocked(axios.post).mockImplementationOnce(async (_url, body, options) => {
                const { assertion } = body as { assertion: string };
                const { payload } = await jwtVerify(assertion, publicKey, {
                    audience: 'issuer-test',
                    issuer: 'did:web:api.example',
                });
                expect(payload).toMatchObject({
                    sub: did,
                    state_student_id: 'private-student-id',
                    classlink_tenant_id: 'tenant-test',
                });
                const record = await getTranscriptRequestsCollection().findOne({
                    jti: payload.jti,
                });
                expect(record?.consentAt).toBeInstanceOf(Date);
                expect(record?.status).toBe('requested');
                expect(options).toMatchObject({
                    headers: { Authorization: `Bearer ${assertion}` },
                    timeout: 15000,
                    maxRedirects: 0,
                });
                return { status: httpStatus, data: { status: 'accepted' } };
            });
            const result = await caller().request({ consent: true });
            const stored = await getClassLinkIdentitiesCollection().findOne({ identityKey });
            expect(getStateStudentId(stored!)).toBe('private-student-id');
            expect(Object.keys(result).sort()).toEqual(['requestedAt', 'status']);
            expect(result.status).toBe('requested');
            expect(await caller().getStatus()).toMatchObject({
                eligible: true,
                stateDisplayName: 'Example District',
                latest: result,
            });
        }
    );
    it('maps none_yet and enforces five attempts per hour atomically', async () => {
        vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { status: 'none_yet' } });
        for (let i = 0; i < 5; i++)
            expect((await caller().request({ consent: true })).status).toBe('none_yet');
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        expect(axios.post).toHaveBeenCalledTimes(5);
        const keys = await cache.node.keys('transcripts:budget:*');
        expect(await cache.node.ttl(keys[0]!)).toBeGreaterThan(3500);
    });
    it.each([500, 302, 202, 200])(
        'fails closed for unexpected HTTP/body %s and retains consent',
        async status => {
            vi.mocked(axios.post).mockResolvedValue({ status, data: { status: 'unexpected' } });
            await expect(caller().request({ consent: true })).rejects.toMatchObject({
                code: 'BAD_GATEWAY',
                message: "We couldn't reach your school records right now. Please try again later.",
            });
            const record = await getTranscriptRequestsCollection().findOne({});
            expect(record).toMatchObject({
                status: 'failed',
                issuerHttpStatus: status,
                consentAt: expect.any(Date),
            });
            expect(axios.post).toHaveBeenCalledTimes(1);
        }
    );
    it('sanitizes network failures without retrying or exposing assertion errors', async () => {
        vi.mocked(axios.post).mockRejectedValue(new Error('private-student-id private-jwt'));
        const error = await caller()
            .request({ consent: true })
            .catch((error: unknown) => error);
        expect(String(error)).not.toMatch(/private-student-id|private-jwt/);
        expect(error).toMatchObject({ code: 'BAD_GATEWAY', cause: undefined });
        expect(await getTranscriptRequestsCollection().findOne({})).toMatchObject({
            status: 'failed',
            consentAt: expect.any(Date),
        });
        expect(axios.post).toHaveBeenCalledTimes(1);
    });
    it('deduplicates sequential requests but permits a request after ten minutes', async () => {
        const first = await caller().request({ consent: true });
        expect(await caller().request({ consent: true })).toEqual(first);
        expect(axios.post).toHaveBeenCalledTimes(1);
        await getTranscriptRequestsCollection().updateMany(
            {},
            { $set: { requestedAt: new Date(Date.now() - 601000) } }
        );
        await caller().request({ consent: true });
        expect(axios.post).toHaveBeenCalledTimes(2);
    });
    it('deduplicates simultaneous calls with an atomic expiring lock', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: 8 }, () => caller().request({ consent: true }))
        );
        expect(results.some(result => result.status === 'fulfilled')).toBe(true);
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(await getTranscriptRequestsCollection().countDocuments()).toBe(1);
        expect(await cache.node.keys('transcripts:lock:*')).toEqual([]);
    });
    it('fails closed when Redis cannot enforce the lock', async () => {
        vi.spyOn(cache.node, 'set').mockRejectedValueOnce(new Error('private-cache-details'));
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            cause: undefined,
        });
        expect(axios.post).not.toHaveBeenCalled();
    });
    it('requires a bound account and ClassLink identity', async () => {
        await expect(
            caller({ did: 'did:key:other', isChallengeValid: true }).getStatus()
        ).rejects.toMatchObject({
            code: 'NOT_FOUND',
            message: 'Finish setting up your account first.',
        });
        await getClassLinkIdentitiesCollection().deleteMany({});
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Sign in with ClassLink to request your transcript.',
        });
    });
    it('reports not_enabled for a district without an override', async () => {
        config.tenants = {};
        expect(await caller().getStatus()).toMatchObject({
            eligible: false,
            reason: 'not_enabled',
        });
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        expect(axios.post).not.toHaveBeenCalled();
    });
    it.each(['reauth_required', 'no_state_id', 'not_enabled'] as const)(
        'reports and blocks %s',
        async reason => {
            if (reason === 'reauth_required')
                await updateClassLinkIdentity(identityKey, {
                    lastAuthTime: new Date(Date.now() - 86401000),
                });
            if (reason === 'no_state_id')
                await getClassLinkIdentitiesCollection().updateOne(
                    { identityKey },
                    { $unset: { stateStudentIdEnc: '', stateStudentIdExpiresAt: '' } }
                );
            if (reason === 'not_enabled') config.tenants['tenant-test']!.transcriptEnabled = false;
            expect(await caller().getStatus()).toMatchObject({ eligible: false, reason });
            await expect(caller().request({ consent: true })).rejects.toMatchObject({
                code: 'PRECONDITION_FAILED',
            });
            expect(axios.post).not.toHaveBeenCalled();
        }
    );
    it('treats an expired state ID as missing and removes it', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { stateStudentIdExpiresAt: new Date(Date.now() - 1000) } }
        );
        expect(await caller().getStatus()).toMatchObject({
            eligible: false,
            reason: 'no_state_id',
        });
        const stored = await getClassLinkIdentitiesCollection().findOne({ identityKey });
        expect(stored).not.toHaveProperty('stateStudentIdEnc');
        expect(stored).not.toHaveProperty('stateStudentIdExpiresAt');
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        expect(axios.post).not.toHaveBeenCalled();
    });
    it('never reads legacy plaintext state IDs and removes them', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            {
                $set: { stateStudentId: 'legacy-plaintext' },
                $unset: { stateStudentIdEnc: '', stateStudentIdExpiresAt: '' },
            }
        );
        expect(await caller().getStatus()).toMatchObject({ reason: 'no_state_id' });
        expect(
            await getClassLinkIdentitiesCollection().findOne({ identityKey })
        ).not.toHaveProperty('stateStudentId');
    });
    it.each([
        { consent: false },
        { consent: true, did },
        { consent: true, stateStudentId: 'injected' },
        { consent: true, profileId: 'injected' },
    ])('rejects invalid input %j', async input => {
        await expect(caller().request(input as { consent: true })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect(axios.post).not.toHaveBeenCalled();
    });
    it('requires DID authentication and a fresh challenge for all procedures', async () => {
        for (const user of [undefined, { did, isChallengeValid: false }]) {
            const client = transcriptsRouter.createCaller({
                user,
                domain: 'api.example',
                tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
            });
            await expect(client.getStatus()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(client.markReceived({ requestId: 'unknown' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(client.request({ consent: true })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        }
    });
});
