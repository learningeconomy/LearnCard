import { CredentialResponseBody, OAuthErrorBody } from './types';
import { VciError } from './errors';

/**
 * POST a credential request to the issuer's credential endpoint and
 * validate the response. Synchronous issuance only — deferred
 * (`transaction_id`) and batch (`credentials` array) responses are passed
 * through for higher-level handling.
 *
 * Draft 13 §7.2 distinguishes two mutually-exclusive ways to identify the
 * credential being requested:
 *
 * 1. `credential_identifier` — supplied by the issuer in the token
 *    response's `authorization_details[].credential_identifiers`. Only
 *    use this when the token endpoint explicitly returned one.
 * 2. `format` + format-specific fields (e.g. `credential_definition`
 *    for `jwt_vc_json` / `ldp_vc`). The default path for pre-authorized
 *    flows where the offer carries `credential_configuration_ids` but
 *    the token response carries no `authorization_details`.
 *
 * Callers pick the path by setting either `credentialIdentifier` OR
 * `format` (+ relevant `extra` fields).
 */
export const requestCredential = async (args: {
    credentialEndpoint: string;
    accessToken: string;
    tokenType?: string;
    /**
     * Opaque identifier from the token response's `authorization_details`.
     * When set, `format` and any format-specific `extra` fields MUST NOT
     * be sent (spec §7.2).
     */
    credentialIdentifier?: string;
    /**
     * Credential format id (`jwt_vc_json`, `ldp_vc`, …). Required unless
     * `credentialIdentifier` is supplied.
     */
    format?: string;
    /** Proof-of-possession JWT built by {@link buildProofJwt}. */
    proofJwt: string;
    /**
     * Format-specific body fields. For `jwt_vc_json` this is typically
     * `{ credential_definition: { type: [...] } }` copied from the issuer
     * metadata's advertised configuration. Ignored when
     * `credentialIdentifier` is set.
     */
    extra?: Record<string, unknown>;
    fetchImpl?: typeof fetch;
}): Promise<CredentialResponseBody> => {
    const {
        credentialEndpoint,
        accessToken,
        tokenType = 'Bearer',
        credentialIdentifier,
        format,
        proofJwt,
        extra,
    } = args;
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;

    if (typeof fetchImpl !== 'function') {
        throw new VciError(
            'credential_request_failed',
            'No fetch implementation available for credential request'
        );
    }

    const hasCredentialIdentifier =
        typeof credentialIdentifier === 'string' && credentialIdentifier.length > 0;

    const hasFormat = typeof format === 'string' && format.length > 0;

    if (!hasCredentialIdentifier && !hasFormat) {
        throw new VciError(
            'credential_request_failed',
            'requestCredential requires either `credentialIdentifier` (from authorization_details) or `format`'
        );
    }

    const body: Record<string, unknown> = {
        proof: { proof_type: 'jwt', jwt: proofJwt },
    };

    if (hasCredentialIdentifier) {
        // Spec §7.2: when `credential_identifier` is used, `format` and
        // format-specific fields MUST NOT be present. We enforce this
        // here rather than silently merging.
        body.credential_identifier = credentialIdentifier;
    } else {
        body.format = format;
        if (extra) Object.assign(body, extra);
    }

    let response: Response;

    try {
        response = await fetchImpl(credentialEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `${tokenType} ${accessToken}`,
            },
            body: JSON.stringify(body),
        });
    } catch (e) {
        throw new VciError(
            'credential_request_failed',
            `Credential endpoint ${credentialEndpoint} unreachable: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    let payload: unknown;

    try {
        payload = await response.json();
    } catch (e) {
        throw new VciError(
            'credential_response_invalid',
            `Credential endpoint ${credentialEndpoint} returned non-JSON body`,
            { status: response.status, cause: e }
        );
    }

    if (!response.ok) {
        const err = payload as OAuthErrorBody;
        const errCode = typeof err?.error === 'string' ? err.error : 'unknown';
        const desc = typeof err?.error_description === 'string' ? `: ${err.error_description}` : '';

        throw new VciError(
            'credential_request_failed',
            `Credential endpoint returned ${response.status} (${errCode})${desc}`,
            { status: response.status, body: payload }
        );
    }

    if (typeof payload !== 'object' || payload === null) {
        throw new VciError(
            'credential_response_invalid',
            'Credential endpoint response was not a JSON object',
            { status: response.status, body: payload }
        );
    }

    return payload as CredentialResponseBody;
};
