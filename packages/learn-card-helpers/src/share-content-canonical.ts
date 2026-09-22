/** C1 request serialization shared by the signing client and verifying service. */
export const DEFAULT_MAX_CANONICAL_BYTES = 2 * 1024 * 1024;
export const DEFAULT_MAX_CANONICAL_DEPTH = 32;

const LONE_SURROGATE_RE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

export class ShareContentCanonicalizationError extends Error {
    readonly code = 'UNSUPPORTED_REQUEST_VALUE';

    constructor(message: string) {
        super(message);
        this.name = 'ShareContentCanonicalizationError';
    }
}

const serializeCanonical = (
    value: unknown,
    seen: Set<object>,
    depth: number,
    maxDepth: number
): string => {
    if (value === null) return 'null';

    switch (typeof value) {
        case 'boolean':
            return value ? 'true' : 'false';

        case 'string': {
            if (LONE_SURROGATE_RE.test(value)) {
                throw new ShareContentCanonicalizationError(
                    'string contains an unpaired surrogate'
                );
            }

            return JSON.stringify(value);
        }

        case 'number': {
            if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
                throw new ShareContentCanonicalizationError(
                    'numbers must be safe integers without a negative-zero sign'
                );
            }

            return String(value);
        }

        case 'object': {
            if (depth >= maxDepth) {
                throw new ShareContentCanonicalizationError(
                    'value exceeds the maximum nesting depth'
                );
            }

            if (seen.has(value)) {
                throw new ShareContentCanonicalizationError('cyclic value is not supported');
            }

            seen.add(value);

            try {
                if (Array.isArray(value)) {
                    const items: string[] = [];

                    for (let index = 0; index < value.length; index += 1) {
                        if (!(index in value)) {
                            throw new ShareContentCanonicalizationError(
                                'sparse arrays are not supported'
                            );
                        }

                        items.push(serializeCanonical(value[index], seen, depth + 1, maxDepth));
                    }

                    return `[${items.join(',')}]`;
                }

                const prototype = Object.getPrototypeOf(value);

                if (prototype !== Object.prototype && prototype !== null) {
                    throw new ShareContentCanonicalizationError('only plain objects are supported');
                }

                const record = value as Record<string, unknown>;

                const entries = Object.keys(record)
                    .sort()
                    .map(key => {
                        if (LONE_SURROGATE_RE.test(key)) {
                            throw new ShareContentCanonicalizationError(
                                'object key contains an unpaired surrogate'
                            );
                        }

                        return `${JSON.stringify(key)}:${serializeCanonical(
                            record[key],
                            seen,
                            depth + 1,
                            maxDepth
                        )}`;
                    });

                return `{${entries.join(',')}}`;
            } finally {
                seen.delete(value);
            }
        }

        default:
            throw new ShareContentCanonicalizationError(`unsupported value type: ${typeof value}`);
    }
};

/** Deterministic UTF-8 canonical serialization of a request body. */
export const canonicalizeShareContentRequestBody = (
    body: unknown,
    options: { maxBytes?: number; maxDepth?: number } = {}
): string => {
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_CANONICAL_BYTES;
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_CANONICAL_DEPTH;
    const serialized = serializeCanonical(body, new Set(), 0, maxDepth);

    if (new TextEncoder().encode(serialized).byteLength > maxBytes) {
        throw new ShareContentCanonicalizationError('canonical request exceeds the maximum size');
    }

    return serialized;
};
