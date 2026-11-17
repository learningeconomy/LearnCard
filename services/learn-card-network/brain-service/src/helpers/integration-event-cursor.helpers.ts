const CURSOR_PREFIX = 'iev1:';
const CURSOR_PATTERN = /^iev1:(0|[1-9]\d{0,15})$/;

/** Encodes a feed sequence number as an opaque cursor. Sequence 0 means "from the start". */
export const encodeIntegrationEventCursor = (sequence: number): string => {
    if (!Number.isSafeInteger(sequence) || sequence < 0) {
        throw new Error('Invalid integration event sequence');
    }

    return Buffer.from(`${CURSOR_PREFIX}${sequence}`, 'utf8').toString('base64url');
};

/** Decodes a feed cursor back to its sequence number. Throws on anything it did not produce. */
export const decodeIntegrationEventCursor = (cursor: string): number => {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const match = CURSOR_PATTERN.exec(decoded);
    const sequence = match ? Number(match[1]) : Number.NaN;

    if (!Number.isSafeInteger(sequence) || encodeIntegrationEventCursor(sequence) !== cursor) {
        throw new Error('Invalid integration event cursor');
    }

    return sequence;
};
