import {
    UnsignedVC,
    VC,
    UnsignedVP,
    VP,
    VerificationCheck,
    DidDocument,
    JWKWithPrivateKey,
    CredentialRefreshResult,
} from '@learncard/types';
import { Plugin, LearnCard } from '@learncard/core';
import { ProofOptions, InputMetadata } from '@learncard/didkit-plugin';

/** @group VC Plugin */
export type VCPluginDependentMethods = {
    keyToVerificationMethod: (type: string, keypair: JWKWithPrivateKey) => Promise<string>;
    didToVerificationMethod: (did: string) => Promise<string>;
    issueCredential: (
        credential: UnsignedVC,
        options: ProofOptions,
        keypair: JWKWithPrivateKey
    ) => Promise<VC>;
    verifyCredential: (credential: VC, options?: ProofOptions) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: JWKWithPrivateKey
    ) => Promise<VP>;
    verifyPresentation: (
        presentation: VP | string,
        options?: ProofOptions
    ) => Promise<VerificationCheck>;
    resolveDid: (did: string, inputMetadata?: InputMetadata) => Promise<DidDocument>;
};

/** @group VC Plugin */
export type VCPluginMethods = {
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    verifyCredential: (
        credential: VC,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
    issuePresentation: (
        credential: UnsignedVP,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VP>;
    verifyPresentation: (
        presentation: VP | string,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    refreshCredential: (
        credential: VC,
        options?: RefreshCredentialOptions
    ) => Promise<CredentialRefreshResult>;
};

/**
 * Options for the generic holder-side credential refresh primitive.
 *
 * @group VC Plugin
 */
export type RefreshCredentialOptions = {
    /** Previously seen ETag validator for the credential; sent as `If-None-Match` */
    etag?: string;
    /** Per-request timeout in milliseconds (default 10_000) */
    timeoutMs?: number;
    /** Maximum number of followed redirects (default 3) */
    maxRedirects?: number;
    /** Maximum accepted response size in bytes (default 1 MiB) */
    maxResponseBytes?: number;
    /**
     * Explicit local-development opt-in allowing plain-HTTP endpoints. HTTPS is required
     * unless this is set.
     */
    allowInsecureHttp?: boolean;
    /**
     * Hostname resolution override used for SSRF checks. Defaults to Node's DNS resolver
     * in Node runtimes; browsers skip DNS resolution and reject only unsafe host literals.
     */
    resolveHost?: (hostname: string) => Promise<string[]>;
};

/** @group VC Plugin */
export type VCDependentLearnCard = LearnCard<any, any, VCPluginDependentMethods>;

/** @group VC Plugin */
export type VCImplicitLearnCard = LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;

/** @group VC Plugin */
export type VerifyExtension = {
    verifyCredential: (
        credential: VC,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
};

/** @group VC Plugin */
export type VCPlugin = Plugin<'VC', any, VCPluginMethods, 'id', VCPluginDependentMethods>;
