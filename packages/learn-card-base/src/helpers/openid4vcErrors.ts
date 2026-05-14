/**
 * Friendly-error mappers for OpenID4VC / OpenID4VP flows.
 *
 * The `@learncard/openid4vc-plugin` exports stable, machine-readable error
 * codes on its error classes (`VciError`, `CredentialOfferParseError`,
 * `VpError`, `RequestObjectError`, etc.). UI layers should translate those
 * codes into friendly copy without string-matching the raw `message`.
 *
 * These helpers are intentionally decoupled from the plugin module so that
 * `learn-card-base` does not need to depend on `@learncard/openid4vc-plugin`
 * at build time — they discriminate on `name` + `code` shape via duck-typing.
 */

/**
 * UX-meaningful classification of an OpenID4VC error.
 *
 * The plugin layer emits ~60 distinct error codes across VciError,
 * VpError, RequestObjectError, etc. From a UX perspective most of
 * those collapse into a small number of fundamentally different
 * moments — each deserving its own visual treatment, copy framing,
 * and call-to-action. This taxonomy is that collapse.
 *
 * - `format_gap`     The wallet doesn't (yet) speak the format the
 *                    counterparty asked for. SD-JWT-VC, mDoc,
 *                    `ldp_vc` issuance, etc. Frame positively as
 *                    "we're building this".
 * - `trust_gap`      We can't verify who the counterparty is.
 *                    Untrusted signer, mismatched cert, unsigned
 *                    request, missing registry binding. Frame as
 *                    a safety feature — the wallet refused.
 * - `transport`      Network/server unreachable. Retry-shaped.
 * - `request_invalid` Counterparty sent us malformed or expired
 *                    data. Their problem to fix.
 * - `wallet`         Local wallet operation failed (signing,
 *                    storage, indexing). User-actionable rarely;
 *                    mostly contact-support.
 * - `unknown`        Unhandled or fully generic. Triage path.
 */
export type ExchangeErrorKind =
    | 'format_gap'
    | 'trust_gap'
    | 'transport'
    | 'request_invalid'
    | 'wallet'
    | 'unknown';

export interface FriendlyErrorInfo {
    /**
     * UX-meaningful classification. Drives header theming and CTA
     * shape in `ExchangeErrorDisplay`. Always present — the mapper
     * defaults to `'unknown'` for un-classified errors.
     */
    kind: ExchangeErrorKind;
    title: string;
    description: string;
    suggestion: string;
}

const GENERIC: FriendlyErrorInfo = {
    kind: 'unknown',
    title: 'Something went wrong',
    description: 'We hit an unexpected error while processing your request.',
    suggestion: 'Try again, or contact support if the problem persists.',
};

const NETWORK: FriendlyErrorInfo = {
    kind: 'transport',
    title: 'Connection issue',
    description: 'We couldn’t reach the issuer or verifier.',
    suggestion: 'Check your internet connection and try again.',
};

// -----------------------------------------------------------------
// OpenID4VCI (Credential Issuance)
// -----------------------------------------------------------------

/**
 * Map a VCI error code to friendly copy. `code` matches `VciErrorCode` from
 * `@learncard/openid4vc-plugin/vci/errors`.
 */
