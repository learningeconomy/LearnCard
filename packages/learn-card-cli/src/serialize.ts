/**
 * Turn any value an SDK method or HTTP endpoint returns into plain JSON that
 * `JSON.stringify` can always print, so `call` and `api` never crash while printing.
 */

export type JsonValue =
    null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface JsonSafeOptions {
    /** Secret strings (e.g. the seed) replaced by `[REDACTED]` wherever they appear. */
    redact?: readonly (string | undefined)[];
    /** Nesting limit; deeper values become `"[Truncated]"` (default: 64). */
    maxDepth?: number;
}

export const REDACTED = '[REDACTED]';
export const CIRCULAR = '[Circular]';
export const TRUNCATED = '[Truncated]';

/** Secrets shorter than this are not redacted (they would mangle ordinary text). */
const MIN_REDACT_LENGTH = 8;

const toBase64 = (bytes: Uint8Array): string =>
    Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');

/**
 * Every encoding of a hex seed that could leak through a result: the hex as stored, padded
 * to 32 bytes (as `@learncard/didkey-plugin` does), upper-case, and the raw bytes in
 * base64 / base64url. The Ed25519 private JWK's `d` is the seed bytes in base64url, so
 * redacting only the hex would let `getSubjectKeypair --show-secret` print the seed.
 */
export const seedRedactions = (seed: string | undefined): string[] => {
    if (!seed || !/^[0-9a-f]+$/i.test(seed)) return seed ? [seed] : [];
    const padded = seed.length % 2 === 0 ? seed.padStart(64, '0') : `0${seed}`.padStart(64, '0');
    const bytes = Buffer.from(padded, 'hex');
    const base64 = bytes.toString('base64');
    const base64Url = bytes.toString('base64url');
    return [
        ...new Set([
            seed,
            padded,
            padded.toLowerCase(),
            padded.toUpperCase(),
            base64,
            base64.replace(/=+$/, ''),
            base64Url,
        ]),
    ];
};

/**
 * JSON-safe copy of `value`:
 * - `bigint` → decimal string; non-finite numbers → `null`
 * - `Uint8Array` / `Buffer` / `ArrayBuffer` / `DataView` → base64 string; other typed arrays → arrays
 * - `Map` → `[key, value][]`; `Set` → array
 * - `Date` → ISO string (`null` when invalid); objects with `toJSON()` → its result
 * - `Error` → `{ name, message, code? }`
 * - a reference back to an ancestor → `"[Circular]"` (shared, non-circular references are kept)
 * - functions, symbols and `undefined` are dropped from objects and become `null` in arrays
 *   (and at the top level)
 * - every occurrence of a `redact` secret inside strings and keys → `"[REDACTED]"`
 */
export const toJsonSafe = (value: unknown, options: JsonSafeOptions = {}): JsonValue => {
    const secrets = (options.redact ?? []).filter(
        (secret): secret is string => !!secret && secret.length >= MIN_REDACT_LENGTH
    );
    const maxDepth = options.maxDepth ?? 64;
    const ancestors: object[] = [];

    const scrub = (text: string): string =>
        secrets.reduce((result, secret) => result.split(secret).join(REDACTED), text);

    const visit = (input: unknown, depth: number): JsonValue | undefined => {
        if (input === null) return null;
        switch (typeof input) {
            case 'string':
                return scrub(input);
            case 'number':
                return Number.isFinite(input) ? input : null;
            case 'boolean':
                return input;
            case 'bigint':
                return input.toString();
            case 'undefined':
            case 'function':
            case 'symbol':
                return undefined;
            default:
                break;
        }
        const object = input as object;
        if (object instanceof Date)
            return Number.isNaN(object.getTime()) ? null : object.toISOString();
        if (object instanceof Uint8Array) return toBase64(object);
        if (object instanceof ArrayBuffer) return toBase64(new Uint8Array(object));
        if (object instanceof DataView)
            return toBase64(new Uint8Array(object.buffer, object.byteOffset, object.byteLength));
        if (ancestors.includes(object)) return CIRCULAR;
        if (depth >= maxDepth) return TRUNCATED;

        ancestors.push(object);
        try {
            const child = (item: unknown): JsonValue => visit(item, depth + 1) ?? null;
            if (ArrayBuffer.isView(object))
                return Array.from(object as unknown as ArrayLike<unknown>, child);
            if (Array.isArray(object)) return object.map(child);
            if (object instanceof Map)
                return Array.from(object.entries(), ([key, item]) => [child(key), child(item)]);
            if (object instanceof Set) return Array.from(object.values(), child);
            if (object instanceof Error) {
                const code = (object as { code?: unknown }).code;
                return {
                    name: scrub(object.name),
                    message: scrub(object.message),
                    ...(code !== undefined ? { code: child(code) } : {}),
                };
            }
            const toJSON = (object as { toJSON?: unknown }).toJSON;
            if (typeof toJSON === 'function') {
                const replacement: unknown = toJSON.call(object);
                if (replacement !== object) return visit(replacement, depth + 1) ?? null;
            }
            const result: Record<string, JsonValue> = {};
            for (const [key, item] of Object.entries(object)) {
                const safe = visit(item, depth + 1);
                if (safe !== undefined) result[scrub(key)] = safe;
            }
            return result;
        } finally {
            ancestors.pop();
        }
    };

    return visit(value, 0) ?? null;
};
