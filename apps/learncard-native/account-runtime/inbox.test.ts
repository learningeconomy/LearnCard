import { expect, test } from 'bun:test';
import type { ConsumerWallet } from './consumer-apps';
import { createInboxCommands, InboxFailure, type NotificationAPI } from './inbox';

const promptID = '11111111-1111-4111-8111-111111111111';
const fixture = () => {
    const state = {
        requests: [
            { profileId: 'alex', displayName: 'Alex', image: 'https://example.com/alex.png' },
        ],
        connected: [] as { profileId: string }[],
        promptStatus: 'PENDING' as 'PENDING' | 'CONNECTED' | 'SKIPPED' | 'STALE',
        promptPending: false,
        notifications: [
            {
                _id: 'request',
                type: 'CONNECTION_REQUEST',
                from: { profileId: 'alex', displayName: 'Alex' },
                read: false,
            },
        ] as unknown[],
        next: undefined as string | undefined,
        more: false,
        brokenRelationships: false,
        failMeta: false,
        failAcceptAfterCommit: false,
        accepts: 0,
        connects: 0,
        skips: 0,
        updates: [] as { id: string; meta: unknown }[],
    };
    const wallet = {
        invoke: {
            getPaginatedConnectionRequests: async () => ({
                records: state.requests,
                hasMore: state.brokenRelationships,
            }),
            getPaginatedConnections: async () => ({ records: state.connected, hasMore: false }),
            acceptConnectionRequest: async (id: string) => {
                state.accepts++;
                state.connected.push({ profileId: id });
                state.requests = [];
                if (state.failAcceptAfterCommit) throw new Error('transport');
                return true;
            },
            getPendingConnectionPrompts: async () =>
                state.promptPending
                    ? [
                          {
                              promptId: promptID,
                              status: 'PENDING',
                              surface: 'POST_CLAIM',
                              triggerId: 'claim',
                              triggeredAt: '2026-10-14T10:00:00Z',
                              updatedAt: '2026-10-14T10:00:00Z',
                              counterpart: { profileId: 'alex', displayName: 'Alex' },
                          },
                      ]
                    : [],
            getConnectionPromptStatus: async (id: string) => ({
                promptId: id,
                status: state.promptStatus,
            }),
            connectWithConnectionPrompt: async (id: string) => {
                state.connects++;
                state.promptStatus = 'CONNECTED';
                return { promptId: id, status: state.promptStatus };
            },
            skipConnectionPrompt: async (id: string) => {
                state.skips++;
                state.promptStatus = 'SKIPPED';
                return { promptId: id, status: state.promptStatus };
            },
        },
    } as unknown as ConsumerWallet;
    const api: NotificationAPI = {
        list: async () => ({
            notifications: state.notifications,
            hasMore: state.more,
            cursor: state.next,
        }),
        update: async (id, meta) => {
            if (state.failMeta) throw new Error('metadata unavailable');
            state.updates.push({ id, meta });
            return true;
        },
    };
    let active: ConsumerWallet | undefined = wallet;
    const commands = createInboxCommands(
        () => active,
        async () => api
    );
    return {
        state,
        commands,
        wallet,
        api,
        switchAccount: () => {
            active = { ...wallet };
        },
        lock: () => {
            active = undefined;
        },
    };
};
const promptNotice = (id = 'suggestion') => ({
    _id: id,
    type: 'CONNECTION_REQUEST',
    from: { profileId: 'alex', displayName: 'Alex' },
    read: false,
    data: { metadata: { connectionPrompt: { promptId: promptID, counterpartProfileId: 'alex' } } },
});

