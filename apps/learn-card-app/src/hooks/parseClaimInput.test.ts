import { describe, expect, it } from 'vitest';

import { parseClaimInput } from './parseClaimInput';

describe('parseClaimInput', () => {
    describe('OID4VCI', () => {
        it('detects openid-credential-offer:// scheme (by-value)', () => {
            const result = parseClaimInput(
                'openid-credential-offer://?credential_offer=%7B%22credential_issuer%22%3A%22https%3A%2F%2Fissuer.example.com%22%7D'
            );
            expect(result.kind).toBe('oid4vci');
            if (result.kind === 'oid4vci') {
                expect(result.offerUrl).toContain('credential_offer=');
            }
        });

        it('detects openid-credential-offer:// scheme (by-reference)', () => {
            const result = parseClaimInput(
                'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example.com%2Foffer%2F123'
            );
            expect(result.kind).toBe('oid4vci');
        });

        it('preserves the full offer URL for downstream routing', () => {
            const offer = 'openid-credential-offer://?credential_offer_uri=https://example.com';
            const result = parseClaimInput(offer);
            if (result.kind === 'oid4vci') expect(result.offerUrl).toBe(offer);
        });
    });

    describe('OID4VP', () => {
        it('detects openid4vp:// scheme', () => {
            const result = parseClaimInput(
                'openid4vp://authorize?client_id=verifier.example.com&request_uri=https%3A%2F%2Fverifier.example.com%2Frequest'
            );
            expect(result.kind).toBe('oid4vp');
            if (result.kind === 'oid4vp') {
                expect(result.requestUrl).toContain('authorize');
            }
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
    });

    describe('LCW HTTPS', () => {
        it('detects https://lcw.app URLs', () => {
            const result = parseClaimInput('https://lcw.app/claim?boostUri=x&challenge=y');
            expect(result.kind).toBe('boost-claim');
        });
    });

    describe('boost-claim query params', () => {
        it('detects ?boostUri=&challenge= on a https URL', () => {
            const result = parseClaimInput(
                'https://learncard.app/claim?boostUri=urn%3Aabc&challenge=xyz'
            );
            expect(result.kind).toBe('boost-claim');
            if (result.kind === 'boost-claim') {
                expect(result.boostUri).toBe('urn:abc');
                expect(result.challenge).toBe('xyz');
            }
        });

        it('detects bare query string ?boostUri=&challenge=', () => {
            const result = parseClaimInput('?boostUri=urn:abc&challenge=xyz');
            expect(result.kind).toBe('boost-claim');
        });

        it('requires both fields — boostUri alone is not enough', () => {
            const result = parseClaimInput('https://learncard.app/claim?boostUri=urn:abc');
            expect(result.kind).toBe('unrecognized');
        });
    });

    describe('interaction URLs (iuv=1)', () => {
        it('detects HTTPS interaction URLs', () => {
            const url = 'https://example.com/interaction?iuv=1&id=abc';
            const result = parseClaimInput(url);
            expect(result.kind).toBe('interaction-url');
            if (result.kind === 'interaction-url') expect(result.url).toBe(url);
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

        it('does NOT match JSON without @context', () => {
            const result = parseClaimInput(JSON.stringify({ type: ['VerifiableCredential'] }));
            expect(result.kind).toBe('unrecognized');
        });

        it('does NOT match non-object JSON', () => {
            const result = parseClaimInput('"just a string"');
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
            const result = parseClaimInput('  openid-credential-offer://?credential_offer=%7B%7D  ');
            expect(result.kind).toBe('oid4vci');
        });

        it('returns "unknown_scheme" for unknown URL protocols', () => {
            const result = parseClaimInput('https://random-website.com/page');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('unknown_scheme');
        });

        it('returns "unknown_format" for unparseable input', () => {
            const result = parseClaimInput('this is just some random text');
            expect(result.kind).toBe('unrecognized');
            if (result.kind === 'unrecognized') expect(result.reason).toBe('unknown_format');
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
});
