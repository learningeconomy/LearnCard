import {
    OpenID4VCDependentLearnCard,
    OpenID4VCPlugin,
    OpenID4VCPluginConfig,
} from './types';
import {
    parseCredentialOfferUri,
    resolveCredentialOfferByReference,
} from './offer/parse';
import { CredentialOffer, CredentialOfferParseError } from './offer/types';
import { acceptCredentialOffer as acceptCredentialOfferFn } from './vci/accept';
import { createJoseEd25519Signer } from './vci/proof';
import {
    storeAcceptedCredentials,
    StoreAcceptedCredentialsOptions,
} from './vci/store';
import { AcceptCredentialOfferOptions } from './vci/types';
import {
    parseAuthorizationRequestUri,
    resolveAuthorizationRequest as resolveAuthorizationRequestFn,
} from './vp/parse';
import { AuthorizationRequest } from './vp/types';
import { selectCredentials } from './vp/select';
import {
    buildPresentation as buildPresentationFn,
    ChosenCredential,
    PreparedPresentation,
    VpFormat,
} from './vp/present';
import {
    signPresentation as signPresentationFn,
    LdpVpSigner,
    SignPresentationResult,
} from './vp/sign';
import { submitPresentation as submitPresentationFn } from './vp/submit';
import { ProofJwtSigner } from './vci/types';

/**
 * Create the OpenID4VC holder plugin.
 *
 * Current scope (Slice 1): Credential Offer URI parsing + by-reference
 * resolution. Subsequent slices will add token exchange, credential request,
 * OID4VP Authorization Request handling, and SIOPv2 ID tokens.
 *
 * @group Plugins
 */
export const getOpenID4VCPlugin = (
    _learnCard: OpenID4VCDependentLearnCard,
    config: OpenID4VCPluginConfig = {}
): OpenID4VCPlugin => {
    const fetchImpl = config.fetch ?? globalThis.fetch;

    const resolveOffer = async (input: string): Promise<CredentialOffer> => {
        const parsed = parseCredentialOfferUri(input);

        if (parsed.kind === 'by_value') return parsed.offer;

        if (typeof fetchImpl !== 'function') {
            throw new CredentialOfferParseError(
                'invalid_uri',
                'No fetch implementation available; pass `config.fetch` to getOpenID4VCPlugin()'
            );
        }

        const resolved = await resolveCredentialOfferByReference(parsed.uri, fetchImpl);

        if (resolved.kind !== 'by_value') {
            throw new CredentialOfferParseError(
                'invalid_uri',
                'Unexpected by_reference result after resolving credential_offer_uri'
            );
        }

        return resolved.offer;
    };

    return {
        name: 'OpenID4VC',
        displayName: 'OpenID4VC',
        description:
            'OpenID for Verifiable Credentials holder support — Credential Offers, VCI, VP, and SIOPv2.',
        methods: {
            parseCredentialOffer: (_lc, input) => parseCredentialOfferUri(input),

            resolveCredentialOffer: async (_lc, input) => resolveOffer(input),

            acceptCredentialOffer: async (learnCard, input, options = {}) => {
                const offer = typeof input === 'string' ? await resolveOffer(input) : input;
                const signer = await ensureSigner(learnCard, options);

                return acceptCredentialOfferFn({
                    offer,
                    signer,
                    options,
                    fetchImpl,
                });
            },

            acceptAndStoreCredentialOffer: async (learnCard, input, options = {}) => {
                // Split the merged options into the two concerns so each helper
                // sees only what it cares about. This is purely hygienic —
                // everything passes through by name.
                const accepted = await (async () => {
                    const offer = typeof input === 'string' ? await resolveOffer(input) : input;
                    const signer = await ensureSigner(learnCard, options);

                    return acceptCredentialOfferFn({
                        offer,
                        signer,
                        options,
                        fetchImpl,
                    });
                })();

                const stored = await storeAcceptedCredentials(
                    learnCard as any,
                    accepted,
                    splitStoreOptions(options)
                );

                return { ...accepted, ...stored };
            },

            parseAuthorizationRequest: (_lc, input) => parseAuthorizationRequestUri(input),

            resolveAuthorizationRequest: async (_lc, input) =>
                resolveAuthorizationRequestFn(input, fetchImpl),

            prepareVerifiablePresentation: async (_lc, input, credentials) => {
                const request = await resolveRequestInput(input, fetchImpl);

                // No presentation_definition → nothing to match against.
                // The caller is probably handling a SIOPv2-only flow or a
                // scope-based PD lookup; return an empty selection result
                // so they can still render verifier identity + proceed.
                if (!request.presentation_definition) {
                    return {
                        request,
                        selection: {
                            descriptors: [],
                            canSatisfy: true,
                            reason: undefined,
                        },
                    };
                }

                const selection = selectCredentials(
                    credentials,
                    request.presentation_definition
                );

                return { request, selection };
            },

            buildPresentation: async (learnCard, input, chosen, options = {}) => {
                const request = await resolveRequestInput(input, fetchImpl);
                const pd = requirePresentationDefinition(request);

                const holder = options.holder ?? learnCard.id.did();

                const prepared = buildPresentationFn({
                    pd,
                    chosen,
                    holder,
                    envelopeFormat: options.envelopeFormat,
                });

                return { request, prepared };
            },

            signPresentation: async (learnCard, input, prepared, options = {}) => {
                const request = await resolveRequestInput(input, fetchImpl);

                const holder =
                    options.holder ??
                    (typeof prepared.unsignedVp.holder === 'string'
                        ? prepared.unsignedVp.holder
                        : learnCard.id.did());

                if (prepared.vpFormat === 'jwt_vp_json') {
                    const jwtSigner =
                        options.signer ?? (await ensureVpJwtSigner(learnCard));

                    return signPresentationFn(
                        {
                            unsignedVp: prepared.unsignedVp,
                            vpFormat: prepared.vpFormat,
                            audience: request.client_id,
                            nonce: request.nonce,
                            holder,
                        },
                        { jwtSigner }
                    );
                }

                return signPresentationFn(
                    {
                        unsignedVp: prepared.unsignedVp,
                        vpFormat: prepared.vpFormat,
                        audience: request.client_id,
                        nonce: request.nonce,
                        holder,
                    },
                    { ldpVpSigner: buildLdpVpSigner(learnCard) }
                );
            },

            submitPresentation: async (_lc, input, signed, submission) => {
                const request = await resolveRequestInput(input, fetchImpl);
                const responseUri = request.response_uri ?? request.redirect_uri;

                if (!responseUri) {
                    throw new Error(
                        'Authorization Request has no response_uri / redirect_uri — cannot submitPresentation'
                    );
                }

                return submitPresentationFn({
                    responseUri,
                    vpToken: signed.vpToken,
                    submission,
                    state: request.state,
                    fetchImpl,
                });
            },

            presentCredentials: async (learnCard, input, chosen, options = {}) => {
                const request = await resolveRequestInput(input, fetchImpl);
                const pd = requirePresentationDefinition(request);

                const holder = options.holder ?? learnCard.id.did();

                const prepared = buildPresentationFn({
                    pd,
                    chosen,
                    holder,
                    envelopeFormat: options.envelopeFormat,
                });

                const helpers =
                    prepared.vpFormat === 'jwt_vp_json'
                        ? {
                              jwtSigner:
                                  options.signer ??
                                  (await ensureVpJwtSigner(learnCard)),
                          }
                        : { ldpVpSigner: buildLdpVpSigner(learnCard) };

                const signed = await signPresentationFn(
                    {
                        unsignedVp: prepared.unsignedVp,
                        vpFormat: prepared.vpFormat,
                        audience: request.client_id,
                        nonce: request.nonce,
                        holder,
                    },
                    helpers
                );

                const responseUri = request.response_uri ?? request.redirect_uri;
                if (!responseUri) {
                    throw new Error(
                        'Authorization Request has no response_uri / redirect_uri — cannot presentCredentials'
                    );
                }

                const submitted = await submitPresentationFn({
                    responseUri,
                    vpToken: signed.vpToken,
                    submission: prepared.submission,
                    state: request.state,
                    fetchImpl,
                });

                return { request, prepared, signed, submitted };
            },
        },
    };
};

