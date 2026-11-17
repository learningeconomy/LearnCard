const CURSOR_PREFIX = 'iev2:';
const SEQUENCE_PATTERN = /^(0|[1-9]\d{0,15})$/;

/** Thrown when a well-formed cursor was issued for a different integration. */
export class IntegrationEventCursorMismatchError extends Error {
    constructor() {
        super('Integration event cursor belongs to a different integration');
        this.name = 'IntegrationEventCursorMismatchError';
    }
}

/**
 * Encodes a feed position as an opaque cursor bound to one integration. Sequence 0 means
 * "from the start".
 */
export const encodeIntegrationEventCursor = (integrationId: string, sequence: number): string => {
    if (!integrationId || !Number.isSafeInteger(sequence) || sequence < 0) {
        throw new Error('Invalid integration event sequence');
    }

    return Buffer.from(`${CURSOR_PREFIX}${integrationId}:${sequence}`, 'utf8').toString(
        'base64url'
    );
};

/**
 * Decodes a feed cursor back to its sequence number. Throws a plain Error on anything it did
 * not produce and an IntegrationEventCursorMismatchError for a cursor of another integration.
 */
export const decodeIntegrationEventCursor = (cursor: string, integrationId: string): number => {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const separator = decoded.lastIndexOf(':');
    const cursorIntegrationId =
        decoded.startsWith(CURSOR_PREFIX) && separator >= CURSOR_PREFIX.length
            ? decoded.slice(CURSOR_PREFIX.length, separator)
            : '';
    const sequenceText = decoded.slice(separator + 1);
    const sequence = SEQUENCE_PATTERN.test(sequenceText) ? Number(sequenceText) : Number.NaN;

    if (
        !cursorIntegrationId ||
        !Number.isSafeInteger(sequence) ||
        encodeIntegrationEventCursor(cursorIntegrationId, sequence) !== cursor
    ) {
        throw new Error('Invalid integration event cursor');
    }

    if (cursorIntegrationId !== integrationId) throw new IntegrationEventCursorMismatchError();

    return sequence;
};
