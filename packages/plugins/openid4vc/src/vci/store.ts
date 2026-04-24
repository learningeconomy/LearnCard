import { LearnCard } from '@learncard/core';

import {
    NormalizedCredential,
    W3CVerifiableCredential,
    normalizeIssuedCredential,
} from './decode';
import { AcceptedCredentialResult } from './types';
import { VciError } from './errors';

/**
 * Name of the plugin we look for on the `store` and `index` planes by
 * default. Matches the LearnCloud plugin's declared `name`.
 */
export const DEFAULT_STORE_PLUGIN = 'LearnCloud';

/** Shape of the record passed to `learnCard.index.<plugin>.add(record)`. */
export interface IndexRecord {
    id: string;
    uri: string;
    category: string;
    title?: string;
    imgUrl?: string;
    boostUri?: string;
    /** Index record schema version, matches existing wallet writes. */
    __v: 1;
}

export interface StoreAcceptedCredentialsOptions {
    /**
     * Name of the plugin implementing the `store` + `index` planes. Defaults
     * to `LearnCloud`. Overridable for future `SQLite` / local-only backends.
     */
    storage?: string;
    /**
     * When true (default), uploads the credential with `uploadEncrypted` so
     * only the holder can read it back. When false or when the chosen store
     * plugin doesn't implement `uploadEncrypted`, falls back to `upload`.
     */
    encrypt?: boolean;
    /**
     * Override or compute the category placed on the index record. Defaults
     * to a simple VC-type heuristic.
     */
    category?: string | ((vc: W3CVerifiableCredential, index: number) => string);
    /** Optional title (display name) on the index record. */
    title?: string | ((vc: W3CVerifiableCredential, index: number) => string | undefined);
    /** Optional image URL on the index record. */
    imgUrl?: string | ((vc: W3CVerifiableCredential, index: number) => string | undefined);
    /**
     * Low-level escape hatches so consumers can swap the underlying backend
     * (e.g. tests, SQLite, a custom in-memory mock). If supplied these take
     * precedence over the `storage` / `encrypt` defaults.
     */
    upload?: (credential: W3CVerifiableCredential) => Promise<string>;
    addToIndex?: (record: IndexRecord) => Promise<unknown>;
    /** Custom id generator. Defaults to crypto.randomUUID() with a fallback. */
    makeId?: () => string;
}

/** Per-credential outcome of `storeAcceptedCredentials`. */
export interface StoredCredentialEntry {
    /** URI returned by the store plane, e.g. `lc:network:...`. */
    uri: string;
    /** Id used in the index record. */
    recordId: string;
    /** Normalized W3C VC — what the store actually saw. */
    vc: W3CVerifiableCredential;
    /** Credential configuration id from the offer that produced this credential. */
    configurationId: string;
    /** Format id the issuer used (`jwt_vc_json`, `ldp_vc`, …). */
    format: string;
}

export interface StoreAcceptedCredentialsResult {
    stored: StoredCredentialEntry[];
    /**
     * Per-credential failures — storage of one credential failing should not
     * abort the batch, so we surface partial success.
     */
    failures: Array<{
        configurationId: string;
        format: string;
        error: VciError;
    }>;
}

/**
 * Persist a batch of credentials returned by {@link acceptCredentialOffer}
 * into the host LearnCard's store + index planes.
 *
 * Each credential is normalized (JWT → W3C VC), uploaded to the store plane
 * to get a URI, then indexed so it appears in the wallet UI.
 *
 * Errors are caught per-credential so a single failure doesn't abort the
 * rest of the batch. Callers should inspect `failures` to decide whether
 * to surface a partial-success toast or retry.
 */
export const storeAcceptedCredentials = async (
    learnCard: LearnCard<any, any, any>,
    accepted: AcceptedCredentialResult,
    options: StoreAcceptedCredentialsOptions = {}
): Promise<StoreAcceptedCredentialsResult> => {
    const storage = options.storage ?? DEFAULT_STORE_PLUGIN;
    const encrypt = options.encrypt ?? true;
    const makeId = options.makeId ?? defaultMakeId;

    const upload = options.upload ?? resolveUpload(learnCard, storage, encrypt);
    const addToIndex = options.addToIndex ?? resolveAddToIndex(learnCard, storage);

    const stored: StoredCredentialEntry[] = [];
    const failures: StoreAcceptedCredentialsResult['failures'] = [];

    for (let i = 0; i < accepted.credentials.length; i++) {
        const entry = accepted.credentials[i];

        try {
            const normalized: NormalizedCredential = normalizeIssuedCredential(
                entry.credential,
                entry.format
            );

            const uri = await safeUpload(upload, normalized.vc);

            const recordId = makeId();

            const record: IndexRecord = {
                id: recordId,
                uri,
                category: resolveCategory(options.category, normalized.vc, i),
                ...(resolveOptional(options.title, normalized.vc, i) && {
                    title: resolveOptional(options.title, normalized.vc, i) as string,
                }),
                ...(resolveOptional(options.imgUrl, normalized.vc, i) && {
                    imgUrl: resolveOptional(options.imgUrl, normalized.vc, i) as string,
                }),
                __v: 1,
            };

            await safeAddToIndex(addToIndex, record);

            stored.push({
                uri,
                recordId,
                vc: normalized.vc,
                configurationId: entry.configuration_id,
                format: normalized.rawFormat,
            });
        } catch (e) {
            failures.push({
                configurationId: entry.configuration_id,
                format: entry.format,
                error:
                    e instanceof VciError
                        ? e
                        : new VciError(
                              'store_failed',
                              `Unexpected error while storing credential: ${e instanceof Error ? e.message : String(e)}`,
                              { cause: e }
                          ),
            });
        }
    }

    return { stored, failures };
};

