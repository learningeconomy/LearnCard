import { describe, expect, it } from 'vitest';

import { findEndorsementForRequest, getEndorsementRequestId } from './endorsement-request.helpers';

describe('endorsement request identity', () => {
    const sentEndorsements = [
        {
            uri: 'endorsement:first',
            metadata: {
                type: 'endorsement',
                sharedUri: 'uri=credential%3Afirst&seed=first-seed&pin=1111',
            },
        },
        {
            uri: 'endorsement:second',
            metadata: {
                type: 'endorsement',
                sharedUri: 'uri=credential%3Asecond&seed=second-seed&pin=2222',
            },
        },
    ];

    it('selects each concurrent request independently', () => {
        expect(
            findEndorsementForRequest(
                sentEndorsements,
                'https://learncard.app/?pin=2222&uri=credential%3Asecond&seed=second-seed&endorsementRequest=true'
            )?.uri
        ).toBe('endorsement:second');
        expect(
            findEndorsementForRequest(
                sentEndorsements,
                'uri=credential%3Afirst&seed=first-seed&pin=1111'
            )?.uri
        ).toBe('endorsement:first');
    });

    it('does not reuse an endorsement from another request', () => {
        expect(
            findEndorsementForRequest(
                sentEndorsements,
                'uri=credential%3Athird&seed=third-seed&pin=3333'
            )
        ).toBeUndefined();
    });

    it('requires the complete request identity', () => {
        expect(getEndorsementRequestId('uri=credential%3Afirst&seed=first-seed')).toBeUndefined();
    });
});
