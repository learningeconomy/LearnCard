import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import type { RunnerConfig } from './config';

/**
 * Canary inbox reader. Messages are written by per-recipient SES receipt rules
 * to `<prefix><hold-NN>/`, so the prefix (not a header) identifies the recipient.
 * Message content is sender-controlled: size and candidate counts are capped
 * and the parser is deliberately minimal (headers + one text/plain part).
 * Codes are returned to the caller only and are never logged or persisted.
 */
export const MAX_MESSAGE_BYTES = 256 * 1024;
export const MAX_CANDIDATES = 10;
/** Tolerate S3 LastModified vs runner clock disagreement. */
const ARRIVAL_SLACK_MS = 2_000;

export interface InboxObject {
    key: string;
    lastModified: number;
    size: number;
}
export interface InboxStore {
    list(prefix: string): Promise<InboxObject[]>;
    get(key: string): Promise<Uint8Array>;
}

export const createS3Inbox = (
    bucket: string,
    client = new S3Client({ maxAttempts: 3 })
): InboxStore => ({
    async list(prefix) {
        const objects: InboxObject[] = [];
        let token: string | undefined;
        do {
            const response = await client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: prefix,
                    ContinuationToken: token,
                })
            );
            for (const object of response.Contents ?? [])
                if (object.Key && object.LastModified)
                    objects.push({
                        key: object.Key,
                        lastModified: object.LastModified.getTime(),
                        size: object.Size ?? 0,
                    });
            token = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (token && objects.length < 5_000);
        return objects;
    },
    async get(key) {
        const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if ((response.ContentLength ?? 0) > MAX_MESSAGE_BYTES || !response.Body)
            throw new InboxError('email_untrusted');
        const bytes = await response.Body.transformToByteArray();
        if (bytes.length > MAX_MESSAGE_BYTES) throw new InboxError('email_untrusted');
        return bytes;
    },
});

export class InboxError extends Error {
    constructor(readonly reason: 'email_untrusted' | 'email_missing' | 'malformed') {
        super('Canary inbox message rejected');
    }
}

// ---------------------------------------------------------------------------
// Minimal MIME parsing
// ---------------------------------------------------------------------------

export interface Header {
    name: string;
    value: string;
}
const utf8 = new TextDecoder('utf-8', { fatal: true });
const latin1 = new TextDecoder('latin1');

const splitHeadersAndBody = (text: string): { headers: Header[]; body: string } => {
    const match = /\r?\n\r?\n/.exec(text);
    if (!match) throw new InboxError('malformed');
    const head = text.slice(0, match.index);
    const body = text.slice(match.index + match[0].length);
    const headers: Header[] = [];
    for (const line of head.split(/\r?\n/)) {
        if (/^[ \t]/.test(line)) {
            if (headers.length === 0) throw new InboxError('malformed');
            headers[headers.length - 1].value += ` ${line.trim()}`;
            continue;
        }
        const colon = line.indexOf(':');
        if (colon <= 0) throw new InboxError('malformed');
        headers.push({
            name: line.slice(0, colon).trim().toLowerCase(),
            value: line.slice(colon + 1).trim(),
        });
    }
    return { headers, body };
};

const all = (headers: Header[], name: string): string[] =>
    headers.filter(header => header.name === name).map(header => header.value);
const one = (headers: Header[], name: string): string | undefined => {
    const values = all(headers, name);
    if (values.length > 1) throw new InboxError('malformed');
    return values[0];
};

const parameter = (value: string, name: string): string | undefined => {
    const match = new RegExp(`;\\s*${name}\\s*=\\s*(?:"([^"]*)"|([^;\\s]+))`, 'i').exec(value);
    return match ? (match[1] ?? match[2]) : undefined;
};

const decodeQuotedPrintable = (text: string): Uint8Array => {
    const soft = text.replace(/=\r?\n/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < soft.length; i += 1) {
        const char = soft[i];
        if (char === '=' && /^[0-9A-Fa-f]{2}$/.test(soft.slice(i + 1, i + 3))) {
            bytes.push(parseInt(soft.slice(i + 1, i + 3), 16));
            i += 2;
        } else {
            const code = char.charCodeAt(0);
            if (code > 0xff) throw new InboxError('malformed');
            bytes.push(code);
        }
    }
    return Uint8Array.from(bytes);
};

