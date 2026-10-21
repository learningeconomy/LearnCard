import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getEndorsementTargetId: vi.fn(),
    resolveSharedCredential: vi.fn(),
}));

import { buildCredentialShareUrl } from './mutation.helpers';

describe('credential share URL encoding', () => {
    it('preserves the storage URI through query decoding and adding a public preview', () => {
        const uri = 'lc:cloud:localhost%3A40875/trpc:credential:6ad8fb753cc0bb035a105b8b';
        const url = new URL(
            buildCredentialShareUrl('tenant.example', 'share-boost', {
                uri,
                seed: '0123456789abcdef',
                pin: '1234',
            })
        );
        const privateUri = url.searchParams.get('uri');
        url.searchParams.set('preview', '5b58ff0c-bb55-4f25-a2a5-b4de3778c649');
        expect({ privateUri, publicUri: url.searchParams.get('uri') }).toEqual({
            privateUri: uri,
            publicUri: uri,
        });
        expect(url.origin + url.pathname).toBe('https://tenant.example/share-boost');
        expect(url.searchParams.get('seed')).toBe('0123456789abcdef');
        expect(url.searchParams.get('pin')).toBe('1234');
    });
});
