import { z } from 'zod';
import {
    LCNConnectionPromptValidator,
    LCNConnectionPromptMetadataValidator,
    LCNConnectionPromptActionResultValidator,
    type LCNPublicProfile,
} from '@learncard/types';
import type { ConsumerWallet } from './consumer-apps';
import { httpsURL } from './consumer-apps';

export interface NotificationAPI {
    list(cursor?: string): Promise<{ notifications: unknown[]; hasMore: boolean; cursor?: string }>;
    update(
        id: string,
        meta: { read?: boolean; archived?: boolean; actionStatus?: 'COMPLETED' | 'REJECTED' }
    ): Promise<unknown>;
}
export class InboxFailure extends Error {
    constructor(readonly kind: 'connection' | 'changed' | 'unavailable' | 'signIn') {
        super(`inbox:${kind}`);
    }
}
export const inboxErrorCode = (error: unknown) =>
    error instanceof InboxFailure ? error.message : 'inbox:connection';
const profile = z
    .object({
        profileId: z.string(),
        displayName: z.string().optional(),
        image: z.string().optional(),
    })
    .passthrough();
const notification = z
    .object({
        _id: z.string().min(1),
        type: z.string(),
        read: z.boolean().default(false),
        archived: z.boolean().default(false),
        from: z.union([z.string(), profile.partial()]).optional(),
        sent: z.string().optional(),
        message: z.object({ title: z.string().optional(), body: z.string().optional() }).optional(),
        data: z
            .object({
                vcUris: z.array(z.string()).optional(),
                metadata: z
                    .object({ connectionPrompt: z.unknown().optional() })
                    .passthrough()
                    .optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();
type Notice = z.infer<typeof notification>;
type Status = 'PENDING' | 'CONNECTED' | 'SKIPPED' | 'STALE' | 'READ';
export interface InboxItem {
    id: string;
    kind: 'request' | 'connection' | 'prompt' | 'notice';
    type: string;
    name: string;
    title?: string;
    body?: string;
    profileID?: string;
    imageURL?: string;
    date?: string;
    read: boolean;
    status: Status;
    promptID?: string;
    surface?: string;
    dismissible: boolean;
    credentialURIs?: string[];
}
const person = (value: { profileId?: string; displayName?: string; image?: string }) => ({
    profileID: value.profileId,
    name: value.displayName || value.profileId || '',
    imageURL: httpsURL(value.image)?.href,
});
// Match the staging identity, not merely an arbitrary DID's trailing username.
// A same-named profile on another network cannot authorize a local request action.
const senderProfileID = (did: string): string | undefined => {
    const prefix = 'did:web:staging.network.learncard.com:users:';
    if (!did.startsWith(prefix)) return;
    try {
        const id = decodeURIComponent(did.slice(prefix.length));
        return id && !id.includes(':') ? id : undefined;
    } catch {
        return;
    }
};
const pageInput = z.object({ cursor: z.string().min(1).max(2048).optional() }).strict();
const actionInput = z
    .object({
        id: z.string().min(1).max(512),
        action: z.enum(['accept', 'connect', 'skip', 'read', 'dismiss']),
    })
    .strict();

/** Account-owned notifications plus authoritative relationship/prompt state. Reads never create
 * suggestions. Receipt state survives metadata failures without repeating a successful write. */
export const createInboxCommands = (
    getWallet: () => ConsumerWallet | undefined,
    getAPI: (wallet: ConsumerWallet) => Promise<NotificationAPI>
) => {
    let owner: ConsumerWallet | undefined;
    let nextCursor: string | undefined;
    const items = new Map<string, { item: InboxItem; notificationID?: string }>();
    const receipts = new Map<string, Status>();
    const current = () => {
        const value = getWallet();
        if (value !== owner) {
            items.clear();
            receipts.clear();
            nextCursor = undefined;
            owner = value;
        }
        if (!value) throw new InboxFailure('signIn');
        return value;
    };
    const check = (wallet: ConsumerWallet) => {
        if (getWallet() !== wallet) throw new InboxFailure('signIn');
    };
    const profiles = async (wallet: ConsumerWallet, requests: boolean) => {
        const records: LCNPublicProfile[] = [],
            seen = new Set<string>();
        let cursor: string | undefined;
        for (let count = 0; count < 100; count++) {
            const page = requests
                ? await wallet.invoke.getPaginatedConnectionRequests({ limit: 100, cursor })
                : await wallet.invoke.getPaginatedConnections({ limit: 100, cursor });
            check(wallet);
            records.push(...page.records);
            if (!page.hasMore) return records;
            if (!page.cursor || seen.has(page.cursor)) throw new InboxFailure('connection');
            seen.add(page.cursor);
            cursor = page.cursor;
        }
        throw new InboxFailure('unavailable');
    };
    const relationships = async (wallet: ConsumerWallet) => {
        const [requests, connected] = await Promise.all([
            profiles(wallet, true),
            profiles(wallet, false),
        ]);
        return { requests, connected: new Set(connected.map(x => x.profileId)) };
    };
    const record = (item: InboxItem, notificationID?: string) => {
        items.set(item.id, { item, notificationID });
        return item;
    };
    const safeDate = (value?: string) =>
        value && Number.isFinite(Date.parse(value)) ? value : undefined;
    const mapNotice = async (
        notice: Notice,
        wallet: ConsumerWallet,
        relations: Awaited<ReturnType<typeof relationships>>
    ) => {
        const id = typeof notice.from === 'string' ? senderProfileID(notice.from) : undefined;
        const supplied = typeof notice.from === 'object' ? notice.from : { profileId: id };
        const from = relations.requests.find(x => x.profileId === supplied.profileId) ?? supplied;
        const item: InboxItem = {
            id: `notification:${notice._id}`,
            kind: 'notice',
            type: notice.type,
            ...person(from),
            title: notice.message?.title,
            body: notice.message?.body,
            date: safeDate(notice.sent),
            read: notice.read,
            status: notice.read ? 'READ' : 'PENDING',
            dismissible: true,
            credentialURIs: notice.data?.vcUris,
        };
        const parsed = LCNConnectionPromptMetadataValidator.safeParse(
            notice.data?.metadata?.connectionPrompt
        );
        if (parsed.success) {
            const fresh = LCNConnectionPromptActionResultValidator.parse(
                await wallet.invoke.getConnectionPromptStatus(parsed.data.promptId)
            );
            check(wallet);
            if (fresh.promptId !== parsed.data.promptId) throw new InboxFailure('changed');
            Object.assign(item, {
                kind: 'prompt',
                promptID: fresh.promptId,
                profileID: parsed.data.counterpartProfileId,
                status:
                    fresh.status === 'PENDING'
                        ? (receipts.get(`prompt:${fresh.promptId}`) ?? fresh.status)
                        : fresh.status,
            });
        } else if (
            ['CONNECTION_REQUEST', 'CONNECTION_REQUEST_EXPIRED_INVITE'].includes(notice.type)
        ) {
            item.kind = 'request';
            item.status =
                item.profileID && relations.connected.has(item.profileID)
                    ? 'CONNECTED'
                    : relations.requests.some(x => x.profileId === item.profileID)
                      ? 'PENDING'
                      : 'STALE';
            if (receipts.get(`request:${item.profileID}`) === 'CONNECTED')
                item.status = 'CONNECTED';
        } else if (notice.type === 'CONNECTION_ACCEPTED') {
            item.kind = 'connection';
            item.status = 'CONNECTED';
        }
        return item;
    };
    return {
        inboxList: async (raw: unknown) => {
            const input = pageInput.parse(raw),
                wallet = current();
            if (input.cursor && input.cursor !== nextCursor) throw new InboxFailure('changed');
            const api = await getAPI(wallet);
            check(wallet);
            const [page, relations, prompts] = await Promise.all([
                api.list(input.cursor),
                relationships(wallet),
                wallet.invoke.getPendingConnectionPrompts(),
            ]);
            check(wallet);
            if (page.hasMore && (!page.cursor || page.cursor === input.cursor))
                throw new InboxFailure('connection');
            if (!input.cursor) items.clear();
            const seenPrompts = new Set(
                [...items.values()]
                    .filter(x => x.notificationID)
                    .flatMap(x => x.item.promptID ?? [])
            );
            const result: InboxItem[] = [];
            for (const rawNotice of page.notifications) {
                const parsed = notification.safeParse(rawNotice);
                if (!parsed.success || parsed.data.archived) continue;
                const item = await mapNotice(parsed.data, wallet, relations);
                if (item.promptID) {
                    if (seenPrompts.has(item.promptID)) continue;
                    seenPrompts.add(item.promptID);
                }
                result.push(record(item, parsed.data._id));
            }
            // Relationship queries validate actions; they do not recreate an archived
            // notification as an undismissable synthetic request on the next refresh.
            const postClaimPrompts: InboxItem[] = [];
            for (const rawPrompt of prompts) {
                const prompt = LCNConnectionPromptValidator.parse(rawPrompt);
                if (prompt.status !== 'PENDING' || receipts.has(`prompt:${prompt.promptId}`))
                    continue;
                const item: InboxItem = {
                    id: `prompt:${prompt.promptId}`,
                    kind: 'prompt',
                    type: 'CONNECTION_PROMPT',
                    ...person(prompt.counterpart),
                    promptID: prompt.promptId,
                    status: 'PENDING',
                    surface: prompt.surface,
                    date: prompt.triggeredAt,
                    read: false,
                    dismissible: false,
                };
                const linkedNotice = [...items.values()].find(
                    x => x.item.promptID === prompt.promptId && x.notificationID
                );
                record(item, linkedNotice?.notificationID);
                if (prompt.surface === 'POST_CLAIM') postClaimPrompts.push(item);
                if (!seenPrompts.has(prompt.promptId)) {
                    result.push(item);
                    seenPrompts.add(prompt.promptId);
                }
            }
            postClaimPrompts.sort(
                (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id.localeCompare(b.id)
            );
            nextCursor = page.hasMore ? page.cursor : undefined;
            return { items: result, postClaimPrompts, hasMore: page.hasMore, cursor: nextCursor };
        },
        inboxAction: async (raw: unknown) => {
            const { id, action } = actionInput.parse(raw),
                wallet = current(),
                saved = items.get(id);
            if (!saved) throw new InboxFailure('changed');
            const api = await getAPI(wallet);
            check(wallet);
            const { item, notificationID } = saved;
            let status: Status;
            if (action === 'accept' && item.kind === 'request' && item.profileID) {
                const relations = await relationships(wallet);
                check(wallet);
                if (
                    relations.connected.has(item.profileID) ||
                    receipts.get(`request:${item.profileID}`) === 'CONNECTED'
                )
                    status = 'CONNECTED';
                else {
                    if (!relations.requests.some(x => x.profileId === item.profileID))
                        throw new InboxFailure('changed');
                    try {
                        await wallet.invoke.acceptConnectionRequest(item.profileID);
                        check(wallet);
                        status = 'CONNECTED';
                    } catch (error) {
                        check(wallet);
                        // A response/notification can fail after the relationship commits. Reconcile;
                        // do not depend on English error text or send another request.
                        if (
                            !(await profiles(wallet, false)).some(
                                x => x.profileId === item.profileID
                            )
                        )
                            throw error;
                        status = 'CONNECTED';
                    }
                }
                receipts.set(`request:${item.profileID}`, status);
            } else if (
                ['connect', 'skip'].includes(action) &&
                item.kind === 'prompt' &&
                item.promptID
            ) {
                const fresh = LCNConnectionPromptActionResultValidator.parse(
                    await wallet.invoke.getConnectionPromptStatus(item.promptID)
                );
                check(wallet);
                if (fresh.promptId !== item.promptID) throw new InboxFailure('changed');
                status =
                    fresh.status === 'PENDING'
                        ? (receipts.get(`prompt:${item.promptID}`) ?? fresh.status)
                        : fresh.status;
                if (status === 'PENDING') {
                    const reply = LCNConnectionPromptActionResultValidator.parse(
                        action === 'connect'
                            ? await wallet.invoke.connectWithConnectionPrompt(item.promptID)
                            : await wallet.invoke.skipConnectionPrompt(item.promptID)
                    );
                    check(wallet);
                    if (reply.promptId !== item.promptID || reply.status === 'PENDING')
                        throw new InboxFailure('changed');
                    status = reply.status;
                }
                receipts.set(`prompt:${item.promptID}`, status);
            } else if (['read', 'dismiss'].includes(action) && notificationID) {
                await api.update(notificationID, {
                    read: true,
                    ...(action === 'dismiss' ? { archived: true } : {}),
                });
                check(wallet);
                item.read = true;
                if (action === 'dismiss') items.delete(id);
                return {
                    status: item.status,
                    metadataPending: false,
                    dismissed: action === 'dismiss',
                };
            } else throw new InboxFailure('changed');
            item.status = status;
            item.read = true;
            let metadataPending = false;
            if (notificationID) {
                try {
                    await api.update(notificationID, {
                        read: true,
                        actionStatus: status === 'CONNECTED' ? 'COMPLETED' : 'REJECTED',
                    });
                } catch {
                    metadataPending = true;
                }
                check(wallet);
            }
            return { status, metadataPending, dismissed: false };
        },
    };
};
