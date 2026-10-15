import { expect, test } from 'bun:test';
import { validateCollectionCursor } from './collection-pagination';

test('allows an advancing page and a terminal page without a cursor', () => {
    expect(() => validateCollectionCursor(true, 'next', new Set(['previous']))).not.toThrow();
    expect(() => validateCollectionCursor(false, undefined, new Set(['previous']))).not.toThrow();
});
test('rejects missing, repeated and cyclic cursors rather than endlessly fetching', () => {
    for (const next of [undefined, '', 'previous', 'earlier']) {
        expect(() =>
            validateCollectionCursor(true, next, new Set(['earlier', 'previous']))
        ).toThrow();
    }
});
test('does not advance the cursor journal until the caller has read the page', () => {
    const visited = new Set(['earlier']);
    validateCollectionCursor(true, 'next', visited);
    expect([...visited]).toEqual(['earlier']);
});
