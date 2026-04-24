import { CredentialResponseBody, OAuthErrorBody } from './types';
import { VciError } from './errors';

/**
 * POST a credential request to the issuer's credential endpoint and
 * validate the response. Slice 2 only supports synchronous issuance of
 * `jwt_vc_json` credentials — deferred (`transaction_id`) and batch
 * (`credentials` array) responses are passed through for Slice 5+.
 */
export const requestCredential = async (args: {
    credentialEndpoint: string;
    accessToken: string;
    tokenType?: string;
    /**
     * Credential configuration id from the offer — sent as
     * `credential_identifier` when the token response authorized it that
     * way, otherwise falls back to `format` + optional type info.
     */
    configurationId?: string;
    /** Credential format id (`jwt_vc_json`, `ldp_vc`, …). */
    format: string;
    /** Proof-of-possession JWT built by {@link buildProofJwt}. */
    proofJwt: string;
    /**
     * Extra body fields — for `jwt_vc_json` this is typically
     * `{ credential_definition: { type: [...] } }`; for `ldp_vc` it's
     * similar. We pass the caller's object through verbatim so adding
     * new formats doesn't require plugin changes.
     */
    extra?: Record<string, unknown>;
    fetchImpl?: typeof fetch;
}): Promise<CredentialResponseBody> => {
    const {
        credentialEndpoint,
        accessToken,
        tokenType = 'Bearer',
        configurationId,
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

    const body: Record<string, unknown> = {
        format,
        proof: { proof_type: 'jwt', jwt: proofJwt },
        ...(extra ?? {}),
    };

    if (typeof configurationId === 'string' && configurationId.length > 0) {
        // Draft 13 allows either `credential_identifier` (when issued via
        // authorization_details) OR a `format`-based selector. We send
        // `credential_identifier` opportunistically; issuers that don't
        // support it ignore it.
        body.credential_identifier = configurationId;
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
