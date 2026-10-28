import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';

mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => createHash('sha256').update(did).digest('hex'),
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
}));
// Load only after the privacy-key module boundary has its isolated fixture.
const { default: cache } = await import('../utils/cache');
const { REDIS_PREFIX } = await import('../constants/env');
const { withOwnerOperation, requestDataErasure, PRIVACY_MAINTENANCE_KEY } =
    await import('./dataErasure');
const {
    readOwnerAuthenticationEntries,
    deleteOwnerAuthenticationEntries,
    ownerAuthenticationIndexKey,
    rebuildOwnerAuthenticationIndex,
    setOwnerAuthenticationRecord,
} = await import('./ownerAuthIndex');
const {
    generateAuthorizationCode,
    consumeAuthorizationCode,
    storeRefreshToken,
    rotateRefreshToken,
    getRefreshToken,
} = await import('../mcp-server/oauth/storage');
const { createOAuthSession, consumeOAuthSession } = await import('../mcp-server/oauth/sessions');
const { createAuthService } = await import('../auth/service');

const alice = 'did:example:alice';
const bob = 'did:example:bob';
let redis: Redis;
let prefix: string;
await cache.redis?.quit();
beforeEach(() => {
    prefix = `owner-auth-index-test:${randomUUID()}:`;
    redis = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6384),
        keyPrefix: prefix,
    });
    cache.redis = redis;
});
afterEach(async () => {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys.map(key => key.slice(prefix.length)));
    await redis.quit();
});

const newCode = (did: string) =>
    generateAuthorizationCode(
        did,
        'client',
        'https://client.example/callback',
        'challenge',
        'S256'
    );

test("reads only the owner's index, revalidates poisoned members, and never scans another owner", async () => {
    const aliceCode = await newCode(alice);
    const bobCode = await newCode(bob);
    const aliceKey = `oauth:authcode:${aliceCode}`;
    const bobKey = `oauth:authcode:${bobCode}`;
    const scan = spyOn(redis, 'scan').mockRejectedValue(new Error('Global scan prohibited'));
    const get = spyOn(redis, 'get').mockRejectedValue(new Error('Global GET prohibited'));
    try {
        expect((await readOwnerAuthenticationEntries(alice)).map(({ key }) => key)).toEqual([
            aliceKey,
        ]);
        await redis.zadd(ownerAuthenticationIndexKey(alice), Date.now() + 60_000, bobKey);
        expect((await readOwnerAuthenticationEntries(alice)).map(({ key }) => key)).toEqual([
            aliceKey,
        ]);
        expect(await redis.zscore(ownerAuthenticationIndexKey(alice), bobKey)).toBeNull();
        expect((await readOwnerAuthenticationEntries(bob)).map(({ key }) => key)).toEqual([bobKey]);
    } finally {
        scan.mockRestore();
        get.mockRestore();
    }
});

test('records and consumes codes and rotates refresh indexes atomically', async () => {
    const code = await newCode(alice);
    const results = await Promise.all([
        consumeAuthorizationCode(code),
        consumeAuthorizationCode(code),
    ]);
    expect(results.filter(({ success }) => success)).toHaveLength(1);
    expect(await readOwnerAuthenticationEntries(alice)).toEqual([]);
    expect(await redis.exists(ownerAuthenticationIndexKey(alice))).toBe(0);

    await storeRefreshToken('old', alice, 'client');
    const previous = { token: 'old', did: alice, clientId: 'client' };
    expect(await rotateRefreshToken(previous, 'next')).toBe(true);
    expect(await rotateRefreshToken(previous, 'loser')).toBe(false);
    expect((await readOwnerAuthenticationEntries(alice)).map(({ key }) => key)).toEqual([
        'oauth:refresh:next',
    ]);
    expect(await getRefreshToken('old')).toEqual({
        success: false,
        error: 'not_found',
    });
});

test('a corrupt index cannot publish an unindexed credential', async () => {
    await redis.set(ownerAuthenticationIndexKey(alice), 'invalid-index');
    await expect(storeRefreshToken('unindexed', alice, 'client')).rejects.toThrow();
    expect(await redis.get('oauth:refresh:unindexed')).toBeNull();
});

test('indexes DID sessions, owner-bound challenges, handoffs, tickets and OAuth sessions', async () => {
    const service = createAuthService({
        store: redis,
        verifyPresentation: async () => ({
            checks: ['proof'],
            errors: [],
            warnings: [],
        }),
    });
    const challenge = await service.createChallenge({
        did: alice,
        audience: 'https://api.example',
        returnTo: 'https://wallet.example',
    });
    expect((await readOwnerAuthenticationEntries(alice)).map(({ key }) => key)).toEqual([
        `${REDIS_PREFIX}:did-auth:challenge:${challenge.challenge}`,
    ]);
    const payload = Buffer.from(JSON.stringify({ iss: alice, vp: { holder: alice } })).toString(
        'base64url'
    );
    const session = await service.authenticate({
        challenge: challenge.challenge,
        expectedBinding: challenge.binding,
        presentation: `header.${payload}.signature`,
    });
    const handoff = await service.createSessionHandoff({
        did: alice,
        sessionId: session.sessionId,
        origin: 'https://wallet.example',
    });
    const ticket = await service.createWebSocketTicket({
        did: alice,
        sessionId: session.sessionId,
        origin: 'https://wallet.example',
    });
    const oauth = await createOAuthSession({
        did: alice,
        clientId: 'client',
        redirectUri: 'https://client.example',
        state: 'state',
        codeChallenge: 'challenge',
        codeChallengeMethod: 'S256',
    });
    expect((await readOwnerAuthenticationEntries(alice)).map(({ key }) => key).sort()).toEqual(
        [
            `${REDIS_PREFIX}:did-auth:session:${session.sessionId}`,
            `${REDIS_PREFIX}:did-auth:session-handoff:${handoff.handoff}`,
            `${REDIS_PREFIX}:did-auth:websocket-ticket:${ticket.ticket}`,
            `oauth:session:${oauth}`,
        ].sort()
    );
    await service.consumeSessionHandoff(handoff.handoff, 'https://wallet.example');
    await service.consumeWebSocketTicket(ticket.ticket, 'https://wallet.example');
    expect((await consumeOAuthSession(oauth)).success).toBe(true);
    await service.deleteSession(session.sessionId);
    expect(await readOwnerAuthenticationEntries(alice)).toEqual([]);
});

