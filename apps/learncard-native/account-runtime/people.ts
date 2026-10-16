import { z } from 'zod';
import type { ConsumerWallet } from './consumer-apps';
import { httpsURL } from './consumer-apps';

export type PeopleScope = 'connections' | 'requests' | 'sent' | 'blocked' | 'find';
export type PersonStatus = 'connected' | 'incoming' | 'outgoing' | 'blocked' | 'none';
export class PeopleFailure extends Error {
    constructor(readonly kind: 'connection' | 'changed' | 'signIn' | 'unavailable' | 'restricted') {
        super(`people:${kind}`);
    }
}
export const peopleErrorCode = (error: unknown) => {
    if (error instanceof PeopleFailure) return error.message;
    const value =
        error && typeof error === 'object'
            ? (error as { data?: { code?: string }; code?: string })
            : {};
    const code = value.data?.code ?? value.code;
    if (code === 'FORBIDDEN') return 'people:restricted';
    if (code === 'NOT_FOUND' || code === 'CONFLICT') return 'people:changed';
    return 'people:connection';
};
const id = z.string().min(1).max(128);
const listInput = z
    .object({
        scope: z.enum(['connections', 'requests', 'sent', 'blocked', 'find']),
        query: z.string().max(100).default(''),
        cursor: z.string().min(1).max(2048).optional(),
    })
    .strict();
const actionInput = z
    .object({
        id,
        action: z.enum(['connect', 'accept', 'cancel', 'disconnect', 'block', 'unblock']),
    })
    .strict();
type Visible = Awaited<ReturnType<ConsumerWallet['invoke']['getProfile']>>;
type Profile = NonNullable<Visible>;
const statusFor = {
    CONNECTED: 'connected',
    PENDING_REQUEST_SENT: 'outgoing',
    PENDING_REQUEST_RECEIVED: 'incoming',
    NOT_CONNECTED: 'none',
} as const;
const person = (profile: Profile, status: PersonStatus) => ({
    id: profile.profileId,
    name: profile.displayName || profile.profileId,
    bio: profile.bio,
    imageURL: httpsURL(profile.image)?.href,
    status,
});

