import { describe, expect, it, vi } from 'vitest';

import { getContextURIs, getDocumentMap } from '../src/helpers';

const managedRefreshContext = {
    LearnCardCredentialRefresh2026: 'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
    authorization: {
        '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
        '@context': { LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth' },
    },
};

describe('getContextURIs', () => {
    it('skips inline context objects, including scoped contexts nested inside them', () => {
        expect(
            getContextURIs({
                '@context': ['https://www.w3.org/ns/credentials/v2', managedRefreshContext],
                credentialSubject: { id: 'did:example:123' },
            })
        ).toEqual(['https://www.w3.org/ns/credentials/v2']);
    });

    it('keeps string contexts wherever they appear, including scoped context URLs', () => {
        expect(
            getContextURIs({
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    {
                        achievement: {
                            '@id': 'https://example.com/a',
                            '@context': 'https://example.com/scoped',
                        },
                    },
                ],
                credentialSubject: { '@context': 'https://example.com/subject' },
            })
        ).toEqual([
            'https://www.w3.org/ns/credentials/v2',
            'https://example.com/scoped',
            'https://example.com/subject',
        ]);
    });
});

describe('getDocumentMap', () => {
    it('only asks the context plane to resolve string URIs', async () => {
        const resolveDocument = vi.fn(async (uri: unknown) => ({ '@context': { uri } }));
        const learnCard = { context: { resolveDocument } };

        const documentMap = await getDocumentMap(learnCard as never, {
            '@context': ['https://www.w3.org/ns/credentials/v2', managedRefreshContext],
        });

        expect(resolveDocument.mock.calls.map(([uri]) => uri)).toEqual([
            'https://www.w3.org/ns/credentials/v2',
        ]);
        expect(Object.keys(documentMap)).toEqual(['https://www.w3.org/ns/credentials/v2']);
    });
});
