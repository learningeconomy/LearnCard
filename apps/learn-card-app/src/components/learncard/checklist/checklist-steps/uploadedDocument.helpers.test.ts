import { describe, expect, it } from 'vitest';
import { readUploadedDocument } from './uploadedDocument.helpers';

const original = {
    type: 'certificate',
    fileName: 'certificate.pdf',
    fileSize: '1 KB',
    fileType: 'PDF',
    data: 'data:application/pdf;base64,YQ==',
};

describe('readUploadedDocument', () => {
    it('keeps readable and legacy originals alongside independently removable broken records', async () => {
        const documents = new Map<string, unknown>([
            ['good', { id: 'source-good', rawArtifact: original }],
            ['legacy', { rawArtifact: { ...original, fileName: 'legacy.pdf' } }],
        ]);
        const records = ['good', 'legacy', 'missing', 'failed'].map(uri => ({
            id: `index-${uri}`,
            uri,
        }));
        const read = async (uri: string): Promise<unknown> => {
            if (uri === 'failed') throw new Error('PRIVATE_READ_ERROR');
            return documents.get(uri);
        };
        const results = await Promise.all(
            records.map(record => readUploadedDocument(record, read, 'certificate'))
        );
        expect(
            results.map(({ id, artifactId, unavailable }) => ({ id, artifactId, unavailable }))
        ).toEqual([
            { id: 'index-good', artifactId: 'source-good', unavailable: false },
            { id: 'index-legacy', artifactId: 'index-legacy', unavailable: false },
            { id: 'index-missing', artifactId: 'index-missing', unavailable: true },
            { id: 'index-failed', artifactId: 'index-failed', unavailable: true },
        ]);
        expect(results[0].data).toBe(original.data);
        expect(results[1]).toMatchObject({ fileName: 'legacy.pdf', data: original.data });
        expect(results.slice(2).map(result => result.data)).toEqual(['', '']);
    });

    it.each([undefined, null, 'invalid', { data: '' }, { ...original, data: '' }])(
        'keeps the index identity but disables preview for malformed artifact %j',
        async rawArtifact => {
            const result = await readUploadedDocument(
                { id: 'index-broken', uri: 'broken-uri' },
                async () => ({ id: 'source-broken', rawArtifact }),
                'resume'
            );
            expect(result).toMatchObject({
                id: 'index-broken',
                uri: 'broken-uri',
                artifactId: 'source-broken',
                type: 'resume',
                data: '',
                unavailable: true,
            });
        }
    );
});
