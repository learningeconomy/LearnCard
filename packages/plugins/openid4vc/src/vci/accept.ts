import { CredentialOffer, PRE_AUTHORIZED_CODE_GRANT, PreAuthorizedCodeGrant } from '../offer/types';
import {
    fetchAuthorizationServerMetadata,
    fetchCredentialIssuerMetadata,
    resolveAuthorizationServer,
} from './metadata';
import { exchangePreAuthorizedCode } from './token';
import { fetchNonceFromEndpoint } from './nonce';
import { buildDiVpProof, buildProofJwt, selectKeyProofType } from './proof';
import { requestCredential } from './request';
import {
    AcceptCredentialOfferOptions,
    AcceptedCredentialResult,
    CredentialIssuerMetadata,
    DiVpProofSigner,
    ProofJwtSigner,
    SpecVersion,
    TokenResponse,
} from './types';
import { VciError } from './errors';

export interface ExchangePreAuthCodeForTokenOptions {
    offer: CredentialOffer;
    options?: AcceptCredentialOfferOptions;
    fetchImpl?: typeof fetch;
}

export interface RequestCredentialsFromPreAuthTokenOptions {
    offer: CredentialOffer;
    tokenResponse: TokenResponse;
    signer: ProofJwtSigner;
    diVpSigner?: DiVpProofSigner;
    options?: AcceptCredentialOfferOptions;
    fetchImpl?: typeof fetch;
}

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
    diVpSigner?: DiVpProofSigner;
    options?: AcceptCredentialOfferOptions;
    fetchImpl?: typeof fetch;
}): Promise<AcceptedCredentialResult> => {
    const options = args.options ?? {};
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;
    const { preAuth, requestedIds } = validatePreAuthOffer(args.offer, options);
    const { metadata: issuerMetadata, specVersion } = await fetchCredentialIssuerMetadata(
        args.offer.credential_issuer,
        fetchImpl
    );
    const authServer = resolveAuthorizationServer(issuerMetadata, preAuth.authorization_server);
    const asMetadata = await fetchAuthorizationServerMetadata(authServer, fetchImpl);

    const tokenResponse = await exchangePreAuthorizedCode({
        tokenEndpoint: asMetadata.token_endpoint,
        preAuthorizedCode: preAuth['pre-authorized_code'],
        txCode: options.txCode,
        clientId: options.clientId,
        fetchImpl,
    });

    return requestCredentialsFromPreAuthTokenCore({
        offer: args.offer,
        tokenResponse,
        signer: args.signer,
        diVpSigner: args.diVpSigner,
        options,
        fetchImpl,
        issuerMetadata,
        specVersion,
        requestedIds,
    });
};

export const exchangePreAuthCodeForToken = async (
    args: ExchangePreAuthCodeForTokenOptions
): Promise<TokenResponse> => {
    const options = args.options ?? {};
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;
    const { preAuth } = validatePreAuthOffer(args.offer, options);

    const { metadata: issuerMetadata } = await fetchCredentialIssuerMetadata(
        args.offer.credential_issuer,
        fetchImpl
    );
    const authServer = resolveAuthorizationServer(issuerMetadata, preAuth.authorization_server);
    const asMetadata = await fetchAuthorizationServerMetadata(authServer, fetchImpl);

    return exchangePreAuthorizedCode({
        tokenEndpoint: asMetadata.token_endpoint,
        preAuthorizedCode: preAuth['pre-authorized_code'],
        txCode: options.txCode,
        clientId: options.clientId,
        fetchImpl,
    });
};

export const requestCredentialsFromPreAuthToken = async (
    args: RequestCredentialsFromPreAuthTokenOptions
): Promise<AcceptedCredentialResult> => {
    const { offer, signer, diVpSigner, tokenResponse } = args;
    const options = args.options ?? {};
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;
    const { requestedIds } = validatePreAuthOffer(offer, options);

    const { metadata: issuerMetadata, specVersion } = await fetchCredentialIssuerMetadata(
        offer.credential_issuer,
        fetchImpl
    );
    return requestCredentialsFromPreAuthTokenCore({
        offer,
        tokenResponse,
        signer,
        diVpSigner,
        options,
        fetchImpl,
        issuerMetadata,
        specVersion,
        requestedIds,
    });
};