const VCI_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    metadata_fetch_failed: {
        kind: 'transport',
        title: 'Couldn’t reach issuer',
        description: 'We couldn’t download the issuer’s configuration.',
        suggestion: 'Check your connection or try again later. The issuer may be temporarily offline.',
    },
    metadata_invalid: {
        kind: 'request_invalid',
        title: 'Issuer not supported',
        description: 'This issuer’s configuration is missing required information.',
        suggestion: 'Contact the issuer — their setup may not be ready yet.',
    },
    metadata_issuer_mismatch: {
        kind: 'trust_gap',
        title: 'Issuer mismatch',
        description: 'The issuer URL in the offer doesn’t match the metadata it returned.',
        suggestion: 'This may indicate a misconfigured issuer. Contact whoever sent you the offer.',
    },
    token_request_failed: {
        kind: 'request_invalid',
        title: 'Issuer rejected the request',
        description: 'The issuer wouldn’t exchange the offer for an access token.',
        suggestion: 'The offer may have expired or the transaction code is wrong. Request a new offer.',
    },
    token_response_invalid: {
        kind: 'request_invalid',
        title: 'Issuer returned bad data',
        description: 'The issuer’s token response was missing required fields.',
        suggestion: 'Contact the issuer — their service may be misconfigured.',
    },
    proof_signing_failed: {
        kind: 'wallet',
        title: 'Couldn’t prove key ownership',
        description: 'Your wallet failed to sign the proof of holder binding.',
        suggestion: 'Try again. If this keeps happening, contact support.',
    },
    credential_request_failed: {
        kind: 'request_invalid',
        title: 'Issuer wouldn’t issue',
        description: 'The issuer rejected the credential request.',
        suggestion: 'The offer may have expired or the issuer is having problems. Try requesting a new offer.',
    },
    credential_response_invalid: {
        kind: 'request_invalid',
        title: 'Issuer returned bad credential',
        description: 'The credential the issuer returned is malformed or missing.',
        suggestion: 'Contact the issuer — their service may be misconfigured.',
    },
    unsupported_grant: {
        kind: 'format_gap',
        title: 'Issuance type not supported',
        description: 'This issuer is using a sign-in flow LearnCard doesn’t support yet.',
        suggestion: 'We’re working on it — let us know you hit this so we can prioritize.',
    },
    unsupported_format: {
        kind: 'format_gap',
        title: 'Credential format not supported',
        description: 'This credential uses a format LearnCard doesn’t support yet (likely SD-JWT-VC or mDoc).',
        suggestion: 'We’re building support for this — let us know you hit this so we can prioritize.',
    },
    tx_code_required: {
        kind: 'request_invalid',
        title: 'Transaction code required',
        description: 'The issuer needs a transaction code from you to release this credential.',
        suggestion: 'Enter the code the issuer gave you and try again.',
    },
    nonce_required: {
        kind: 'request_invalid',
        title: 'Issuer asked for a fresh proof',
        description: 'The issuer wants a new cryptographic proof to issue the credential.',
        suggestion: 'Try again — your wallet will generate a fresh proof automatically.',
    },
    store_failed: {
        kind: 'wallet',
        title: 'Couldn’t save credential',
        description: 'The credential was issued but we couldn’t store it in your wallet.',
        suggestion: 'Try again. If this keeps happening, free up storage or contact support.',
    },
    index_failed: {
        kind: 'wallet',
        title: 'Couldn’t index credential',
        description: 'The credential was saved but couldn’t be added to your wallet index.',
        suggestion: 'You may need to refresh your wallet to see it.',
    },
    store_plane_missing: {
        kind: 'wallet',
        title: 'Wallet not ready',
        description: 'Your wallet is missing the storage support needed for this credential.',
        suggestion: 'Try again after the wallet finishes initializing, or contact support.',
    },
    index_plane_missing: {
        kind: 'wallet',
        title: 'Wallet not ready',
        description: 'Your wallet is missing the index support needed for this credential.',
        suggestion: 'Try again after the wallet finishes initializing, or contact support.',
    },
    unsupported_client_id_scheme: {
        kind: 'format_gap',
        title: 'Unsupported client ID scheme',
        description: 'The issuer is using a client ID scheme that LearnCard doesn’t support yet.',
        suggestion: 'We’re working on it — let us know you hit this so we can prioritize.',
    },
};

/**
 * Map a `CredentialOfferParseError.code` value to friendly copy.
 */
const OFFER_PARSE_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    invalid_uri: {
        kind: 'request_invalid',
        title: 'Invalid offer link',
        description: 'The credential offer link is malformed or incomplete.',
        suggestion: 'Check that you scanned the full QR code, or ask the issuer for a new link.',
    },
    invalid_json: {
        kind: 'request_invalid',
        title: 'Invalid offer data',
        description: 'The credential offer contains data we couldn’t parse.',
        suggestion: 'Ask the issuer to send the offer again — their service may have generated a malformed payload.',
    },
    missing_offer: {
        kind: 'request_invalid',
        title: 'No offer in link',
        description: 'The link is missing the credential offer details.',
        suggestion: 'Check that you have the full link and try again.',
    },
    missing_issuer: {
        kind: 'request_invalid',
        title: 'Offer missing issuer',
        description: 'The credential offer doesn’t say who is issuing the credential.',
        suggestion: 'Ask the issuer for a corrected offer.',
    },
    missing_credentials: {
        kind: 'request_invalid',
        title: 'Offer missing credentials',
        description: 'The credential offer doesn’t list any credentials to claim.',
        suggestion: 'Ask the issuer for a corrected offer.',
    },
    invalid_grants: {
        kind: 'request_invalid',
        title: 'Offer has invalid grants',
        description: 'The credential offer’s authorization information is malformed.',
        suggestion: 'Ask the issuer to send the offer again.',
    },
    both_offer_and_uri: {
        kind: 'request_invalid',
        title: 'Ambiguous offer link',
        description: 'The link contains both an inline offer and a remote offer URL, which isn’t allowed.',
        suggestion: 'Ask the issuer for a corrected link.',
    },
};

