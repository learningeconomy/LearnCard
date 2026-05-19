import { describe, expect, it } from 'vitest';

import {
    DEFAULT_HTTPS_DOMAINS,
    isTenantHttpsUrl,
    parseClaimInput,
} from './parseClaimInput';

describe('parseClaimInput', () => {
    describe('OID4VCI', () => {
        it('detects openid-credential-offer:// scheme (by-value)', () => {
            const result = parseClaimInput(
                'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.example.com%22%7D'
            );
            expect(result.kind).toBe('oid4vci');
        });

        it('detects openid-credential-offer:// scheme (by-reference)', () => {
            const result = parseClaimInput(
                'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example.com%2Foffer%2F123'
            );
            expect(result.kind).toBe('oid4vci');
        });
    });

    describe('OID4VP', () => {
        it('detects openid4vp:// scheme', () => {
            const result = parseClaimInput('openid4vp://authorize?client_id=verifier.example.com');
            expect(result.kind).toBe('oid4vp');
        });
    });

    describe('VC-API custom schemes', () => {
        it.each([
            'dccrequest://request/123',
            'msprequest://request/456',
            'asuprequest://request/789',
        ])('detects %s', input => {
            const result = parseClaimInput(input);
            expect(result.kind).toBe('vc-api-custom-scheme');
        });

        it('defaults pathname-less custom scheme URLs to /request', () => {
            const result = parseClaimInput('dccrequest://?challenge=abc');
            expect(result.kind).toBe('vc-api-custom-scheme');
            if (result.kind === 'vc-api-custom-scheme') {
                expect(result.path.startsWith('/request')).toBe(true);
            }
        });

        it('preserves the pathname (no /request prefix) when the URL already has one', () => {
            const result = parseClaimInput(
                'dccrequest://issuer.example.com/abc?challenge=xyz'
            );
            expect(result.kind).toBe('vc-api-custom-scheme');
            if (result.kind === 'vc-api-custom-scheme') {
                expect(result.path).toBe('/abc?challenge=xyz');
            }
        });
    });

    describe('LCW HTTPS', () => {
        it('detects https://lcw.app URLs as boost-claim when query params match', () => {
            const result = parseClaimInput('https://lcw.app/claim?boostUri=x&challenge=y');
            expect(result.kind).toBe('boost-claim');
        });
    });

    describe('tenant-aware HTTPS domain matching', () => {
        it('matches the configured tenant domain (bare hostname)', () => {
            const result = parseClaimInput('https://vetpass.app/oid4vci?offer=x', {
                httpsDomains: ['vetpass.app'],
            });
            expect(result.kind).toBe('lcw-https');
            if (result.kind === 'lcw-https') {
                expect(result.path).toBe('/oid4vci?offer=x');
            }
        });

        it('matches the configured tenant domain (full origin)', () => {
            const result = parseClaimInput('https://scoutpass.app/claim', {
                httpsDomains: ['https://scoutpass.app'],
            });
            expect(result.kind).toBe('lcw-https');
        });

        it('rejects domains not in the configured list', () => {
            const result = parseClaimInput('https://lcw.app/x', {
                httpsDomains: ['vetpass.app'],
            });
            expect(result.kind).toBe('unrecognized');
        });

        it('matches case-insensitively on host', () => {
            const result = parseClaimInput('https://LEARNCARD.APP/x', {
                httpsDomains: ['learncard.app'],
            });
            expect(result.kind).toBe('lcw-https');
        });
    });

    describe('tenant-aware custom scheme matching', () => {
        it('accepts custom schemes from tenant config', () => {
            const result = parseClaimInput('vcrequest://issue?id=1', {
                customSchemes: ['vcrequest'],
            });
            expect(result.kind).toBe('vc-api-custom-scheme');
        });

        it('rejects custom schemes not in tenant config', () => {
            const result = parseClaimInput('dccrequest://issue?id=1', {
                customSchemes: ['vcrequest'],
            });
            expect(result.kind).toBe('unrecognized');
        });
    });

    describe('boost-claim query params', () => {
        it('detects ?boostUri=&challenge= on a https URL', () => {
            const result = parseClaimInput(
                'https://learncard.app/claim?boostUri=urn%3Aabc&challenge=xyz'
            );
            expect(result.kind).toBe('boost-claim');
        });

        it('detects bare query string ?boostUri=&challenge=', () => {
            const result = parseClaimInput('?boostUri=urn:abc&challenge=xyz');
            expect(result.kind).toBe('boost-claim');
        });

        it('does not match without a challenge', () => {
            const result = parseClaimInput('https://random.example.com/claim?boostUri=urn:abc');
            expect(result.kind).toBe('unrecognized');
        });
    });

    describe('interaction URLs', () => {
        it('detects ?iuv=1', () => {
            const url = 'https://example.com/interaction?iuv=1&id=abc';
            const result = parseClaimInput(url);
            expect(result.kind).toBe('interaction-url');
        });
    });

    describe('connection requests', () => {
        it('detects ?did=did:web:…:users:<id>', () => {
            const result = parseClaimInput(
                'https://network.example.com/connect?did=did:web:network.example.com:users:alice'
            );
            expect(result.kind).toBe('connection-request');
            if (result.kind === 'connection-request') {
                expect(result.profileId).toBe('alice');
            }
        });

        it('requires the users:<id> segment', () => {
            const result = parseClaimInput(
                'https://network.example.com/connect?did=did:web:network.example.com'
            );
            expect(result.kind).toBe('unrecognized');
        });
    });

    describe('raw VC JSON', () => {
        const vc = {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: 'did:key:z6Mk',
            credentialSubject: { id: 'did:key:z6Mk', name: 'Alice' },
        };

        it('detects a pasted W3C VC', () => {
            const result = parseClaimInput(JSON.stringify(vc));
            expect(result.kind).toBe('raw-vc-candidate');
        });

        it('threads the parsed object alongside the raw string', () => {
            const raw = JSON.stringify(vc);
            const result = parseClaimInput(raw);
            expect(result.kind).toBe('raw-vc-candidate');
            if (result.kind === 'raw-vc-candidate') {
                expect(result.parsed).toEqual(vc);
                expect(result.raw).toBe(raw);
            }
        });

        it('accepts string-typed type field', () => {
            const result = parseClaimInput(JSON.stringify({ ...vc, type: 'VerifiableCredential' }));
            expect(result.kind).toBe('raw-vc-candidate');
        });

        it('does NOT match JSON without VerifiableCredential type', () => {
            const result = parseClaimInput(
                JSON.stringify({ '@context': ['x'], type: ['SomeOtherType'] })
            );
            expect(result.kind).toBe('unrecognized');
        });

        it('does NOT match malformed JSON', () => {
            const result = parseClaimInput('{ not really json }');
            expect(result.kind).toBe('unrecognized');
        });
    });

    describe('edge cases', () => {
        it('returns "empty" for empty input', () => {
            const result = parseClaimInput('');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('empty');
        });

        it('returns "empty" for whitespace-only input', () => {
            const result = parseClaimInput('   \n\t  ');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('empty');
        });

        it('trims surrounding whitespace before parsing', () => {
            const result = parseClaimInput(
                '  openid-credential-offer://?credential_offer=%7B%7D  '
            );
            expect(result.kind).toBe('oid4vci');
        });

        it('returns "unknown_scheme" for unknown URL protocols', () => {
            const result = parseClaimInput('https://random-website.com/page');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('unknown_scheme');
        });

        it('returns "unknown_format" for unparseable plain text', () => {
            const result = parseClaimInput('this is just some random text');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('unknown_format');
        });

        it('returns "malformed_url" for URL-shaped strings that fail to parse', () => {
            const result = parseClaimInput('openid-credential-offer://[not a url]');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('malformed_url');
        });

        it('returns "malformed_url" for URL-shaped strings missing required parts', () => {
            const result = parseClaimInput('https://');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('malformed_url');
        });

        it('is case-insensitive on the scheme', () => {
            const result = parseClaimInput('OPENID-CREDENTIAL-OFFER://?credential_offer=%7B%7D');
            expect(result.kind).toBe('oid4vci');
        });
    });

    describe('precedence ordering', () => {
        it('OID4VCI scheme wins over query-param boost-claim', () => {
            const result = parseClaimInput(
                'openid-credential-offer://?credential_offer=%7B%7D&boostUri=urn:abc&challenge=xyz'
            );
            expect(result.kind).toBe('oid4vci');
        });

        it('boost-claim wins over connection-request when both are in the same URL', () => {
            const result = parseClaimInput(
                'https://learncard.app/?boostUri=urn:x&challenge=y&did=did:web:example.com:users:z'
            );
            expect(result.kind).toBe('boost-claim');
        });

        it('iuv=1 wins over connection-request', () => {
            const result = parseClaimInput(
                'https://example.com/?iuv=1&did=did:web:example.com:users:alice'
            );
            expect(result.kind).toBe('interaction-url');
        });
    });

    describe('default tenant HTTPS domains', () => {
        it('mirrors DEFAULT_LEARNCARD_TENANT_CONFIG.native.deepLinkDomains', () => {
            expect(DEFAULT_HTTPS_DOMAINS).toEqual([
                'learncard.app',
                'learncardapp.netlify.app',
                'learncardapp.netlify.com',
                'lcw.app',
            ]);
        });

        it('recognizes learncard.app by default', () => {
            const result = parseClaimInput('https://learncard.app/some/path?x=1');
            expect(result.kind).toBe('lcw-https');
            if (result.kind === 'lcw-https') {
                expect(result.path).toBe('/some/path?x=1');
            }
        });

        it('recognizes lcw.app by default', () => {
            const result = parseClaimInput('https://lcw.app/x');
            expect(result.kind).toBe('lcw-https');
        });

        it('recognizes Netlify preview hosts by default', () => {
            expect(
                parseClaimInput('https://learncardapp.netlify.app/some/path').kind
            ).toBe('lcw-https');
            expect(
                parseClaimInput('https://learncardapp.netlify.com/some/path').kind
            ).toBe('lcw-https');
        });
    });

    describe('bare tenant root rejection', () => {
        it('rejects https://learncard.app (no path, no query, no hash) as unrecognized', () => {
            const result = parseClaimInput('https://learncard.app');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') {
                expect(result.reason).toBe('unknown_format');
            }
        });

        it('rejects https://learncard.app/ (root path only) as unrecognized', () => {
            const result = parseClaimInput('https://learncard.app/');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') {
                expect(result.reason).toBe('unknown_format');
            }
        });

        it('still accepts root path with a query string', () => {
            const result = parseClaimInput('https://learncard.app/?x=1');
            expect(result.kind).toBe('lcw-https');
            if (result.kind === 'lcw-https') {
                expect(result.path).toBe('/?x=1');
            }
        });

        it('still accepts root path with a hash', () => {
            const result = parseClaimInput('https://learncard.app/#wallet');
            expect(result.kind).toBe('lcw-https');
            if (result.kind === 'lcw-https') {
                expect(result.path).toBe('/#wallet');
            }
        });

        it('still accepts non-root paths', () => {
            const result = parseClaimInput('https://learncard.app/x');
            expect(result.kind).toBe('lcw-https');
            if (result.kind === 'lcw-https') {
                expect(result.path).toBe('/x');
            }
        });
    });
});

