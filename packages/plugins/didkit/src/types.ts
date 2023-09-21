import { JWK, UnsignedVC, UnsignedVP, VC, VP, VerificationCheck } from '@learncard/types';
import type { DIDResolutionResult } from 'dids';
import { Plugin } from '@learncard/core';

/** @group DIDKit Plugin */
export type DidMethod =
    | 'key'
    | 'tz'
    | 'ethr'
    | `pkh:${| 'tz'
    | 'tezos'
    | 'sol'
    | 'solana'
    | 'eth'
    | 'celo'
    | 'poly'
    | 'btc'
    | 'doge'
    | 'eip155'
    | 'bip122'}`
    | `pkh:eip155:${string}`
    | `pkh:bip122:${string}`;

/** @group DIDKit Plugin */
export type ProofOptions = {
    type?: string;
    verificationMethod?: string;
    proofPurpose?: string;
    proofFormat?: string;
    created?: string;
    challenge?: string;
    domain?: string;
    checks?: ('Proof' | 'JWS' | 'CredentialStatus')[];
};

/** @group DIDKit Plugin */
export type InputMetadata = {
    accept?: string;
    versionId?: string;
    versionTime?: string;
    noCache?: boolean;
};

/** @group DIDKit Plugin */
export type DidkitPluginMethods = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => JWK;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => JWK;
    keyToDid: (type: DidMethod, keypair: JWK) => string;
    keyToVerificationMethod: (type: string, keypair: JWK) => Promise<string>;
    didToVerificationMethod: (did: string) => Promise<string>;
    issueCredential: (credential: UnsignedVC, options: ProofOptions, keypair: JWK) => Promise<VC>;
    verifyCredential: (credential: VC, options?: ProofOptions) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: JWK
    ) => Promise<VP>;
    verifyPresentation: (
        presentation: VP | string,
        options?: ProofOptions
    ) => Promise<VerificationCheck>;
    contextLoader: (url: string) => Promise<Record<string, any>>;
    resolveDid: (did: string, inputMetadata?: InputMetadata) => Promise<Record<string, any>>;
    didResolver: (did: string, inputMetadata?: InputMetadata) => Promise<DIDResolutionResult>;
};

/** @group DIDKit Plugin */
export type DIDKitPlugin = Plugin<'DIDKit', 'context', DidkitPluginMethods>;