/** Native People uses the existing relationship graph. No device-address-book access or implicit invitations. */
export const createPeopleCommands = (getWallet: () => ConsumerWallet | undefined) => {
    let acting = false;
    const current = () => {
        const wallet = getWallet();
        if (!wallet) throw new PeopleFailure('signIn');
        return wallet;
    };
    const check = (wallet: ConsumerWallet) => {
        if (getWallet() !== wallet) throw new PeopleFailure('signIn');
    };
    const owner = async (wallet: ConsumerWallet) => {
        const self = await wallet.invoke.getProfile();
        check(wallet);
        if (!self) throw new PeopleFailure('signIn');
        return self;
    };
    const page = async (
        wallet: ConsumerWallet,
        scope: Exclude<PeopleScope, 'find'>,
        cursor?: string
    ) => {
        const reply =
            scope === 'connections'
                ? await wallet.invoke.getPaginatedConnections({ limit: 50, cursor })
                : scope === 'requests'
                  ? await wallet.invoke.getPaginatedConnectionRequests({ limit: 50, cursor })
                  : scope === 'sent'
                    ? await wallet.invoke.getPaginatedPendingConnections({ limit: 50, cursor })
                    : {
                          records: await wallet.invoke.getBlockedProfiles(),
                          hasMore: false,
                          cursor: undefined,
                      };
        check(wallet);
        if (reply.hasMore && (!reply.cursor || reply.cursor === cursor))
            throw new PeopleFailure('connection');
        return reply;
    };
    const all = async (wallet: ConsumerWallet, scope: Exclude<PeopleScope, 'find'>) => {
        const records: Profile[] = [],
            seen = new Set<string>();
        let cursor: string | undefined;
        for (let count = 0; count < 100; count++) {
            const reply = await page(wallet, scope, cursor);
            records.push(...reply.records);
            if (!reply.hasMore) return records;
            if (!reply.cursor || seen.has(reply.cursor)) throw new PeopleFailure('connection');
            seen.add(reply.cursor);
            cursor = reply.cursor;
        }
        throw new PeopleFailure('unavailable'); // Never report a truncated search as no matches.
    };
    const state = async (wallet: ConsumerWallet, target: string) => {
        const self = await owner(wallet);
        if (target === self.profileId) throw new PeopleFailure('changed');
        const [blocked, connections, requests, sent] = await Promise.all(
            ['blocked', 'connections', 'requests', 'sent'].map(scope =>
                all(wallet, scope as Exclude<PeopleScope, 'find'>)
            )
        );
        check(wallet);
        const status: PersonStatus = blocked.some(p => p.profileId === target)
            ? 'blocked'
            : connections.some(p => p.profileId === target)
              ? 'connected'
              : requests.some(p => p.profileId === target)
                ? 'incoming'
                : sent.some(p => p.profileId === target)
                  ? 'outgoing'
                  : 'none';
        const profile =
            [blocked, connections, requests, sent].flat().find(p => p.profileId === target) ??
            (await wallet.invoke.getProfile(target));
        check(wallet);
        if (
            !profile ||
            profile.profileId === self.profileId ||
            (self.did && profile.did === self.did)
        )
            throw new PeopleFailure('changed');
        return person(profile, status);
    };
    return {
        peopleList: async (raw: unknown) => {
            const input = listInput.parse(raw),
                wallet = current(),
                self = await owner(wallet),
                query = input.query.trim();
            const status: PersonStatus =
                input.scope === 'connections'
                    ? 'connected'
                    : input.scope === 'requests'
                      ? 'incoming'
                      : input.scope === 'sent'
                        ? 'outgoing'
                        : 'blocked';
            if (input.scope === 'find') {
                if (input.cursor) throw new PeopleFailure('changed');
                if (query.length < 2) return { items: [], hasMore: false, limited: false };
                const profiles = await wallet.invoke.searchProfiles(query, {
                    limit: 50,
                    includeSelf: false,
                    includeConnectionStatus: true,
                    includeServiceProfiles: false,
                });
                check(wallet);
                return {
                    items: profiles
                        .filter(
                            p => p.profileId !== self.profileId && (!self.did || p.did !== self.did)
                        )
                        .map(p =>
                            person(p, p.connectionStatus ? statusFor[p.connectionStatus] : 'none')
                        ),
                    hasMore: false,
                    limited: profiles.length >= 50,
                };
            }
            if (query && input.cursor) throw new PeopleFailure('changed');
            const reply = query
                ? { records: await all(wallet, input.scope), hasMore: false, cursor: undefined }
                : await page(wallet, input.scope, input.cursor);
            check(wallet);
            const seen = new Set<string>(),
                needle = query.toLocaleLowerCase();
            return {
                items: reply.records
                    .filter(
                        p =>
                            p.profileId !== self.profileId &&
                            (!self.did || p.did !== self.did) &&
                            !seen.has(p.profileId) &&
                            !!seen.add(p.profileId)
                    )
                    .filter(
                        p =>
                            !needle ||
                            `${p.displayName ?? ''} ${p.profileId}`
                                .toLocaleLowerCase()
                                .includes(needle)
                    )
                    .map(p => person(p, status)),
                hasMore: reply.hasMore,
                cursor: reply.hasMore ? reply.cursor : undefined,
                limited: false,
            };
        },
        peopleProfile: async (raw: unknown) => {
            const input = z.object({ id }).strict().parse(raw);
            return state(current(), input.id);
        },
        peopleAction: async (raw: unknown) => {
            const input = actionInput.parse(raw),
                wallet = current();
            if (acting) throw new PeopleFailure('changed');
            acting = true;
            try {
                const before = await state(wallet, input.id);
                const desired: PersonStatus =
                    input.action === 'connect'
                        ? 'outgoing'
                        : input.action === 'accept'
                          ? 'connected'
                          : input.action === 'block'
                            ? 'blocked'
                            : 'none';
                if (
                    before.status === desired ||
                    (input.action === 'connect' && before.status === 'connected')
                )
                    return before;
                const expected = {
                    connect: 'none',
                    accept: 'incoming',
                    cancel: 'outgoing',
                    disconnect: 'connected',
                    unblock: 'blocked',
                    block: before.status,
                }[input.action];
                if (before.status !== expected) throw new PeopleFailure('changed');
                check(wallet);
                try {
                    const success = await (input.action === 'connect'
                        ? wallet.invoke.connectWith(input.id)
                        : input.action === 'accept'
                          ? wallet.invoke.acceptConnectionRequest(input.id)
                          : input.action === 'cancel'
                            ? wallet.invoke.cancelConnectionRequest(input.id)
                            : input.action === 'disconnect'
                              ? wallet.invoke.disconnectWith(input.id)
                              : input.action === 'block'
                                ? wallet.invoke.blockProfile(input.id)
                                : wallet.invoke.unblockProfile(input.id));
                    check(wallet);
                    if (!success) throw new PeopleFailure('changed');
                } catch (error) {
                    check(wallet);
                    const reconciled = await state(wallet, input.id);
                    if (
                        reconciled.status !== desired &&
                        !(input.action === 'connect' && reconciled.status === 'connected')
                    )
                        throw error;
                    return reconciled;
                }
                return await state(wallet, input.id);
            } finally {
                acting = false;
            }
        },
    };
};