// -----------------------------------------------------------------
// OpenID4VP (Verifiable Presentation)
// -----------------------------------------------------------------

const VP_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    invalid_uri: {
        kind: 'request_invalid',
        title: 'Invalid request link',
        description: 'The presentation request link is malformed or incomplete.',
        suggestion: 'Check that you scanned the full QR code, or ask the verifier for a new link.',
    },
    invalid_json: {
        kind: 'request_invalid',
        title: 'Invalid request data',
        description: 'The verifier’s request contained data we couldn’t parse.',
        suggestion: 'Ask the verifier to generate a new request.',
    },
    invalid_request: {
        kind: 'request_invalid',
        title: 'Invalid presentation request',
        description: 'The verifier sent a request we couldn’t parse.',
        suggestion: 'Ask the verifier for a new request — their service may have generated a malformed payload.',
    },
    fetch_failed: {
        kind: 'transport',
        title: 'Couldn’t reach verifier',
        description: 'We couldn’t download the verifier’s request.',
        suggestion: 'Check your connection or try again later.',
    },
    request_uri_failed: {
        kind: 'transport',
        title: 'Couldn’t fetch request',
        description: 'We couldn’t download the verifier’s presentation request.',
        suggestion: 'Check your connection. If this keeps happening, the verifier may be offline.',
    },
    presentation_definition_fetch_failed: {
        kind: 'transport',
        title: 'Couldn’t fetch request',
        description: 'We couldn’t download the rules of what the verifier is asking for.',
        suggestion: 'Check your connection. If this keeps happening, the verifier may be offline.',
    },
    no_match: {
        kind: 'request_invalid',
        title: 'No matching credentials',
        description: 'You don’t have any credentials in your wallet that match what the verifier is asking for.',
        suggestion: 'You may need to obtain the requested credential before you can present it.',
    },
    incomplete_match: {
        kind: 'request_invalid',
        title: 'Some credentials missing',
        description: 'You have some, but not all, of the credentials the verifier requested.',
        suggestion: 'Obtain the missing credentials, then come back and try again.',
    },
    invalid_credential: {
        kind: 'wallet',
        title: 'Credential not usable',
        description: 'One of the credentials we tried to present can’t be used for this request.',
        suggestion: 'Try selecting a different credential, or contact support.',
    },
    sign_failed: {
        kind: 'wallet',
        title: 'Couldn’t sign presentation',
        description: 'Your wallet failed to sign the presentation.',
        suggestion: 'Try again. If this keeps happening, contact support.',
    },
    submit_failed: {
        kind: 'request_invalid',
        title: 'Verifier rejected presentation',
        description: 'The verifier didn’t accept the presentation we submitted.',
        suggestion: 'Try again. If this keeps happening, the verifier may be misconfigured.',
    },
    server_error: {
        kind: 'transport',
        title: 'Verifier server error',
        description: 'The verifier’s server returned an error.',
        suggestion: 'This is usually temporary. Wait a moment and try again.',
    },
    jarm_encrypt_failed: {
        kind: 'request_invalid',
        title: 'Couldn’t encrypt response',
        description: 'We couldn’t encrypt the response with the verifier’s public key.',
        suggestion: 'The verifier’s key configuration may be invalid. Contact the verifier.',
    },
    network_error: {
        kind: 'transport',
        title: 'Connection issue',
        description: 'We couldn’t reach the verifier.',
        suggestion: 'Check your internet connection and try again.',
    },
    no_fetch: {
        kind: 'wallet',
        title: 'Wallet not ready',
        description: 'Your wallet doesn’t have networking available right now.',
        suggestion: 'Try again after the wallet finishes initializing.',
    },
    invalid_input: {
        kind: 'wallet',
        title: 'Couldn’t prepare presentation',
        description: 'The wallet couldn’t assemble a valid presentation from your selection.',
        suggestion: 'Try again, or pick a different credential.',
    },
    no_selections: {
        kind: 'request_invalid',
        title: 'Nothing selected to share',
        description: 'No credentials were chosen for this request.',
        suggestion: 'Go back to the consent screen and pick at least one credential.',
    },
    unknown_descriptor: {
        kind: 'request_invalid',
        title: 'Verifier asked for something unknown',
        description: 'The verifier referenced a part of the request we couldn’t resolve.',
        suggestion: 'Ask the verifier to send a corrected request.',
    },
    unknown_credential_format: {
        kind: 'format_gap',
        title: 'Credential format not supported',
        description: 'The verifier is asking for a credential format LearnCard doesn’t produce yet (likely SD-JWT-VC or mDoc).',
        suggestion: 'We’re building support for this — let us know you hit this so we can prioritize.',
    },
    invalid_jwt_vc: {
        kind: 'wallet',
        title: 'Credential not usable',
        description: 'One of the credentials selected for sharing is in an unexpected shape.',
        suggestion: 'Try selecting a different credential, or contact support.',
    },
    invalid_dcql_query: {
        kind: 'request_invalid',
        title: 'Invalid query from verifier',
        description: 'The verifier sent a credential query we couldn’t parse.',
        suggestion: 'Ask the verifier to send a corrected request.',
    },
    invalid_presentation_definition: {
        kind: 'request_invalid',
        title: 'Invalid request from verifier',
        description: 'The verifier sent a presentation definition we couldn’t parse.',
        suggestion: 'Ask the verifier to send a corrected request.',
    },
    both_pex_and_dcql: {
        kind: 'request_invalid',
        title: 'Ambiguous request',
        description: 'The verifier sent two competing query types in one request, which isn’t allowed.',
        suggestion: 'Ask the verifier to send a corrected request — their service may be misconfigured.',
    },
    both_definition_and_uri: {
        kind: 'request_invalid',
        title: 'Ambiguous request',
        description: 'The verifier sent both an inline and a remote presentation definition, which isn’t allowed.',
        suggestion: 'Ask the verifier to send a corrected request.',
    },
    request_object_not_supported: {
        kind: 'format_gap',
        title: 'Request type not supported',
        description: 'The verifier is using a request format LearnCard doesn’t support yet.',
        suggestion: 'We’re working on it — let us know you hit this so we can prioritize.',
    },
    unsupported_response_type: {
        kind: 'format_gap',
        title: 'Response type not supported',
        description: 'The verifier asked for a response type LearnCard doesn’t produce yet.',
        suggestion: 'We’re working on it — let us know you hit this so we can prioritize.',
    },
    missing_client_id: {
        kind: 'request_invalid',
        title: 'Verifier didn’t identify itself',
        description: 'The request didn’t include the verifier’s identifier.',
        suggestion: 'Don’t share credentials. Ask the verifier to send a properly-formed request.',
    },
    missing_nonce: {
        kind: 'request_invalid',
        title: 'Invalid request from verifier',
        description: 'The request was missing a freshness token (nonce).',
        suggestion: 'Ask the verifier to send a corrected request.',
    },
};

