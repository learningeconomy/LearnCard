import { CredentialOffer, PRE_AUTHORIZED_CODE_GRANT } from '../offer/types';
import {
    fetchAuthorizationServerMetadata,
    fetchCredentialIssuerMetadata,
    resolveAuthorizationServer,
} from './metadata';
import { exchangePreAuthorizedCode } from './token';
import { buildProofJwt } from './proof';
import { requestCredential } from './request';
import {
    AcceptCredentialOfferOptions,
    AcceptedCredentialResult,
    ProofJwtSigner,
} from './types';
import { VciError } from './errors';

/**
 * Drive the pre-authorized_code flow end-to-end for a single credential
 * offer, returning the raw issued credentials.
 *
 * Flow:
 *   1. Validate the offer has the pre-authorized_code grant.
 *   2. Fetch issuer metadata + resolve the authorization server.
 *   3. Fetch AS metadata to discover the token endpoint.
 *   4. Exchange the pre-auth code (+ optional tx_code) for an access token.
 *   5. Build a proof-of-possession JWT bound to the issuer + c_nonce.
 *   6. POST a credential request per configuration id.
 *   7. Aggregate the returned credentials.
 *
 * Storage (wallet index, LearnCloud) happens in Slice 3.
 */
export const acceptCredentialOffer = async (args: {
    offer: CredentialOffer;
    signer: ProofJwtSigner;
    options?: AcceptCredentialOfferOptions;
    fetchImpl?: typeof fetch;
}): Promise<AcceptedCredentialResult> => {
    const { offer, signer } = args;
    const options = args.options ?? {};
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;

    const preAuth = offer.grants?.[PRE_AUTHORIZED_CODE_GRANT];

    if (!preAuth) {
        throw new VciError(
            'unsupported_grant',
            'acceptCredentialOffer currently only handles the pre-authorized_code grant. For authorization_code flows, use slice-4 APIs (not yet shipped).'
        );
    }

    if (preAuth.tx_code && !options.txCode) {
        throw new VciError(
            'tx_code_required',
            'Offer requires a transaction code but none was supplied in options.txCode'
        );
    }

    // Validate the caller-supplied configuration filter BEFORE we hit the
    // network. A pre-authorized code is single-use; burning one on a token
    // exchange only to discover the filter doesn't match anything would be
    // a poor UX.
    const requestedIds =
        options.configurationIds && options.configurationIds.length > 0
            ? options.configurationIds.filter(id => offer.credential_configuration_ids.includes(id))
            : offer.credential_configuration_ids;

    if (requestedIds.length === 0) {
        throw new VciError(
            'unsupported_format',
            'No credential configuration ids in the offer matched the caller-supplied filter'
        );
    }

    const issuerMetadata = await fetchCredentialIssuerMetadata(offer.credential_issuer, fetchImpl);

    const authServer = resolveAuthorizationServer(issuerMetadata, preAuth.authorization_server);
    const asMetadata = await fetchAuthorizationServerMetadata(authServer, fetchImpl);

    const tokenResponse = await exchangePreAuthorizedCode({
        tokenEndpoint: asMetadata.token_endpoint,
        preAuthorizedCode: preAuth['pre-authorized_code'],
        txCode: options.txCode,
        clientId: options.clientId,
        fetchImpl,
    });

    const proofJwt = await buildProofJwt({
        signer,
        audience: offer.credential_issuer,
        nonce: tokenResponse.c_nonce,
        clientId: options.clientId,
    });

    const credentials: AcceptedCredentialResult['credentials'] = [];
    let aggregateNotificationId: string | undefined;
    let latestCNonce: string | undefined = tokenResponse.c_nonce;
    let latestCNonceExpiresIn: number | undefined = tokenResponse.c_nonce_expires_in;

    // If the token endpoint returned `authorization_details` with
    // `credential_identifiers`, we MUST use those in subsequent credential
    // requests (Draft 13 §7.2). Index by configuration id for lookup.
    const identifiersByConfigId = indexAuthorizationDetails(tokenResponse.authorization_details);

    for (const configurationId of requestedIds) {
        const configDef = getConfigurationDefinition(issuerMetadata, configurationId);
        const format = inferFormatFromDefinition(configDef);
        const issuedIdentifiers = identifiersByConfigId.get(configurationId) ?? [];

        // If the issuer provided credential_identifiers, request each one;
        // otherwise make a single format-based request.
        const requestsForConfig = issuedIdentifiers.length > 0
            ? issuedIdentifiers.map(id => ({ credentialIdentifier: id }))
            : [{ credentialIdentifier: undefined }];

        for (const requestDescriptor of requestsForConfig) {
            const response = await requestCredential({
                credentialEndpoint: issuerMetadata.credential_endpoint,
                accessToken: tokenResponse.access_token,
                tokenType: tokenResponse.token_type,
                credentialIdentifier: requestDescriptor.credentialIdentifier,
                // When we have an identifier, format + extras MUST NOT be sent.
                format: requestDescriptor.credentialIdentifier ? undefined : format,
                extra: requestDescriptor.credentialIdentifier
                    ? undefined
                    : buildFormatSpecificBody(configDef, format),
                proofJwt,
                fetchImpl,
            });

            // Deferred issuance (`transaction_id` only) not supported yet.
            if (!response.credential && !Array.isArray(response.credentials)) {
                throw new VciError(
                    'unsupported_format',
                    'Credential endpoint returned neither `credential` nor `credentials`; deferred issuance not supported yet',
                    { body: response }
                );
            }

            if (response.credential !== undefined) {
                credentials.push({
                    format,
                    credential: response.credential,
                    configuration_id: configurationId,
                });
            }

            if (Array.isArray(response.credentials)) {
                for (const entry of response.credentials) {
                    if (entry && typeof entry === 'object' && 'credential' in entry) {
                        credentials.push({
                            format,
                            credential: entry.credential,
                            configuration_id: configurationId,
                        });
                    }
                }
            }

            if (typeof response.notification_id === 'string') {
                aggregateNotificationId = response.notification_id;
            }

            if (typeof response.c_nonce === 'string') {
                latestCNonce = response.c_nonce;
                latestCNonceExpiresIn =
                    typeof response.c_nonce_expires_in === 'number'
                        ? response.c_nonce_expires_in
                        : undefined;
            }
        }
    }

    return {
        credentials,
        notification_id: aggregateNotificationId,
        c_nonce: latestCNonce,
        c_nonce_expires_in: latestCNonceExpiresIn,
    };
};

