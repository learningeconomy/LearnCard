import { describe, expect, it } from 'vitest';
import { buildEmbedUrlWithPath } from './buildEmbedUrlWithPath';

describe('buildEmbedUrlWithPath', () => {
    it('joins below the configured base, merges query parameters and pins the host override', () => {
        const result = buildEmbedUrlWithPath(
            'https://partner.test/app/?tenant=one',
            '/course?unit=2&lc_host_override=evil#part',
            'https://host.test'
        );
        const url = new URL(result!);
        expect(url.origin).toBe('https://partner.test');
        expect(url.pathname).toBe('/app/course');
        expect(url.searchParams.get('tenant')).toBe('one');
        expect(url.searchParams.get('unit')).toBe('2');
        expect(url.searchParams.get('lc_host_override')).toBe('https://host.test');
        expect(url.hash).toBe('#part');
    });
    it('preserves repeated query parameters from the requested page', () => {
        const result = buildEmbedUrlWithPath(
            'https://partner.test/app?tag=base&tenant=one',
            '/search?tag=alpha&tag=beta&filter=one&filter=two',
            'https://host.test'
        );
        const url = new URL(result!);
        expect(url.searchParams.getAll('tag')).toEqual(['alpha', 'beta']);
        expect(url.searchParams.getAll('filter')).toEqual(['one', 'two']);
        expect(url.searchParams.get('tenant')).toBe('one');
    });
    it.each([
        '//evil.test',
        '/%2fhost',
        '/%252e%252e/other',
        '/foo/../other',
        '/\\evil',
        'javascript:alert(1)',
        '/%00',
    ])('fails closed for %s', path => {
        expect(
            buildEmbedUrlWithPath('https://partner.test/app', path, 'https://host.test')
        ).toBeNull();
    });
    it('rejects invalid bases and preserves a default launch', () => {
        expect(buildEmbedUrlWithPath('javascript:alert(1)', '/', 'https://host.test')).toBeNull();
        expect(
            buildEmbedUrlWithPath('https://user:pass@partner.test', '/', 'https://host.test')
        ).toBeNull();
        expect(
            buildEmbedUrlWithPath(
                'https://partner.test/app?tenant=a#home',
                undefined,
                'https://host.test'
            )
        ).toContain('/app?tenant=a&lc_host_override=');
    });
});
