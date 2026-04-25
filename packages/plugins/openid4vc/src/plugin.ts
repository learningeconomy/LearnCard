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
import {
    beginAuthCodeFlow as beginAuthCodeFlowFn,
    completeAuthCodeFlow as completeAuthCodeFlowFn,
} from './vci/auth-code';
import { createJoseEd25519Signer } from './vci/proof';
import {
    storeAcceptedCredentials,
    StoreAcceptedCredentialsOptions,
} from './vci/store';
import { AcceptCredentialOfferOptions } from './vci/types';
import {
    parseAuthorizationRequestUri,
    resolveAuthorizationRequest as resolveAuthorizationRequestFn,
    ResolveAuthorizationRequestOptions,
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
import {
    signIdToken as signIdTokenFn,
    requiresIdToken,
    SignIdTokenResult,
} from './siop/sign';
import { ProofJwtSigner } from './vci/types';
import { selectCredentialsForDcql } from './dcql/select';
import {
    buildDcqlPresentations,
    type DcqlChosenCredential,
} from './dcql/build';
import { buildDcqlResponse } from './dcql/respond';
import type { ChosenForPresentation } from './types';

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

    // Request Object verification knobs (Slice 7.5). Built once so every
    // resolveAuthorizationRequest call uses the same trust policy.
    const resolveOptions: ResolveAuthorizationRequestOptions = {
        didResolver: config.didResolver,
        trustedX509Roots: config.trustedX509Roots,
        unsafeAllowSelfSigned: config.unsafeAllowSelfSignedRequestObject,
    };

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

            beginCredentialOfferAuthCode: async (_lc, input, authOptions) => {
                const offer = typeof input === 'string' ? await resolveOffer(input) : input;

                return beginAuthCodeFlowFn({
                    offer,
                    redirectUri: authOptions.redirectUri,
                    clientId: authOptions.clientId,
                    configurationIds: authOptions.configurationIds,
                    scope: authOptions.scope,
                    fetchImpl,
                });
            },

            completeCredentialOfferAuthCode: async (learnCard, completionOptions) => {
                const signer =
                    completionOptions.signer ??
                    (await ensureSigner(learnCard, {}));

                return completeAuthCodeFlowFn({
                    flowHandle: completionOptions.flowHandle,
                    code: completionOptions.code,
                    state: completionOptions.state,
                    signer,
                    fetchImpl,
                });
            },

            parseAuthorizationRequest: (_lc, input) => parseAuthorizationRequestUri(input),

            resolveAuthorizationRequest: async (_lc, input) =>
                resolveAuthorizationRequestFn(input, fetchImpl, resolveOptions),

            prepareVerifiablePresentation: async (_lc, input, credentials) => {
                const request = await resolveRequestInput(input, fetchImpl, resolveOptions);

                // DCQL takes precedence over PEX when both are
                // somehow present (the parser already rejects that
                // case, but be defensive).
                if (request.dcql_query) {
                    const dcqlSelection = selectCredentialsForDcql(
                        credentials,
                        request.dcql_query
                    );
                    return { request, dcqlSelection };
                }

                if (request.presentation_definition) {
                    const selection = selectCredentials(
                        credentials,
                        request.presentation_definition
                    );
                    return { request, selection };
                }

                // No presentation_definition AND no dcql_query →
                // nothing to match against. The caller is probably
                // handling a SIOPv2-only flow or a scope-based PD
                // lookup; return an empty PEX selection result so
                // they can still render verifier identity + proceed.
                return {
                    request,
                    selection: {
                        descriptors: [],
                        canSatisfy: true,
                        reason: undefined,
                    },
                };
            },

            buildPresentation: async (learnCard, input, chosen, options = {}) => {
                const request = await resolveRequestInput(input, fetchImpl, resolveOptions);
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
                const request = await resolveRequestInput(input, fetchImpl, resolveOptions);

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

            submitPresentation: async (_lc, input, signed, submission, submitOptions = {}) => {
                const request = await resolveRequestInput(input, fetchImpl, resolveOptions);
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
                    idToken: submitOptions.idToken,
                    state: request.state,
                    fetchImpl,
                });
            },

            signIdToken: async (learnCard, input, options = {}) => {
                const request = await resolveRequestInput(input, fetchImpl, resolveOptions);
                const holder = options.holder ?? learnCard.id.did();
                const signer =
                    options.signer ?? (await ensureVpJwtSigner(learnCard));

                return signIdTokenFn(
                    {
                        holder,
                        audience: request.client_id,
                        nonce: request.nonce,
                        lifetimeSeconds: options.lifetimeSeconds,
                        issuerMode: options.issuerMode,
                        vpTokenHash: options.vpTokenHash,
                    },
                    { signer }
                );
            },

            presentCredentials: async (learnCard, input, chosen, options = {}) => {
                const request = await resolveRequestInput(input, fetchImpl, resolveOptions);

                const holder = options.holder ?? learnCard.id.did();

                // The id_token signer is needed for both routes when
                // the verifier asked for SIOPv2 + VP combined, AND
                // for the jwt_vp_json signing path.
                let jwtSigner: ProofJwtSigner | undefined = options.signer;
                const ensureSharedJwtSigner = async (): Promise<ProofJwtSigner> => {
                    if (!jwtSigner) jwtSigner = await ensureVpJwtSigner(learnCard);
                    return jwtSigner;
                };

                // SIOPv2 combined flow (Slice 8): when the verifier
                // asked for `id_token`, sign one and bundle it alongside
                // the VP in the direct_post submission. Lifted out of
                // the per-route bodies so PEX and DCQL share it.
                const signIdTokenIfRequested = async (): Promise<
                    SignIdTokenResult | undefined
                > => {
                    if (!requiresIdToken(request.response_type)) return undefined;
                    return signIdTokenFn(
                        {
                            holder,
                            audience: request.client_id,
                            nonce: request.nonce,
                        },
                        { signer: await ensureSharedJwtSigner() }
                    );
                };

                const responseUri = request.response_uri ?? request.redirect_uri;
                if (!responseUri) {
                    throw new Error(
                        'Authorization Request has no response_uri / redirect_uri — cannot presentCredentials'
                    );
                }

                /* ---------------------- DCQL route ---------------------- */
                if (request.dcql_query) {
                    const dcqlChosen = assertDcqlChosen(chosen);

                    const dcqlBuilt = buildDcqlPresentations({
                        query: request.dcql_query,
                        chosen: dcqlChosen,
                        holder,
                    });

                    // DCQL only emits jwt_vp_json/ldp_vp depending on
                    // each query entry's declared format. Build the
                    // helpers off the full set so we have whatever's
                    // needed across all per-query VPs.
                    const needsJwt = dcqlBuilt.some(b => b.vpFormat === 'jwt_vp_json');
                    const needsLdp = dcqlBuilt.some(b => b.vpFormat === 'ldp_vp');
                    const dcqlHelpers = {
                        ...(needsJwt ? { jwtSigner: await ensureSharedJwtSigner() } : {}),
                        ...(needsLdp ? { ldpVpSigner: buildLdpVpSigner(learnCard) } : {}),
                    };

                    const dcqlResponse = await buildDcqlResponse(
                        {
                            built: dcqlBuilt,
                            audience: request.client_id,
                            nonce: request.nonce,
                            holder,
                        },
                        dcqlHelpers
                    );

                    const signedIdToken = await signIdTokenIfRequested();

                    const submitted = await submitPresentationFn({
                        responseUri,
                        vpToken: dcqlResponse.vpToken,
                        // DCQL submissions MUST omit presentation_submission.
                        idToken: signedIdToken?.idToken,
                        state: request.state,
                        fetchImpl,
                    });

                    return {
                        request,
                        dcqlBuilt,
                        dcqlSigned: dcqlResponse.presentations,
                        dcqlVpToken: dcqlResponse.vpToken,
                        signedIdToken,
                        submitted,
                    };
                }

                /* ---------------------- PEX route ----------------------- */
                const pd = requirePresentationDefinition(request);
                const pexChosen = assertPexChosen(chosen);

                const prepared = buildPresentationFn({
                    pd,
                    chosen: pexChosen,
                    holder,
                    envelopeFormat: options.envelopeFormat,
                });

                const helpers =
                    prepared.vpFormat === 'jwt_vp_json'
                        ? { jwtSigner: await ensureSharedJwtSigner() }
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

                const signedIdToken = await signIdTokenIfRequested();

                const submitted = await submitPresentationFn({
                    responseUri,
                    vpToken: signed.vpToken,
                    submission: prepared.submission,
                    idToken: signedIdToken?.idToken,
                    state: request.state,
                    fetchImpl,
                });

                return { request, prepared, signed, signedIdToken, submitted };
            },
        },
    };
};