test('expired and missing members are pruned and dormant indexes have bounded lifetime', async () => {
    await withOwnerOperation(alice, () =>
        setOwnerAuthenticationRecord(
            redis,
            alice,
            'oauth:refresh:short',
            JSON.stringify({ did: alice }),
            1
        )
    );
    const indexKey = ownerAuthenticationIndexKey(alice);
    expect(await redis.pttl(indexKey)).toBeGreaterThan(0);
    expect(await redis.pttl(indexKey)).toBeLessThanOrEqual(1_000);
    await redis.del('oauth:refresh:short');
    await redis.zadd(
        indexKey,
        1,
        'oauth:refresh:expired',
        Date.now() + 60_000,
        'oauth:refresh:missing'
    );
    expect(await readOwnerAuthenticationEntries(alice)).toEqual([]);
    expect(await redis.exists(indexKey)).toBe(0);
});

test('erasure winning immediately before publication leaves neither credential nor index', async () => {
    const original = redis.eval.bind(redis);
    const intercepted = spyOn(redis, 'eval').mockImplementation(
        async (script, keyCount, ...args) => {
            if (args[3] === 'oauth:refresh:late') await requestDataErasure(alice);
            return Reflect.apply(original, redis, [script, keyCount, ...args]);
        }
    );
    try {
        await expect(storeRefreshToken('late', alice, 'client')).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
        expect(await redis.get('oauth:refresh:late')).toBeNull();
        expect(await redis.exists(ownerAuthenticationIndexKey(alice))).toBe(0);
    } finally {
        intercepted.mockRestore();
    }
});

test("deletion requires the permanent fence and removes only the indexed owner's authentication", async () => {
    await storeRefreshToken('alice', alice, 'client');
    await storeRefreshToken('bob', bob, 'client');
    await expect(deleteOwnerAuthenticationEntries(alice)).rejects.toThrow();
    await requestDataErasure(alice);
    expect(await deleteOwnerAuthenticationEntries(alice)).toBe(1);
    expect(await redis.exists(ownerAuthenticationIndexKey(alice))).toBe(0);
    expect((await getRefreshToken('bob')).success).toBe(true);
    await expect(storeRefreshToken('resurrection', alice, 'client')).rejects.toMatchObject({
        code: 'data_erasure_requested',
    });
});

test('index storage failures propagate instead of exporting an empty owner', async () => {
    await storeRefreshToken('alice', alice, 'client');
    const failed = spyOn(redis, 'eval').mockRejectedValue(new Error('Storage unavailable'));
    try {
        await expect(readOwnerAuthenticationEntries(alice)).rejects.toThrow('Storage unavailable');
    } finally {
        failed.mockRestore();
    }
});

test('offline migration dry-run is read-only, reports counts and requires maintenance to apply', async () => {
    await redis.set('oauth:refresh:legacy-alice', JSON.stringify({ did: alice }), 'EX', 600);
    await redis.set('oauth:refresh:legacy-bob', JSON.stringify({ did: bob }));
    await redis.set(
        `${REDIS_PREFIX}:did-auth:challenge:unowned`,
        JSON.stringify({ audience: 'https://api.example' }),
        'EX',
        60
    );
    await redis.set('oauth:authcode:invalid', 'malformed', 'EX', 60);
    const before = (await redis.keys(`${prefix}*`)).sort();
    const evalCall = spyOn(redis, 'eval').mockRejectedValue(
        new Error('Dry-run mutation prohibited')
    );
    try {
        expect(await rebuildOwnerAuthenticationIndex({ apply: false })).toEqual({
            scanned: 4,
            owned: 2,
            indexed: 0,
            unowned: 1,
            invalid: 1,
        });
        expect((await redis.keys(`${prefix}*`)).sort()).toEqual(before);
        expect(await redis.exists(ownerAuthenticationIndexKey(alice))).toBe(0);
    } finally {
        evalCall.mockRestore();
    }
    await expect(rebuildOwnerAuthenticationIndex({ apply: true })).rejects.toThrow();
    await redis.set(PRIVACY_MAINTENANCE_KEY, 'offline');
    expect(await rebuildOwnerAuthenticationIndex({ apply: true })).toEqual({
        scanned: 4,
        owned: 2,
        indexed: 2,
        unowned: 1,
        invalid: 1,
    });
    expect((await readOwnerAuthenticationEntries(alice)).map(({ key }) => key)).toEqual([
        'oauth:refresh:legacy-alice',
    ]);
    expect((await readOwnerAuthenticationEntries(bob)).map(({ key }) => key)).toEqual([
        'oauth:refresh:legacy-bob',
    ]);
    expect(await redis.ttl(ownerAuthenticationIndexKey(bob))).toBe(-1);
    expect(await redis.get(PRIVACY_MAINTENANCE_KEY)).toBe('offline');
});
