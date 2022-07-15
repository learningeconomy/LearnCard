import { UnsignedVC, UnsignedVP, VC, VP, VerificationCheck } from '@learncard/types';

export type DidMethod =
    | 'key'
    | 'tz'
    | 'ethr'
    | `pkh:${
          | 'tz'
          | 'tezos'
          | 'sol'
          | 'solana'
          | 'eth'
          | 'celo'
          | 'poly'
          | 'btc'
          | 'doge'
          | 'eip155'
          | 'bip122'}`;

export type KeyPair = { kty: string; crv: string; x: string; y?: string; d: string };

export type ProofOptions = {
    verificationMethod: string;
    proofPurpose: string;
};

export type DidkitPluginMethods = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    generateSecp256k1KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    keyToDid: (type: DidMethod, keypair: KeyPair) => string;
    keyToVerificationMethod: (type: string, keypair: KeyPair) => Promise<string>;
    issueCredential: (
        credential: UnsignedVC,
        options: ProofOptions,
        keypair: KeyPair
    ) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: KeyPair
    ) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
};