describe('isTenantHttpsUrl', () => {
    it('returns true for HTTPS URLs on default tenant hosts', () => {
        expect(isTenantHttpsUrl('https://learncard.app/anything?x=1')).toBe(true);
        expect(isTenantHttpsUrl('https://lcw.app/path')).toBe(true);
    });

    it('returns false for non-tenant hosts', () => {
        expect(isTenantHttpsUrl('https://random.example.com/anything')).toBe(false);
    });

    it('returns false for http:// (not https://)', () => {
        expect(isTenantHttpsUrl('http://learncard.app/anything')).toBe(false);
    });

    it('returns false for custom schemes even on tenant domains', () => {
        expect(isTenantHttpsUrl('openid-credential-offer://learncard.app')).toBe(false);
    });

    it('returns false for malformed URLs', () => {
        expect(isTenantHttpsUrl('not a url')).toBe(false);
    });

    it('matches case-insensitively on host', () => {
        expect(isTenantHttpsUrl('https://LEARNCARD.APP/x')).toBe(true);
    });

    it('respects custom tenant config', () => {
        expect(
            isTenantHttpsUrl('https://vetpass.app/x', { httpsDomains: ['vetpass.app'] })
        ).toBe(true);
        expect(
            isTenantHttpsUrl('https://learncard.app/x', { httpsDomains: ['vetpass.app'] })
        ).toBe(false);
    });

    it('accepts full-origin entries in httpsDomains', () => {
        expect(
            isTenantHttpsUrl('https://scoutpass.app/x', {
                httpsDomains: ['https://scoutpass.app'],
            })
        ).toBe(true);
    });
});
