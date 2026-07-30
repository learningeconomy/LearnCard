import { describe, expect, it } from 'vitest';

import {
    apexDomain,
    extractDomain,
    faviconUrl,
    preferredFaviconUrl,
} from '../faviconHelpers';

describe('extractDomain', () => {
    it('returns the host for a well-formed URL', () => {
        expect(extractDomain('https://issuer.demo.walt.id/path')).toBe(
            'issuer.demo.walt.id'
        );
    });

    it('preserves explicit ports', () => {
        expect(extractDomain('http://localhost:7002/offer')).toBe('localhost:7002');
    });

    it('returns undefined for an unparseable URL', () => {
        expect(extractDomain('not a url')).toBeUndefined();
    });

    it('returns undefined for missing input', () => {
        expect(extractDomain(undefined)).toBeUndefined();
        expect(extractDomain('')).toBeUndefined();
    });
});

describe('apexDomain', () => {
    it('collapses a deeper subdomain to its last two labels', () => {
        expect(apexDomain('issuer.demo.walt.id')).toBe('walt.id');
    });

    it('collapses a single-subdomain host to its apex', () => {
        expect(apexDomain('issuer.eudiw.dev')).toBe('eudiw.dev');
    });

    it('returns undefined for a host already at the apex (no point retrying)', () => {
        expect(apexDomain('walt.id')).toBeUndefined();
        expect(apexDomain('learncard.app')).toBeUndefined();
    });

    it('strips a port before evaluating', () => {
        expect(apexDomain('issuer.walt.id:443')).toBe('walt.id');
    });

    it('returns undefined for an IPv4 host', () => {
        expect(apexDomain('192.168.1.1')).toBeUndefined();
        expect(apexDomain('127.0.0.1:7002')).toBeUndefined();
    });

    it('returns undefined for a single-label host (localhost)', () => {
        expect(apexDomain('localhost')).toBeUndefined();
        expect(apexDomain('localhost:7002')).toBeUndefined();
    });

    it('returns undefined for an empty / missing host', () => {
        expect(apexDomain(undefined)).toBeUndefined();
        expect(apexDomain('')).toBeUndefined();
    });
});

describe('faviconUrl', () => {
    it('builds a Google s2 URL with size and url-encoded domain', () => {
        expect(faviconUrl('walt.id', 128)).toBe(
            'https://www.google.com/s2/favicons?domain=walt.id&sz=128'
        );
    });

    it('defaults to a 128px size when none is given', () => {
        expect(faviconUrl('walt.id')).toBe(
            'https://www.google.com/s2/favicons?domain=walt.id&sz=128'
        );
    });

    it('url-encodes domains containing reserved characters', () => {
        expect(faviconUrl('issuer.walt.id:443')).toBe(
            'https://www.google.com/s2/favicons?domain=issuer.walt.id%3A443&sz=128'
        );
    });

    it('returns undefined for missing input', () => {
        expect(faviconUrl(undefined)).toBeUndefined();
        expect(faviconUrl('')).toBeUndefined();
    });
});

describe('preferredFaviconUrl', () => {
    it('targets the apex when the host has a deeper subdomain', () => {
        expect(preferredFaviconUrl('issuer.demo.walt.id')).toBe(
            'https://www.google.com/s2/favicons?domain=walt.id&sz=128'
        );
    });

    it('targets the apex when the host has a single subdomain', () => {
        expect(preferredFaviconUrl('issuer.eudiw.dev')).toBe(
            'https://www.google.com/s2/favicons?domain=eudiw.dev&sz=128'
        );
    });

    it('uses the literal host when host is already at the apex', () => {
        expect(preferredFaviconUrl('walt.id')).toBe(
            'https://www.google.com/s2/favicons?domain=walt.id&sz=128'
        );
    });

    it('uses the literal host for an IPv4 (no apex concept)', () => {
        expect(preferredFaviconUrl('192.168.1.1')).toBe(
            'https://www.google.com/s2/favicons?domain=192.168.1.1&sz=128'
        );
    });

    it('uses the literal host for a single-label host (localhost)', () => {
        expect(preferredFaviconUrl('localhost:7002')).toBe(
            'https://www.google.com/s2/favicons?domain=localhost%3A7002&sz=128'
        );
    });

    it('returns undefined for a missing host', () => {
        expect(preferredFaviconUrl(undefined)).toBeUndefined();
        expect(preferredFaviconUrl('')).toBeUndefined();
    });

    it('respects a custom size', () => {
        expect(preferredFaviconUrl('issuer.demo.walt.id', 64)).toBe(
            'https://www.google.com/s2/favicons?domain=walt.id&sz=64'
        );
    });
});
