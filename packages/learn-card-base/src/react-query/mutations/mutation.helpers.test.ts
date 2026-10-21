import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getEndorsementTargetId: vi.fn(),
    resolveSharedCredential: vi.fn(),
}));

import { buildCredentialShareUrl, publishSharePreview } from './mutation.helpers';

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

describe('public share preview lifecycle', () => {
    const linkFor = (uri: string) => `https://example.test/share?uri=${encodeURIComponent(uri)}`;

    it('does not publish without explicit preview consent', async () => {
        const publish = vi.fn(async () => 'unexpected');
        const link = linkFor('private-presentation-uri');
        const result = await publishSharePreview(
            link,
            undefined,
            undefined,
            publish,
            async () => 1,
            async () => true
        );
        expect(result).toBe(link);
        expect(publish).not.toHaveBeenCalled();
    });

    it.each([0, 'throw'] as const)(
        'rolls back a newly-created node when index write fails (%s)',
        async failure => {
            const records: Record<string, { shareUri: string }> = {};
            const remove = vi.fn(async (id: string) => {
                delete records[id];
                return true;
            });
            await expect(
                publishSharePreview(
                    linkFor('new-uri'),
                    { name: 'Name', issuer: 'Issuer' },
                    undefined,
                    async input => {
                        records['new-id'] = { shareUri: input.shareUri };
                        return 'new-id';
                    },
                    async () => {
                        if (failure === 'throw') throw new Error('index write failed');
                        return 0;
                    },
                    remove
                )
            ).rejects.toThrow(
                failure === 'throw'
                    ? 'index write failed'
                    : 'Unable to save public preview reference'
            );
            expect(records).toEqual({});
        }
    );

    it('does not delete an existing preview when its refresh fails', async () => {
        const records: Record<string, { shareUri: string }> = {
            owned: { shareUri: 'old-uri' },
        };
        const remove = vi.fn(async (id: string) => {
            delete records[id];
            return true;
        });
        await expect(
            publishSharePreview(
                linkFor('rebound-uri'),
                { name: 'Name', issuer: 'Issuer' },
                'owned',
                async () => {
                    throw new Error('refresh failed');
                },
                async () => 1,
                remove
            )
        ).rejects.toThrow('refresh failed');
        expect(records).toEqual({ owned: { shareUri: 'old-uri' } });
    });

    it('reports indexing and cleanup failures together instead of claiming rollback succeeded', async () => {
        const indexingError = new Error('index unavailable');
        const cleanupError = new Error('delete unavailable');
        const result = publishSharePreview(
            linkFor('new-uri'),
            { name: 'Name', issuer: 'Issuer' },
            undefined,
            async () => 'new-id',
            async () => {
                throw indexingError;
            },
            async () => {
                throw cleanupError;
            }
        );
        await expect(result).rejects.toBeInstanceOf(AggregateError);
        await expect(result).rejects.toHaveProperty('errors', [indexingError, cleanupError]);
    });
});
