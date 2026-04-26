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

export interface FriendlyErrorInfo {
    title: string;
    description: string;
    suggestion: string;
}

const GENERIC: FriendlyErrorInfo = {
    title: 'Something went wrong',
    description: 'We hit an unexpected error while processing your request.',
    suggestion: 'Try again, or contact support if the problem persists.',
};

const NETWORK: FriendlyErrorInfo = {
    title: 'Connection issue',
    description: 'We couldn\u2019t reach the issuer or verifier.',
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
        title: 'Couldn\u2019t reach issuer',
        description: 'We couldn\u2019t download the issuer\u2019s configuration.',
        suggestion: 'Check your connection or try again later. The issuer may be temporarily offline.',
    },
    metadata_invalid: {
        title: 'Issuer not supported',
        description: 'This issuer\u2019s configuration is missing required information.',
        suggestion: 'Contact the issuer \u2014 their setup may not be ready yet.',
    },
    metadata_issuer_mismatch: {
        title: 'Issuer mismatch',
        description: 'The issuer URL in the offer doesn\u2019t match the metadata it returned.',
        suggestion: 'This may indicate a misconfigured issuer. Contact whoever sent you the offer.',
    },
    token_request_failed: {
        title: 'Issuer rejected the request',
        description: 'The issuer wouldn\u2019t exchange the offer for an access token.',
        suggestion: 'The offer may have expired or the transaction code is wrong. Request a new offer.',
    },
    token_response_invalid: {
        title: 'Issuer returned bad data',
        description: 'The issuer\u2019s token response was missing required fields.',
        suggestion: 'Contact the issuer \u2014 their service may be misconfigured.',
    },
    proof_signing_failed: {
        title: 'Couldn\u2019t prove key ownership',
        description: 'Your wallet failed to sign the proof of holder binding.',
        suggestion: 'Try again. If this keeps happening, contact support.',
    },
    credential_request_failed: {
        title: 'Issuer wouldn\u2019t issue',
        description: 'The issuer rejected the credential request.',
        suggestion: 'The offer may have expired or the issuer is having problems. Try requesting a new offer.',
    },
    credential_response_invalid: {
        title: 'Issuer returned bad credential',
        description: 'The credential the issuer returned is malformed or missing.',
        suggestion: 'Contact the issuer \u2014 their service may be misconfigured.',
    },
    unsupported_grant: {
        title: 'Issuance type not supported',
        description: 'This wallet doesn\u2019t support the issuance flow this offer requires.',
        suggestion: 'Try claiming with a different wallet that supports authorization-code or pre-authorized flows.',
    },
    unsupported_format: {
        title: 'Credential format not supported',
        description: 'The format of the credential being offered isn\u2019t supported by this wallet.',
        suggestion: 'Contact the issuer to request a supported format (JWT-VC or LDP-VC).',
    },
    tx_code_required: {
        title: 'Transaction code required',
        description: 'The issuer needs a transaction code from you to release this credential.',
        suggestion: 'Enter the code the issuer gave you and try again.',
    },
    nonce_required: {
        title: 'Issuer asked for a fresh proof',
        description: 'The issuer wants a new cryptographic proof to issue the credential.',
        suggestion: 'Try again \u2014 your wallet will generate a fresh proof automatically.',
    },
    store_failed: {
        title: 'Couldn\u2019t save credential',
        description: 'The credential was issued but we couldn\u2019t store it in your wallet.',
        suggestion: 'Try again. If this keeps happening, free up storage or contact support.',
    },
    index_failed: {
        title: 'Couldn\u2019t index credential',
        description: 'The credential was saved but couldn\u2019t be added to your wallet index.',
        suggestion: 'You may need to refresh your wallet to see it.',
    },
    store_plane_missing: {
        title: 'Wallet not ready',
        description: 'Your wallet is missing the storage support needed for this credential.',
        suggestion: 'Try again after the wallet finishes initializing, or contact support.',
    },
    index_plane_missing: {
        title: 'Wallet not ready',
        description: 'Your wallet is missing the index support needed for this credential.',
        suggestion: 'Try again after the wallet finishes initializing, or contact support.',
    },
};

/**
 * Map a `CredentialOfferParseError.code` value to friendly copy.
 */
const OFFER_PARSE_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    invalid_uri: {
        title: 'Invalid offer link',
        description: 'The credential offer link is malformed or incomplete.',
        suggestion: 'Check that you scanned the full QR code, or ask the issuer for a new link.',
    },
    invalid_json: {
        title: 'Invalid offer data',
        description: 'The credential offer contains data we couldn\u2019t parse.',
        suggestion: 'Ask the issuer to send the offer again \u2014 their service may have generated a malformed payload.',
    },
    missing_offer: {
        title: 'No offer in link',
        description: 'The link is missing the credential offer details.',
        suggestion: 'Check that you have the full link and try again.',
    },
    missing_issuer: {
        title: 'Offer missing issuer',
        description: 'The credential offer doesn\u2019t say who is issuing the credential.',
        suggestion: 'Ask the issuer for a corrected offer.',
    },
    missing_credentials: {
        title: 'Offer missing credentials',
        description: 'The credential offer doesn\u2019t list any credentials to claim.',
        suggestion: 'Ask the issuer for a corrected offer.',
    },
    invalid_grants: {
        title: 'Offer has invalid grants',
        description: 'The credential offer\u2019s authorization information is malformed.',
        suggestion: 'Ask the issuer to send the offer again.',
    },
    both_offer_and_uri: {
        title: 'Ambiguous offer link',
        description: 'The link contains both an inline offer and a remote offer URL, which isn\u2019t allowed.',
        suggestion: 'Ask the issuer for a corrected link.',
    },
};

