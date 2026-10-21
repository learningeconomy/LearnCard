import { describe, expect, it } from 'vitest';

import {
    createEndorsementShareLinkInfo,
    findEndorsementForRequest,
    getEndorsementRequestBaseUrl,
    getEndorsementRequestId,
} from './endorsement-request.helpers';

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

    it('handles a missing sent-credential result', () => {
        expect(
            findEndorsementForRequest(undefined, 'uri=credential%3Afirst&seed=first-seed&pin=1111')
        ).toBeUndefined();
    });

    it('encodes request identity values before storing them', () => {
        const sharedUri = createEndorsementShareLinkInfo({
            uri: 'credential:test?version=1&source=event',
            seed: 'seed+with/slashes=',
            pin: '12&34',
        });

        expect(getEndorsementRequestId(sharedUri)).toBe(
            JSON.stringify([
                'credential:test?version=1&source=event',
                'seed+with/slashes=',
                '12&34',
                null,
            ])
        );
    });

    it('uses the current web origin and the public tenant origin on native', () => {
        expect(
            getEndorsementRequestBaseUrl(
                'https://learncard.app',
                'https://preview.example.com',
                false
            )
        ).toBe('https://preview.example.com');
        expect(
            getEndorsementRequestBaseUrl('https://learncard.app', 'capacitor://localhost', true)
        ).toBe('https://learncard.app');
        expect(
            getEndorsementRequestBaseUrl('https://learncard.app', 'https://localhost', true)
        ).toBe('https://learncard.app');
    });

    it('separates credentials even when a legacy share link was reused', () => {
        const reusedLinkEndorsements = [
            {
                uri: 'endorsement:first',
                metadata: {
                    type: 'endorsement',
                    sharedUri:
                        'uri=shared%3Apresentation&seed=reused-seed&pin=1234&credentialId=credential%3Afirst',
                },
            },
            {
                uri: 'endorsement:second',
                metadata: {
                    type: 'endorsement',
                    sharedUri:
                        'uri=shared%3Apresentation&seed=reused-seed&pin=1234&credentialId=credential%3Asecond',
                },
            },
        ];

        expect(
            findEndorsementForRequest(
                reusedLinkEndorsements,
                'uri=shared%3Apresentation&seed=reused-seed&pin=1234&credentialId=credential%3Asecond'
            )?.uri
        ).toBe('endorsement:second');
    });

    it('uses stored credential metadata to disambiguate legacy links', () => {
        const legacyEndorsements = [
            {
                uri: 'endorsement:first',
                metadata: {
                    type: 'endorsement',
                    sharedUri: 'uri=shared%3Apresentation&seed=reused-seed&pin=1234',
                    credentialId: 'credential:first',
                },
            },
            {
                uri: 'endorsement:second',
                metadata: {
                    type: 'endorsement',
                    sharedUri: 'uri=shared%3Apresentation&seed=reused-seed&pin=1234',
                    credentialId: 'credential:second',
                },
            },
        ];

        expect(
            findEndorsementForRequest(
                legacyEndorsements,
                'uri=shared%3Apresentation&seed=reused-seed&pin=1234&credentialId=credential%3Asecond'
            )?.uri
        ).toBe('endorsement:second');
    });

    it('matches legacy requests without using newer credential metadata', () => {
        const legacyEndorsement = {
            uri: 'endorsement:legacy',
            metadata: {
                type: 'endorsement',
                sharedUri: 'uri=shared%3Apresentation&seed=legacy-seed&pin=1234',
                credentialId: 'credential:new-metadata',
            },
        };

        expect(
            findEndorsementForRequest(
                [legacyEndorsement],
                'uri=shared%3Apresentation&seed=legacy-seed&pin=1234'
            )
        ).toBe(legacyEndorsement);
    });
});