/**
 * Map a `RequestObjectError.code` to friendly copy.
 */
const REQUEST_OBJECT_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    invalid_request_object: {
        kind: 'request_invalid',
        title: 'Invalid request from verifier',
        description: 'The verifier sent a request we couldn’t parse.',
        suggestion: 'Ask the verifier to send a corrected request.',
    },
    request_fetch_failed: {
        kind: 'transport',
        title: 'Couldn’t fetch request',
        description: 'We couldn’t download the verifier’s request.',
        suggestion: 'Check your connection. If this keeps happening, the verifier may be offline.',
    },
    missing_client_id_scheme: {
        kind: 'trust_gap',
        title: 'Verifier identity unverifiable',
        description: 'The verifier didn’t tell us how to confirm who they are.',
        suggestion: 'For your safety, LearnCard won’t share credentials with apps it can’t identify. Contact the verifier through a trusted channel.',
    },
    unsupported_client_id_scheme: {
        kind: 'trust_gap',
        title: 'Can’t verify this app’s identity',
        description: 'For your safety, LearnCard only shares credentials with apps it can cryptographically confirm. We don’t yet know how to verify this app’s identity.',
        suggestion: 'If this is a verifier you trust, let us know — we’re building support for more identity schemes.',
    },
    client_id_mismatch: {
        kind: 'trust_gap',
        title: 'Verifier identity mismatch',
        description: 'The signature on the request doesn’t match the verifier’s claimed identity.',
        suggestion: 'Don’t share credentials. Contact the verifier through a trusted channel.',
    },
    request_signature_invalid: {
        kind: 'trust_gap',
        title: 'Verifier signature invalid',
        description: 'We couldn’t verify the verifier’s identity — their request signature didn’t check out.',
        suggestion: 'Don’t share credentials. Contact the verifier through a trusted channel to confirm.',
    },
    request_signer_untrusted: {
        kind: 'trust_gap',
        title: 'Unknown verifier',
        description: 'We don’t recognize the certificate the verifier used to sign this request.',
        suggestion: 'Don’t share credentials with verifiers you don’t trust.',
    },
    did_resolution_failed: {
        kind: 'trust_gap',
        title: 'Couldn’t resolve verifier identity',
        description: 'We couldn’t look up the verifier’s decentralized identifier.',
        suggestion: 'Check your connection or try again later.',
    },
    unsafe_mode_rejected: {
        kind: 'trust_gap',
        title: 'Unsafe request rejected',
        description: 'This wallet is configured to require signed requests, but the verifier sent an unsigned one.',
        suggestion: 'Ask the verifier to send a signed request.',
    },

    // ----- Legacy aliases (kept so older string-matching callers still resolve) -----
    request_signature_missing: {
        kind: 'trust_gap',
        title: 'Unsigned request',
        description: 'The verifier sent an unsigned request, which can’t be trusted.',
        suggestion: 'Ask the verifier to send a signed request before sharing credentials.',
    },
    issuer_mismatch: {
        kind: 'trust_gap',
        title: 'Verifier identity mismatch',
        description: 'The signature on the request doesn’t match the claimed verifier.',
        suggestion: 'Don’t share credentials. Contact the verifier through a trusted channel.',
    },
    untrusted_signer: {
        kind: 'trust_gap',
        title: 'Unknown verifier',
        description: 'We don’t recognize the certificate the verifier used to sign this request.',
        suggestion: 'Don’t share credentials with verifiers you don’t trust.',
    },
    cert_chain_invalid: {
        kind: 'trust_gap',
        title: 'Invalid certificate chain',
        description: 'The verifier’s certificate chain isn’t valid.',
        suggestion: 'Don’t share credentials. Contact the verifier through a trusted channel.',
    },
    cert_san_mismatch: {
        kind: 'trust_gap',
        title: 'Verifier domain mismatch',
        description: 'The verifier’s certificate doesn’t cover the domain it’s claiming to act for.',
        suggestion: 'Don’t share credentials. The verifier’s setup is misconfigured.',
    },
};

