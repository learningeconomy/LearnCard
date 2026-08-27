import { describe, expect, it } from 'vitest';

import { createConsentFlowReturnUrl } from './createConsentFlowReturnUrl';

describe('createConsentFlowReturnUrl', () => {
    it('preserves query delivery by default', () => {
        const result = new URL(
            createConsentFlowReturnUrl({
                returnTo: 'https://example.com/callback?session=session-id',
                did: 'did:example:learner',
                presentation: 'signed-presentation',
            })
        );

        expect(result.searchParams.get('session')).toBe('session-id');
        expect(result.searchParams.get('did')).toBe('did:example:learner');
        expect(result.searchParams.get('vp')).toBe('signed-presentation');
    });

    it('keeps presentations out of HTTP request URLs in fragment mode', () => {
        const result = new URL(
            createConsentFlowReturnUrl({
                returnTo: 'https://example.com/callback?challenge=challenge-id&session=session-id',
                did: 'did:example:learner',
                presentation: 'signed-presentation',
                mode: 'fragment',
            })
        );
        const fragment = new URLSearchParams(result.hash.slice(1));

        expect(result.searchParams.get('challenge')).toBe('challenge-id');
        expect(result.searchParams.get('session')).toBe('session-id');
        expect(result.searchParams.has('did')).toBe(false);
        expect(result.searchParams.has('vp')).toBe(false);
        expect(fragment.get('did')).toBe('did:example:learner');
        expect(fragment.get('vp')).toBe('signed-presentation');
    });

    it('preserves existing fragment parameters', () => {
        const result = new URL(
            createConsentFlowReturnUrl({
                returnTo: 'https://example.com/callback#state=existing',
                presentation: 'signed-presentation',
                mode: 'fragment',
            })
        );
        const fragment = new URLSearchParams(result.hash.slice(1));

        expect(fragment.get('state')).toBe('existing');
        expect(fragment.get('vp')).toBe('signed-presentation');
    });
});
