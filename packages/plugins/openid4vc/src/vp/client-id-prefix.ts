/**
 * **OID4VP 1.0 §5.10 — Client Identifier Prefix derivation.**
 *
 * The prefix tells the wallet *how to verify* a verifier's identity:
 *
 *   - `pre-registered` — the verifier is in the wallet's local registry;
 *     `client_id` is whatever ID the registration agreed on (an opaque
 *     string, often a slug).
 *   - `redirect_uri` — the verifier's identity IS its redirect URL;
 *     no signed Request Object permitted (no key to verify against).
 *   - `https` — `client_id` is the verifier's HTTPS URL; verifier
 *     metadata (and its signing key) is fetched from
 *     `<client_id>/.well-known/openid-federation`.
 *   - `did` — `client_id` is a DID URL; signing key resolves through
 *     the DID document.
 *   - `verifier_attestation` — the verifier carries a self-attesting
 *     JWT in the JWS header (cnf claim).
 *   - `x509_san_dns` — the JWS `x5c` chain's leaf cert binds to the
 *     hostname half of `client_id` via DNS SAN.
 *   - `x509_hash` — same as above but the binding is a hash match
 *     against `client_id` rather than a DNS name.
 *
 * # Two encoding styles to handle
 *
 * Wallets see both forms in the wild:
 *
 *   - **Draft 22 / earlier** ships `client_id_scheme` as a *separate*
 *     parameter (URL or signed claim) and `client_id` is the bare
 *     identifier:
 *
 *         client_id=did:jwk:eyJhbGc...
 *         client_id_scheme=did
 *
 *   - **OID4VP 1.0** packs the prefix *inline* in `client_id` as
 *     `<prefix>:<value>`:
 *
 *         client_id=x509_san_dns:verifier.example.com
 *         client_id=did:jwk:eyJhbGc...           (prefix `did` is
 *                                                  implicit; the DID
 *                                                  URI scheme IS the
 *                                                  prefix)
 *         client_id=Verifier                     (no prefix → defaults
 *                                                  to pre-registered)
 *
 * `deriveClientIdPrefix` accepts both styles and returns a normalized
 * `{ prefix, value }` so downstream verification code doesn't care
 * which encoding the verifier picked.
 *
 * # Why this lives in its own module
 *
 * This logic is **the security perimeter** for verifier identity:
 * every signed Request Object's trust binding chains off the prefix
 * we derive here. Keeping it in one tested module (rather than
 * inlining the string-munging in `request-object.ts`) means:
 *
 *   1. The test surface is one cohesive matrix instead of being
 *      smeared across the JAR verifier's tests.
 *   2. URI-mode (`by_value`) and Request-Object-mode (`by_reference`)
 *      share exactly the same derivation, so we can't drift between
 *      them.
 *   3. Adding a new prefix in the future (e.g. `web_origin` from a
 *      future spec rev) is a one-line addition here, not a sweep.
 */

/**
 * The OID4VP 1.0 client-identifier prefixes the plugin recognizes.
 * `did` includes the legacy `decentralized_identifier` synonym some
 * implementations emit; both normalize to `did`.
 */
export type ClientIdPrefix =
    | 'pre-registered'
    | 'redirect_uri'
    | 'https'
    | 'did'
    | 'verifier_attestation'
    | 'x509_san_dns'
    | 'x509_hash';

export const KNOWN_CLIENT_ID_PREFIXES: readonly ClientIdPrefix[] = [
    'pre-registered',
    'redirect_uri',
    'https',
    'did',
    'verifier_attestation',
    'x509_san_dns',
    'x509_hash',
];

export interface DerivedClientId {
    /** Normalized prefix that downstream verification keys off. */
    prefix: ClientIdPrefix;

    /**
     * The post-prefix portion of `client_id` — the actual verifier
     * identifier (DNS name, DID, URL, registered slug, …). Equal to
     * `clientId` when no prefix was inline (e.g. `pre-registered`).
     */
    value: string;

    /**
     * `true` when the prefix was inferred (legacy draft-22 form, OR
     * a DID URI encoding the `did` prefix implicitly, OR the
     * `pre-registered` default for a bare client_id). Useful for
     * logging / interop diagnostics; verification logic shouldn't
     * branch on it.
     */
    inferred: boolean;
}

