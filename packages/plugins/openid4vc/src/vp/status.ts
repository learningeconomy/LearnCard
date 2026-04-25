/**
 * Slice 8 — **Bitstring Status List checking**.
 *
 * W3C [Bitstring Status List v1.0](https://www.w3.org/TR/vc-bitstring-status-list/)
 * (and its predecessor [StatusList2021](https://www.w3.org/TR/2023/WD-vc-status-list-20230427/))
 * encode revocation/suspension state for a population of credentials
 * as a single GZIP-compressed bitstring published in a Status List
 * Credential. Each issued credential carries a `credentialStatus`
 * pointing at:
 *
 *   - the URL of the Status List Credential,
 *   - the bit index within its bitstring,
 *   - the purpose (`revocation`, `suspension`, …).
 *
 * Verifier-side check at present time: fetch the list, decompress,
 * read the bit, decide whether to honour the credential.
 *
 * # Why this is a security-critical primitive
 *
 * A wallet that presents revoked credentials breaks the verifier's
 * trust model — the verifier may have *already* relied on the
 * presentation by the time periodic status sync catches up. The
 * conservative posture is "check before you present", which this
 * module makes cheap enough that wallets can always do.
 *
 * # Scope
 *
 * Supports both:
 *
 *   - **`BitstringStatusListEntry`** (W3C VC Bitstring Status List
 *     v1.0, the current spec).
 *   - **`StatusList2021Entry`** (the legacy alias still used by
 *     OBv3 issuers and many production deployments).
 *
 * Both share the same wire format: a GZIP-compressed bitstring,
 * base64url-encoded into `credentialSubject.encodedList` of the
 * Status List Credential. Bit indexing is **high-order-bit-first
 * within each byte** — bit 0 is `byte[0] & 0x80`, bit 7 is
 * `byte[0] & 0x01`, bit 8 is `byte[1] & 0x80`, etc. (Matches the
 * digitalbazaar reference implementation; the spec underspecifies
 * but the test-vector ecosystem has converged on this layout.)
 *
 * Out of scope (deferred):
 *
 *   - Token Status List (IETF draft) — different wire format
 *     (CBOR + COSE), different revocation model. Future slice.
 *   - `statusSize > 1` (multi-bit per index) — uncommon in
 *     production; we recognize the field but currently only support
 *     single-bit purposes (revocation, suspension). Multi-bit
 *     `message`-purpose entries return `unsupported_status_type`.
 *
 * # Why this is its own module
 *
 *   1. Verifying status lists involves GZIP, base64url, bit math,
 *      and an HTTP fetch — none of which belong in the VP transport
 *      or the selector. Concentrating the logic here makes it
 *      auditable and lets us swap implementations (e.g., switch to
 *      a streaming decompressor) without touching callers.
 *   2. Wallets and verifiers both need this; future verifier-side
 *      use cases (e.g., a custom verification harness) can import
 *      from here without dragging in OID4VP transport code.
 *   3. The test surface is one cohesive matrix of bitstring layouts,
 *      legacy/new entry shapes, fetch/network errors, and malformed
 *      list payloads.
 */
import { gunzipSync } from 'node:zlib';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * Result of checking a credential against its declared status list.
 *
 *   - `active` — the bit at the credential's index is 0; the status
 *     purpose does NOT apply (e.g., revocation purpose + bit 0 →
 *     not revoked).
 *   - `revoked` / `suspended` — the bit is 1 AND the purpose matches.
 *     Two distinct values so callers can render different UI for
 *     "this credential was revoked" vs "this is temporarily
 *     suspended" (suspension can be lifted; revocation is
 *     terminal).
 *   - `no_status` — the credential carries no `credentialStatus`
 *     entry. Distinct from `active` so callers can decide whether
 *     to require a status list (some governance models do).
 *   - `unsupported_status_type` — the entry's `type` isn't one we
 *     recognise (e.g., `RevocationList2020` legacy, IETF Token
 *     Status List, custom). Caller decides whether to honour or
 *     reject.
 */
export type StatusCheckOutcome =
    | 'active'
    | 'revoked'
    | 'suspended'
    | 'no_status'
    | 'unsupported_status_type';

export interface StatusCheckResult {
    outcome: StatusCheckOutcome;

