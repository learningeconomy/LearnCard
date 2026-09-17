import { describe, expect, it } from 'vitest';

import { getSharedCredentialIndexQuery } from '../mutation.helpers';

describe('shared credential cache identity', () => {
    it('selects distinct presentations under LearnCloud OR-query semantics', () => {
        const firstQuery = getSharedCredentialIndexQuery(
            'lc:credential:shared-record',
            'urn:uuid:credential-a'
        );
        const secondQuery = getSharedCredentialIndexQuery(
            'lc:credential:shared-record',
            'urn:uuid:credential-b'
        );
        const records = [
            { ...firstQuery, uri: 'presentation:a' },
            { ...secondQuery, uri: 'presentation:b' },
        ];
        const readWithOrSemantics = (query: object) =>
            records.filter(record =>
                Object.entries(query).some(
                    ([field, value]) => (record as Record<string, unknown>)[field] === value
                )
            );

        expect(readWithOrSemantics(firstQuery)).toEqual([records[0]]);
        expect(readWithOrSemantics(secondQuery)).toEqual([records[1]]);
    });

    it('keeps the legacy record-only identity for unsigned credentials', () => {
        expect(getSharedCredentialIndexQuery('lc:credential:unsigned')).toEqual({
            sharedCredentialUri: 'lc:credential:unsigned',
        });
    });
});