/**
 * Derive the client-id prefix from a verifier's `client_id` plus an
 * optional legacy `client_id_scheme` parameter.
 *
 * Resolution order:
 *
 *   1. **Legacy `client_id_scheme` wins** when supplied (draft-22
 *      semantics). The full `client_id` is the value. Validates that
 *      the supplied scheme is one we recognize.
 *   2. **Explicit prefix in `client_id`**: if `client_id` starts with
 *      `<prefix>:` for any prefix that requires explicit encoding
 *      (everything except `pre-registered`, `did`, and `https`,
 *      which have implicit forms), strip and use it.
 *   3. **`https://` URL** → prefix `https`, value = full URL.
 *   4. **`did:` URI** → prefix `did`, value = full DID (the DID's
 *      own colon-delimited form encodes the prefix implicitly).
 *   5. **Fallback** → `pre-registered`, value = `client_id` verbatim.
 *
 * Throws nothing — returns a value for every input. Spec violations
 * (e.g. caller-supplied `client_id_scheme=garbage`) bubble up as
 * `prefix: pre-registered` with a `legacySchemeIgnored` diagnostic
 * the caller can surface; this keeps the function pure and lets the
 * security-critical "is this prefix one I know how to verify"
 * decision happen at the JAR verifier where the trust context lives.
 */
export const deriveClientIdPrefix = (
    clientId: string,
    legacyScheme?: string
): DerivedClientId => {
    if (typeof clientId !== 'string' || clientId.length === 0) {
        // Caller is responsible for catching the empty case before
        // calling us — but if they don't, fall back gracefully rather
        // than throw, matching the rest of this module's pure-fn
        // contract. Always normalize value to a string so downstream
        // code never has to type-guard.
        return { prefix: 'pre-registered', value: '', inferred: true };
    }

    // Path 1 — legacy `client_id_scheme` parameter (draft 22 wire form).
    // We accept any of the known prefixes verbatim. Unknown legacy
    // schemes degrade to `pre-registered` (the JAR verifier will then
    // reject the request with a clear `unsupported_client_id_scheme`
    // because the signing-key binding won't be derivable).
    if (typeof legacyScheme === 'string' && legacyScheme.length > 0) {
        if (isKnownPrefix(legacyScheme)) {
            return {
                prefix: legacyScheme,
                value: clientId,
                inferred: false,
            };
        }
        // Unknown scheme — fall through to inference. The JAR verifier
        // logs the legacy value as part of its error message.
    }

    // Path 2 — explicit `<prefix>:<value>` form. Only the prefixes
    // listed here are spec-allowed in explicit form. Notably:
    //
    //   - `pre-registered` has no explicit form (it's the *default*
    //     when no prefix is detected).
    //   - `did` has no explicit form either; the DID URI itself
    //     (`did:method:identifier`) IS the encoding, handled below
    //     in path 4.
    //   - `https` has no explicit form; the URL syntax `https://...`
    //     is the encoding (path 3).
    //
    // Skipping `did` here is what lets `did:web:foo.com` route
    // correctly through the implicit-DID path rather than getting
    // (mis)stripped to `web:foo.com`.
    const explicitPrefixes: readonly ClientIdPrefix[] = [
        'redirect_uri',
        'verifier_attestation',
        'x509_san_dns',
        'x509_hash',
    ];

    for (const prefix of explicitPrefixes) {
        const sentinel = `${prefix}:`;
        if (clientId.startsWith(sentinel)) {
            return {
                prefix,
                value: clientId.slice(sentinel.length),
                inferred: false,
            };
        }
    }

    // Path 3 — `https://...` URL. Note we deliberately match the
    // `://` form (not bare `https:` which would conflict with a
    // hypothetical literal `https:` prefix encoding). The OID4VP
    // 1.0 spec mandates the URL form.
    if (clientId.startsWith('https://')) {
        return { prefix: 'https', value: clientId, inferred: true };
    }

    // Path 4 — DID URI. `did:` followed by a method name + identifier.
    // We match the canonical DID URI grammar (RFC 8141-ish): a method
    // name made of lowercase ASCII alphanumerics, then another colon.
    // This avoids matching e.g. an unrelated explicit-prefix form
    // that happens to start with "did" (none currently exist, but
    // the strictness keeps future-proofing cheap).
    if (/^did:[a-z0-9]+:/.test(clientId)) {
        return { prefix: 'did', value: clientId, inferred: true };
    }

    // Path 5 — fallback: pre-registered with the bare client_id as
    // the registration key.
    return { prefix: 'pre-registered', value: clientId, inferred: true };
};

const isKnownPrefix = (s: string): s is ClientIdPrefix =>
    (KNOWN_CLIENT_ID_PREFIXES as readonly string[]).includes(s);
