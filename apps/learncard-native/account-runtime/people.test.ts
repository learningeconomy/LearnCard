import { expect, test } from 'bun:test';
import { createPeopleCommands, peopleErrorCode } from './people';
import type { ConsumerWallet } from './consumer-apps';

const profile = (profileId: string, displayName = profileId) => ({
    profileId,
    displayName,
    did: `did:web:staging.network.learncard.com:users:${profileId}`,
});
const setup = () => {
    const records = {
        connections: [profile('jordan')],
        requests: [profile('alex')],
        sent: [profile('sam')],
        blocked: [profile('blocked')],
    };
    const known = [profile('me'), profile('robin'), ...Object.values(records).flat()];
    let calls = 0,
        loseReply = false;
    const page = (scope: keyof typeof records, options: { cursor?: string; limit?: number }) => {
        const offset = options.cursor ? Number(options.cursor) : 0,
            limit = options.limit ?? 50;
        return {
            records: records[scope].slice(offset, offset + limit),
            hasMore: records[scope].length > offset + limit,
            cursor: String(offset + limit),
        };
    };
    const remove = (id: string) => {
        for (const key of Object.keys(records) as (keyof typeof records)[])
            records[key] = records[key].filter(p => p.profileId !== id);
    };
    const move = async (id: string, scope?: keyof typeof records) => {
        calls++;
        const person = known.find(p => p.profileId === id) ?? profile(id);
        remove(id);
        if (scope) records[scope].push(person);
        if (loseReply) {
            loseReply = false;
            throw Error('lost reply');
        }
        return true;
    };
    const wallet = {
        invoke: {
            getProfile: async (id?: string) => known.find(p => p.profileId === (id ?? 'me')),
            getPaginatedConnections: async (options: object) => page('connections', options),
            getPaginatedConnectionRequests: async (options: object) => page('requests', options),
            getPaginatedPendingConnections: async (options: object) => page('sent', options),
            getBlockedProfiles: async () => records.blocked,
            searchProfiles: async () =>
                known
                    .filter(p => p.profileId !== 'blocked')
                    .map(p => ({
                        ...p,
                        connectionStatus: records.connections.some(x => x.profileId === p.profileId)
                            ? 'CONNECTED'
                            : records.requests.some(x => x.profileId === p.profileId)
                              ? 'PENDING_REQUEST_RECEIVED'
                              : records.sent.some(x => x.profileId === p.profileId)
                                ? 'PENDING_REQUEST_SENT'
                                : 'NOT_CONNECTED',
                    })),
            connectWith: (id: string) => move(id, 'sent'),
            acceptConnectionRequest: (id: string) => move(id, 'connections'),
            cancelConnectionRequest: (id: string) => move(id),
            disconnectWith: (id: string) => move(id),
            blockProfile: (id: string) => move(id, 'blocked'),
            unblockProfile: (id: string) => move(id),
        },
    } as unknown as ConsumerWallet;
    let current: ConsumerWallet | undefined = wallet;
    return {
        wallet,
        records,
        commands: createPeopleCommands(() => current),
        swap: () => {
            current = undefined;
        },
        loseReply: () => {
            loseReply = true;
        },
        calls: () => calls,
    };
};

