import { describe, expect, it, vi } from 'vitest';
import { ingestText, ingestFile } from './ingest';
import { detectSource } from './detectSource';

vi.mock('learn-card-base', () => ({ getLogger: () => ({ warn: vi.fn() }) }));

describe('spreadsheet and credential import routing', () => {
    it('routes URL-first CSV to spreadsheet review without fetching the URL', async () => {
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        try {
            const result = await ingestText(
                'https://proof.test/a,ada@test.com\nhttps://proof.test/b,bob@test.com'
            );
            expect(result.kind).toBe('spreadsheet');
            expect(fetch).not.toHaveBeenCalled();
        } finally {
            vi.unstubAllGlobals();
        }
    });
    it('gives complete JSON precedence and keeps ordinary prose out of roster detection', () => {
        expect(
            detectSource(JSON.stringify({ people: ['ada@test.com', 'bob@test.com'] }, null, 2)).kind
        ).toBe('json');
        expect(detectSource('Hello, team\nHere are our meeting notes.').kind).toBe('unknown');
        expect(detectSource('https://proof.test/a\nnot-a-url').kind).not.toBe('url');
    });
    it('returns a spreadsheet result for TSV files without inventing credential JSON', async () => {
        const text = 'Email\tName\nada@test.com\tÁda';
        const bytes = new TextEncoder().encode(text);
        const result = await ingestFile({
            name: 'people.tsv',
            size: bytes.byteLength,
            arrayBuffer: async () => bytes.buffer,
        } as File);
        expect(result).toMatchObject({
            kind: 'spreadsheet',
            source: {
                name: 'people.tsv',
                sheets: {
                    Sheet1: [
                        [{ text: 'Email' }, { text: 'Name' }],
                        [{ text: 'ada@test.com' }, { text: 'Áda' }],
                    ],
                },
            },
        });
        expect(result).not.toHaveProperty('value');
    });
});