/**
 * Resolve a URI-or-request union to a fully-resolved AuthorizationRequest.
 * Idempotent when the caller already passes a resolved request.
 */
const resolveRequestInput = async (
    input: string | AuthorizationRequest,
    fetchImpl: typeof fetch | undefined
): Promise<AuthorizationRequest> =>
    typeof input === 'string'
        ? await resolveAuthorizationRequestFn(input, fetchImpl)
        : input;

const requirePresentationDefinition = (request: AuthorizationRequest) => {
    if (!request.presentation_definition) {
        throw new Error(
            'Authorization Request has no presentation_definition — cannot build a VP'
        );
    }
    return request.presentation_definition;
};

/**
 * Build a JWT signer for VP signing. Shares the same Ed25519 pathway
 * used by the VCI proof-of-possession flow — the `typ` header is set
 * per-call by the sign layer, so the signer itself is format-agnostic.
 */
const ensureVpJwtSigner = async (learnCard: any): Promise<ProofJwtSigner> => {
    const keypair = learnCard.id.keypair('ed25519');
    const did = learnCard.id.did();
    const kid = await learnCard.invoke.didToVerificationMethod(did);

    return createJoseEd25519Signer({ keypair, kid });
};

/**
 * Wrap `learnCard.invoke.issuePresentation` into the {@link LdpVpSigner}
 * contract expected by the VP sign layer. OID4VP replay-binding
 * (domain/challenge) is passed through verbatim.
 */
const buildLdpVpSigner = (learnCard: any): LdpVpSigner => ({
    sign: async (unsignedVp, { domain, challenge }) =>
        learnCard.invoke.issuePresentation(unsignedVp, { domain, challenge }),
});

/**
 * Build an Ed25519 proof-of-possession signer from the host LearnCard's
 * primary keypair, unless the caller already supplied a signer (for HSM /
 * secp256k1 / external key backends).
 */
const ensureSigner = async (
    learnCard: any,
    options: { signer?: AcceptCredentialOfferOptions['signer'] }
) => {
    if (options.signer) return options.signer;

    const keypair = learnCard.id.keypair('ed25519');
    const did = learnCard.id.did();
    const kid = await learnCard.invoke.didToVerificationMethod(did);

    return createJoseEd25519Signer({ keypair, kid });
};

/**
 * Extract just the {@link StoreAcceptedCredentialsOptions} fields from the
 * merged options bag. Keeps `storeAcceptedCredentials` from seeing irrelevant
 * VCI options (like `txCode` or `signer`).
 */
const splitStoreOptions = (
    options: AcceptCredentialOfferOptions & StoreAcceptedCredentialsOptions
): StoreAcceptedCredentialsOptions => ({
    storage: options.storage,
    encrypt: options.encrypt,
    category: options.category,
    title: options.title,
    imgUrl: options.imgUrl,
    upload: options.upload,
    addToIndex: options.addToIndex,
    makeId: options.makeId,
});
