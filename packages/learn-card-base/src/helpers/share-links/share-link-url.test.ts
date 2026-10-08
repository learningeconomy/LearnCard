import { describe, expect, it } from 'vitest';

import { encodeBase64Url } from '@learncard/types';

import {
    SHARE_LINK_FIXED_OVERHEAD_CHARS,
    buildShareLinkUrl,
    parseShareLinkUrl,
    shareLinkLength,
} from './index';

const ID = encodeBase64Url(new Uint8Array(16).fill(11));
const KEY = encodeBase64Url(new Uint8Array(32).fill(12));

describe('canonical share-link URL grammar', () => {
    it('builds exactly https://{host}/s/{id}#{key}', () => {
        const url = buildShareLinkUrl('learncard.app', ID, KEY);

        expect(url).toBe(`https://learncard.app/s/${ID}#${KEY}`);
        expect(url).toHaveLength(90);
        expect(url).toHaveLength(shareLinkLength('learncard.app'));
        expect(SHARE_LINK_FIXED_OVERHEAD_CHARS).toBe(77);

        const parsedUrl = new URL(url);
        expect(parsedUrl.search).toBe('');
        expect(parsedUrl.pathname).toBe(`/s/${ID}`);
        expect(parsedUrl.hash).toBe(`#${KEY}`);
    });

    it('round-trips id/key byte-for-byte on ordinary and long tenant hosts', () => {
        const longHost = `${'a'.repeat(120)}.example.test`;
        const url = buildShareLinkUrl(longHost, ID, KEY);
        const parsed = parseShareLinkUrl(url);

        expect(parsed).toEqual({ ok: true, id: ID, key: KEY, host: longHost, url });
        expect(url).toHaveLength(77 + longHost.length);

        const veryLongHost = `${'tenant-subdomain.'.repeat(10)}example.test`;
        expect(parseShareLinkUrl(buildShareLinkUrl(veryLongHost, ID, KEY))).toEqual({
            ok: true,
            id: ID,
            key: KEY,
            host: veryLongHost,
            url: `https://${veryLongHost}/s/${ID}#${KEY}`,
        });
    });

    it('preserves full entropy for randomized ids and keys', () => {
        for (let index = 0; index < 25; index += 1) {
            const id = encodeBase64Url(crypto.getRandomValues(new Uint8Array(16)));
            const key = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
            const parsed = parseShareLinkUrl(buildShareLinkUrl('learncard.app', id, key));

            expect(parsed.ok).toBe(true);
            expect(parsed.ok && parsed.id).toBe(id);
            expect(parsed.ok && parsed.key).toBe(key);
        }
    });

    it('rejects non-canonical id/key aliases and padding', () => {
        const idAlias = `${ID.slice(0, 21)}B`;
        expect(parseShareLinkUrl(`https://learncard.app/s/${idAlias}#${KEY}`)).toEqual({
            ok: false,
            reason: 'INVALID_ID',
        });

        const keyAlias = `${KEY.slice(0, 42)}B`;
        expect(parseShareLinkUrl(`https://learncard.app/s/${ID}#${keyAlias}`)).toEqual({
            ok: false,
            reason: 'INVALID_KEY',
        });

        expect(parseShareLinkUrl(`https://learncard.app/s/${ID}=#${KEY}`)).toEqual({
            ok: false,
            reason: 'INVALID_ID',
        });
        expect(parseShareLinkUrl(`https://learncard.app/s/${ID}#${KEY}=`)).toEqual({
            ok: false,
            reason: 'INVALID_KEY',
        });
    });

    it('never parses legacy share routes as the new grammar', () => {
        expect(parseShareLinkUrl('https://learncard.app/share-creds/urn:lc:cred/seed')).toEqual({
            ok: false,
            reason: 'NOT_SHARE_LINK',
        });
        expect(
            parseShareLinkUrl('https://learncard.app/?uri=urn:lc:cred&seed=seed&pin=1234')
        ).toEqual({ ok: false, reason: 'UNEXPECTED_QUERY' });
        expect(parseShareLinkUrl(`https://learncard.app/s/${ID}/extra#${KEY}`)).toEqual({
            ok: false,
            reason: 'NOT_SHARE_LINK',
        });
    });

    it('rejects wrong transport, query, host and non-string input', () => {
        expect(parseShareLinkUrl(`http://learncard.app/s/${ID}#${KEY}`)).toEqual({
            ok: false,
            reason: 'UNSUPPORTED_PROTOCOL',
        });
        expect(parseShareLinkUrl(`https://learncard.app/s/${ID}?x=1#${KEY}`)).toEqual({
            ok: false,
            reason: 'UNEXPECTED_QUERY',
        });
        expect(parseShareLinkUrl('not a url')).toEqual({ ok: false, reason: 'MALFORMED_URL' });
        expect(parseShareLinkUrl(42)).toEqual({ ok: false, reason: 'NOT_A_STRING' });
        expect(parseShareLinkUrl(null)).toEqual({ ok: false, reason: 'NOT_A_STRING' });
    });

    it('refuses to build from a host carrying a scheme, path or userinfo', () => {
        expect(() => buildShareLinkUrl('https://evil.test', ID, KEY)).toThrow();
        expect(() => buildShareLinkUrl('evil.test/path', ID, KEY)).toThrow();
        expect(() => buildShareLinkUrl('user@evil.test', ID, KEY)).toThrow();
        expect(() => buildShareLinkUrl('', ID, KEY)).toThrow();
    });
});

describe('URL authority regression', () => {
    it('rejects userinfo and invalid ports', () => {
        expect(parseShareLinkUrl(`https://user:password@learncard.app/s/${ID}#${KEY}`).ok).toBe(
            false
        );
        expect(() => buildShareLinkUrl('learncard.app:99999', ID, KEY)).toThrow();
    });
});