    /**
     * The `statusPurpose` that produced the outcome — e.g.,
     * `'revocation'` for a `revoked` outcome. Useful for
     * surfacing "credential revoked because reason X" in UIs
     * when the credential carries multiple status entries with
     * different purposes (the spec allows arrays).
     */
    purpose?: string;

    /**
     * URL of the status list credential that was checked. Echoed
     * for logging / audit trails.
     */
    listUrl?: string;

    /**
     * Bit index that was read. Matches the credential's
     * `credentialStatus.statusListIndex`.
     */
    listIndex?: number;

    /**
     * Free-form diagnostic detail when the outcome is
     * `unsupported_status_type` or when the list type itself is
     * unfamiliar. Always populated when the outcome isn't a clean
     * active/revoked/suspended.
     */
    detail?: string;
}

/**
 * A loose VC shape — only the fields this module actually reads.
 * Full validation lives in `@learncard/types`'s `VCValidator`; we
 * stay loose here so callers can pass partially-typed credentials
 * (e.g., parsed-but-not-validated wire payloads) without an extra
 * narrowing step.
 */
export interface CredentialWithStatus {
    credentialStatus?: CredentialStatusEntry | CredentialStatusEntry[];
    [extra: string]: unknown;
}

export interface CredentialStatusEntry {
    type: string;
    id?: string;
    statusPurpose?: string;
    statusListIndex?: string | number;
    statusListCredential?: string;
    statusSize?: number;
    [extra: string]: unknown;
}

export interface CheckCredentialStatusOptions {
    /**
     * Override fetch — defaults to `globalThis.fetch`. Required when
     * status lists need to be fetched over the network. Tests inject
     * a stub that returns a hand-crafted Status List Credential.
     */
    fetchImpl?: typeof fetch;

    /**
     * Caller-supplied lookup that bypasses the network entirely.
     * When provided, the module skips the `fetchImpl` path and
     * delegates list resolution. Useful for wallets that cache
     * status lists locally, host apps that proxy fetches through
     * a trust layer, or tests that want to drive a known list
     * shape without HTTP mocking.
     */
    fetchStatusList?: (url: string) => Promise<StatusListCredential>;

    /**
     * When true (default), the function treats any
     * `credentialStatus` entry whose `type` we don't recognise as
     * `unsupported_status_type` and short-circuits. When false,
     * we instead try every known type until one matches; useful
     * for credentials that carry both a legacy and modern entry.
     */
    strictType?: boolean;
}

/**
 * Minimal shape we expect from a Status List Credential. We DO NOT
 * cryptographically verify the credential here — that's a separate
 * concern (and a separate plugin), and the relevant trust check
 * (does the list issuer match the credential issuer's policy?) is
 * a wallet decision, not a status-decoder decision.
 */
export interface StatusListCredential {
    credentialSubject?:
        | StatusListCredentialSubject
        | StatusListCredentialSubject[];
    [extra: string]: unknown;
}