test('People search scans the complete paginated connection graph and excludes self', async () => {
    const f = setup();
    f.records.connections = Array.from({ length: 123 }, (_, i) =>
        profile(`person-${i}`, i === 122 ? 'Last Page Person' : `Person ${i}`)
    );
    f.records.connections.unshift(profile('me'));
    const first = await f.commands.peopleList({ scope: 'connections' });
    expect(first.items).toHaveLength(49);
    expect(first.hasMore).toBe(true);
    const found = await f.commands.peopleList({ scope: 'connections', query: 'last page' });
    expect(found.items.map(p => p.id)).toEqual(['person-122']);
    expect(found.hasMore).toBe(false);
    expect(f.calls()).toBe(0);
});
test('People find uses server search states and no own-profile result or one-character request', async () => {
    const f = setup();
    const reply = await f.commands.peopleList({ scope: 'find', query: 'al' });
    expect(reply.items.find(p => p.id === 'me')).toBeUndefined();
    expect(reply.items.find(p => p.id === 'alex')?.status).toBe('incoming');
    expect(reply.items.find(p => p.id === 'sam')?.status).toBe('outgoing');
    expect((await f.commands.peopleList({ scope: 'find', query: 'a' })).items).toEqual([]);
});
test('People rejects stalled or cycling cursors instead of showing false complete search', async () => {
    const f = setup();
    f.wallet.invoke.getPaginatedConnections = async () => ({
        records: [],
        hasMore: true,
        cursor: 'same',
    });
    await expect(f.commands.peopleList({ scope: 'connections', query: 'someone' })).rejects.toThrow(
        'people:connection'
    );
});
test('People refuses self actions, changed relationship actions and invalid payloads', async () => {
    const f = setup();
    await expect(f.commands.peopleAction({ id: 'me', action: 'connect' })).rejects.toThrow(
        'people:changed'
    );
    await expect(f.commands.peopleAction({ id: 'alex', action: 'connect' })).rejects.toThrow(
        'people:changed'
    );
    await expect(f.commands.peopleAction({ id: 'sam', action: 'accept' })).rejects.toThrow(
        'people:changed'
    );
    await expect(
        f.commands.peopleList({ scope: 'connections', query: 'x'.repeat(101) })
    ).rejects.toThrow();
    expect(f.calls()).toBe(0);
});
test('People reconciles a committed request after a lost reply and does not send it twice', async () => {
    const f = setup();
    f.loseReply();
    expect((await f.commands.peopleAction({ id: 'robin', action: 'connect' })).status).toBe(
        'outgoing'
    );
    expect((await f.commands.peopleAction({ id: 'robin', action: 'connect' })).status).toBe(
        'outgoing'
    );
    expect(f.calls()).toBe(1);
});
test('People accept, cancel, disconnect, block and unblock use authoritative relationship state', async () => {
    const f = setup();
    expect((await f.commands.peopleAction({ id: 'alex', action: 'accept' })).status).toBe(
        'connected'
    );
    expect((await f.commands.peopleList({ scope: 'requests' })).items).toEqual([]);
    expect((await f.commands.peopleAction({ id: 'sam', action: 'cancel' })).status).toBe('none');
    expect((await f.commands.peopleAction({ id: 'jordan', action: 'disconnect' })).status).toBe(
        'none'
    );
    expect((await f.commands.peopleAction({ id: 'alex', action: 'block' })).status).toBe('blocked');
    expect((await f.commands.peopleAction({ id: 'alex', action: 'unblock' })).status).toBe('none');
    expect(f.calls()).toBe(5);
});
test('People late reads after account replacement return no former-account data', async () => {
    const f = setup();
    f.wallet.invoke.getPaginatedConnections = async () => {
        f.swap();
        return { records: [profile('private-old')], hasMore: false };
    };
    await expect(f.commands.peopleList({ scope: 'connections' })).rejects.toThrow('people:signIn');
});
test('People serializes mutations and reconciles connection state without an implicit accept', async () => {
    const f = setup();
    let release: (() => void) | undefined;
    f.wallet.invoke.connectWith = async () => {
        await new Promise<void>(resolve => {
            release = resolve;
        });
        f.records.sent.push(profile('robin'));
        return true;
    };
    const first = f.commands.peopleAction({ id: 'robin', action: 'connect' });
    for (let i = 0; i < 20 && !release; i++) await new Promise(resolve => setTimeout(resolve, 0));
    expect(release).toBeDefined();
    await expect(f.commands.peopleAction({ id: 'alex', action: 'accept' })).rejects.toThrow(
        'people:changed'
    );
    release!();
    expect((await first).status).toBe('outgoing');
    expect(f.records.requests.map(p => p.profileId)).toEqual(['alex']);
});

test('People maps profile restrictions and stale states without exposing server errors', () => {
    expect(peopleErrorCode({ data: { code: 'FORBIDDEN' }, message: 'private server detail' })).toBe(
        'people:restricted'
    );
    expect(peopleErrorCode({ data: { code: 'NOT_FOUND' } })).toBe('people:changed');
    expect(peopleErrorCode(Error('raw network internals'))).toBe('people:connection');
});
