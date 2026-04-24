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
import { ProofJwtSigner } from './vci/types';

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
     * @param input  Authorization Request URI, or an already-parsed request.
     * @param credentials  The wallet's candidate pool. Each entry carries
     *   the raw credential value; the `format` id is inferred when
     *   omitted.
     */
    prepareVerifiablePresentation: (
        input: string | AuthorizationRequest,
        credentials: CandidateCredential[]
    ) => Promise<{
        request: AuthorizationRequest;
        selection: SelectionResult;
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
     * `state` is echoed back when the verifier included one.
     */
    submitPresentation: (
        input: string | AuthorizationRequest,
        signed: SignPresentationResult,
        submission: PresentationSubmission
    ) => Promise<SubmitPresentationResult>;

    /**
     * End-to-end convenience: resolve the verifier's request, build +
     * sign the VP around the user's picks, and POST it. Returns every
     * intermediate stage so UIs can surface per-step progress or errors.
     *
     * Typed error codes bubble up from each stage (`BuildPresentationError`,
     * `VpSignError`, `VpSubmitError`) — wrap this in a `try/catch` to
     * distinguish "we couldn't build the VP" from "the verifier rejected
     * it" in the UI.
     */
    presentCredentials: (
        input: string | AuthorizationRequest,
        chosen: ChosenCredential[],
        options?: {
            holder?: string;
            envelopeFormat?: VpFormat;
            signer?: ProofJwtSigner;
        }
    ) => Promise<{
        request: AuthorizationRequest;
        prepared: PreparedPresentation;
        signed: SignPresentationResult;
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
