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
