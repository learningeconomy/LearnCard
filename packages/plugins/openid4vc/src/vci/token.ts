import { PRE_AUTHORIZED_CODE_GRANT } from '../offer/types';
import { OAuthErrorBody, TokenResponse } from './types';
import { VciError } from './errors';

/**
 * Exchange a pre-authorized code for an access token.
 *
 * Per OID4VCI Draft 13 §6.1, the request is a standard OAuth 2.0 token
 * request with `grant_type = urn:ietf:params:oauth:grant-type:pre-authorized_code`
 * and optional `tx_code` when the offer required one.
 */
export const exchangePreAuthorizedCode = async (args: {
    tokenEndpoint: string;
    preAuthorizedCode: string;
    txCode?: string;
    clientId?: string;
    fetchImpl?: typeof fetch;
}): Promise<TokenResponse> => {
    const { tokenEndpoint, preAuthorizedCode, txCode, clientId } = args;
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;

    if (typeof fetchImpl !== 'function') {
        throw new VciError('token_request_failed', 'No fetch implementation available for token exchange');
    }

    const body = new URLSearchParams();
    body.set('grant_type', PRE_AUTHORIZED_CODE_GRANT);
    body.set('pre-authorized_code', preAuthorizedCode);

    if (typeof txCode === 'string' && txCode.length > 0) body.set('tx_code', txCode);
    if (typeof clientId === 'string' && clientId.length > 0) body.set('client_id', clientId);

    let response: Response;

    try {
        response = await fetchImpl(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: body.toString(),
        });
    } catch (e) {
        throw new VciError(
            'token_request_failed',
            `Token endpoint ${tokenEndpoint} unreachable: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    let payload: unknown;

    try {
        payload = await response.json();
    } catch (e) {
        throw new VciError(
            'token_response_invalid',
            `Token endpoint ${tokenEndpoint} returned non-JSON body`,
            { status: response.status, cause: e }
        );
    }

    if (!response.ok) {
        const err = payload as OAuthErrorBody;
        const errCode = typeof err?.error === 'string' ? err.error : 'unknown';
        const desc = typeof err?.error_description === 'string' ? `: ${err.error_description}` : '';

        throw new VciError(
            'token_request_failed',
            `Token endpoint returned ${response.status} (${errCode})${desc}`,
            { status: response.status, body: payload }
        );
    }

    if (!isTokenResponse(payload)) {
        throw new VciError(
            'token_response_invalid',
            'Token endpoint response is missing required `access_token` / `token_type`',
            { status: response.status, body: payload }
        );
    }

    return payload;
};

const isTokenResponse = (value: unknown): value is TokenResponse => {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.access_token === 'string' &&
        obj.access_token.length > 0 &&
        typeof obj.token_type === 'string' &&
        obj.token_type.length > 0
    );
};
