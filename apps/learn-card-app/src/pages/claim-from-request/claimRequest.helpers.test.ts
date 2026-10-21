import { describe, expect, it } from 'vitest';

import {
    getClaimInteractionBoostUri,
    getClaimInteractionDuplicateLookup,
    isInboxClaimInteraction,
    shouldCompleteInboxClaimLocally,
} from './claimRequest.helpers';

const exchangeId =
    'eyJib29zdFVyaSI6ImxjOm5ldHdvcms6bG9jYWxob3N0JTNBNDAwMC90cnBjOmJvb3N0OjYyNDAyNmJlLWQ3ZTktNDQwYS1hOGFkLWZjMDk5OTAzMmMzNiIsImNoYWxsZW5nZSI6IjZlOGI3ZGQzLTI3OTYtNDlmMS1iZjRkLTA2OTgxYTgxZjc4NyJ9';

describe('getClaimInteractionBoostUri', () => {
    it('extracts the Boost URI from the exact claim interaction exchange URL', () => {
        const requestUrl = `http://localhost:4000/api/workflows/claim/exchanges/${exchangeId}`;

        expect(getClaimInteractionBoostUri(requestUrl)).toBe(
            'lc:network:localhost%3A4000/trpc:boost:624026be-d7e9-440a-a8ad-fc0999032c36'
        );
    });

    it('ignores non-claim and malformed exchange URLs', () => {
        expect(
            getClaimInteractionBoostUri(
                `http://localhost:4000/api/workflows/verify/exchanges/${exchangeId}`
            )
        ).toBeUndefined();
        expect(getClaimInteractionBoostUri('not a valid claim URL')).toBeUndefined();
    });

    it('builds the same legacy-aware duplicate lookup for every claim interaction path', () => {
        const boostUri = getClaimInteractionBoostUri(
            `http://localhost:4000/api/workflows/claim/exchanges/${exchangeId}`
        );

        expect(getClaimInteractionDuplicateLookup(boostUri)).toEqual({
            boostUri,
            compareByContent: true,
        });
        expect(getClaimInteractionDuplicateLookup(undefined)).toBeUndefined();
    });
});

describe('isInboxClaimInteraction', () => {
    it('identifies Universal Inbox exchange URLs', () => {
        expect(
            isInboxClaimInteraction(
                'http://localhost:4000/api/workflows/inbox-claim/exchanges/claim-token'
            )
        ).toBe(true);
    });

    it('does not treat other exchange workflows as Universal Inbox claims', () => {
        expect(
            isInboxClaimInteraction(
                'http://localhost:4000/api/workflows/claim/exchanges/exchange-id'
            )
        ).toBe(false);
    });
});

describe('shouldCompleteInboxClaimLocally', () => {
    const inboxRequestUrl = 'http://localhost:4000/api/workflows/inbox-claim/exchanges/claim-token';

    it('completes a saved Universal Inbox batch without making an empty follow-up request', () => {
        expect(shouldCompleteInboxClaimLocally(inboxRequestUrl, 2, {})).toBe(true);
    });

    it('continues with the server when submitting a presentation or another workflow', () => {
        expect(
            shouldCompleteInboxClaimLocally(inboxRequestUrl, 2, {
                verifiablePresentation: { holder: 'did:key:holder' },
            })
        ).toBe(false);
        expect(
            shouldCompleteInboxClaimLocally(
                'http://localhost:4000/api/workflows/claim/exchanges/exchange-id',
                1,
                {}
            )
        ).toBe(false);
    });
});
