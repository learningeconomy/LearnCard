/**
 * Unit tests for `deriveClientIdPrefix` — the OID4VP 1.0 §5.10
 * client-id prefix parser.
 *
 * Coverage targets every wire-form a wallet might see:
 *   - all 7 known prefixes in their explicit `<prefix>:<value>` form
 *   - both implicit forms (`did:` URIs, `https://` URLs)
 *   - draft-22 legacy `client_id_scheme` parameter
 *   - the fallback to `pre-registered`
 *   - precedence rules between the above (legacy wins; explicit
 *     beats implicit; `did:foo:bar` correctly routes via the implicit
 *     `did` rule rather than treating `did` as an unknown explicit
 *     prefix)
 *   - degenerate inputs (empty string, malformed DIDs)
 */
import { describe, it, expect } from '@jest/globals';

import {
    deriveClientIdPrefix,
    KNOWN_CLIENT_ID_PREFIXES,
} from './client-id-prefix';

describe('deriveClientIdPrefix — explicit prefix form (OID4VP 1.0)', () => {
    it('strips x509_san_dns prefix and returns the host as value', () => {
        const result = deriveClientIdPrefix('x509_san_dns:verifier.example.com');
        expect(result).toEqual({
            prefix: 'x509_san_dns',
            value: 'verifier.example.com',
            inferred: false,
        });
    });

    it('strips x509_hash prefix and returns the hash as value', () => {
        const result = deriveClientIdPrefix(
            'x509_hash:c4ca4238a0b923820dcc509a6f75849b'
        );
        expect(result).toEqual({
            prefix: 'x509_hash',
            value: 'c4ca4238a0b923820dcc509a6f75849b',
            inferred: false,
        });
    });

    it('strips redirect_uri prefix and returns the URL as value', () => {
        const result = deriveClientIdPrefix(
            'redirect_uri:https://wallet.example/cb'
        );
        expect(result).toEqual({
            prefix: 'redirect_uri',
            value: 'https://wallet.example/cb',
            inferred: false,
        });
    });

    it('strips verifier_attestation prefix and returns the value', () => {
        const result = deriveClientIdPrefix('verifier_attestation:VerifierABC');
        expect(result).toEqual({
            prefix: 'verifier_attestation',
            value: 'VerifierABC',
            inferred: false,
        });
    });

    it('does NOT strip a pre-registered: pseudo-prefix (spec has no explicit form)', () => {
        // OID4VP 1.0 §5.10 reserves `pre-registered` as the default
        // when no prefix is present. There is no explicit
        // `pre-registered:Verifier` wire form. If a verifier emitted
        // one, we'd treat the whole string as the bare client_id
        // (which the JAR verifier would then fail to bind a signing
        // key to). The string itself should NOT be stripped.
        const result = deriveClientIdPrefix('pre-registered:Verifier');
        // Doesn't match any explicit prefix → doesn't match the
        // implicit DID/HTTPS forms either → falls through to
        // pre-registered with the full value.
        expect(result).toEqual({
            prefix: 'pre-registered',
            value: 'pre-registered:Verifier',
            inferred: true,
        });
    });
});

describe('deriveClientIdPrefix — implicit prefix form (OID4VP 1.0)', () => {
    it('infers did prefix from a did:jwk URI', () => {
        const did = 'did:jwk:eyJrdHkiOiJPS1AiLCJjcnYiOiJFZDI1NTE5In0';
        const result = deriveClientIdPrefix(did);
        expect(result).toEqual({ prefix: 'did', value: did, inferred: true });
    });

    it('infers did prefix from a did:web URI with multiple path segments', () => {
        const did = 'did:web:verifier.example:tenant:42';
        const result = deriveClientIdPrefix(did);
        expect(result).toEqual({ prefix: 'did', value: did, inferred: true });
    });

    it('infers did prefix from a DID URI carrying a fragment / query', () => {
        const did = 'did:key:z6Mki...#key-1';
        const result = deriveClientIdPrefix(did);
        expect(result).toEqual({ prefix: 'did', value: did, inferred: true });
    });

    it('infers https prefix from an https URL', () => {
        const url = 'https://verifier.example/oid4vp';
        const result = deriveClientIdPrefix(url);
        expect(result).toEqual({ prefix: 'https', value: url, inferred: true });
    });

    it('does NOT infer https prefix from a bare http:// URL', () => {
        // OID4VP 1.0 §5.10 mandates HTTPS for the `https` prefix —
        // a plain `http://` URL is NOT spec-conformant for this
        // prefix and falls through to `pre-registered` (the JAR
        // verifier will then reject the request).
        const result = deriveClientIdPrefix('http://insecure.example');
        expect(result.prefix).toBe('pre-registered');
        expect(result.inferred).toBe(true);
    });
});

