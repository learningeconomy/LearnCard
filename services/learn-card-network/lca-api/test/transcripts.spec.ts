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
import {
    createTranscriptRequest,
    deleteTranscriptRequestsForAccount,
    findLatestTranscriptRequest,
    getTranscriptRequestsCollection,
} from '../src/models/TranscriptRequest';
import { PREFERENCES_COLLECTION } from '../src/models/Preferences';
import { deleteClassLinkDataForAccount } from '../src/helpers/classlinkDeletion.helpers';
import { getStateStudentId, sealStateStudentId } from '../src/helpers/classlinkPii.helpers';
import type { ClassLinkConfig, ResolvedTranscriptIssuer } from '../src/types/classlink';

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
const linkedDid = 'did:key:caller-linked';
const identityKey = 'classlink:tenant-test:source-1';
/** The pinned service domain (DOMAIN_NAME); requests arrive on a different hostname. */
const serviceDomain = 'api.example';
const requesterDid = `did:web:${serviceDomain}`;
const originalEnvironment = {
    DOMAIN_NAME: environment.DOMAIN_NAME,
    NODE_ENV: environment.NODE_ENV,
    IS_OFFLINE: environment.IS_OFFLINE,
};
const caller = (
    user: { did: string; isChallengeValid: boolean } | undefined = { did, isChallengeValid: true }
) =>
    transcriptsRouter.createCaller({
        user,
        domain: 'alias-host.example',
        tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
    });
let publicKey: Awaited<ReturnType<typeof generateKeyPair>>['publicKey'];
let config: ClassLinkConfig;
let issuerRegistry: Record<string, ResolvedTranscriptIssuer>;
const resolveIssuer = (tenant?: { transcriptIssuer?: string } | null) =>
    issuerRegistry[tenant?.transcriptIssuer ?? 'default'] ?? null;

