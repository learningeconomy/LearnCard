/**
 * Category-level `shareUntil` dates of a consent, and the derived `nextShareUntil` scalar that
 * lets the deadline job find consents with a passing date through an index.
 *
 * A date counts only for a category that is being shared (`sharing` true, and the credentials
 * area not switched off with `sharing: false`), the same rule the consented-data reads use.
 * Unparseable or empty dates are ignored.
 *
 * Keep this module free of imports: a small Lambda bundles it.
 */

export type ShareUntilEntry = {
    category: string;
    /** The date as an ISO instant in UTC, so equal instants compare as equal strings. */
    shareUntil: string;
    /** The same instant in epoch milliseconds. */
    at: number;
};

const toEntry = (category: string, value: unknown): ShareUntilEntry | undefined => {
    if (typeof value !== 'string' || !value.trim()) return undefined;

    const at = Date.parse(value);

    return Number.isFinite(at)
        ? { category, shareUntil: new Date(at).toISOString(), at }
        : undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Dated, shared categories of a nested terms object (`{ read: { credentials: ... } }`). */
export const shareUntilEntriesOfTerms = (terms: unknown): ShareUntilEntry[] => {
    const credentials =
        isRecord(terms) && isRecord(terms.read) ? terms.read.credentials : undefined;

    if (!isRecord(credentials) || credentials.sharing === false) return [];

    const categories = credentials.categories;

    if (!isRecord(categories)) return [];

    return Object.entries(categories).flatMap(([category, value]) => {
        if (!isRecord(value) || !value.sharing) return [];

        const entry = toEntry(category, value.shareUntil);

        return entry ? [entry] : [];
    });
};

const FLAT_CATEGORY_KEY = /^terms\.read\.credentials\.categories\.(.+)\.sharing$/;

/**
 * Dated, shared categories of the flattened terms properties stored on the node
 * (`terms.read.credentials.categories.<Category>.shareUntil` and `.sharing`).
 */
export const shareUntilEntriesOfProperties = (
    properties: Record<string, unknown>
): ShareUntilEntry[] => {
    if (properties['terms.read.credentials.sharing'] === false) return [];

    return Object.keys(properties).flatMap(key => {
        const category = FLAT_CATEGORY_KEY.exec(key)?.[1];

        if (!category || !properties[key]) return [];

        const entry = toEntry(
            category,
            properties[`terms.read.credentials.categories.${category}.shareUntil`]
        );

        return entry ? [entry] : [];
    });
};

/** The earliest date in the future, as an ISO string; `null` when there is none. */
export const earliestFutureShareUntil = (
    entries: ShareUntilEntry[],
    now: number
): string | null => {
    const future = entries.filter(entry => entry.at > now).sort((a, b) => a.at - b.at)[0];

    return future?.shareUntil ?? null;
};

/** `nextShareUntil` of a nested terms object. Stored on the terms node by every terms write. */
export const computeNextShareUntil = (terms: unknown, now: number = Date.now()): string | null =>
    earliestFutureShareUntil(shareUntilEntriesOfTerms(terms), now);

/** `nextShareUntil` computed from the flattened properties of a stored terms node. */
export const computeNextShareUntilFromProperties = (
    properties: Record<string, unknown>,
    now: number = Date.now()
): string | null => earliestFutureShareUntil(shareUntilEntriesOfProperties(properties), now);
