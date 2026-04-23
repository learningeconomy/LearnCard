/**
 * Pathway serialization — the bridge between in-memory `Pathway`
 * objects and JSON bytes that cross the network, a disk, or the
 * offline queue.
 *
 * The shape is plain JSON today (Zod is strict about ISO-8601 strings,
 * not `Date`; no Map/Set in the tree; no cycles by construction). The
 * value this module adds is the **migration hinge**: every serialized
 * pathway carries `schemaVersion`, and `deserializePathway` fans into
 * the right migrator before parsing.
 *
 * Ship it now, while the migrator table is empty, so the first real
 * migration is a matter of appending one entry — not introducing a
 * whole new API seam under pressure.
 *
 * See `docs/pathways-storage-and-sync.md` § 6.1 for why this plumbing
 * exists ahead of the server wire-up.
 */

import {
    CURRENT_PATHWAY_SCHEMA_VERSION,
    Pathway,
    PathwaySchema,
} from '../types';

// -----------------------------------------------------------------
// Errors
// -----------------------------------------------------------------

/**
 * Thrown when the incoming document can't be coerced into a valid
 * `Pathway`. Callers should render a friendly "we couldn't open this
 * pathway" message and never surface the raw message to learners —
 * the underlying causes are usually developer-facing (corrupt JSON,
 * schema drift, unknown version).
 */
export class PathwaySerializationError extends Error {
    constructor(
        message: string,
        public readonly cause?: unknown,
    ) {
        super(message);
        this.name = 'PathwaySerializationError';
    }
}

// -----------------------------------------------------------------
// Serialized shape
// -----------------------------------------------------------------

/**
 * What a serialized pathway looks like on the wire / in storage.
 *
 * It's structurally identical to `Pathway` today — the distinct type
 * exists so callers can't accidentally pass a runtime `Pathway` where
 * a persisted one was expected (and vice versa). When a future
 * schema version adds a wrapping envelope (e.g. a JWE with a payload
 * field, or a { schemaVersion, payload } separation), this is the
 * one place that has to change.
 *
 * The `schemaVersion` on the document drives migration routing. It
 * is permitted to be missing on documents written before the field
 * existed — `deserializePathway` treats absence as "pre-versioned"
 * and defaults to version 1.
 */
export interface SerializedPathway {
    readonly schemaVersion?: number;
    readonly [key: string]: unknown;
}

// -----------------------------------------------------------------
// Migrator registry
// -----------------------------------------------------------------

/**
 * A migrator takes a pathway *document at version N* and returns the
 * equivalent document at version N+1. It operates on the untyped
 * `SerializedPathway` shape because at migration time the document
 * doesn't yet match the current Zod schema (that's the whole point
 * of migrating).
 *
 * Migrators must be:
 *   - **Pure.** No network, no date math, no randomness.
 *   - **Total.** Every document at version N produces a valid N+1 doc.
 *   - **Idempotent on re-run.** Running the same migrator twice on
 *     the same document should produce the same shape. (The runner
 *     below guarantees this by checking version monotonicity, but
 *     author your migrators to be defensive anyway.)
 *
 * Add entries to `MIGRATORS` in ascending order keyed by the *source*
 * version — e.g. `MIGRATORS[1]` is the v1 → v2 migrator.
 */
export type PathwayMigrator = (doc: SerializedPathway) => SerializedPathway;

/**
 * Registry of schema migrators. Currently empty — no migrations have
 * been needed yet. When you introduce one:
 *
 *   1. Bump `CURRENT_PATHWAY_SCHEMA_VERSION` in `types/pathway.ts`.
 *   2. Add the migrator here keyed by the *source* version.
 *   3. Write a test in `core/serialize.test.ts` that round-trips a
 *      fixture document from the old version to the new one.
 */
export const MIGRATORS: Readonly<Record<number, PathwayMigrator>> = Object.freeze({});

// -----------------------------------------------------------------
// serializePathway
// -----------------------------------------------------------------

/**
 * Produce a plain JSON-serializable snapshot of a pathway.
 *
 * **Contract** — the returned value satisfies:
 *   - `JSON.stringify(serializePathway(p))` succeeds without throwing
 *   - `JSON.parse(JSON.stringify(...))` produces a deeply-equal object
 *   - The stamped `schemaVersion` equals `CURRENT_PATHWAY_SCHEMA_VERSION`
 *     (we upgrade on write — legacy docs don't stay at their old
 *     version indefinitely, even if they never go through a real
 *     migration)
 *
 * This is a pure function — no store access, no timestamps. Callers
 * that need a revision bump do it via `stampRevision` (in `buildOps`)
 * or at the store boundary before serializing.
 *
 * **Why not just return the `Pathway` directly?** Two reasons: (1) the
 * type distinction between runtime and persisted shapes catches bugs
 * at compile time, (2) we always want the version stamp on the wire,
 * and doing it here (not leaving it up to callers) prevents drift.
 */