// ---------- helpers ----------

const resolveCategory = (
    category: StoreAcceptedCredentialsOptions['category'],
    vc: W3CVerifiableCredential,
    index: number
): string => {
    if (typeof category === 'string') return category;
    if (typeof category === 'function') return category(vc, index);
    return defaultCategoryFor(vc);
};

const resolveOptional = <T>(
    value: string | undefined | ((vc: W3CVerifiableCredential, index: number) => T | undefined),
    vc: W3CVerifiableCredential,
    index: number
): T | string | undefined => {
    if (typeof value === 'string') return value;
    if (typeof value === 'function') return value(vc, index);
    return undefined;
};

/**
 * Simple heuristic mapping VC `type` entries to wallet categories. Kept
 * small and override-able; the host wallet app usually has richer mapping
 * that the caller can plug in via `options.category`.
 */
const defaultCategoryFor = (vc: W3CVerifiableCredential): string => {
    const types = toTypeArray(vc.type);

    // ID documents first — so a credential with both Identity + Achievement
    // claims is treated as an ID rather than an achievement.
    if (types.some(matchesAny(ID_TYPES))) return 'ID';
    if (types.some(matchesAny(ACHIEVEMENT_TYPES))) return 'Achievement';
    if (types.some(matchesAny(WORK_TYPES))) return 'Work';
    if (types.some(matchesAny(LEARNING_HISTORY_TYPES))) return 'Learning History';

    return 'Achievement';
};

const ID_TYPES = ['IdentityCredential', 'VerifiableId', 'MobileDriversLicense'];
const ACHIEVEMENT_TYPES = [
    'OpenBadgeCredential',
    'AchievementCredential',
    'UniversityDegreeCredential',
    'MicroCredential',
];
const WORK_TYPES = ['EmploymentCredential', 'WorkExperienceCredential'];
const LEARNING_HISTORY_TYPES = ['CourseCompletionCredential', 'LearningHistoryCredential'];

const matchesAny = (list: string[]) => (t: string) => list.includes(t);

const toTypeArray = (type: string[] | string | undefined): string[] => {
    if (Array.isArray(type)) return type.filter((t): t is string => typeof t === 'string');
    if (typeof type === 'string') return [type];
    return [];
};

type UploadFn = NonNullable<StoreAcceptedCredentialsOptions['upload']>;
type AddToIndexFn = NonNullable<StoreAcceptedCredentialsOptions['addToIndex']>;

const resolveUpload = (
    learnCard: LearnCard<any, any, any>,
    storage: string,
    encrypt: boolean
): UploadFn => {
    const storePlane = (learnCard as unknown as { store?: Record<string, unknown> }).store;
    const plugin = storePlane?.[storage] as
        | {
              upload?: (credential: unknown) => Promise<string>;
              uploadEncrypted?: (credential: unknown, opts?: unknown) => Promise<string>;
          }
        | undefined;

    if (!plugin) {
        throw new VciError(
            'store_plane_missing',
            `LearnCard has no store plugin named "${storage}" — did you forget to add @learncard/learn-cloud-plugin?`
        );
    }

    if (encrypt && typeof plugin.uploadEncrypted === 'function') {
        return credential => plugin.uploadEncrypted!(credential);
    }

    if (typeof plugin.upload === 'function') {
        return credential => plugin.upload!(credential);
    }

    throw new VciError(
        'store_plane_missing',
        `Store plugin "${storage}" implements neither \`upload\` nor \`uploadEncrypted\``
    );
};

const resolveAddToIndex = (
    learnCard: LearnCard<any, any, any>,
    storage: string
): AddToIndexFn => {
    const indexPlane = (learnCard as unknown as { index?: Record<string, unknown> }).index;
    const plugin = indexPlane?.[storage] as
        | { add?: (record: IndexRecord) => Promise<unknown> }
        | undefined;

    if (!plugin || typeof plugin.add !== 'function') {
        throw new VciError(
            'index_plane_missing',
            `LearnCard has no index plugin named "${storage}" exposing an \`add\` method`
        );
    }

    return record => plugin.add!(record);
};

const safeUpload = async (upload: UploadFn, vc: W3CVerifiableCredential): Promise<string> => {
    let uri: string;

    try {
        uri = await upload(vc);
    } catch (e) {
        throw new VciError(
            'store_failed',
            `Store plane rejected the credential upload: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    if (typeof uri !== 'string' || uri.length === 0) {
        throw new VciError(
            'store_failed',
            'Store plane upload returned an empty URI — refusing to index an unresolvable credential'
        );
    }

    return uri;
};

const safeAddToIndex = async (addToIndex: AddToIndexFn, record: IndexRecord): Promise<void> => {
    try {
        await addToIndex(record);
    } catch (e) {
        throw new VciError(
            'index_failed',
            `Index plane rejected the credential record: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }
};

/**
 * Default id factory. Uses WebCrypto's randomUUID() where available and
 * falls back to a simple random string — good enough for index record ids
 * which are only used locally.
 */
const defaultMakeId = (): string => {
    const cryptoImpl = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (cryptoImpl && typeof cryptoImpl.randomUUID === 'function') {
        return cryptoImpl.randomUUID();
    }

    // Fallback: 16 random bytes hex-encoded. Not RFC-4122 but unique enough
    // for a local index record.
    const bytes = new Uint8Array(16);
    const cryptoSubtle = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } })
        .crypto;
    if (cryptoSubtle && typeof cryptoSubtle.getRandomValues === 'function') {
        cryptoSubtle.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};
