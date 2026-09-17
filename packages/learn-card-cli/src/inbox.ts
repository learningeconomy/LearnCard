import type { Command } from 'commander';
import type {
    InboxCredentialQuery,
    InboxCredentialType,
    PaginationOptionsType,
} from '@learncard/types';

import {
    connect,
    connectAsManaged,
    loadProject,
    type NetworkCard,
    type ProjectOptions,
} from './project';
import { out } from './out';

export interface InboxRecipient {
    type?: string;
    value?: string;
}

/**
 * The network's current inbox listing carries no recipient contact info per record
 * (only the send-time response does). `recipient` is modeled as optional so this type
 * stays compatible with today's API while allowing `--recipient-type` to work the day
 * the server starts returning it.
 */
export type SentInboxRecord = InboxCredentialType & { recipient?: InboxRecipient };

export interface InboxJsonRecord {
    id: string;
    status: string;
    recipient?: { type?: string; value?: string };
    createdAt: string;
    expiresAt: string;
    credentialName?: string;
    isSigned: boolean;
}

const STATUS_VALUES = ['PENDING', 'ISSUED', 'EXPIRED', 'DELIVERED', 'CLAIMED'] as const;
type InboxStatus = (typeof STATUS_VALUES)[number];

export const isInboxStatus = (value: string): value is InboxStatus =>
    (STATUS_VALUES as readonly string[]).includes(value);

export const parseStatus = (value: string | undefined): InboxStatus | undefined => {
    if (value === undefined) return undefined;
    const upper = value.toUpperCase();
    if (!isInboxStatus(upper))
        throw new Error(
            `Unknown --status "${value}". Use PENDING, ISSUED, or EXPIRED (DELIVERED and CLAIMED are deprecated aliases).`
        );
    return upper;
};

export const parseLimit = (value: string | undefined): number => {
    if (value === undefined) return 50;
    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1)
        throw new Error(`Invalid --limit "${value}". Use a positive whole number.`);
    return limit;
};

const DURATION_PATTERN = /^(\d+)\s*(d|h|m)$/i;
const MS_PER_UNIT = { d: 86_400_000, h: 3_600_000, m: 60_000 } as const;

/** Parses `7d` / `24h` / `30m` (relative to `now`) or an ISO timestamp into a cutoff Date. */
export const parseSince = (value: string, now: Date = new Date()): Date => {
    const match = value.match(DURATION_PATTERN);
    if (match) {
        const amount = Number(match[1]);
        const unit = match[2]!.toLowerCase() as keyof typeof MS_PER_UNIT;
        return new Date(now.getTime() - amount * MS_PER_UNIT[unit]);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        throw new Error(`Invalid --since value "${value}". Use 7d, 24h, 30m, or an ISO timestamp.`);
    return parsed;
};

/** Keeps only records created at or after `since`; a no-op when `since` is undefined. */
export const filterSince = <T extends { createdAt: string }>(records: T[], since?: Date): T[] => {
    if (!since) return records;
    const cutoff = since.getTime();
    return records.filter(record => new Date(record.createdAt).getTime() >= cutoff);
};

/** Keeps only records addressed to a contact method of this type; a no-op without a filter. */
export const filterRecipientType = (
    records: SentInboxRecord[],
    recipientType?: string
): SentInboxRecord[] => {
    if (!recipientType) return records;
    return records.filter(record => record.recipient?.type === recipientType);
};

export interface FetchSentInboxOptions {
    limit: number;
    currentStatus?: InboxStatus;
}

export interface FetchSentInboxResult {
    records: SentInboxRecord[];
    hasMore: boolean;
}

/** Cursor-paginates the network's sent-inbox listing until `hasMore` is false or `limit` is reached. */
export const fetchSentInboxCredentials = async (
    card: Pick<NetworkCard['invoke'], 'getMySentInboxCredentials'>,
    options: FetchSentInboxOptions
): Promise<FetchSentInboxResult> => {
    const records: SentInboxRecord[] = [];
    let cursor: string | undefined;
    let serverHasMore = true;

    while (serverHasMore && records.length < options.limit) {
        const query: Partial<PaginationOptionsType> & { query?: InboxCredentialQuery } = {
            limit: options.limit,
            ...(cursor ? { cursor } : {}),
            ...(options.currentStatus ? { query: { currentStatus: options.currentStatus } } : {}),
        };
        const page = await card.getMySentInboxCredentials(query);
        records.push(...page.records);
        serverHasMore = page.hasMore;
        cursor = page.cursor;
    }

    return {
        records: records.slice(0, options.limit),
        hasMore: serverHasMore || records.length > options.limit,
    };
};

/** Shapes a record for `--json` output; `recipient` is omitted when the metadata lacks it. */
export const toJsonRecord = (record: SentInboxRecord): InboxJsonRecord => ({
    id: record.id,
    status: record.currentStatus,
    recipient: record.recipient
        ? {
              type: record.recipient.type,
              ...(record.recipient.value ? { value: record.recipient.value } : {}),
          }
        : undefined,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    credentialName: record.credentialName,
    isSigned: record.isSigned,
});

const formatRow = (record: SentInboxRecord): string => {
    const created = record.createdAt.replace('T', ' ').slice(0, 19);
    const recipient = record.recipient
        ? `${record.recipient.type ?? '?'}${record.recipient.value ? `:${record.recipient.value}` : ''}`
        : '—';
    return `${record.id}  ${record.currentStatus.padEnd(8)}  ${recipient}  ${created}  ${record.credentialName ?? ''}`;
};

export type InboxListOptions = ProjectOptions & {
    as?: string;
    status?: string;
    since?: string;
    recipientType?: string;
    limit?: string;
};

export const runInboxList = async (options: InboxListOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    const learnCard = options.as
        ? await connectAsManaged(project, options, options.as)
        : await connect(project, options);

    const currentStatus = parseStatus(options.status);
    const limit = parseLimit(options.limit);
    const since = options.since ? parseSince(options.since) : undefined;

    const { records: fetched, hasMore } = await fetchSentInboxCredentials(learnCard.invoke, {
        limit,
        currentStatus,
    });

    const filtered = filterRecipientType(filterSince(fetched, since), options.recipientType);

    if (!filtered.length) {
        out.log(
            'No sent inbox credentials match. Try widening --since or dropping --status/--recipient-type.'
        );
        out.set({ records: [], hasMore });
        return;
    }

    out.log('issuanceId  status  recipient  created  name');
    for (const record of filtered) out.log(formatRow(record));
    if (hasMore) out.log('…more. Raise --limit to see additional sends.');

    out.set({ records: filtered.map(toJsonRecord), hasMore });
};

export const registerInboxCommand = (
    program: Command,
    run: (
        command: string,
        options: { json?: boolean },
        action: (didkit: Promise<Buffer>) => Promise<void>,
        wrap?: boolean
    ) => Promise<void>
): void => {
    const inbox = program
        .command('inbox')
        .description('Credentials sent through the inbox (email/phone claim flow).');
    inbox
        .command('list')
        .description('List credentials you sent through the inbox.')
        .option('--as <profileId>', 'list credentials sent by a profile you manage')
        .option('--status <status>', 'PENDING, ISSUED, or EXPIRED')
        .option(
            '--since <duration|iso>',
            'only sends at/after this: 7d, 24h, 30m, or an ISO timestamp'
        )
        .option('--recipient-type <type>', 'email, phone, or state_student_id')
        .option('--limit <n>', 'how many to list (default: 50)')
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .action(options =>
            run('inbox list', options, async didkit => {
                await runInboxList({ ...options, didkit });
            })
        );
};
