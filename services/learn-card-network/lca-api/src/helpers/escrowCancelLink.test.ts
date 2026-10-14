import { describe, expect, it } from 'vitest';

import { buildEscrowCancelUrl, resolveEscrowAppBaseUrl } from './escrowCancelLink';

describe('buildEscrowCancelUrl', () => {
    const holdId = '5b1f6e2e-6e2a-4e8a-9e2a-6e2a4e8a9e2a';
    const token = 'a'.repeat(64);

    it('builds the expected path and query', () => {
        expect(buildEscrowCancelUrl({ baseUrl: 'https://learncard.app', holdId, token })).toBe(
            `https://learncard.app/recovery/cancel?holdId=${holdId}&token=${token}`
        );
    });

    it('never doubles the slash when baseUrl has a trailing slash', () => {
        expect(buildEscrowCancelUrl({ baseUrl: 'https://learncard.app/', holdId, token })).toBe(
            `https://learncard.app/recovery/cancel?holdId=${holdId}&token=${token}`
        );
    });

    it('percent-encodes query values that need it', () => {
        const url = buildEscrowCancelUrl({
            baseUrl: 'https://learncard.app',
            holdId: 'weird id/with&chars',
            token,
        });
        expect(url).toBe(
            `https://learncard.app/recovery/cancel?holdId=weird+id%2Fwith%26chars&token=${token}`
        );
        expect(new URL(url).searchParams.get('holdId')).toBe('weird id/with&chars');
    });

    it('ignores any path segment already present on baseUrl (host + protocol only, matching every tenant appUrl in the registry)', () => {
        expect(buildEscrowCancelUrl({ baseUrl: 'https://vetpass.app', holdId, token })).toBe(
            `https://vetpass.app/recovery/cancel?holdId=${holdId}&token=${token}`
        );
    });
});

describe('resolveEscrowAppBaseUrl', () => {
    it('falls back to the LearnCard default when the tenant has no appUrl override', () => {
        expect(
            resolveEscrowAppBaseUrl({
                tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
            })
        ).toBe('https://learncard.app');
    });

    it('prefers the resolved tenant appUrl', () => {
        expect(
            resolveEscrowAppBaseUrl({
                tenant: {
                    id: 'vetpass',
                    emailBranding: { appUrl: 'https://vetpass.app' },
                    resolvedVia: 'origin',
                },
            })
        ).toBe('https://vetpass.app');
    });
});
