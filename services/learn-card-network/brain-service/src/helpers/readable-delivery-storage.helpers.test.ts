import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@accesslayer/credential/read', () => ({ getCredentialById: mocks.get }));
// Use the production URI parser while isolating its unrelated database resolvers.
vi.mock('@accesslayer/boost/read', () => ({}));
vi.mock('@accesslayer/consentflowcontract/read', () => ({}));
vi.mock('@accesslayer/consentflowcontract/relationships/read', () => ({}));
vi.mock('@accesslayer/presentation/read', () => ({}));
vi.mock('@accesslayer/skill-framework/read', () => ({}));
vi.mock('@accesslayer/skill/read', () => ({}));
vi.mock('@helpers/learnCard.helpers', () => ({}));
import { readDeliveryCiphertext } from './readable-delivery-storage.helpers';
const jwe = { protected: 'header', iv: 'iv', tag: 'tag', ciphertext: 'ciphertext' };
const config = { domain: 'network.example', cloudUrl: 'https://cloud.example', local: false };
beforeEach(() => vi.resetAllMocks());
describe('readable delivery storage boundary', () => {
    it('reads ciphertext directly from its own network storage', async () => {
        mocks.get.mockResolvedValue({ credential: JSON.stringify(jwe) });
        const fetcher = vi.fn();
        expect(
            await readDeliveryCiphertext(
                'lc:network:network.example/trpc:credential:one',
                config,
                fetcher
            )
        ).toEqual(jwe);
        expect(mocks.get).toHaveBeenCalledWith('one');
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('fetches only configured LearnCloud, with redirects disabled', async () => {
        const fetcher = vi.fn().mockResolvedValue(Response.json(jwe));
        const uri = 'lc:cloud:cloud.example/trpc:credential:one';
        expect(await readDeliveryCiphertext(uri, config, fetcher)).toEqual(jwe);
        const [url, options] = fetcher.mock.calls[0]!;
        expect(url.origin).toBe('https://cloud.example');
        expect(url.pathname).toBe('/api/storage/resolve');
        expect(url.searchParams.get('uri')).toBe(uri);
        expect(options.redirect).toBe('error');
        expect(options.signal).toBeInstanceOf(AbortSignal);
    });
    it.each([
        'https://cloud.example/secret',
        'lc:network:foreign.example/trpc:credential:one',
        'lc:cloud:169.254.169.254/trpc:credential:one',
        'lc:cloud:cloud.example/trpc:credential:../secret',
        'lc:cloud:cloud.example/trpc:profile:one',
        'fake:cloud:cloud.example/trpc:credential:one',
    ])('rejects unsupported references without I/O: %s', async uri => {
        const fetcher = vi.fn();
        await expect(readDeliveryCiphertext(uri, config, fetcher)).rejects.toThrow();
        expect(fetcher).not.toHaveBeenCalled();
        expect(mocks.get).not.toHaveBeenCalled();
    });
    it('permits an explicit local container mapping, but not in production', async () => {
        const local = {
            domain: 'localhost%3A3000',
            cloudUrl: 'http://localhost:3100',
            cloudInternalUrl: 'http://cloud:3100',
            local: true,
        };
        const uri = 'lc:cloud:localhost%3A3100/trpc:credential:one';
        const fetcher = vi.fn().mockImplementation(async () => Response.json(jwe));
        expect(await readDeliveryCiphertext(uri, local, fetcher)).toEqual(jwe);
        expect(fetcher.mock.calls[0]?.[0].origin).toBe('http://cloud:3100');
        await expect(
            readDeliveryCiphertext(uri, { ...local, local: false }, fetcher)
        ).rejects.toThrow();
    });
    it('rejects plaintext, oversized responses and failed requests', async () => {
        const uri = 'lc:cloud:cloud.example/trpc:credential:one';
        for (const response of [
            Response.json({ credentialSubject: {} }),
            new Response('x'.repeat(2 * 1024 * 1024 + 1)),
            new Response(null, { status: 500 }),
        ]) {
            await expect(
                readDeliveryCiphertext(uri, config, vi.fn().mockResolvedValue(response))
            ).rejects.toThrow();
        }
    });
});
