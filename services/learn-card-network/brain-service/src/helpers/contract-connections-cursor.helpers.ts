const CURSOR_PREFIX = 'ccv1:';

/** Encodes the last terms id of a page as an opaque cursor. */
export const encodeContractConnectionsCursor = (termsId: string): string =>
    Buffer.from(`${CURSOR_PREFIX}${termsId}`, 'utf8').toString('base64url');

/** Decodes a connections cursor back to a terms id. Throws on anything it did not produce. */
export const decodeContractConnectionsCursor = (cursor: string): string => {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const termsId = decoded.startsWith(CURSOR_PREFIX) ? decoded.slice(CURSOR_PREFIX.length) : '';

    if (!termsId || encodeContractConnectionsCursor(termsId) !== cursor) {
        throw new Error('Invalid contract connections cursor');
    }

    return termsId;
};