export interface StatusListCredentialSubject {
    type?: string;
    statusPurpose?: string;
    encodedList?: string;
    [extra: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type StatusCheckErrorCode =
    | 'invalid_status_entry'
    | 'invalid_status_list'
    | 'list_fetch_failed'
    | 'index_out_of_range'
    | 'no_fetch';

export class StatusCheckError extends Error {
    readonly code: StatusCheckErrorCode;
    readonly listUrl?: string;

    constructor(
        code: StatusCheckErrorCode,
        message: string,
        extra: { cause?: unknown; listUrl?: string } = {}
    ) {
        super(message);
        this.name = 'StatusCheckError';
        this.code = code;
        if (extra.listUrl) this.listUrl = extra.listUrl;
        if (extra.cause !== undefined) {
            (this as { cause?: unknown }).cause = extra.cause;
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Recognised entry types. `BitstringStatusListEntry` is the W3C
 * v1.0 spec; `StatusList2021Entry` is the legacy alias. Both share
 * the same wire format — only the type string differs.
 */
const KNOWN_ENTRY_TYPES = [
    'BitstringStatusListEntry',
    'StatusList2021Entry',
] as const;

/**
 * Check a credential's status against its declared Status List
 * Credential. Returns an outcome describing whether the credential
 * is active, revoked, suspended, etc.; throws `StatusCheckError`
 * for transport / encoding failures the caller should surface
 * rather than treat as "active by default".
 */
export const checkCredentialStatus = async (
    credential: CredentialWithStatus,
    options: CheckCredentialStatusOptions = {}
): Promise<StatusCheckResult> => {
    const entries = normalizeStatusEntries(credential.credentialStatus);

    if (entries.length === 0) {
        return { outcome: 'no_status' };
    }

    // Iterate the entries in declaration order. The first entry
    // whose bit is set produces a non-active outcome — credentials
    // can carry multiple entries (e.g., revocation + suspension
    // pointing at distinct lists), and ANY set bit means the
    // credential is in a non-active state.
    //
    // When every entry is active we want to preserve the diagnostic
    // fields (listUrl / listIndex / purpose) of the LAST active
    // entry rather than returning a bare `{ outcome: 'active' }`.
    // Callers that audit-log status checks need to know which list
    // was consulted; without this the active path swallows that
    // metadata silently.
    let firstUnsupported: StatusCheckResult | undefined;
    let lastActive: StatusCheckResult | undefined;

    for (const entry of entries) {
        if (!KNOWN_ENTRY_TYPES.includes(entry.type as typeof KNOWN_ENTRY_TYPES[number])) {
            const unsupported: StatusCheckResult = {
                outcome: 'unsupported_status_type',
                detail: `Unknown credentialStatus type: ${entry.type}`,
            };
            if (options.strictType !== false) {
                return unsupported;
            }
            firstUnsupported ??= unsupported;
            continue;
        }

        const result = await evaluateBitstringEntry(entry, options);

        // Any non-active outcome wins immediately. `no_status`
        // shouldn't appear at this layer (we only get here with
        // parsed entries), but we treat it as continue-the-loop
        // for safety.
        if (
            result.outcome === 'revoked' ||
            result.outcome === 'suspended' ||
            result.outcome === 'unsupported_status_type'
        ) {
            return result;
        }

        if (result.outcome === 'active') {
            lastActive = result;
        }
    }

    return lastActive ?? firstUnsupported ?? { outcome: 'active' };
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

const normalizeStatusEntries = (
    raw: unknown
): CredentialStatusEntry[] => {
    if (raw === undefined || raw === null) return [];
    if (Array.isArray(raw)) {
        return raw.filter(
            (e): e is CredentialStatusEntry =>
                typeof e === 'object' && e !== null && typeof (e as { type?: unknown }).type === 'string'
        );
    }
    if (
        typeof raw === 'object' &&
        typeof (raw as { type?: unknown }).type === 'string'
    ) {
        return [raw as CredentialStatusEntry];
    }
    return [];
};

/**
 * Evaluate one status entry against its referenced Status List
 * Credential. Pure compute given the list bytes; the I/O layer
 * (fetch or caller-supplied lookup) is injected.
 */
const evaluateBitstringEntry = async (
    entry: CredentialStatusEntry,
    options: CheckCredentialStatusOptions
): Promise<StatusCheckResult> => {
    const listUrl = entry.statusListCredential;
    if (typeof listUrl !== 'string' || listUrl.length === 0) {
        throw new StatusCheckError(
            'invalid_status_entry',
            `credentialStatus.statusListCredential must be a non-empty string (entry id=${String(entry.id)})`
        );
    }

    const indexRaw = entry.statusListIndex;
    const index =
        typeof indexRaw === 'number'
            ? indexRaw
            : typeof indexRaw === 'string' && /^\d+$/.test(indexRaw)
              ? Number.parseInt(indexRaw, 10)
              : NaN;

    if (!Number.isFinite(index) || index < 0) {
        throw new StatusCheckError(
            'invalid_status_entry',
            `credentialStatus.statusListIndex must be a non-negative integer (received ${String(indexRaw)})`,
            { listUrl }
        );
    }

    // statusSize > 1 (multi-bit "message" purposes) is reserved in
    // the spec but uncommon in production. Reject explicitly so the
    // caller knows to drop down to a future implementation.
    if (typeof entry.statusSize === 'number' && entry.statusSize !== 1) {
        return {
            outcome: 'unsupported_status_type',
            listUrl,
            listIndex: index,
            purpose: entry.statusPurpose,
            detail: `statusSize=${entry.statusSize} (multi-bit) is not supported; only single-bit revocation/suspension purposes are decoded`,
        };
    }

    const listCredential = await loadStatusList(listUrl, options);

    const subject = pickStatusSubject(listCredential);
    const encoded = subject?.encodedList;
    if (typeof encoded !== 'string' || encoded.length === 0) {
        throw new StatusCheckError(
            'invalid_status_list',
            `Status list credential at ${listUrl} has no credentialSubject.encodedList`,
            { listUrl }
        );
    }

    const bits = decodeEncodedList(encoded, listUrl);
    const isSet = readBit(bits, index, listUrl);

    if (!isSet) {
        return {
            outcome: 'active',
            listUrl,
            listIndex: index,
            purpose: entry.statusPurpose,
        };
    }

    // Map the entry's purpose to the corresponding outcome. The
    // spec permits any string here; we recognize the two purposes
    // that have well-defined wallet semantics. Anything else falls
    // through to `revoked` (the most conservative interpretation —
    // a verifier seeing a set bit treats it as a refusal-to-honour
    // signal).
    const purpose = subject?.statusPurpose ?? entry.statusPurpose ?? 'revocation';

    if (purpose === 'suspension') {
        return {
            outcome: 'suspended',
            listUrl,
            listIndex: index,
            purpose,
        };
    }

    return {
        outcome: 'revoked',
        listUrl,
        listIndex: index,
        purpose,
    };
};

const pickStatusSubject = (
    credential: StatusListCredential
): StatusListCredentialSubject | undefined => {
    const cs = credential.credentialSubject;
    if (Array.isArray(cs)) return cs[0];
    if (cs && typeof cs === 'object') return cs;
    return undefined;
};

const loadStatusList = async (
    url: string,
    options: CheckCredentialStatusOptions
): Promise<StatusListCredential> => {
    if (options.fetchStatusList) {
        try {
            return await options.fetchStatusList(url);
        } catch (e) {
            throw new StatusCheckError(
                'list_fetch_failed',
                `fetchStatusList lookup failed for ${url}: ${describe(e)}`,
                { listUrl: url, cause: e }
            );
        }
    }

    const fx = options.fetchImpl ?? globalThis.fetch;
    if (typeof fx !== 'function') {
        throw new StatusCheckError(
            'no_fetch',
            `No fetch implementation available; pass \`fetchImpl\` or \`fetchStatusList\` to check status against ${url}`,
            { listUrl: url }
        );
    }

    let response: Response;
    try {
        response = await fx(url, {
            headers: { Accept: 'application/json, application/ld+json, application/jwt' },
        });
    } catch (e) {
        throw new StatusCheckError(
            'list_fetch_failed',
            `Failed to fetch status list at ${url}: ${describe(e)}`,
            { listUrl: url, cause: e }
        );
    }

    if (!response.ok) {
        throw new StatusCheckError(
            'list_fetch_failed',
            `Status list fetch returned HTTP ${response.status} for ${url}`,
            { listUrl: url }
        );
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch (e) {
        // The list might be a JWT-VC (compact JWS) rather than a
        // JSON-LD object. We don't support JWT-encoded lists yet —
        // production wallets that need them can hook
        // `fetchStatusList` to decode the JWT first. Surface a
        // typed error so the upgrade path is clear.
        throw new StatusCheckError(
            'invalid_status_list',
            `Status list at ${url} is not JSON (JWT-encoded lists require a custom fetchStatusList): ${describe(e)}`,
            { listUrl: url, cause: e }
        );
    }

    if (!body || typeof body !== 'object') {
        throw new StatusCheckError(
            'invalid_status_list',
            `Status list at ${url} did not parse to an object`,
            { listUrl: url }
        );
    }

    return body as StatusListCredential;
};

/**
 * Decode the GZIP-compressed, base64url-encoded bitstring back to
 * raw bytes. Spec mandates GZIP; uncompressed inputs are rejected
 * (some implementations emit raw base64 as a shortcut, but accepting
 * that would silently mis-decode any list whose first bytes happen
 * to be valid GZIP magic). Be strict.
 */
const decodeEncodedList = (encoded: string, listUrl: string): Uint8Array => {
    let raw: Uint8Array;
    try {
        // Multibase prefix: per the spec the encodedList MAY start
        // with a multibase prefix character (e.g., 'u' for
        // base64url-no-pad). Strip it if present so callers don't
        // need to know about multibase to author test fixtures.
        const stripped = encoded.startsWith('u') ? encoded.slice(1) : encoded;
        const std = stripped.replace(/-/g, '+').replace(/_/g, '/');
        const pad = '='.repeat((4 - (std.length % 4)) % 4);
        // Cast through Uint8Array.from so TS sees a concrete
        // ArrayBuffer-backed view (Node Buffer's underlying
        // ArrayBufferLike trips the latest @types/node `gunzipSync`
        // overloads).
        raw = Uint8Array.from(Buffer.from(std + pad, 'base64'));
    } catch (e) {
        throw new StatusCheckError(
            'invalid_status_list',
            `encodedList at ${listUrl} is not valid base64url: ${describe(e)}`,
            { listUrl, cause: e }
        );
    }

    let decompressed: Buffer;
    try {
        decompressed = gunzipSync(raw);
    } catch (e) {
        throw new StatusCheckError(
            'invalid_status_list',
            `encodedList at ${listUrl} did not GZIP-decompress (per W3C VC Bitstring Status List §4.1): ${describe(e)}`,
            { listUrl, cause: e }
        );
    }

    return new Uint8Array(decompressed);
};

/**
 * Read a single bit out of a packed bitstring, big-endian within
 * each byte (high-order bit = lowest index). Matches the
 * digitalbazaar reference implementation and the W3C spec's test
 * vectors.
 */
const readBit = (
    bytes: Uint8Array,
    index: number,
    listUrl: string
): boolean => {
    const byteIndex = index >> 3;
    if (byteIndex >= bytes.length) {
        throw new StatusCheckError(
            'index_out_of_range',
            `statusListIndex=${index} exceeds bitstring length (${bytes.length * 8} bits) at ${listUrl}`,
            { listUrl }
        );
    }
    const bitInByte = 7 - (index & 7);
    const mask = 1 << bitInByte;
    return (bytes[byteIndex]! & mask) !== 0;
};

const describe = (e: unknown): string =>
    e instanceof Error ? e.message : String(e);

/* -------------------------------------------------------------------------- */
/*                            test-only helpers                               */
/* -------------------------------------------------------------------------- */

/**
 * Build a status-list credential body the unit tests can mount via
 * `fetchStatusList`. Exposed publicly so other plugin tests (and
 * the Sphereon harness, when a future slice exercises status
 * checking interop) can construct lists without re-implementing
 * the encode pipeline.
 *
 * `bitsSet` is a sparse list of indices to flip to 1. Everything
 * else stays 0 (active). The bitstring length defaults to 16 KiB
 * (131,072 bits) per the W3C spec's recommended minimum, which is
 * well under the 1 GiB max and large enough for realistic test
 * scenarios.
 */
export const buildBitstringStatusListCredential = (args: {
    bitsSet?: readonly number[];
    bitstringLengthBytes?: number;
    statusPurpose?: string;
    /** Helper for tests that need to assert against the encoded form. */
    listIssuer?: string;
}): StatusListCredential & { credentialSubject: StatusListCredentialSubject } => {
    const lengthBytes = args.bitstringLengthBytes ?? 16 * 1024;
    const bytes = new Uint8Array(lengthBytes);

    for (const idx of args.bitsSet ?? []) {
        if (idx < 0 || idx >= lengthBytes * 8) {
            throw new RangeError(
                `Cannot set bit ${idx}: bitstring is ${lengthBytes * 8} bits long`
            );
        }
        const byteIndex = idx >> 3;
        const bitInByte = 7 - (idx & 7);
        bytes[byteIndex] = (bytes[byteIndex] ?? 0) | (1 << bitInByte);
    }

    // Lazy-load gzipSync so the production module doesn't pull it
    // unless a test asks for it. Slight perf win; mostly principle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { gzipSync } = require('node:zlib') as typeof import('node:zlib');
    const compressed = gzipSync(bytes);
    const encodedList = compressed
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/vc/status-list/2021/v1',
        ],
        type: ['VerifiableCredential', 'BitstringStatusListCredential'],
        ...(args.listIssuer ? { issuer: args.listIssuer } : {}),
        credentialSubject: {
            type: 'BitstringStatusList',
            statusPurpose: args.statusPurpose ?? 'revocation',
            encodedList,
        },
    };
};