/**
 * Look up a credential configuration definition in issuer metadata.
 * Returns `undefined` if the issuer didn't advertise the id — the caller
 * then falls back to `jwt_vc_json` with an empty body extras, which lets
 * issuers that publish minimal metadata still work when there's only one
 * configuration on offer.
 */
const getConfigurationDefinition = (
    issuerMetadata: { credential_configurations_supported?: Record<string, unknown> },
    configurationId: string
): Record<string, unknown> | undefined => {
    const configs = issuerMetadata.credential_configurations_supported;

    if (!configs || typeof configs !== 'object') return undefined;
    if (!(configurationId in configs)) return undefined;

    const cfg = configs[configurationId];

    if (!cfg || typeof cfg !== 'object') return undefined;

    return cfg as Record<string, unknown>;
};

/**
 * Resolve the credential format from a configuration definition.
 * `jwt_vc_json` is the overwhelmingly common fallback — ldp_vc and
 * SD-JWT VC adapters (Slice 5+) will extend this mapping.
 */
const inferFormatFromDefinition = (configDef: Record<string, unknown> | undefined): string => {
    if (configDef && typeof configDef.format === 'string' && configDef.format.length > 0) {
        return configDef.format;
    }

    return 'jwt_vc_json';
};

/**
 * Build the format-specific portion of the credential request body by
 * copying Draft 13 §7.2 — required fields from the issuer's advertised
 * configuration. For `jwt_vc_json` / `jwt_vc_json-ld` / `ldp_vc` that
 * means echoing `credential_definition` so the issuer knows which
 * credential type to mint.
 *
 * Falls back to `undefined` when no format-specific fields are needed
 * (e.g. formats the plugin doesn't yet support explicitly — the server
 * either accepts a bare `format` or surfaces a clear error).
 */
const buildFormatSpecificBody = (
    configDef: Record<string, unknown> | undefined,
    format: string
): Record<string, unknown> | undefined => {
    if (!configDef) return undefined;

    if (
        format === 'jwt_vc_json' ||
        format === 'jwt_vc_json-ld' ||
        format === 'ldp_vc'
    ) {
        const def = configDef.credential_definition;
        if (def && typeof def === 'object') {
            return { credential_definition: def };
        }
    }

    return undefined;
};

/**
 * Index `authorization_details` from the token response by credential
 * configuration id, so the main loop can look up issued
 * `credential_identifiers` for each configuration. Per Draft 13 §5.1.1,
 * an entry looks like:
 *
 *   { type: "openid_credential",
 *     credential_configuration_id: "UniversityDegree_jwt_vc_json",
 *     credential_identifiers: ["id-abc", "id-def"] }
 *
 * Returns an empty map for pre-auth flows that don't carry
 * authorization_details, which is the common case today.
 */
const indexAuthorizationDetails = (raw: unknown): Map<string, string[]> => {
    const map = new Map<string, string[]>();

    if (!Array.isArray(raw)) return map;

    for (const entry of raw) {
        if (!entry || typeof entry !== 'object') continue;

        const record = entry as Record<string, unknown>;
        const configId = record.credential_configuration_id;
        const identifiers = record.credential_identifiers;

        if (typeof configId !== 'string' || !Array.isArray(identifiers)) continue;

        const strings = identifiers.filter((id): id is string => typeof id === 'string');
        if (strings.length > 0) map.set(configId, strings);
    }

    return map;
};