const requestCredentialsFromPreAuthTokenCore = async (args: {
    offer: CredentialOffer;
    tokenResponse: TokenResponse;
    signer: ProofJwtSigner;
    diVpSigner?: DiVpProofSigner;
    options: AcceptCredentialOfferOptions;
    fetchImpl: typeof fetch;
    issuerMetadata: CredentialIssuerMetadata;
    specVersion: SpecVersion;
    requestedIds: string[];
}): Promise<AcceptedCredentialResult> => {
    const {
        offer,
        signer,
        diVpSigner,
        tokenResponse,
        options,
        fetchImpl,
        issuerMetadata,
        specVersion,
        requestedIds,
    } = args;
    const nonceEndpoint = issuerMetadata.nonce_endpoint;

    const credentials: AcceptedCredentialResult['credentials'] = [];
    let aggregateNotificationId: string | undefined;
    let { c_nonce: latestCNonce, c_nonce_expires_in: latestCNonceExpiresIn } = await resolveNonce(
        nonceEndpoint,
        tokenResponse,
        fetchImpl
    );

    // If the token endpoint returned `authorization_details` with
    // `credential_identifiers`, we MUST use those in subsequent credential
    // requests (Draft 13 §7.2). Index by configuration id for lookup.
    const identifiersByConfigId = indexAuthorizationDetails(tokenResponse.authorization_details);

    for (const configurationId of requestedIds) {
        const configDef = getConfigurationDefinition(issuerMetadata, configurationId);
        const format = inferFormatFromDefinition(configDef);
        const proofSelection =
            specVersion === 'draft-13' // [draft-13-compat] draft 13 only defines the jwt proof type
                ? ({ proofType: 'jwt' } as const)
                : selectKeyProofType(configDef);

        if (proofSelection.proofType === 'di_vp' && !diVpSigner) {
            throw new VciError(
                'proof_signing_failed',
                `Configuration "${configurationId}" requires a di_vp key proof but no di_vp signer is available`
            );
        }

        const issuedIdentifiers = identifiersByConfigId.get(configurationId) ?? [];

        // If the issuer provided credential_identifiers, request each one;
        // otherwise make a single format-based request.
        const requestsForConfig =
            issuedIdentifiers.length > 0
                ? issuedIdentifiers.map(id => ({ credentialIdentifier: id }))
                : [{ credentialIdentifier: undefined }];

        for (const requestDescriptor of requestsForConfig) {
            const requestArgs = {
                credentialEndpoint: issuerMetadata.credential_endpoint,
                accessToken: tokenResponse.access_token,
                tokenType: tokenResponse.token_type,
                credentialIdentifier: requestDescriptor.credentialIdentifier,
                credentialConfigurationId: requestDescriptor.credentialIdentifier
                    ? undefined
                    : configurationId,
                specVersion,
                // [draft-13-compat] consumed by requestCredential only when specVersion === 'draft-13'
                format: requestDescriptor.credentialIdentifier ? undefined : format,
                configDef: requestDescriptor.credentialIdentifier ? undefined : configDef,
                fetchImpl,
            };

            const buildCurrentProof = async (): Promise<
                { proofJwt: string } | { proofDiVp: Record<string, unknown> }
            > => {
                if (proofSelection.proofType === 'di_vp') {
                    return {
                        proofDiVp: await buildDiVpProof({
                            signer: diVpSigner!,
                            audience: offer.credential_issuer,
                            nonce: latestCNonce,
                            cryptosuite: proofSelection.cryptosuite,
                        }),
                    };
                }

                return {
                    proofJwt: await buildProofJwt({
                        signer,
                        audience: offer.credential_issuer,
                        nonce: latestCNonce,
                        clientId: options.clientId,
                    }),
                };
            };

            let response;

            try {
                response = await requestCredential({
                    ...requestArgs,
                    ...(await buildCurrentProof()),
                });
            } catch (error) {
                const body = error instanceof VciError ? error.body : undefined;
                const invalidProof =
                    error instanceof VciError &&
                    error.code === 'credential_request_failed' &&
                    typeof body === 'object' &&
                    body !== null &&
                    (body as { error?: unknown }).error === 'invalid_proof';

                if (!invalidProof) throw error;

                if (typeof nonceEndpoint === 'string' && nonceEndpoint.length > 0) {
                    const refreshed = await fetchNonceFromEndpoint(nonceEndpoint, fetchImpl);
                    latestCNonce = refreshed.c_nonce;
                    latestCNonceExpiresIn = refreshed.c_nonce_expires_in;
                } else if (typeof (body as { c_nonce?: unknown }).c_nonce === 'string') {
                    latestCNonce = (body as { c_nonce: string }).c_nonce;
                    latestCNonceExpiresIn =
                        typeof (body as { c_nonce_expires_in?: unknown }).c_nonce_expires_in ===
                        'number'
                            ? (body as { c_nonce_expires_in: number }).c_nonce_expires_in
                            : undefined;
                } else {
                    throw error;
                }

                response = await requestCredential({
                    ...requestArgs,
                    ...(await buildCurrentProof()),
                });
            }

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

const validatePreAuthOffer = (
    offer: CredentialOffer,
    options: AcceptCredentialOfferOptions
): {
    preAuth: PreAuthorizedCodeGrant;
    requestedIds: string[];
} => {
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

    return { preAuth: preAuth as PreAuthorizedCodeGrant, requestedIds };
};

const resolveNonce = async (
    nonceEndpoint: string | undefined,
    tokenResponse: TokenResponse,
    fetchImpl: typeof fetch
): Promise<{
    c_nonce: string | undefined;
    c_nonce_expires_in: number | undefined;
}> => {
    if (typeof nonceEndpoint === 'string' && nonceEndpoint.length > 0) {
        const fresh = await fetchNonceFromEndpoint(nonceEndpoint, fetchImpl);
        return {
            c_nonce: fresh.c_nonce,
            c_nonce_expires_in: fresh.c_nonce_expires_in,
        };
    }

    return {
        c_nonce: tokenResponse.c_nonce,
        c_nonce_expires_in: tokenResponse.c_nonce_expires_in,
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