test('read lists requests, accepted updates and legacy notices without any mutations', async () => {
    const f = fixture();
    f.state.notifications.push(
        {
            _id: 'connected',
            type: 'CONNECTION_ACCEPTED',
            from: { profileId: 'other', displayName: 'Other' },
            read: true,
        },
        {
            _id: 'legacy',
            type: 'ANNOUNCEMENT',
            message: { title: 'Update' },
            data: { metadata: { connectionPrompt: { promptId: 'bad' } } },
        }
    );
    const page = await f.commands.inboxList({});
    expect(page.items.map(x => x.kind)).toEqual(['request', 'connection', 'notice']);
    expect(f.state.accepts + f.state.connects + f.state.skips).toBe(0);
    expect(f.state.updates).toHaveLength(0);
});
test('accept reconciles a committed relationship after transport failure and updates only loaded notification', async () => {
    const f = fixture();
    f.state.failAcceptAfterCommit = true;
    await f.commands.inboxList({});
    const result = await f.commands.inboxAction({ id: 'notification:request', action: 'accept' });
    expect(result.status).toBe('CONNECTED');
    expect(f.state.accepts).toBe(1);
    await f.commands.inboxAction({ id: 'notification:request', action: 'accept' });
    expect(f.state.accepts).toBe(1);
    expect(f.state.updates[0]).toEqual({
        id: 'request',
        meta: { read: true, actionStatus: 'COMPLETED' },
    });
});
test('dismiss archives an incoming notification but never rejects or cancels the relationship', async () => {
    const f = fixture();
    await f.commands.inboxList({});
    expect(
        (await f.commands.inboxAction({ id: 'notification:request', action: 'dismiss' })).dismissed
    ).toBe(true);
    expect(f.state.requests).toHaveLength(1);
    expect(f.state.accepts).toBe(0);
    expect(f.state.updates[0]).toEqual({ id: 'request', meta: { read: true, archived: true } });
});
test('fresh stale request and foreign unloaded identifiers cannot mutate', async () => {
    const f = fixture();
    await f.commands.inboxList({});
    f.state.requests = [];
    for (const id of ['notification:request', 'notification:foreign'])
        await expect(f.commands.inboxAction({ id, action: 'accept' })).rejects.toBeInstanceOf(
            InboxFailure
        );
    expect(f.state.accepts).toBe(0);
});
test('relationship reads do not recreate dismissed notifications as synthetic requests', async () => {
    const f = fixture();
    f.state.notifications = [];
    const page = await f.commands.inboxList({});
    expect(page.items).toHaveLength(0);
    expect(f.state.requests).toHaveLength(1);
    await expect(
        f.commands.inboxAction({ id: 'request:alex', action: 'accept' })
    ).rejects.toBeInstanceOf(InboxFailure);
});
test('duplicate prompt notifications dedupe by server UUID and post-claim queue comes only from pending prompts', async () => {
    const f = fixture();
    f.state.notifications = [promptNotice(), promptNotice('duplicate')];
    f.state.promptPending = true;
    const page = await f.commands.inboxList({});
    expect(page.items.filter(x => x.kind === 'prompt')).toHaveLength(1);
    expect(page.postClaimPrompts).toHaveLength(1);
    expect(f.state.connects).toBe(0);
});
test('terminal server prompt state wins over cached pending notification', async () => {
    const f = fixture();
    f.state.notifications = [promptNotice()];
    await f.commands.inboxList({});
    f.state.promptStatus = 'STALE';
    const result = await f.commands.inboxAction({
        id: 'notification:suggestion',
        action: 'connect',
    });
    expect(result.status).toBe('STALE');
    expect(f.state.connects).toBe(0);
    expect(f.state.updates[0]?.meta).toEqual({ read: true, actionStatus: 'REJECTED' });
});
test('metadata failure cannot undo connected prompt or allow repeat mutation against eventually stale reads', async () => {
    const f = fixture();
    f.state.notifications = [promptNotice()];
    await f.commands.inboxList({});
    f.state.failMeta = true;
    const reply = await f.commands.inboxAction({
        id: 'notification:suggestion',
        action: 'connect',
    });
    expect(reply.metadataPending).toBe(true);
    expect(reply.status).toBe('CONNECTED');
    f.state.promptStatus = 'PENDING';
    const page = await f.commands.inboxList({});
    expect(page.items[0]?.status).toBe('CONNECTED');
    await f.commands.inboxAction({ id: 'notification:suggestion', action: 'connect' });
    expect(f.state.connects).toBe(1);
});
test('explicit skip resolves server-only post-claim prompt and suppresses it on refresh', async () => {
    const f = fixture();
    f.state.promptPending = true;
    await f.commands.inboxList({});
    expect(
        (await f.commands.inboxAction({ id: `prompt:${promptID}`, action: 'skip' })).status
    ).toBe('SKIPPED');
    expect(f.state.skips).toBe(1);
    expect((await f.commands.inboxList({})).postClaimPrompts).toHaveLength(0);
});
test('post-claim decision also resolves the linked notification metadata', async () => {
    const f = fixture();
    f.state.notifications = [promptNotice()];
    f.state.promptPending = true;
    await f.commands.inboxList({});
    await f.commands.inboxAction({ id: `prompt:${promptID}`, action: 'skip' });
    expect(f.state.updates).toEqual([
        { id: 'suggestion', meta: { read: true, actionStatus: 'REJECTED' } },
    ]);
});
test('opaque cursor must come from current account and broken pagination fails without partial success', async () => {
    const f = fixture();
    await expect(f.commands.inboxList({ cursor: 'foreign' })).rejects.toBeInstanceOf(InboxFailure);
    f.state.more = true;
    await expect(f.commands.inboxList({})).rejects.toBeInstanceOf(InboxFailure);
    f.state.more = false;
    f.state.brokenRelationships = true;
    await expect(f.commands.inboxList({})).rejects.toBeInstanceOf(InboxFailure);
});
test('account switch clears capabilities and late fetch after lock cannot expose the previous inbox', async () => {
    const f = fixture();
    await f.commands.inboxList({});
    f.switchAccount();
    await expect(
        f.commands.inboxAction({ id: 'notification:request', action: 'accept' })
    ).rejects.toBeInstanceOf(InboxFailure);
    f.api.list = async () => {
        f.lock();
        return { notifications: f.state.notifications, hasMore: false };
    };
    await expect(f.commands.inboxList({})).rejects.toBeInstanceOf(InboxFailure);
    expect(f.state.accepts).toBe(0);
});
