import { createHash } from 'node:crypto';
import { canonicalizeShareContentRequestBody } from '@learncard/helpers';

export {
    canonicalizeShareContentRequestBody,
    DEFAULT_MAX_CANONICAL_BYTES,
    DEFAULT_MAX_CANONICAL_DEPTH,
    ShareContentCanonicalizationError,
} from '@learncard/helpers';

/**
 * SHA-256 (lowercase hex) over the canonical request body. This is exactly the
 * value signed into `claims.requestHash` and recomputed by C1.
 */
export const computeShareContentRequestBodyHash = (
    body: unknown,
    options: { maxBytes?: number; maxDepth?: number } = {}
): string =>
    createHash('sha256')
        .update(canonicalizeShareContentRequestBody(body, options), 'utf8')
        .digest('hex');

/** Strict lowercase hex SHA-256. */
export const isSha256Hex = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
