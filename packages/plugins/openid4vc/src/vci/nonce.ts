import { VciError } from './errors';

export type NonceEndpointResponse = {
    c_nonce: string;
    c_nonce_expires_in?: number;
};

/**
 * OID4VCI 1.0 Final §7.1 — POST to nonce_endpoint with no body and parse the
 * returned c_nonce.
 */
export const fetchNonceFromEndpoint = async (
    endpoint: string,
    fetchImpl?: typeof fetch
): Promise<NonceEndpointResponse> => {
    const resolvedFetch = fetchImpl ?? globalThis.fetch;

    if (typeof resolvedFetch !== 'function') {
        throw new VciError(
            'credential_request_failed',
            'No fetch implementation available for nonce endpoint request'
        );
    }

    let response: Response;

    try {
        response = await resolvedFetch(endpoint, {
            method: 'POST',
        });
    } catch (e) {
        throw new VciError(
            'credential_request_failed',
            `Nonce endpoint ${endpoint} unreachable: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    if (!response.ok) {
        let body = '';

        try {
            body = await response.text();
        } catch {
            body = '';
        }

        throw new VciError(
            'credential_request_failed',
            `Nonce endpoint returned ${response.status}${body ? `: ${body}` : ''}`,
            { status: response.status, body }
        );
    }

    let payload: unknown;

    try {
        payload = await response.json();
    } catch (e) {
        throw new VciError(
            'credential_response_invalid',
            'Nonce endpoint response was not valid JSON',
            { status: response.status, cause: e }
        );
    }

    if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof (payload as { c_nonce?: unknown }).c_nonce !== 'string'
    ) {
        throw new VciError(
            'credential_response_invalid',
            'Nonce endpoint response missing required c_nonce string',
            { status: response.status, body: payload }
        );
    }

    const data = payload as { c_nonce: string; c_nonce_expires_in?: unknown };

    return {
        c_nonce: data.c_nonce,
        c_nonce_expires_in:
            typeof data.c_nonce_expires_in === 'number' ? data.c_nonce_expires_in : undefined,
    };
};