/**
 * Resolve a URI-or-request union to a fully-resolved AuthorizationRequest.
 * Idempotent when the caller already passes a resolved request.
 *
 * `resolveOptions` carries Slice 7.5 trust policy (DID resolver, X.509
 * roots) so every internal call — including the convenience wrappers
 * around `buildPresentation`, `signPresentation`, and
 * `presentCredentials` — honors the plugin's configured trust anchors
 * when a signed Request Object is in play.
 */
const resolveRequestInput = async (
    input: string | AuthorizationRequest,
    fetchImpl: typeof fetch | undefined,
    resolveOptions: ResolveAuthorizationRequestOptions
): Promise<AuthorizationRequest> =>
    typeof input === 'string'
        ? await resolveAuthorizationRequestFn(input, fetchImpl, resolveOptions)
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
 * Type guard / discriminator: every entry must have `descriptorId`
 * (PEX shape). Throws if any entry is the DCQL shape — that's a
 * caller bug (passing DCQL picks for a PEX request).
 */
const assertPexChosen = (chosen: ChosenForPresentation[]): ChosenCredential[] => {
    for (const [i, entry] of chosen.entries()) {
        if (!('descriptorId' in entry) || typeof entry.descriptorId !== 'string') {
            throw new Error(
                `chosen[${i}] is missing 'descriptorId' — PEX requests need ChosenCredential entries (received DCQL-shape entry with credentialQueryId="${(entry as DcqlChosenCredential).credentialQueryId}")`
            );
        }
    }
    return chosen as ChosenCredential[];
};

/**
 * Same idea for the DCQL route — every entry must carry
 * `credentialQueryId`. Mixed shapes throw with a precise per-index
 * message so debug is fast.
 */
const assertDcqlChosen = (chosen: ChosenForPresentation[]): DcqlChosenCredential[] => {
    for (const [i, entry] of chosen.entries()) {
        if (
            !('credentialQueryId' in entry) ||
            typeof entry.credentialQueryId !== 'string'
        ) {
            throw new Error(
                `chosen[${i}] is missing 'credentialQueryId' — DCQL requests need DcqlChosenCredential entries (received PEX-shape entry with descriptorId="${(entry as ChosenCredential).descriptorId}")`
            );
        }
    }
    return chosen as DcqlChosenCredential[];
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
