import { describe, expect, it } from 'vitest';

import { getEvidenceMimeType, toSafeFileName } from './evidence';

describe('CLR evidence metadata', () => {
    it.each([
        ['https://example.com/evidence.pdf?download=1#page=2', 'application/pdf'],
        ['https://example.com/photo.JPG', 'image/jpeg'],
        ['https://example.com/diagram.svg', 'image/svg+xml'],
        ['data:application/pdf;base64,AAAA', 'application/pdf'],
        ['data:text/plain,hello', 'text/plain'],
        ['data:broken', undefined],
    ])('extracts the media type for %s', (url, expected) => {
        expect(getEvidenceMimeType(url)).toBe(expected);
    });

    it('preserves existing extensions and uses a valid SVG filename suffix', () => {
        expect(toSafeFileName('Training Record.pdf', 'application/pdf')).toBe(
            'Training_Record.pdf'
        );
        expect(toSafeFileName('Training Record', 'application/pdf')).toBe('Training_Record.pdf');
        expect(toSafeFileName('Diagram', 'image/svg+xml')).toBe('Diagram.svg');
        expect(toSafeFileName('   ', 'image/jpeg')).toBe('evidence.jpeg');
    });
});
