import { Plugin, LearnCard } from '@learncard/core';
import { UnsignedVC, VC, UnsignedVP, VP } from '@learncard/types';
import { ProofOptions } from '@learncard/didkit-plugin';

import {
    CredentialOffer,
    ParsedCredentialOfferUri,
} from './offer/types';
import {
    AcceptCredentialOfferOptions,
    AcceptedCredentialResult,
} from './vci/types';
import {
    AuthCodeFlowHandle,
    BeginAuthCodeFlowResult,
} from './vci/auth-code';
import {
    StoreAcceptedCredentialsOptions,
    StoreAcceptedCredentialsResult,
} from './vci/store';
import {
    AuthorizationRequest,
    ParsedAuthorizationRequest,
} from './vp/types';
import {
    CandidateCredential,
    PresentationSubmission,
    SelectionResult,
} from './vp/select';
import {
    ChosenCredential,
    PreparedPresentation,
    VpFormat,
} from './vp/present';
import {
    SignPresentationResult,
} from './vp/sign';
import {
    SubmitPresentationResult,
} from './vp/submit';
import { DidResolver } from './vp/request-object';
import {
    SignIdTokenResult,
} from './siop/sign';
import { ProofJwtSigner } from './vci/types';
import type {
    DcqlChosenCredential,
    BuiltDcqlPresentation,
} from './dcql/build';
import type { DcqlSelectionResult } from './dcql/select';
import type { DcqlSignedPresentation } from './dcql/respond';

/**
 * A holder pick for either the PEX or DCQL pipeline.
 *
 * The plugin auto-routes based on which query language the verifier's
 * Authorization Request carried:
 *
 * - PEX (`request.presentation_definition` set) → entries MUST use
 *   {@link ChosenCredential} (with `descriptorId`).
 * - DCQL (`request.dcql_query` set) → entries MUST use
 *   {@link DcqlChosenCredential} (with `credentialQueryId`).
 *
 * Mixing shapes within a single call is rejected with a typed error
 * — every entry must match the request's query language.
 */
export type ChosenForPresentation = ChosenCredential | DcqlChosenCredential;

/**
 * Methods the host LearnCard must provide for the OpenID4VC plugin to work.
 *
 * We lean on the existing VC plugin for credential signing (needed for
 * proof-of-possession JWTs and, eventually, VP token construction) and on
 * the `id` plane for keypair/DID access.
 */