describe('deriveClientIdPrefix — legacy draft-22 client_id_scheme parameter', () => {
    it('respects a known legacy scheme over what the client_id would imply', () => {
        // Caller passes `client_id_scheme=did` alongside a bare
        // client_id. Even though the bare form would default to
        // `pre-registered`, the explicit legacy scheme wins.
        const result = deriveClientIdPrefix('verifier-1', 'did');
        expect(result).toEqual({
            prefix: 'did',
            value: 'verifier-1',
            inferred: false,
        });
    });

    it('respects a legacy scheme even when client_id has an implicit form', () => {
        // Defense-in-depth: if a verifier sends both `did:web:foo.com`
        // AND `client_id_scheme=x509_san_dns`, we trust the explicit
        // legacy declaration. The downstream verifier will then fail
        // the SAN binding (since `did:web:foo.com` isn't a hostname)
        // and surface an honest `client_id_mismatch` rather than
        // silently routing through the DID path.
        const result = deriveClientIdPrefix('did:web:foo.com', 'x509_san_dns');
        expect(result).toEqual({
            prefix: 'x509_san_dns',
            value: 'did:web:foo.com',
            inferred: false,
        });
    });

    it('falls through to inference when legacy scheme is unrecognized', () => {
        // Garbage in `client_id_scheme` shouldn't crash us; we
        // continue to the implicit-form rules and let the JAR
        // verifier surface a clear error if the result is unverifiable.
        const result = deriveClientIdPrefix('did:web:foo.com', 'made_up');
        expect(result).toEqual({
            prefix: 'did',
            value: 'did:web:foo.com',
            inferred: true,
        });
    });

    it('treats empty legacy scheme as not supplied', () => {
        const result = deriveClientIdPrefix('did:web:foo.com', '');
        expect(result.prefix).toBe('did');
        expect(result.inferred).toBe(true);
    });
});

describe('deriveClientIdPrefix — fallback', () => {
    it('falls back to pre-registered for an opaque bare client_id', () => {
        // Matches EUDI's default mode: `client_id="Verifier"`.
        const result = deriveClientIdPrefix('Verifier');
        expect(result).toEqual({
            prefix: 'pre-registered',
            value: 'Verifier',
            inferred: true,
        });
    });

    it('falls back gracefully on an empty client_id', () => {
        const result = deriveClientIdPrefix('');
        expect(result.prefix).toBe('pre-registered');
        expect(result.value).toBe('');
        expect(result.inferred).toBe(true);
    });

    it('handles bizarre inputs (numbers, undefined, …) without throwing', () => {
        // The function is contract-pure but defensive — callers that
        // forget to validate their input upstream still get a stable
        // response.
        expect(
            deriveClientIdPrefix(undefined as unknown as string)
        ).toEqual({ prefix: 'pre-registered', value: '', inferred: true });
        expect(
            deriveClientIdPrefix(123 as unknown as string)
        ).toEqual({ prefix: 'pre-registered', value: '', inferred: true });
    });

    it('does not match a non-canonical did-ish string (e.g. trailing colon missing)', () => {
        // `did:` with no method name is malformed; the implicit-prefix
        // regex requires lowercase alphanumerics between the colons.
        // Ensures we don't accidentally treat invalid DID-like junk as
        // a DID (which would route it into the DID resolver downstream
        // and produce a confusing resolution error).
        const result = deriveClientIdPrefix('did:not-quite');
        expect(result.prefix).toBe('pre-registered');
    });
});

describe('deriveClientIdPrefix — KNOWN_CLIENT_ID_PREFIXES coverage', () => {
    it('exposes the full prefix list as a readonly tuple', () => {
        expect(KNOWN_CLIENT_ID_PREFIXES).toEqual([
            'pre-registered',
            'redirect_uri',
            'https',
            'did',
            'verifier_attestation',
            'x509_san_dns',
            'x509_hash',
        ]);
    });

    it('every advertised prefix is parseable in legacy form', () => {
        for (const prefix of KNOWN_CLIENT_ID_PREFIXES) {
            const result = deriveClientIdPrefix('verifier-1', prefix);
            expect(result.prefix).toBe(prefix);
            expect(result.inferred).toBe(false);
        }
    });
});
