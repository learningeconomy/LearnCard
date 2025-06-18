import type {
    JWE,
    JWKWithPrivateKey,
    UnsignedVC,
    UnsignedVP,
    VC,
    VP,
    VerificationCheck,
    DidDocument,
} from '@learncard/types';
import type { DIDResolutionResult } from 'dids';
import type { Plugin } from '@learncard/core';

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
    checks?: ('proof' | 'JWS' | 'credentialStatus' | 'credentialSchema')[];
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
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => JWKWithPrivateKey;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => JWKWithPrivateKey;
    keyToDid: (type: DidMethod, keypair: JWKWithPrivateKey) => string;
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
    contextLoader: (url: string) => Promise<Record<string, any>>;
    resolveDid: (did: string, inputMetadata?: InputMetadata) => Promise<DidDocument>;
    didResolver: (did: string, inputMetadata?: InputMetadata) => Promise<DIDResolutionResult>;
    createJwe: (cleartext: string, recipients: string[]) => Promise<JWE>;
    decryptJwe: (jwe: JWE, jwks: JWKWithPrivateKey[]) => Promise<string>;
    createDagJwe: <T>(cleartext: T, recipients: string[]) => Promise<JWE>;
    decryptDagJwe: <T>(jwe: JWE, jwks: JWKWithPrivateKey[]) => Promise<T>;
    clearDidWebCache: () => Promise<void>;
};

/** @group DIDKit Plugin */
export type DIDKitPlugin = Plugin<'DIDKit', 'context', DidkitPluginMethods>;