export type OpenID4VCPluginDependentMethods = {
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    issuePresentation: (
        presentation: UnsignedVP,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VP>;
    didToVerificationMethod: (did: string) => Promise<string>;
};

/** Public surface of the OpenID4VC plugin. */
export type OpenID4VCPluginMethods = {
    /**
     * Parse an OpenID4VCI Credential Offer URI. Does not hit the network.
     *
     * Returns a discriminated union so callers can decide whether to resolve
     * a by-reference offer themselves or delegate to {@link resolveCredentialOffer}.
     */
    parseCredentialOffer: (input: string) => ParsedCredentialOfferUri;

    /**
     * Parse a Credential Offer URI and, if it's by-reference, fetch and
     * normalize the underlying offer. Returns the normalized Draft 13 offer.
     */
    resolveCredentialOffer: (input: string) => Promise<CredentialOffer>;

    /**
     * Drive the pre-authorized_code flow end-to-end for a credential offer
     * and return the raw issued credentials. Accepts either a Credential
     * Offer URI (which will be parsed + resolved) or an already-parsed offer.
     *
     * The plugin auto-builds an Ed25519 proof-of-possession signer from the
     * host LearnCard's keypair. Callers using other key types (HSM, secp256k1)
     * should supply their own `options.signer`.
     *
     * Storage of the returned credentials is the caller's responsibility.
     * Use {@link acceptAndStoreCredentialOffer} for the turnkey "accept and
     * persist to the wallet" flow.
     */
    acceptCredentialOffer: (
        input: string | CredentialOffer,
        options?: AcceptCredentialOfferOptions
    ) => Promise<AcceptedCredentialResult>;

    /**
     * Accept a Credential Offer **and** persist the resulting credentials
     * to the wallet's store + index planes, so they appear in the UI.
     *
     * Internally: runs {@link acceptCredentialOffer}, then normalizes each
     * issued credential into a W3C VC (JWT → VC per VCDM §6.3.1), uploads
     * to `learnCard.store.LearnCloud.uploadEncrypted` by default, and adds
     * an index record so the wallet's credential list picks it up.
     *
     * Per-credential failures are surfaced in the `failures` array rather
     * than aborting the batch — one bad credential in an offer shouldn't
     * discard the rest.
     */
    acceptAndStoreCredentialOffer: (
        input: string | CredentialOffer,
        options?: AcceptCredentialOfferOptions & StoreAcceptedCredentialsOptions
    ) => Promise<AcceptedCredentialResult & StoreAcceptedCredentialsResult>;

    /**
     * Slice 4 — phase 1 of the OID4VCI **authorization_code** flow.
     *
     * Resolves issuer + AS metadata, generates PKCE, and builds the
     * `authorization_endpoint` URL the wallet should open in a
     * user-agent. Returns an opaque `flowHandle` the wallet persists
     * until the redirect callback fires.
     *
     * This method is purely preparation — no codes are exchanged, no
     * credentials requested. The actual credential issuance happens
     * in {@link completeCredentialOfferAuthCode} once the redirect
     * delivers a `code`.
     */
    beginCredentialOfferAuthCode: (
        input: string | CredentialOffer,
        options: {
            /** Wallet's OAuth 2.0 redirect_uri for the callback. Required. */
            redirectUri: string;
            /** Wallet's OAuth client_id. Required by most authorization servers. */
            clientId: string;
            /** Optional subset of credential_configuration_ids. Default: all. */
            configurationIds?: string[];
            /** Optional OAuth scope. */
            scope?: string;
        }
    ) => Promise<BeginAuthCodeFlowResult>;

    /**
     * Slice 4 — phase 2 of the OID4VCI **authorization_code** flow.
     *
     * Takes the `code` (and `state`) delivered on the redirect
     * callback, the `flowHandle` persisted from
     * {@link beginCredentialOfferAuthCode}, and:
     *   - Exchanges the code for an access token (PKCE verifier sent).
     *   - Builds a proof-of-possession JWT via the host signer.
     *   - POSTs the credential request + returns the issued VC(s).
     */
    completeCredentialOfferAuthCode: (
        options: {
            flowHandle: AuthCodeFlowHandle;
            code: string;
            state?: string;
            signer?: AcceptCredentialOfferOptions['signer'];
        }
    ) => Promise<AcceptedCredentialResult>;

    /**
     * Parse an OpenID4VP Authorization Request URI. Does not hit the
     * network. Returns a discriminated union so callers can detect
     * signed Request Objects (`request` / `request_uri`) — those require
     * JWS verification via Slice 7.
     *
     * @see resolveAuthorizationRequest for the one-shot version that
     * also fetches `presentation_definition_uri` when present.
     */
    parseAuthorizationRequest: (input: string) => ParsedAuthorizationRequest;

    /**
     * End-to-end: parse the Authorization Request URI and, if it's a
     * by-value request with an out-of-band `presentation_definition_uri`,
     * fetch and inline the PD. Returns a fully resolved
     * {@link AuthorizationRequest} ready for PEX matching.
     *
     * Throws `VpError` with code `request_object_not_supported` when
     * the URI points at a signed Request Object (Slice 7 surface).
     */
    resolveAuthorizationRequest: (input: string) => Promise<AuthorizationRequest>;

    /**
     * The main OID4VP entry point for wallet UIs: resolve the verifier's
     * Authorization Request, match every `input_descriptor` in its
     * Presentation Definition against the holder's candidate credentials,
     * and return a preview object carrying:
     *
     *   - The resolved {@link AuthorizationRequest} (for UI to show
     *     verifier identity, purpose, etc.).
     *   - A {@link SelectionResult} with per-descriptor candidate lists
     *     so the UI can render selection rows and disable "Share" up
     *     front when `canSatisfy === false`.
     *
     * This method is read-only — it never signs, never POSTs, and never
     * touches the holder's private keys. Actual vp_token construction
     * + `direct_post` submission happens in Slice 7.
     *
     * Match the holder's candidate pool against either the
     * verifier's PEX `presentation_definition` or DCQL `dcql_query`,
     * whichever the request carries.
     *
     * The returned object exposes BOTH `selection` (PEX) and
     * `dcqlSelection` (DCQL) fields; exactly one is populated, mirroring
     * which query language the request used. Callers can either:
     *  - branch on `request.dcql_query` first (preferred), or
     *  - branch on which selection field is defined.
     *
     * @param input        Authorization Request URI, or an already-parsed request.
     * @param credentials  Wallet's candidate pool (same shape used by both routes).
     */
    prepareVerifiablePresentation: (
        input: string | AuthorizationRequest,
        credentials: CandidateCredential[]
    ) => Promise<{
        request: AuthorizationRequest;
        /** Populated when the verifier sent PEX. Undefined for DCQL requests. */
        selection?: SelectionResult;
        /** Populated when the verifier sent DCQL. Undefined for PEX requests. */
        dcqlSelection?: DcqlSelectionResult;
    }>;

    /**
     * Slice 7a — build an unsigned Verifiable Presentation + DIF PEX
     * Presentation Submission from the user's per-descriptor picks.
     *
     * Pure / synchronous w.r.t. cryptography: this method never touches
     * the holder's private keys, so UIs can call it to show a preview
     * of exactly what will be submitted before the user consents to
     * sign.
     *
     * @param input    The verifier's Authorization Request (or URI that
     *   will be re-resolved for convenience).
     * @param chosen   One {@link ChosenCredential} per input_descriptor
     *   the user picked. Order determines `verifiableCredential[i]`
     *   slots in the VP and the corresponding `descriptor_map` entries.
     * @param options  `holder` defaults to `learnCard.id.did()`;
     *   `envelopeFormat` is inferred from `pd.format` + the inner
     *   credential formats when omitted.
     */
    buildPresentation: (
        input: string | AuthorizationRequest,
        chosen: ChosenCredential[],
        options?: {
            holder?: string;
            envelopeFormat?: VpFormat;
        }
    ) => Promise<{
        request: AuthorizationRequest;
        prepared: PreparedPresentation;
    }>;

    /**
     * Slice 7b — sign a prepared VP into a submittable `vp_token`.
     *
     * For `jwt_vp_json` envelopes: builds a VCDM §6.3.1 JWT-VP with
     * `iss`/`sub` = holder, `aud` = verifier `client_id`, `nonce` =
     * verifier nonce, and signs with an Ed25519 signer derived from
     * the host's primary keypair (unless overridden via `options.signer`).
     *
     * For `ldp_vp` envelopes: delegates to
     * `learnCard.invoke.issuePresentation`, passing `domain = client_id`
     * and `challenge = nonce` so the resulting Linked-Data proof binds
     * to the verifier's replay-resistant context.
     */
    signPresentation: (
        input: string | AuthorizationRequest,
        prepared: PreparedPresentation,
        options?: {
            /** Override the JWT signer (for HSM/secp256k1/etc. backends). */
            signer?: ProofJwtSigner;
            /** Override holder DID. Defaults to `prepared.unsignedVp.holder` or `learnCard.id.did()`. */
            holder?: string;
        }
    ) => Promise<SignPresentationResult>;

    /**
     * Slice 7c — POST the signed `vp_token` + `presentation_submission`
     * to the verifier's `response_uri` per OID4VP §8 (direct_post).
     * Pass `idToken` to include a SIOPv2 id_token alongside the VP
     * (required when `response_type=vp_token id_token`). `state` is
     * echoed back when the verifier included one.
     */
    submitPresentation: (
        input: string | AuthorizationRequest,
        signed: SignPresentationResult,
        submission: PresentationSubmission,
        options?: { idToken?: string }
    ) => Promise<SubmitPresentationResult>;

    /**
     * Slice 8 — sign a SIOPv2 ID token proving holder control of
     * their DID. Used on its own for SIOPv2-only flows
     * (`response_type=id_token`), or bundled into `presentCredentials`
     * for combined `vp_token id_token` flows.
     */
    signIdToken: (
        input: string | AuthorizationRequest,
        options?: {
            holder?: string;
            signer?: ProofJwtSigner;
            lifetimeSeconds?: number;
            issuerMode?: 'did' | 'self-issued.me';
            vpTokenHash?: string;
        }
    ) => Promise<SignIdTokenResult>;

    /**
     * End-to-end convenience: resolve the verifier's request, build +
     * sign the VP around the user's picks, and POST it. Returns every
     * intermediate stage so UIs can surface per-step progress or errors.
     *
     * When the verifier's `response_type` includes `id_token`, a
     * SIOPv2 id_token is also signed and included in the direct_post
     * submission. The returned `signedIdToken` is populated on those
     * flows; on pure `vp_token` flows it's undefined.
     *
     * Typed error codes bubble up from each stage (`BuildPresentationError`,
     * `VpSignError`, `SiopSignError`, `VpSubmitError`) — wrap this in
     * a `try/catch` to distinguish "we couldn't build the VP" from
     * "the verifier rejected it" in the UI.
     */
    presentCredentials: (
        input: string | AuthorizationRequest,
        chosen: ChosenForPresentation[],
        options?: {
            holder?: string;
            envelopeFormat?: VpFormat;
            signer?: ProofJwtSigner;
        }
    ) => Promise<{
        request: AuthorizationRequest;
        /**
         * PEX flow output: the unsigned VP + DIF PEX presentation_submission
         * built before signing. Populated only when the request carried
         * `presentation_definition`.
         */
        prepared?: PreparedPresentation;
        /**
         * PEX flow output: the signed PEX `vp_token`. Populated only when
         * the request carried `presentation_definition`.
         */
        signed?: SignPresentationResult;
        /** SIOPv2 id_token (both PEX and DCQL flows route through this). */
        signedIdToken?: SignIdTokenResult;
        /**
         * DCQL flow output: per-credential-query unsigned VPs.
         * Populated only when the request carried `dcql_query`.
         */
        dcqlBuilt?: BuiltDcqlPresentation[];
        /**
         * DCQL flow output: per-credential-query signed presentations.
         * Populated only when the request carried `dcql_query`.
         */
        dcqlSigned?: DcqlSignedPresentation[];
        /**
         * DCQL flow output: the assembled `vp_token` object (keys =
         * credential_query_id, values = signed presentations).
         * Populated only when the request carried `dcql_query`.
         */
        dcqlVpToken?: Record<string, unknown>;
        /** HTTP-level result of the direct_post submission. Always populated. */
        submitted: SubmitPresentationResult;
    }>;

};

/** Configuration passed to {@link getOpenID4VCPlugin}. */
export interface OpenID4VCPluginConfig {
    /**
     * Fetch implementation used for HTTP calls (offer resolution,
     * issuer metadata, token exchange, credential request).
     *
     * Defaults to `globalThis.fetch` when available.
     */
    fetch?: typeof fetch;

    /**
     * DID resolver used to verify signed Authorization Request Objects
     * whose `client_id_scheme=did` (Slice 7.5). When omitted, a
     * built-in resolver handles `did:jwk` (offline) and `did:web` (over
     * `fetch`). Host apps shipping `did:key` / `did:ion` / `did:pkh`
     * etc. wire their own resolver here.
     */
    didResolver?: DidResolver;

    /**
     * PEM-encoded trust anchors for signed Request Objects whose
     * `client_id_scheme=x509_san_dns` (Slice 7.5). When empty, the
     * plugin refuses x509-signed requests unless
     * {@link unsafeAllowSelfSignedRequestObject} is explicitly true.
     */
    trustedX509Roots?: readonly string[];

    /**
     * **Dev-only.** When true, accept `x509_san_dns` chains that don't
     * root into {@link trustedX509Roots}. Exists so smoke tests can
     * hit self-signed staging verifiers; production wallets must leave
     * this off.
     */
    unsafeAllowSelfSignedRequestObject?: boolean;

    /**
     * **Maximally dangerous, dev-only.** Skip JWS signature
     * verification on signed Request Objects entirely (claims are
     * still parsed). Use ONLY when interoperating with a verifier
     * whose signing keys are pre-shared out-of-band and not
     * published on any in-band channel (e.g. EUDI's reference
     * verifier in `pre-registered` mode, which embeds
     * `kid: "access_certificate"` referencing a keystore inside
     * the verifier container with no JWKS endpoint).
     *
     * Production wallets MUST leave this off — when set, tampered
     * Request Objects bypass detection. The other binding checks
     * (URL `client_id` ↔ signed `client_id`, mutual exclusion of
     * PEX vs. DCQL, etc.) still run because they're integrity
     * checks against the host-supplied URL, not the signature.
     */
    unsafeSkipRequestObjectSignatureVerification?: boolean;
}

/** LearnCard shape the plugin factory consumes. */
export type OpenID4VCDependentLearnCard = LearnCard<
    any,
    'id',
    OpenID4VCPluginDependentMethods
>;

/** LearnCard shape after the plugin has been added. */
export type OpenID4VCImplicitLearnCard = LearnCard<
    any,
    'id',
    OpenID4VCPluginMethods & OpenID4VCPluginDependentMethods
>;

/** @group OpenID4VC Plugin */
export type OpenID4VCPlugin = Plugin<
    'OpenID4VC',
    any,
    OpenID4VCPluginMethods,
    'id',
    OpenID4VCPluginDependentMethods
>;
