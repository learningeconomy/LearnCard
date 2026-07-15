import { CredentialResponseBody, OAuthErrorBody } from './types';
import { VciError } from './errors';

/**
 * POST a credential request to the issuer's credential endpoint and
 * validate the response. Synchronous issuance only — deferred
 * (`transaction_id`) and batch (`credentials` array) responses are passed
 * through for higher-level handling.
 *
 * OID4VCI 1.0 Final §8.2 distinguishes two mutually-exclusive ways to
 * identify the credential being requested:
 *
 * 1. `credential_identifier` — supplied by the issuer in the token
 *    response's `authorization_details[].credential_identifiers`. Only
 *    use this when the token endpoint explicitly returned one.
 * 2. `credential_configuration_id` — a key from the offer's
 *    `credential_configuration_ids` / the issuer metadata's
 *    `credential_configurations_supported`. The default path for
 *    pre-authorized flows whose token response carries no
 *    `authorization_details`.
 *
 * Exactly one of the two MUST be present (§8.2). The `format` +
 * `credential_definition` request shape from Draft 13 was removed in the
 * final spec and is no longer sent.
 */
export const requestCredential = async (args: {
    credentialEndpoint: string;
    accessToken: string;
    tokenType?: string;
    /**
     * Opaque identifier from the token response's `authorization_details`.
     * When set, `credential_configuration_id` MUST NOT be sent (§8.2).
     */
    credentialIdentifier?: string;
    /**
     * Configuration id from the issuer metadata. Required unless
     * `credentialIdentifier` is supplied. MUST NOT be sent alongside one.
     */
    credentialConfigurationId?: string;
    /** Proof-of-possession JWT built by {@link buildProofJwt}. */
    proofJwt: string;
    fetchImpl?: typeof fetch;
}): Promise<CredentialResponseBody> => {
    const {
        credentialEndpoint,
        accessToken,
        tokenType = 'Bearer',
        credentialIdentifier,
        credentialConfigurationId,
        proofJwt,
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

    const hasConfigurationId =
        typeof credentialConfigurationId === 'string' && credentialConfigurationId.length > 0;

    if (!hasCredentialIdentifier && !hasConfigurationId) {
        throw new VciError(
            'credential_request_failed',
            'requestCredential requires either `credentialIdentifier` (from authorization_details) or `credentialConfigurationId`'
        );
    }

    const body: Record<string, unknown> = {
        proofs: { jwt: [proofJwt] },
    };

    if (hasCredentialIdentifier) {
        body.credential_identifier = credentialIdentifier;
    } else {
        body.credential_configuration_id = credentialConfigurationId;
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
            `Credential endpoint ${credentialEndpoint} unreachable: ${
                e instanceof Error ? e.message : String(e)
            }`,
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