const decodeBody = (
    body: string,
    encoding: string | undefined,
    charset: string | undefined
): string => {
    const cs = (charset ?? 'us-ascii').toLowerCase();
    if (!['utf-8', 'utf8', 'us-ascii'].includes(cs)) throw new InboxError('malformed');
    const transfer = (encoding ?? '7bit').toLowerCase();
    let bytes: Uint8Array;
    if (transfer === 'quoted-printable') bytes = decodeQuotedPrintable(body);
    else if (transfer === 'base64') {
        const compact = body.replace(/\s+/g, '');
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) throw new InboxError('malformed');
        bytes = Uint8Array.from(Buffer.from(compact, 'base64'));
    } else if (['7bit', '8bit', 'binary'].includes(transfer))
        bytes = Uint8Array.from(Buffer.from(body, 'latin1'));
    else throw new InboxError('malformed');
    try {
        return utf8.decode(bytes).replace(/\r\n/g, '\n');
    } catch {
        throw new InboxError('malformed');
    }
};

/** RFC 2047 encoded words (UTF-8 only); adjacent encoded words join without spaces. */
export const decodeHeaderWords = (value: string): string =>
    value
        .replace(/(=\?[^?]+\?[BbQq]\?[^?]*\?=)\s+(?==\?)/g, '$1')
        .replace(
            /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
            (_whole, charset: string, kind: string, text: string) => {
                if (!['utf-8', 'utf8', 'us-ascii'].includes(charset.toLowerCase()))
                    throw new InboxError('malformed');
                const bytes =
                    kind.toUpperCase() === 'B'
                        ? Uint8Array.from(Buffer.from(text, 'base64'))
                        : decodeQuotedPrintable(text.replace(/_/g, ' '));
                try {
                    return utf8.decode(bytes);
                } catch {
                    throw new InboxError('malformed');
                }
            }
        );

export interface ParsedMessage {
    headers: Header[];
    subject: string;
    text: string;
}

