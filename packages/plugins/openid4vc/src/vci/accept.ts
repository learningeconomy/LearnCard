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

    for (const configurationId of requestedIds) {
        const format = inferFormat(issuerMetadata, configurationId);

        const response = await requestCredential({
            credentialEndpoint: issuerMetadata.credential_endpoint,
            accessToken: tokenResponse.access_token,
            tokenType: tokenResponse.token_type,
            configurationId,
            format,
            proofJwt,
            fetchImpl,
        });

        // Deferred issuance (`transaction_id` only) not supported in Slice 2.
        if (!response.credential && !Array.isArray(response.credentials)) {
            throw new VciError(
                'unsupported_format',
                'Credential endpoint returned neither `credential` nor `credentials`; deferred issuance not supported yet',
                { body: response }
            );
        }

        if (response.credential !== undefined) {
            credentials.push({ format, credential: response.credential, configuration_id: configurationId });
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

    return {
        credentials,
        notification_id: aggregateNotificationId,
        c_nonce: latestCNonce,
        c_nonce_expires_in: latestCNonceExpiresIn,
    };
};

/**
 * Infer the credential format for a given configuration id by looking it up
 * in the issuer metadata. Falls back to `jwt_vc_json` — the most widely
 * deployed format — with a note logged via the thrown error path if the
 * issuer advertises something unexpected.
 */
const inferFormat = (
    issuerMetadata: { credential_configurations_supported?: Record<string, unknown> },
    configurationId: string
): string => {
    const configs = issuerMetadata.credential_configurations_supported;

    if (configs && typeof configs === 'object' && configurationId in configs) {
        const cfg = configs[configurationId];

        if (cfg && typeof cfg === 'object' && 'format' in cfg) {
            const format = (cfg as { format?: unknown }).format;
            if (typeof format === 'string' && format.length > 0) return format;
        }
    }

    // The offer gave us an id but the issuer metadata didn't advertise a
    // format for it. jwt_vc_json is the overwhelmingly common default for
    // OID4VCI pilots (SD-JWT-VC is handled by a separate plugin).
    return 'jwt_vc_json';
};