// -----------------------------------------------------------------
// Public API
// -----------------------------------------------------------------

/**
 * Best-effort mapping of an error caught from the OpenID4VC plugin into
 * friendly copy. Tries (in order):
 *
 *  1. Match by `error.name === 'VciError'` and `code` lookup
 *  2. Match by `error.name === 'CredentialOfferParseError'` and `code` lookup
 *  3. Match by `error.name === 'VpError' | 'VpSubmitError'` and `code` lookup
 *  4. Match by `error.name === 'RequestObjectError'` and `code` lookup
 *  5. Network-flavored default if the message looks like a `fetch` failure
 *  6. Generic fallback
 */
export const getFriendlyOpenID4VCError = (err: unknown): FriendlyErrorInfo => {
    if (!err) return GENERIC;

    if (typeof err === 'string') {
        return mapByMessage(err);
    }

    if (typeof err !== 'object') return GENERIC;

    const candidate = err as { name?: string; code?: string; message?: string };

    if (typeof candidate.code === 'string') {
        switch (candidate.name) {
            case 'VciError':
                return VCI_ERROR_MAP[candidate.code] ?? GENERIC;
            case 'CredentialOfferParseError':
                return OFFER_PARSE_ERROR_MAP[candidate.code] ?? GENERIC;
            case 'VpError':
            case 'VpSubmitError':
            case 'BuildPresentationError':
            case 'VpSignError':
            case 'JarmEncryptError':
                return VP_ERROR_MAP[candidate.code] ?? GENERIC;
            case 'RequestObjectError':
                return REQUEST_OBJECT_ERROR_MAP[candidate.code] ?? GENERIC;
        }

        // Some plugin code paths attach `code` without setting a custom `name`.
        // Fall back to looking the code up across all maps.
        return (
            VCI_ERROR_MAP[candidate.code]
            ?? OFFER_PARSE_ERROR_MAP[candidate.code]
            ?? VP_ERROR_MAP[candidate.code]
            ?? REQUEST_OBJECT_ERROR_MAP[candidate.code]
            ?? GENERIC
        );
    }

    if (typeof candidate.message === 'string') {
        return mapByMessage(candidate.message);
    }

    return GENERIC;
};

const mapByMessage = (message: string): FriendlyErrorInfo => {
    const lower = message.toLowerCase();

    if (
        lower.includes('failed to fetch')
        || lower.includes('network')
        || lower.includes('econn')
        || lower.includes('timeout')
    ) {
        return NETWORK;
    }

    return GENERIC;
};

/**
 * Convenience helpers for callers that already know which flow they\u2019re in.
 * They just narrow the public mapper for clarity at the call site.
 */
export const getFriendlyVciError = getFriendlyOpenID4VCError;
export const getFriendlyVpError = getFriendlyOpenID4VCError;
