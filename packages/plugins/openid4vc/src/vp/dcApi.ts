import { parseDcqlQuery } from '../dcql/parse';
import { buildDcqlPresentations, type DcqlChosenCredential } from '../dcql/build';
import { buildDcqlResponse, type DcqlResponse } from '../dcql/respond';
import type { DcqlQuery } from '../dcql/types';
import type { SdJwtPresenter } from './sign';

export type DcApiErrorCode =
    'invalid_origin' | 'unsupported_profile' | 'invalid_request' | 'cancelled';

export class DcApiError extends Error {
    constructor(
        readonly code: DcApiErrorCode,
        message: string,
        options?: { cause?: unknown }
    ) {
        super(message, options);
        this.name = 'DcApiError';
    }
}

export interface DcApiRequest {
    protocol: string;
    data: Record<string, unknown>;
}

export interface ParsedDcApiRequest {
    nonce: string;
    query: DcqlQuery;
    audience: string;
}

export interface DcApiResponse {
    vp_token: DcqlResponse['vpToken'];
}

export interface DcApiResponseOptions {
    signal?: AbortSignal;
}

/** Parse only the unsigned DC API profile. Origin must come from a trusted transport. */
export const parseDcApiRequest = (input: unknown, verifiedOrigin: string): ParsedDcApiRequest => {
    let origin: URL;
    try {
        origin = new URL(verifiedOrigin);
    } catch (cause) {
        throw new DcApiError('invalid_origin', 'verifiedOrigin must be an HTTPS origin', { cause });
    }
    if (origin.protocol !== 'https:' || origin.origin !== verifiedOrigin) {
        throw new DcApiError('invalid_origin', 'verifiedOrigin must be a canonical HTTPS origin');
    }

    if (!isRecord(input) || input.protocol !== 'openid4vp-v1-unsigned') {
        throw new DcApiError('unsupported_profile', 'Only openid4vp-v1-unsigned is supported');
    }
    const data = input.data;
    if (!isRecord(data)) {
        throw new DcApiError('invalid_request', 'DC API request data must be an object');
    }
    if (data.response_type !== 'vp_token' || data.response_mode !== 'dc_api') {
        throw new DcApiError(
            'unsupported_profile',
            'Expected response_type=vp_token and response_mode=dc_api'
        );
    }
    if (
        [
            'request',
            'request_uri',
            'presentation_definition',
            'presentation_definition_uri',
            'transaction_data',
            'client_metadata_uri',
        ].some(key => key in data)
    ) {
        throw new DcApiError(
            'unsupported_profile',
            'Request references, PEX, and transaction data are unsupported'
        );
    }
    if (
        isRecord(data.client_metadata) &&
        Object.keys(data.client_metadata).some(
            key =>
                key.startsWith('authorization_signed_response_') ||
                key.startsWith('authorization_encrypted_response_')
        )
    ) {
        throw new DcApiError(
            'unsupported_profile',
            'Signed or encrypted responses are unsupported'
        );
    }
    if (typeof data.nonce !== 'string' || data.nonce.trim().length === 0) {
        throw new DcApiError('invalid_request', 'DC API request requires a nonempty nonce');
    }
    let query: DcqlQuery;
    try {
        query = parseDcqlQuery(data.dcql_query);
    } catch (cause) {
        throw new DcApiError('invalid_request', 'DC API request requires a valid DCQL query', {
            cause,
        });
    }
    if (
        query.credentials.some(
            entry => entry.format !== 'dc+sd-jwt' && entry.format !== 'vc+sd-jwt'
        )
    ) {
        throw new DcApiError('unsupported_profile', 'DC API supports only SD-JWT VC queries');
    }
    return { nonce: data.nonce, query, audience: `origin:${verifiedOrigin}` };
};

/** Build a local JSON response without resolving references or submitting over HTTP. */
export const createDcApiResponse = async (
    request: ParsedDcApiRequest,
    chosen: readonly DcqlChosenCredential[],
    holder: string,
    sdJwtPresenter: SdJwtPresenter | undefined,
    options: DcApiResponseOptions = {}
): Promise<DcApiResponse> => {
    const assertNotCancelled = (): void => {
        if (options.signal?.aborted) throw new DcApiError('cancelled', 'DC API response cancelled');
    };
    assertNotCancelled();
    const built = buildDcqlPresentations({ query: request.query, chosen, holder });
    const response = await buildDcqlResponse(
        { built, audience: request.audience, nonce: request.nonce, holder },
        { sdJwtPresenter }
    );
    assertNotCancelled();
    return { vp_token: response.vpToken };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
