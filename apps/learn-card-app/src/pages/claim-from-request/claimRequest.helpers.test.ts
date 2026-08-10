import { describe, expect, it } from 'vitest';

import { getClaimInteractionBoostUri } from './claimRequest.helpers';

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
});