export const serializePathway = (pathway: Pathway): SerializedPathway => {
    // `JSON.parse(JSON.stringify(...))` is the cheapest "guaranteed
    // plain JSON" operation — it strips any class instances, function
    // properties, or symbols that might sneak in through a patch
    // object. Our schemas don't allow any of those today, but this
    // belt-and-suspenders approach makes the property test honest.
    const cloned = JSON.parse(JSON.stringify(pathway)) as Record<string, unknown>;

    return {
        ...cloned,
        schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
    };
};

// -----------------------------------------------------------------
// deserializePathway
// -----------------------------------------------------------------

/**
 * Parse a serialized pathway, applying any pending migrations before
 * validating against the current Zod schema.
 *
 * Migration semantics:
 *
 *   - Missing `schemaVersion` → treat as version 1.
 *   - Source version > current → throw. This is a future-dated
 *     document; we can't safely downgrade.
 *   - Source version < current → run each migrator from source to
 *     current in order.
 *   - Each step is validated against its own shape by Zod only at the
 *     final stage (not between migrations — partial shapes might
 *     not satisfy any Zod schema we still have around).
 *
 * Returns a validated `Pathway` or throws `PathwaySerializationError`.
 */
export const deserializePathway = (doc: unknown): Pathway => {
    if (typeof doc !== 'object' || doc === null) {
        throw new PathwaySerializationError(
            `Expected a pathway object, got ${doc === null ? 'null' : typeof doc}`,
        );
    }

    const docAsAny = doc as SerializedPathway;

    // Absence of schemaVersion is treated as the implicit initial
    // version (1). Anything else must be a positive integer — we
    // don't accept floats or zero as a "schema version" because the
    // registry is keyed by integer.
    const rawVersion = docAsAny.schemaVersion;

    let sourceVersion: number;

    if (rawVersion === undefined || rawVersion === null) {
        sourceVersion = 1;
    } else if (
        typeof rawVersion !== 'number' ||
        !Number.isInteger(rawVersion) ||
        rawVersion < 1
    ) {
        throw new PathwaySerializationError(
            `Invalid schemaVersion ${String(rawVersion)} — expected a positive integer`,
        );
    } else {
        sourceVersion = rawVersion;
    }

    if (sourceVersion > CURRENT_PATHWAY_SCHEMA_VERSION) {
        throw new PathwaySerializationError(
            `Pathway document is at schemaVersion ${sourceVersion} but this client understands ` +
                `only up to ${CURRENT_PATHWAY_SCHEMA_VERSION}. Refusing to downgrade.`,
        );
    }

    // Step the document forward one version at a time. We clone on
    // entry so migrators never accidentally mutate the caller's doc.
    let current: SerializedPathway = { ...docAsAny };

    for (let v = sourceVersion; v < CURRENT_PATHWAY_SCHEMA_VERSION; v++) {
        const migrator = MIGRATORS[v];

        if (!migrator) {
            throw new PathwaySerializationError(
                `No migrator registered for schemaVersion ${v} → ${v + 1}. ` +
                    `Every step between the source and current version must have one.`,
            );
        }

        current = { ...migrator(current), schemaVersion: v + 1 };
    }

    // After migration, force the version stamp to current so the
    // Zod-parsed output carries the right number regardless of what
    // the last migrator produced.
    current = { ...current, schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION };

    const parsed = PathwaySchema.safeParse(current);

    if (!parsed.success) {
        throw new PathwaySerializationError(
            'Pathway document failed schema validation after migration',
            parsed.error,
        );
    }

    return parsed.data;
};

// -----------------------------------------------------------------
// Convenience: JSON round-trip
// -----------------------------------------------------------------

/**
 * Serialize to a JSON string. Wraps `serializePathway` + `JSON.stringify`
 * so callers don't re-do the plumbing at the network/storage boundary.
 * Uses stable key ordering is *not* promised — object-key order in
 * `JSON.stringify` follows the runtime's insertion order, which is
 * fine for parity but should not be relied on for content hashing.
 */
export const stringifyPathway = (pathway: Pathway): string =>
    JSON.stringify(serializePathway(pathway));

/**
 * Parse a JSON string and deserialize it into a `Pathway`. Raises
 * `PathwaySerializationError` on either JSON-parse failure or schema
 * validation failure.
 */
export const parsePathway = (json: string): Pathway => {
    let doc: unknown;

    try {
        doc = JSON.parse(json);
    } catch (cause) {
        throw new PathwaySerializationError('Pathway JSON is not valid JSON', cause);
    }

    return deserializePathway(doc);
};