beforeAll(async () => {
    const pair = await generateKeyPair('EdDSA', { extractable: true });
    publicKey = pair.publicKey;
    mocks.keypair.mockReturnValue(await exportJWK(pair.privateKey));
});
beforeEach(async () => {
    Object.assign(environment, { DOMAIN_NAME: serviceDomain, IS_OFFLINE: false });
    vi.mocked(axios.post).mockReset();
    await cache.node.flushall();
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getTranscriptRequestsCollection().deleteMany({});
    await mongodb.collection(PREFERENCES_COLLECTION).deleteMany({});
    await mongodb.collection('userkeys').insertOne({
        primaryDid: did,
        linkedDids: [linkedDid],
        authProviders: [{ type: 'firebase', id: 'uid-test' }],
    });
    await upsertClassLinkIdentity({
        identityKey,
        firebaseUid: 'uid-test',
        subject: 'subject-test',
        tenantId: 'tenant-test',
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
    issuerRegistry = {
        default: {
            key: 'default',
            endpoint: 'https://issuer.example/transcripts',
            audience: 'issuer-test',
            did: 'did:web:issuer.example',
            profileId: 'issuer-records',
        },
    };
    vi.mocked(getClassLinkConfig).mockImplementation(() => config);
    vi.mocked(getTranscriptIssuerConfig).mockImplementation(resolveIssuer);
    vi.mocked(axios.post).mockResolvedValue({ status: 202, data: { status: 'accepted' } });
});
afterEach(() => {
    Object.assign(environment, originalEnvironment);
    vi.restoreAllMocks();
});

describe('transcript requests', () => {
    it('exposes issuer identity and the stored request jti without a received marker', async () => {
        const result = await caller().request({ consent: true });
        const stored = await getTranscriptRequestsCollection().findOne({});
        const status = await caller().getStatus();
        expect(status.issuerDid).toBe('did:web:issuer.example');
        // The app authenticates the sender by this network profile ID, not by a profile DID.
        expect(status.issuerProfileId).toBe('issuer-records');
        expect(status.latest?.requestId).toBe(stored?.jti);
        expect(result.requestId).toBe(stored?.jti);
        expect(status.latest?.receivedAt).toBeUndefined();
    });
    it('prefers the district issuer override', async () => {
        config.tenants['tenant-test']!.transcriptIssuer = 'district-issuer';
        issuerRegistry['district-issuer'] = {
            key: 'district-issuer',
            endpoint: 'https://district.example/transcripts',
            audience: 'district-audience',
            did: 'did:web:district.example',
        };
        expect((await caller().getStatus()).issuerDid).toBe('did:web:district.example');
    });
    it('leaves issuer identity unset when no default or override is configured', async () => {
        delete issuerRegistry.default!.did;
        expect((await caller().getStatus()).issuerDid).toBeUndefined();
    });
    it('routes each district to its own transcript issuer endpoint, audience, and DID', async () => {
        const didTwo = 'did:key:caller-two';
        const identityKeyTwo = 'classlink:tenant-two:source-2';
        await mongodb.collection('userkeys').insertOne({
            primaryDid: didTwo,
            authProviders: [{ type: 'firebase', id: 'uid-two' }],
        });
        await upsertClassLinkIdentity({
            identityKey: identityKeyTwo,
            firebaseUid: 'uid-two',
            subject: 'subject-two',
            tenantId: 'tenant-two',
            sub: 'upstream-sub-two',
            role: 'student',
            email: 'student2@example.edu',
            state: 'YY',
            sealedStateStudentId: sealStateStudentId(
                'private-student-id-two',
                identityKeyTwo,
                new Date(),
                86400
            ),
            lastAuthTime: new Date(),
        });
        config.tenants['tenant-test']!.transcriptIssuer = 'issuer-a';
        config.tenants['tenant-two'] = {
            displayName: 'Second District',
            state: 'YY',
            stateStudentIdField: 'student_id',
            allowedEmailDomains: ['example.edu'],
            transcriptEnabled: true,
            transcriptIssuer: 'issuer-b',
        };
        issuerRegistry['issuer-a'] = {
            key: 'issuer-a',
            endpoint: 'https://issuer-a.example/transcripts',
            audience: 'audience-a',
            did: 'did:web:issuer-a.example',
        };
        issuerRegistry['issuer-b'] = {
            key: 'issuer-b',
            endpoint: 'https://issuer-b.example/transcripts',
            audience: 'audience-b',
            did: 'did:web:issuer-b.example',
        };
        const callerTwo = caller({ did: didTwo, isChallengeValid: true });

        await caller().request({ consent: true });
        await callerTwo.request({ consent: true });

        const [urlA, bodyA] = vi.mocked(axios.post).mock.calls[0]!;
        const [urlB, bodyB] = vi.mocked(axios.post).mock.calls[1]!;
        expect(urlA).toBe('https://issuer-a.example/transcripts');
        expect(urlB).toBe('https://issuer-b.example/transcripts');
        await expect(
            jwtVerify((bodyA as { assertion: string }).assertion, publicKey, {
                audience: 'audience-a',
                issuer: requesterDid,
            })
        ).resolves.toBeDefined();
        await expect(
            jwtVerify((bodyB as { assertion: string }).assertion, publicKey, {
                audience: 'audience-b',
                issuer: requesterDid,
            })
        ).resolves.toBeDefined();
        expect((await caller().getStatus()).issuerDid).toBe('did:web:issuer-a.example');
        expect((await callerTwo.getStatus()).issuerDid).toBe('did:web:issuer-b.example');
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
                    issuer: requesterDid,
                });
                const { protectedHeader } = await jwtVerify(assertion, publicKey);
                expect(protectedHeader.kid).toBe(`${requesterDid}#owner`);
                expect(payload).toMatchObject({
                    sub: did,
                    state_student_id: 'private-student-id',
                    idp: 'classlink',
                    idp_tenant: 'tenant-test',
                    auth_time: expect.any(Number),
                    consent_at: expect.any(Number),
                    request_id: payload.jti,
                });
                for (const legacy of [
                    'classlink_sourced_id',
                    'classlink_tenant_id',
                    'classlink_auth_time',
                ]) {
                    expect(payload).not.toHaveProperty(legacy);
                    expect(body).not.toHaveProperty(legacy);
                }
                expect(body).toEqual({ assertion, request_id: payload.jti });
                const record = await getTranscriptRequestsCollection().findOne({
                    jti: payload.jti,
                });
                expect(record?.consentAt).toBeInstanceOf(Date);
                expect(record?.status).toBe('requested');
                expect(record?.primaryDid).toBe(did);
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
            expect(Object.keys(result).sort()).toEqual(['requestId', 'requestedAt', 'status']);
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
    it('keeps a request pending when the issuer may have received it before a timeout', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.mocked(axios.post).mockRejectedValue(
            Object.assign(new Error('timeout of 15000ms exceeded private-jwt'), {
                isAxiosError: true,
                code: 'ECONNABORTED',
            })
        );
        const first = await caller().request({ consent: true });
        expect(first.status).toBe('requested');
        expect(warn).toHaveBeenCalledWith('transcripts.request.issuer_outcome_unknown');
        const row = await getTranscriptRequestsCollection().findOne({});
        expect(row).toMatchObject({ status: 'requested', issuerResponseCode: 'no_response' });
        expect(row?.issuerHttpStatus).toBeUndefined();
        // Deduped within ten minutes: no second assertion reaches the issuer or the budget.
        expect(await caller().request({ consent: true })).toEqual(first);
        expect(axios.post).toHaveBeenCalledTimes(1);
        // A transcript echoing this request_id can still be acknowledged.
        expect(await caller().markReceived({ requestId: first.requestId })).toEqual({
            success: true,
        });
    });
    it('fails a request when the issuer was definitely not reached', async () => {
        vi.mocked(axios.post).mockRejectedValue(
            Object.assign(new Error('connect ECONNREFUSED'), {
                isAxiosError: true,
                code: 'ECONNREFUSED',
            })
        );
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'BAD_GATEWAY',
        });
        expect(await getTranscriptRequestsCollection().findOne({})).toMatchObject({
            status: 'failed',
        });
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
    it('fails closed when Redis cannot count the issuer budget', async () => {
        const realEval = cache.node.eval.bind(cache.node);
        let budgetResult: () => Promise<unknown> = async () => {
            throw new Error('private-cache-details');
        };
        // The lock is taken, then the budget count fails (e.g. a failover mid-request).
        vi.spyOn(cache.node, 'eval').mockImplementation((async (...args: unknown[]) =>
            String(args[2]).startsWith('transcripts:budget:')
                ? budgetResult()
                : (realEval as (...a: unknown[]) => Promise<unknown>)(...args)) as never);
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            cause: undefined,
        });
        budgetResult = async () => null;
        await expect(caller().request({ consent: true })).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
        expect(axios.post).not.toHaveBeenCalled();
    });
    it('gives accounts with an empty primaryDid their own lock and budget', async () => {
        const otherIdentityKey = 'classlink:tenant-test:source-2';
        await mongodb
            .collection('userkeys')
            .updateOne({ primaryDid: did }, { $set: { primaryDid: '', linkedDids: [did] } });
        await mongodb.collection('userkeys').insertOne({
            primaryDid: '',
            linkedDids: ['did:key:other-legacy'],
            authProviders: [{ type: 'firebase', id: 'uid-other' }],
        });
        await upsertClassLinkIdentity({
            identityKey: otherIdentityKey,
            firebaseUid: 'uid-other',
            subject: 'subject-other',
            tenantId: 'tenant-test',
            sub: 'other-sub',
            role: 'student',
            state: 'XX',
            sealedStateStudentId: sealStateStudentId(
                'other-student-id',
                otherIdentityKey,
                new Date(),
                86400
            ),
            lastAuthTime: new Date(),
        });
        vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { status: 'none_yet' } });
        for (let i = 0; i < 5; i++) await caller().request({ consent: true });
        // Another legacy account is not blocked by the first one's budget.
        await expect(
            caller({ did: 'did:key:other-legacy', isChallengeValid: true }).request({
                consent: true,
            })
        ).resolves.toMatchObject({ status: 'none_yet' });
        expect(await cache.node.keys('transcripts:budget:*')).toHaveLength(2);
        const stored = await getTranscriptRequestsCollection().find({}).toArray();
        expect(stored.every(record => !('primaryDid' in record))).toBe(true);
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
    describe('pinned requester DID', () => {
        it('refuses to sign without DOMAIN_NAME outside local runs and logs why', async () => {
            Object.assign(environment, { DOMAIN_NAME: undefined, NODE_ENV: 'production' });
            const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            expect(await caller().getStatus()).toMatchObject({
                eligible: false,
                reason: 'not_enabled',
            });
            await expect(caller().request({ consent: true })).rejects.toMatchObject({
                code: 'PRECONDITION_FAILED',
            });
            expect(log).toHaveBeenCalledWith(
                expect.stringContaining('transcripts.request.requester_did_unconfigured')
            );
            expect(axios.post).not.toHaveBeenCalled();
            expect(await getTranscriptRequestsCollection().countDocuments()).toBe(0);
        });
    });

    describe('account ownership', () => {
        it('lets another DID of the same account mark the request received', async () => {
            const { requestId } = await caller().request({ consent: true });
            await expect(
                caller({ did: linkedDid, isChallengeValid: true }).markReceived({ requestId })
            ).resolves.toEqual({ success: true });
            expect(
                (await getTranscriptRequestsCollection().findOne({ jti: requestId }))?.receivedAt
            ).toBeInstanceOf(Date);
        });

        it('returns NOT_FOUND to another account and a DID with no account', async () => {
            const { requestId } = await caller().request({ consent: true });
            await mongodb.collection('userkeys').insertOne({
                primaryDid: 'did:key:other-account',
                authProviders: [{ type: 'firebase', id: 'uid-other' }],
            });
            for (const otherDid of ['did:key:other-account', 'did:key:no-account'])
                await expect(
                    caller({ did: otherDid, isChallengeValid: true }).markReceived({ requestId })
                ).rejects.toMatchObject({ code: 'NOT_FOUND' });
            expect(
                (await getTranscriptRequestsCollection().findOne({ jti: requestId }))?.receivedAt
            ).toBeUndefined();
        });

        it('gives a fresh wallet made for the owner stale uid no access to its transcripts', async () => {
            const { requestId } = await caller().request({ consent: true });
            // Recovery/revoke moved the owner off uid-test; a fresh wallet was made for it.
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { authProviders: [{ type: 'firebase', id: 'uid-rebound' }] } }
                );
            await mongodb.collection('userkeys').insertOne({
                primaryDid: 'did:key:fresh',
                linkedDids: [],
                authProviders: [{ type: 'firebase', id: 'uid-test' }],
            });
            const fresh = caller({ did: 'did:key:fresh', isChallengeValid: true });
            await expect(fresh.getStatus()).rejects.toMatchObject({ code: 'FORBIDDEN' });
            await expect(fresh.request({ consent: true })).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
            await expect(fresh.markReceived({ requestId })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(
                (await getTranscriptRequestsCollection().findOne({ jti: requestId }))?.receivedAt
            ).toBeUndefined();
            // The owner keeps its identity, state ID and history.
            expect((await caller().getStatus()).latest?.requestId).toBe(requestId);
            await expect(caller().markReceived({ requestId })).resolves.toEqual({
                success: true,
            });
        });

        it('gives a stale-uid wallet no access to the owner history after the owner re-links', async () => {
            const { requestId } = await caller().request({ consent: true });
            // Recovery/revoke moved the owner to uid-rebound, and the owner re-linked from
            // School Connect, which moved the identity there too. The request still carries
            // the old uid-test.
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { authProviders: [{ type: 'firebase', id: 'uid-rebound' }] } }
                );
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey },
                { $set: { firebaseUid: 'uid-rebound' } }
            );
            const freshKey = {
                primaryDid: 'did:key:fresh',
                linkedDids: [],
                authProviders: [{ type: 'firebase', id: 'uid-test' }],
            };
            await mongodb.collection('userkeys').insertOne({ ...freshKey });
            const fresh = caller({ did: 'did:key:fresh', isChallengeValid: true });
            await expect(fresh.markReceived({ requestId })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
            await expect(fresh.getStatus()).rejects.toMatchObject({ code: 'FORBIDDEN' });
            expect(await deleteClassLinkDataForAccount(freshKey as never)).toMatchObject({
                transcriptRequests: 0,
            });
            const stored = await getTranscriptRequestsCollection().findOne({ jti: requestId });
            expect(stored).not.toBeNull();
            expect(stored?.receivedAt).toBeUndefined();
            expect((await caller().getStatus()).latest?.requestId).toBe(requestId);
        });

        it('keeps the owner history out of a stale-uid wallet that owns a different school identity', async () => {
            const { requestId } = await caller().request({ consent: true });
            // The owner was rebound/revoked off uid-test; its identity stays pinned to its DID.
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { authProviders: [{ type: 'firebase', id: 'uid-rebound' }] } }
                );
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey },
                { $set: { primaryDid: did } }
            );
            // A stale uid-test session made wallet B and connected another school identity,
            // which School Connect stored under B's uid (uid-test).
            const freshKey = {
                primaryDid: 'did:key:fresh',
                linkedDids: [],
                authProviders: [{ type: 'firebase', id: 'uid-test' }],
            };
            await mongodb.collection('userkeys').insertOne({ ...freshKey });
            await upsertClassLinkIdentity({
                identityKey: 'classlink:tenant-test:other',
                firebaseUid: 'uid-test',
                subject: 'subject-other',
                tenantId: 'tenant-test',
                sub: 'other-sub',
                role: 'student',
                email: 'other@example.edu',
                state: 'XX',
                sealedStateStudentId: sealStateStudentId(
                    'other-student-id',
                    'classlink:tenant-test:other',
                    new Date(),
                    86400
                ),
                lastAuthTime: new Date(),
                primaryDid: 'did:key:fresh',
            });
            const fresh = caller({ did: 'did:key:fresh', isChallengeValid: true });
            // B resolves its own identity, but never sees or touches the owner's history.
            expect((await fresh.getStatus()).latest?.requestId).not.toBe(requestId);
            await expect(fresh.markReceived({ requestId })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
            await fresh.request({ consent: true });
            expect(await getTranscriptRequestsCollection().countDocuments({ jti: requestId })).toBe(
                1
            );
            await fresh.request({ consent: true }).catch(() => undefined);
            const before = await getTranscriptRequestsCollection().countDocuments({
                primaryDid: did,
            });
            await deleteClassLinkDataForAccount(freshKey as never);
            expect(
                await getTranscriptRequestsCollection().countDocuments({ primaryDid: did })
            ).toBe(before);
            const stored = await getTranscriptRequestsCollection().findOne({ jti: requestId });
            expect(stored?.receivedAt).toBeUndefined();
            expect((await caller().getStatus()).latest?.requestId).toBe(requestId);
        });

        it('never lets a uid prove ownership of a request that records another DID (no check-then-use window)', async () => {
            // Simulates the race: the owner's request lands after a stale-uid wallet decided
            // its owned uids. The final query itself must not match it by uid.
            await createTranscriptRequest({
                jti: 'owner-new',
                firebaseUid: 'uid-shared',
                did,
                primaryDid: did,
                identityKey,
                state: 'XX',
                consentAt: new Date(),
                status: 'requested',
            });
            const staleOwner = { firebaseUids: ['uid-shared'], dids: ['did:key:stale'] };
            expect(await findLatestTranscriptRequest(staleOwner, 'XX')).toBeNull();
            expect(await deleteTranscriptRequestsForAccount(staleOwner)).toBe(0);
            // A legacy request with no recorded primaryDid is still owned through its uid.
            await createTranscriptRequest({
                jti: 'legacy-shared',
                firebaseUid: 'uid-shared',
                did: 'did:key:old-session',
                identityKey,
                state: 'XX',
                consentAt: new Date(),
                status: 'requested',
            });
            expect(await findLatestTranscriptRequest(staleOwner, 'XX')).toMatchObject({
                jti: 'legacy-shared',
            });
        });

        it('keeps transcript history after the ClassLink identity is rebound to a new uid', async () => {
            const { requestId } = await caller().request({ consent: true });
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { authProviders: [{ type: 'firebase', id: 'uid-rebound' }] } }
                );
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey },
                { $set: { firebaseUid: 'uid-rebound' } }
            );
            expect((await caller().getStatus()).latest?.requestId).toBe(requestId);
            expect(await caller().request({ consent: true })).toMatchObject({ requestId });
            expect(axios.post).toHaveBeenCalledTimes(1);
            await expect(caller().markReceived({ requestId })).resolves.toEqual({
                success: true,
            });
        });

        it('still finds legacy requests stored without primaryDid by Firebase uid', async () => {
            await createTranscriptRequest({
                jti: 'legacy-jti',
                firebaseUid: 'uid-test',
                did: 'did:key:old-session',
                identityKey,
                state: 'XX',
                consentAt: new Date(),
                status: 'requested',
            });
            expect((await caller().getStatus()).latest?.requestId).toBe('legacy-jti');
        });

        it('shares one issuer budget across every DID of the account', async () => {
            vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { status: 'none_yet' } });
            for (let i = 0; i < 5; i++) {
                const user = { did: i % 2 ? linkedDid : did, isChallengeValid: true };
                expect((await caller(user).request({ consent: true })).status).toBe('none_yet');
            }
            await expect(
                caller({ did: linkedDid, isChallengeValid: true }).request({ consent: true })
            ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
            expect(axios.post).toHaveBeenCalledTimes(5);
        });

        it("deletes an account's requests by Firebase uid, primaryDid or DID only", async () => {
            const base = {
                identityKey,
                state: 'XX',
                consentAt: new Date(),
                status: 'failed' as const,
            };
            await createTranscriptRequest({ ...base, jti: 'a', firebaseUid: 'uid-old', did });
            await createTranscriptRequest({
                ...base,
                jti: 'b',
                firebaseUid: 'uid-new',
                did: linkedDid,
                primaryDid: did,
            });
            await createTranscriptRequest({
                ...base,
                jti: 'c',
                firebaseUid: 'uid-z',
                did: 'did:key:z',
            });
            expect(await deleteTranscriptRequestsForAccount({ firebaseUids: [], dids: [] })).toBe(
                0
            );
            expect(
                await deleteTranscriptRequestsForAccount({ firebaseUids: ['uid-new'], dids: [did] })
            ).toBe(2);
            expect(await findLatestTranscriptRequest('uid-z', 'XX')).toMatchObject({ jti: 'c' });
        });
    });

    it('enforces minor preferences for a student even when preferences already exist', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { isMinorHint: true } }
        );
        await mongodb.collection(PREFERENCES_COLLECTION).insertOne({
            _id: 'prefs-1' as never,
            did,
            theme: 'colorful',
            aiEnabled: true,
            analyticsEnabled: true,
        });
        await caller().getStatus();
        expect(await mongodb.collection(PREFERENCES_COLLECTION).findOne({ did })).toMatchObject({
            aiEnabled: false,
            analyticsEnabled: false,
            bugReportsEnabled: false,
            isMinor: true,
        });
    });
});