// -----------------------------------------------------------------
// OpenID4VP (Verifiable Presentation)
// -----------------------------------------------------------------

const VP_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    invalid_uri: {
        title: 'Invalid request link',
        description: 'The presentation request link is malformed or incomplete.',
        suggestion: 'Check that you scanned the full QR code, or ask the verifier for a new link.',
    },
    invalid_request: {
        title: 'Invalid presentation request',
        description: 'The verifier sent a request we couldn\u2019t parse.',
        suggestion: 'Ask the verifier for a new request \u2014 their service may have generated a malformed payload.',
    },
    fetch_failed: {
        title: 'Couldn\u2019t reach verifier',
        description: 'We couldn\u2019t download the verifier\u2019s request.',
        suggestion: 'Check your connection or try again later.',
    },
    request_uri_failed: {
        title: 'Couldn\u2019t fetch request',
        description: 'We couldn\u2019t download the verifier\u2019s presentation request.',
        suggestion: 'Check your connection. If this keeps happening, the verifier may be offline.',
    },
    no_match: {
        title: 'No matching credentials',
        description: 'You don\u2019t have any credentials in your wallet that match what the verifier is asking for.',
        suggestion: 'You may need to obtain the requested credential before you can present it.',
    },
    incomplete_match: {
        title: 'Some credentials missing',
        description: 'You have some, but not all, of the credentials the verifier requested.',
        suggestion: 'Obtain the missing credentials, then come back and try again.',
    },
    invalid_credential: {
        title: 'Credential not usable',
        description: 'One of the credentials we tried to present can\u2019t be used for this request.',
        suggestion: 'Try selecting a different credential, or contact support.',
    },
    sign_failed: {
        title: 'Couldn\u2019t sign presentation',
        description: 'Your wallet failed to sign the presentation.',
        suggestion: 'Try again. If this keeps happening, contact support.',
    },
    submit_failed: {
        title: 'Verifier rejected presentation',
        description: 'The verifier didn\u2019t accept the presentation we submitted.',
        suggestion: 'Try again. If this keeps happening, the verifier may be misconfigured.',
    },
    server_error: {
        title: 'Verifier server error',
        description: 'The verifier\u2019s server returned an error.',
        suggestion: 'This is usually temporary. Wait a moment and try again.',
    },
    jarm_encrypt_failed: {
        title: 'Couldn\u2019t encrypt response',
        description: 'We couldn\u2019t encrypt the response with the verifier\u2019s public key.',
        suggestion: 'The verifier\u2019s key configuration may be invalid. Contact the verifier.',
    },
};

/**
 * Map a `RequestObjectError.code` to friendly copy.
 */
const REQUEST_OBJECT_ERROR_MAP: Record<string, FriendlyErrorInfo> = {
    request_signature_invalid: {
        title: 'Verifier signature invalid',
        description: 'We couldn\u2019t verify the verifier\u2019s identity \u2014 their request signature didn\u2019t check out.',
        suggestion: 'Don\u2019t share credentials. Contact the verifier through a trusted channel to confirm.',
    },
    request_signature_missing: {
        title: 'Unsigned request',
        description: 'The verifier sent an unsigned request, which can\u2019t be trusted.',
        suggestion: 'Ask the verifier to send a signed request before sharing credentials.',
    },
    issuer_mismatch: {
        title: 'Verifier identity mismatch',
        description: 'The signature on the request doesn\u2019t match the claimed verifier.',
        suggestion: 'Don\u2019t share credentials. Contact the verifier through a trusted channel.',
    },
    untrusted_signer: {
        title: 'Unknown verifier',
        description: 'We don\u2019t recognize the certificate the verifier used to sign this request.',
        suggestion: 'Don\u2019t share credentials with verifiers you don\u2019t trust.',
    },
    cert_chain_invalid: {
        title: 'Invalid certificate chain',
        description: 'The verifier\u2019s certificate chain isn\u2019t valid.',
        suggestion: 'Don\u2019t share credentials. Contact the verifier through a trusted channel.',
    },
    cert_san_mismatch: {
        title: 'Verifier domain mismatch',
        description: 'The verifier\u2019s certificate doesn\u2019t cover the domain it\u2019s claiming to act for.',
        suggestion: 'Don\u2019t share credentials. The verifier\u2019s setup is misconfigured.',
    },
    did_resolution_failed: {
        title: 'Couldn\u2019t resolve verifier identity',
        description: 'We couldn\u2019t look up the verifier\u2019s decentralized identifier.',
        suggestion: 'Check your connection or try again later.',
    },
    unsafe_mode_rejected: {
        title: 'Unsafe request rejected',
        description: 'This wallet is configured to require signed requests, but the verifier sent an unsigned one.',
        suggestion: 'Ask the verifier to send a signed request.',
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
