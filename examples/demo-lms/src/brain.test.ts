import { describe, expect, it } from 'bun:test';

import { claimLinkFor } from './brain';

const offerUri = 'http://localhost:4000/api/workflows/educationos-claim/exchanges/abc_123-XYZ';

describe('claimLinkFor', () => {
    it('wraps the offer in the LearnCard app request link', () => {
        expect(claimLinkFor(offerUri, 'https://learncard.app/')).toBe(
            `https://learncard.app/request?vc_request_url=${encodeURIComponent(offerUri)}`
        );
    });

    it('falls back to the raw VC-API exchange URL', () => {
        expect(claimLinkFor(offerUri)).toBe(offerUri);
    });
});