/** Headers in original order, decoded subject, and the single text/plain body. */
export const parseMessage = (raw: Uint8Array): ParsedMessage => {
    if (raw.length > MAX_MESSAGE_BYTES) throw new InboxError('email_untrusted');
    const { headers, body } = splitHeadersAndBody(latin1.decode(raw));
    const contentType = one(headers, 'content-type') ?? 'text/plain; charset=us-ascii';
    const subject = decodeHeaderWords(one(headers, 'subject') ?? '');
    const mediaType = contentType.split(';')[0].trim().toLowerCase();
    if (mediaType === 'text/plain')
        return {
            headers,
            subject,
            text: decodeBody(
                body,
                one(headers, 'content-transfer-encoding'),
                parameter(contentType, 'charset')
            ),
        };
    if (!mediaType.startsWith('multipart/')) throw new InboxError('malformed');
    const boundary = parameter(contentType, 'boundary');
    if (!boundary || boundary.length > 200) throw new InboxError('malformed');
    const parts = body.split(
        new RegExp(`\\r?\\n?--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    );
    for (const part of parts.slice(1, 21)) {
        if (part.startsWith('--')) break;
        const section = splitHeadersAndBody(part.replace(/^\r?\n/, ''));
        const type = one(section.headers, 'content-type') ?? 'text/plain; charset=us-ascii';
        if (type.split(';')[0].trim().toLowerCase() !== 'text/plain') continue;
        return {
            headers,
            subject,
            text: decodeBody(
                section.body,
                one(section.headers, 'content-transfer-encoding'),
                parameter(type, 'charset')
            ),
        };
    }
    throw new InboxError('malformed');
};

// ---------------------------------------------------------------------------
// Trust checks (all required; fail closed)
// ---------------------------------------------------------------------------

const addresses = (value: string): string[] => {
    const bracketed = [...value.matchAll(/<([^<>\s@]+@[^<>\s@]+)>/g)].map(match => match[1]);
    if (bracketed.length > 0) return bracketed.map(address => address.toLowerCase());
    return value
        .split(',')
        .map(part => part.trim())
        .filter(part => /^[^\s@<>]+@[^\s@<>]+$/.test(part))
        .map(address => address.toLowerCase());
};
const domainOf = (address: string): string => address.split('@')[1] ?? '';
const within = (domain: string, parent: string): boolean =>
    domain === parent || domain.endsWith(`.${parent}`);

/** Headers an original sender supplies; SES prepends its own block above all of them. */
const SENDER_HEADERS = new Set([
    'dkim-signature',
    'from',
    'to',
    'subject',
    'message-id',
    'date',
    'mime-version',
]);
const SES_RECEIVED = /\bby inbound-smtp\.[a-z0-9-]+\.amazonaws\.com\b/i;

interface AuthResult {
    method: string;
    result: string;
    properties: Record<string, string>;
}
const parseAuthenticationResults = (
    value: string
): { authservId: string; results: AuthResult[] } => {
    const [authserv, ...rest] = value.split(';');
    return {
        authservId: authserv.trim().split(/\s+/)[0].toLowerCase(),
        results: rest.flatMap(segment => {
            const match = /^\s*([a-z]+)\s*=\s*([a-z]+)/i.exec(segment);
            if (!match) return [];
            const properties: Record<string, string> = {};
            for (const prop of segment.matchAll(/\b([a-z]+\.[a-z]+)=([^\s;()]+)/gi))
                properties[prop[1].toLowerCase()] = prop[2].toLowerCase();
            return [{ method: match[1].toLowerCase(), result: match[2].toLowerCase(), properties }];
        }),
    };
};

export interface TrustPolicy {
    expectedSenders: string[];
    expectedDkimDomain: string;
    requireDmarc: boolean;
    recoveryEmail: string;
}

/** `false` from a non-allowlisted sender (skip silently); throws for enclave-looking but untrusted mail. */
export const isTrusted = (message: ParsedMessage, policy: TrustPolicy): boolean => {
    const fromHeaders = all(message.headers, 'from');
    const from = fromHeaders.length === 1 ? addresses(fromHeaders[0]) : [];
    const fromAllowlisted = from.length === 1 && policy.expectedSenders.includes(from[0]);
    if (!fromAllowlisted) {
        // Several From headers or addresses claiming an expected sender are forged, not foreign.
        if (
            fromHeaders.some(value =>
                addresses(value).some(a => policy.expectedSenders.includes(a))
            )
        )
            throw new InboxError('email_untrusted');
        return false;
    }
    const fail = (): never => {
        throw new InboxError('email_untrusted');
    };
    const boundary = message.headers.findIndex(
        header =>
            SENDER_HEADERS.has(header.name) ||
            (header.name === 'received' && !SES_RECEIVED.test(header.value))
    );
    const sesBlock = boundary === -1 ? fail() : message.headers.slice(0, boundary);
    const firstAuth = message.headers.findIndex(header => header.name === 'authentication-results');
    if (firstAuth === -1 || firstAuth >= boundary) fail();
    if (all(sesBlock, 'authentication-results').length !== 1) fail();
    const auth = parseAuthenticationResults(message.headers[firstAuth].value);
    if (auth.authservId !== 'amazonses.com') fail();
    const pass = (method: string) =>
        auth.results.some(r => r.method === method && r.result === 'pass');
    if (!pass('spf') || (policy.requireDmarc && !pass('dmarc'))) fail();
    const fromDomain = domainOf(from[0]);
    const aligned = auth.results.some(result => {
        if (result.method !== 'dkim' || result.result !== 'pass') return false;
        const domain =
            result.properties['header.d'] ?? domainOf(result.properties['header.i'] ?? '');
        return (
            domain.length > 0 &&
            within(domain, policy.expectedDkimDomain) &&
            (within(fromDomain, domain) || within(domain, fromDomain))
        );
    });
    if (!aligned) fail();
    if (all(sesBlock, 'x-ses-spam-verdict').join() !== 'PASS') fail();
    if (all(sesBlock, 'x-ses-virus-verdict').join() !== 'PASS') fail();
    const to = all(message.headers, 'to').flatMap(addresses);
    if (!to.includes(policy.recoveryEmail.toLowerCase())) fail();
    return true;
};

// ---------------------------------------------------------------------------
// Templates (English only; brand captured, never hardcoded)
// ---------------------------------------------------------------------------

export type Template =
    | { kind: 'code'; brand: string; code: string }
    | { kind: 'warning'; brand: string; hours: number }
    | { kind: 'started'; brand: string };

export const parseTemplate = (message: ParsedMessage): Template | undefined => {
    const firstLine = message.text.split('\n')[0]?.trim() ?? '';
    const code = /^Your (.{1,64}) recovery code$/.exec(message.subject);
    if (code) {
        const body = /^Your (.{1,64}) recovery code is: ([0-9]{8})$/.exec(firstLine);
        const digits = message.text.match(/(?<![0-9])[0-9]{8}(?![0-9])/g) ?? [];
        if (!body || body[1] !== code[1] || digits.length !== 1) throw new InboxError('malformed');
        return { kind: 'code', brand: code[1], code: body[2] };
    }
    const warning = /^Your (.{1,64}) recovery completes soon$/.exec(message.subject);
    if (warning) {
        const body =
            /^Your (.{1,64}) account recovery will complete in about ([0-9]{1,3}) hours unless you cancel it\.$/.exec(
                firstLine
            );
        if (!body || body[1] !== warning[1]) throw new InboxError('malformed');
        return { kind: 'warning', brand: warning[1], hours: Number(body[2]) };
    }
    const started = /^Your (.{1,64}) account recovery has started$/.exec(message.subject);
    if (started) return { kind: 'started', brand: started[1] };
    return undefined;
};

// ---------------------------------------------------------------------------
// Message selection
// ---------------------------------------------------------------------------

export interface FoundMessage<K extends Template['kind']> {
    key: string;
    lastModified: number;
    template: Extract<Template, { kind: K }>;
}
export interface FindResult<K extends Template['kind']> {
    found?: FoundMessage<K>;
    /** Enclave-looking mail failed trust checks: a diagnostic, never satisfies the step. */
    untrusted: number;
}

export const inboxPolicy = (config: RunnerConfig['inbox'], recoveryEmail: string): TrustPolicy => ({
    expectedSenders: config.expectedSenders,
    expectedDkimDomain: config.expectedDkimDomain,
    requireDmarc: config.requireDmarc,
    recoveryEmail,
});

const readTrusted = async <K extends Template['kind']>(
    store: InboxStore,
    object: InboxObject,
    kind: K,
    policy: TrustPolicy
): Promise<FoundMessage<K> | undefined> => {
    const message = parseMessage(await store.get(object.key));
    if (!isTrusted(message, policy)) return undefined;
    const template = parseTemplate(message);
    if (!template || template.kind !== kind) return undefined;
    return {
        key: object.key,
        lastModified: object.lastModified,
        template: template as Extract<Template, { kind: K }>,
    };
};

/** Newest-first; stops at the first trusted message of `kind` that arrived at or after `since`. */
export const findMessage = async <K extends Template['kind']>(
    store: InboxStore,
    prefix: string,
    kind: K,
    since: number,
    policy: TrustPolicy
): Promise<FindResult<K>> => {
    const candidates = (await store.list(prefix))
        .filter(
            object =>
                object.lastModified >= since - ARRIVAL_SLACK_MS &&
                object.key !== `${prefix}AMAZON_SES_SETUP_NOTIFICATION`
        )
        .sort((a, b) => b.lastModified - a.lastModified)
        .slice(0, MAX_CANDIDATES);
    let untrusted = 0;
    for (const object of candidates) {
        if (object.size > MAX_MESSAGE_BYTES) {
            untrusted += 1;
            continue;
        }
        try {
            const found = await readTrusted(store, object, kind, policy);
            if (found) return { found, untrusted };
        } catch (error) {
            if (error instanceof InboxError)
                untrusted += error.reason === 'email_untrusted' ? 1 : 0;
            else throw error;
        }
    }
    return { untrusted };
};

/** Re-read one known object (crash recovery for a confirm already in flight). */
export const readKnownMessage = async <K extends Template['kind']>(
    store: InboxStore,
    key: string,
    kind: K,
    policy: TrustPolicy
): Promise<FoundMessage<K> | undefined> => {
    const object = (await store.list(key)).find(candidate => candidate.key === key);
    if (!object || object.size > MAX_MESSAGE_BYTES) return undefined;
    return readTrusted(store, object, kind, policy);
};
